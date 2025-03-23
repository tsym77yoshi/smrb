import type {
  Item,
  DrawingItem,
  ImageItem,
  //TachieItem,
  //ShapeItem,
  VoiceItem,
  TextItem,
  ShapeItem,
  //AudioItem,
  //VideoItem,
} from "@/types/itemType";
import { useFileStore } from "@/store/fileStore";
import { useVideoInfoStore } from "@/store/tlStore";
import type { ItemOption } from "./rendererTypes";

import { drawText } from "./draws/drawText";
import { TextureStore } from "./draws/drawImage";
import { drawShape } from "./draws/drawShape";

import { EffectLoader } from "./effectLoader";
import { CurveConverter } from "./curveConverter";
import { Matrix3 } from "./matrix";


export class Renderer {
  // #をつけるとprivateになる
  #gl: WebGLRenderingContext;//CanvasRenderingContext2D;
  #renderIdStore = 0;// 同時に1つしかrenderしないよ
  #fileStore: ReturnType<typeof useFileStore>;
  #videoInfoStore: ReturnType<typeof useVideoInfoStore>;
  #effectLoader: EffectLoader;
  #textureStore: TextureStore;

  constructor(inputgl: WebGLRenderingContext | null) {
    if (!inputgl) {
      alert("WebGLがサポートされていません");
      throw new Error("WebGL not supported");
    }
    this.#gl = inputgl;

    // ブレンディングを有効にする
    this.#gl.enable(this.#gl.BLEND);

    // ストア読み込み
    this.#fileStore = useFileStore();// pinia
    this.#videoInfoStore = useVideoInfoStore();// pinia
    this.#textureStore = new TextureStore(this.#gl);// draws/drawImage.ts

    // エフェクトローダー
    this.#effectLoader = new EffectLoader(this.#gl);
  }

  render(
    frame: number,
    itemLayers: Item[][],
    renderId?: number,
  ) {
    // 読み込みが終わった時に、次のrenderが始まっていたらrenderをやめる
    if (renderId != undefined) {
      if (renderId != this.#renderIdStore) {
        return;
      }
    }
    else {
      this.#renderIdStore++;
    }

    // 動画の情報を取得
    // this.loadVideoInfoStore();

    // canvasを初期化
    this.#gl.clearColor(0.0, 0.0, 0.0, 1.0);// 透過画像出力時にはここを変えよう！
    this.#gl.clear(this.#gl.COLOR_BUFFER_BIT);

    // 描画対象のアイテムを取得
    const targetItems = this.#getTargetItems(itemLayers, frame);

    // アイテムをフレームバッファ上に描画
    for (const item of targetItems) {
      if (item.isHidden) {
        continue;
      }
      const itemType = item.type;
      const itemFrame = frame - item.frame;// アイテム内で何フレーム目か
      const cConv = new CurveConverter(item.keyFrames, itemFrame, item.length, this.#videoInfoStore.fps);

      let reRenderFileId: undefined | number = undefined;
      if (itemType == "text" || itemType == "voice") {
        const texAndItemOption = drawText(item as TextItem, cConv, this.#gl);
        const itemOption = texAndItemOption?.itemOption;
        if (itemOption != undefined && texAndItemOption != undefined) {
          itemOption.itemFrame = itemFrame;
          this.#draw(item as DrawingItem, texAndItemOption.tex, itemOption, cConv);
        }
      } else if (itemType == "image") {
        const status = this.#textureStore.get((item as ImageItem).fileId, this.#fileStore);
        if (typeof status == "number") {
          // ファイルが読み込めていない時
          reRenderFileId = status;
        } else if (status != undefined) {
          // statusがStoredTextureType型の時
          this.#draw(item as DrawingItem, status.texture, {
            x: cConv.getVarNum((item as DrawingItem).x),
            y: cConv.getVarNum((item as DrawingItem).y),
            height: status.height,
            width: status.width,
            pivotX: 0,
            pivotY: 0,
            itemFrame: itemFrame,
          }, cConv);
        }
      } else if (itemType == "shape") {
        const texAndItemOption = drawShape(item as ShapeItem, cConv, this.#gl, this.#videoInfoStore);
        const itemOption = texAndItemOption?.itemOption;
        if (itemOption != undefined && texAndItemOption != undefined) {
          itemOption.itemFrame = itemFrame;
          this.#draw(item as DrawingItem, texAndItemOption.tex, itemOption, cConv);
        }
      }
      // ファイルがなかった時に実行
      if (reRenderFileId != undefined) {
        this.#fileStore.addOnReadFileFunc(reRenderFileId, () => { this.render(frame, itemLayers, this.#renderIdStore) });
      }
    }

    // canvasに描画
    /* cv.cvtColor(renderDst, renderDst, cv.COLOR_RGB2RGBA);
    const imgData = new ImageData(new Uint8ClampedArray(renderDst.data), renderDst.cols, renderDst.rows);
    ctx.putImageData(imgData, 0, 0);
    renderDst.delete(); */



    // コンテキストの再描画
    this.#gl.flush();
  };

  #getTargetItems(itemLayers: Item[][], frame: number): Item[] {
    let targetItems = [];
    for (const itemLayer of itemLayers) {
      for (let i = 0; i < itemLayer.length; i++) {
        const itemFrame = frame - itemLayer[i].frame;// item内にとってどれだけ時間がかかっているか
        if (0 <= itemFrame && itemFrame < itemLayer[i].length) {
          targetItems.push(itemLayer[i]);
          break;
        }
      }
    }
    return targetItems;
  }

  /* 1.
  itemからtexture2dを作成
  2.
  映像エフェクトをかける
  3.
  描画Groupを処理 */
  #draw(item: DrawingItem, texture: WebGLTexture, itemOption: ItemOption, cConv: CurveConverter) {
    for (const videoEffect of item.videoEffects) {
      // ここでエフェクトを適用
    }

    // サイズを合わせる
    this.#gl.viewport(0, 0, this.#videoInfoStore.width, this.#videoInfoStore.height);

    // テクスチャを貼り付けるシェーダー
    const shaderProgram = this.#effectLoader.useEffect("texture");
    if (shaderProgram == undefined) {
      return;
    }

    // zoom
    const itemZoom = cConv.getVarNum(item.zoom) / 100;
    itemOption.pivotX *= itemZoom;
    itemOption.pivotY *= itemZoom;
    // rotation
    const itemRotation = - (cConv.getVarNum(item.rotation) % 360) * Math.PI / 180;// ラジアンに変換。マイナスなのはYMM4に合せている
    // 回転拡大移動行列を作成
    const astMatrix = Matrix3
      .fromScale(2 / this.#videoInfoStore.width, 2 / this.#videoInfoStore.height)// 画面全体が-1~1なので倍率はwidth,height/2
      .multiplyM(Matrix3.fromTranslation(itemOption.x, itemOption.y))
      .multiplyM(Matrix3.fromRotation(itemRotation))
      .multiplyM(Matrix3.fromScale(itemZoom, itemZoom))
      .multiplyM(Matrix3.fromTranslation(itemOption.pivotX, itemOption.pivotY))
      .multiplyM(Matrix3.fromScale(itemOption.width, itemOption.height))
      .transpose()// glslは転置しているのでここで転置
      .matrix;
    // 回転拡大移動行列をシェーダに渡す
    const angleLocation = this.#gl.getUniformLocation(shaderProgram, "angleScaleTransMat");
    this.#gl.uniformMatrix3fv(angleLocation, false, astMatrix);

    // 透明度(Opacity, fadeIn, fadeOut)
    const opacityRate = cConv.getVarNum(item.opacity) / 100;
    const fadeInOpacityRate = item.fadeIn > 0
      ? Math.min(itemOption.itemFrame / (item.fadeIn * this.#videoInfoStore.fps), 1)
      : 1;
    const fadeOutOpacityRate = item.fadeOut > 0
      ? Math.min((item.length - itemOption.itemFrame) / (item.fadeOut * this.#videoInfoStore.fps), 1)
      : 1;
    const opacity = opacityRate * fadeInOpacityRate * fadeOutOpacityRate;
    const opacityLocation = this.#gl.getUniformLocation(shaderProgram, "opacity");
    this.#gl.uniform1f(opacityLocation, opacity);

    // 合成方法
    this.#gl.blendFunc(this.#gl.SRC_ALPHA, this.#gl.ONE_MINUS_SRC_ALPHA);// アルファブレンド
    // this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE);// 加算

    // テクスチャをバインド
    this.#gl.bindTexture(this.#gl.TEXTURE_2D, texture);
    // テクスチャの頂点情報(位置((-0.5~0.5)x(-0.5~0.5)の正方形) + テクスチャ座標)を作成、シェーダーによりこれに前の行列がかけられる
    this.#createVertexData(shaderProgram, item.isInverted);

    // 描画
    this.#gl.drawArrays(this.#gl.TRIANGLE_STRIP, 0, 4);
    // フレームバッファ削除
    // ここなのかな？
  }
  #createVertexData(shaderProgram: WebGLProgram, isInverted: boolean) {
    const m = isInverted ? -1 : 1;// mirror
    // 頂点データ (位置 + テクスチャ座標)
    const vertices = new Float32Array([
      -0.5 * m, -0.5, 0.0, 1.0, // 左下
      0.5 * m, -0.5, 1.0, 1.0, // 右下
      -0.5 * m, 0.5, 0.0, 0.0, // 左上
      0.5 * m, 0.5, 1.0, 0.0, // 右上
    ]);
    const buffer = this.#gl.createBuffer();
    this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, buffer);
    this.#gl.bufferData(this.#gl.ARRAY_BUFFER, vertices, this.#gl.STATIC_DRAW);
    // 位置情報
    const positionLocation = this.#gl.getAttribLocation(shaderProgram, "position");
    this.#gl.enableVertexAttribArray(positionLocation);
    this.#gl.vertexAttribPointer(positionLocation, 2, this.#gl.FLOAT, false, 4 * 4, 0);
    // テクスチャ座標
    const texCoordLocation = this.#gl.getAttribLocation(shaderProgram, "texCoord");
    this.#gl.enableVertexAttribArray(texCoordLocation);
    this.#gl.vertexAttribPointer(texCoordLocation, 2, this.#gl.FLOAT, false, 4 * 4, 2 * 4);
  }
}
