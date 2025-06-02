import type {
  Item,
  DrawingItem,
  ImageItem,
  VoiceItem,
  TextItem,
  ShapeItem,
} from "@/types/itemType";
import { useFileStore } from "@/store/fileStore";
import { useVideoInfoStore } from "@/store/tlStore";
import type { ItemOption } from "./rendererTypes";

import { drawText } from "./draws/drawText";
import { TextureStore } from "./draws/drawImage";
import { drawShape } from "./draws/drawShape";

import { applyEffect } from "./effect";

import { EffectLoader } from "./effectLoader";
import { CurveConverter } from "./curveConverter";
import { Matrix3 } from "./matrix";

export class Renderer {
  #gl: WebGLRenderingContext;
  #renderIdStore = 0;
  #fileStore: ReturnType<typeof useFileStore>;
  #videoInfoStore: ReturnType<typeof useVideoInfoStore>;
  #drawEffectLoader: EffectLoader;
  #drawShaderProgram: WebGLProgram | undefined;
  #textureStore: TextureStore;

  constructor(inputgl: WebGLRenderingContext | null) {
    if (!inputgl) throw new Error("WebGL not supported");
    this.#gl = inputgl;
    this.#gl.enable(this.#gl.BLEND);
    this.#fileStore = useFileStore();
    this.#videoInfoStore = useVideoInfoStore();
    this.#textureStore = new TextureStore(this.#gl);
    this.#drawEffectLoader = new EffectLoader(this.#gl);
    const drawVertexShader = this.#drawEffectLoader.compileShader(`
      attribute vec4 position;
      attribute vec2 texCoord;
      varying vec2 vTexCoord;
      uniform mat3 angleScaleTransMat;// 回転拡大移動行列
  
      void main() {
        vec3 pos = angleScaleTransMat * vec3(position.xy, 1.0);
        gl_Position = vec4(pos.x, pos.y, position.zw);
        vTexCoord = texCoord;
      }`, this.#gl.VERTEX_SHADER);
    const drawFragmentShader = this.#drawEffectLoader.compileShader(`
      precision mediump float;
      varying vec2 vTexCoord;
      uniform sampler2D texture;
      uniform float opacity;

      void main() {
        vec4 color = texture2D(texture, vTexCoord);
        gl_FragColor = vec4(color.rgb, color.a * opacity);
      }`, this.#gl.FRAGMENT_SHADER);
    if (drawVertexShader && drawFragmentShader) {
      const shaderProgram = this.#drawEffectLoader.useProgram(drawVertexShader, drawFragmentShader);
      if (shaderProgram) {
        this.#drawShaderProgram = shaderProgram;
      }
      else {
        console.error("Draw shader program creation failed");
        return;
      }
    }
    else {
      console.error("Draw shader program creation failed");
    }
  }

  getGL() {
    return this.#gl;
  }

  dispose() {
    this.#gl.getExtension('WEBGL_lose_context')?.loseContext();
  }

  // ロードが終わるまで待ってから描画する
  renderWaitLoad = (frame: number, itemLayers: Item[][]) => {
    this.#renderIdStore++;
    this.#render(frame, itemLayers, true)
  }

  // ロードが終わるのを待たずに描画する
  renderNotWaitLoad = (frame: number, itemLayers: Item[][]) => {
    this.#renderIdStore++;
    this.#render(frame, itemLayers, false);
  }

  // ロードが終わるのを待たずに描画するときに再描画する
  rerender = (frame: number, itemLayers: Item[][], renderId?: number) => {
    if (renderId !== undefined && renderId !== this.#renderIdStore) return;
    this.#render(frame, itemLayers, false);
  }

  // 描画する(待たずに描画するかは関数の引数)
  #render = async (frame: number, itemLayers: Item[][], isWaitLoad: boolean) => {
    this.#gl.clearColor(0, 0, 0, 1);
    this.#gl.clear(this.#gl.COLOR_BUFFER_BIT);

    const targetItems = this.#getTargetItems(itemLayers, frame);
    for (const item of targetItems) {
      if (item.isHidden) continue;
      const itemType = item.type;
      const itemFrame = frame - item.frame;
      const cConv = new CurveConverter(item.keyFrames, itemFrame, item.length, this.#videoInfoStore.fps);

      let reRenderFileId: number | undefined;
      if (itemType === "text" || itemType === "voice") {
        const texAndItemOption = drawText(item as TextItem, cConv, this.#gl);
        if (texAndItemOption?.itemOption) {
          texAndItemOption.itemOption.itemFrame = itemFrame;
          this.#draw(item as DrawingItem, texAndItemOption.tex, texAndItemOption.itemOption, cConv);
        }
      } else if (itemType === "image") {
        let status = this.#textureStore.get((item as ImageItem).fileId, this.#fileStore);
        if (isWaitLoad && typeof status === "number") {
          await new Promise(resolve => setTimeout(resolve, 200/**sleep_duration_ms */));
          status = this.#textureStore.get((item as ImageItem).fileId, this.#fileStore);
        }
        if (typeof status === "number") {
          reRenderFileId = status;
        } else if (status) {
          this.#draw(item as DrawingItem, status.texture, {
            x: cConv.getVarNum((item as DrawingItem).x),
            y: cConv.getVarNum((item as DrawingItem).y),
            height: status.height,
            width: status.width,
            pivotX: 0,
            pivotY: 0,
            itemFrame,
          }, cConv);
        }
      } else if (itemType === "shape") {
        const texAndItemOption = drawShape(item as ShapeItem, cConv, this.#gl, this.#videoInfoStore);
        if (texAndItemOption?.itemOption) {
          texAndItemOption.itemOption.itemFrame = itemFrame;
          this.#draw(item as DrawingItem, texAndItemOption.tex, texAndItemOption.itemOption, cConv);
        }
      }
      if (reRenderFileId !== undefined && !isWaitLoad) {

        // 読み込みが終わったら実行する関数を登録
        this.#fileStore.addOnReadFileFunc(reRenderFileId, () => {
          this.rerender(frame, itemLayers, this.#renderIdStore);
        });
      }
    }
    this.#gl.flush();
  }

  #getTargetItems(itemLayers: Item[][], frame: number): Item[] {
    return itemLayers.flatMap(layer => {
      const item = layer.find(i => frame >= i.frame && frame < i.frame + i.length);
      return item ? [item] : [];
    });
  }

  #draw(item: DrawingItem, texture: WebGLTexture, itemOption: ItemOption, cConv: CurveConverter) {
    const gl = this.#gl;// 書きやすくするため

    // エフェクトを適用する
    texture = applyEffect(gl, item, texture, itemOption, cConv);

    // drawingItemの描画
    if (!this.#drawShaderProgram) {
      console.error("Draw shader program is not initialized");
      return;
    }
    gl.linkProgram(this.#drawShaderProgram);
    gl.useProgram(this.#drawShaderProgram);
    gl.viewport(0, 0, this.#videoInfoStore.width, this.#videoInfoStore.height);

    const zoom = cConv.getVarNum(item.zoom) / 100;
    itemOption.pivotX *= zoom;
    itemOption.pivotY *= zoom;
    const rotation = -(cConv.getVarNum(item.rotation) % 360) * Math.PI / 180;

    const mat = Matrix3
      .fromScale(2 / this.#videoInfoStore.width, 2 / this.#videoInfoStore.height)
      .multiplyM(Matrix3.fromTranslation(itemOption.x, itemOption.y))
      .multiplyM(Matrix3.fromRotation(rotation))
      .multiplyM(Matrix3.fromScale(zoom, zoom))
      .multiplyM(Matrix3.fromTranslation(itemOption.pivotX, itemOption.pivotY))
      .multiplyM(Matrix3.fromScale(itemOption.width, itemOption.height))
      .transpose()
      .matrix;

    gl.uniformMatrix3fv(gl.getUniformLocation(this.#drawShaderProgram, "angleScaleTransMat"), false, mat);

    const opacity = (cConv.getVarNum(item.opacity) / 100) *
      (item.fadeIn > 0 ? Math.min(itemOption.itemFrame / (item.fadeIn * this.#videoInfoStore.fps), 1) : 1) *
      (item.fadeOut > 0 ? Math.min((item.length - itemOption.itemFrame) / (item.fadeOut * this.#videoInfoStore.fps), 1) : 1);
    gl.uniform1f(gl.getUniformLocation(this.#drawShaderProgram, "opacity"), opacity);

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    this.#createVertexData(this.#drawShaderProgram, item.isInverted);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  #createVertexData(shaderProgram: WebGLProgram, isInverted: boolean) {
    const gl = this.#gl;
    const m = isInverted ? -1 : 1;
    const vertices = new Float32Array([
      -0.5 * m, -0.5, 0, 1,
      0.5 * m, -0.5, 1, 1,
      -0.5 * m, 0.5, 0, 0,
      0.5 * m, 0.5, 1, 0,
    ]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(shaderProgram, "position");
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 16, 0);

    const texCoordLoc = gl.getAttribLocation(shaderProgram, "texCoord");
    gl.enableVertexAttribArray(texCoordLoc);
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 16, 8);
  }
}
