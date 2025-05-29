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

import { EffectLoader } from "./effectLoader";
import { CurveConverter } from "./curveConverter";
import { Matrix3 } from "./matrix";

export class Renderer {
  #gl: WebGLRenderingContext;
  #renderIdStore = 0;
  #fileStore: ReturnType<typeof useFileStore>;
  #videoInfoStore: ReturnType<typeof useVideoInfoStore>;
  #effectLoader: EffectLoader;
  #textureStore: TextureStore;

  constructor(inputgl: WebGLRenderingContext | null) {
    if (!inputgl) throw new Error("WebGL not supported");
    this.#gl = inputgl;
    this.#gl.enable(this.#gl.BLEND);
    this.#fileStore = useFileStore();
    this.#videoInfoStore = useVideoInfoStore();
    this.#textureStore = new TextureStore(this.#gl);
    this.#effectLoader = new EffectLoader(this.#gl);
  }

  getGL() {
    return this.#gl;
  }

  render(frame: number, itemLayers: Item[][], renderId?: number) {
    if (renderId !== undefined && renderId !== this.#renderIdStore) return;
    else this.#renderIdStore++;

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
        const status = this.#textureStore.get((item as ImageItem).fileId, this.#fileStore);
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
      if (reRenderFileId !== undefined) {
        this.#fileStore.addOnReadFileFunc(reRenderFileId, () => {
          this.render(frame, itemLayers, this.#renderIdStore);
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
    const gl = this.#gl;

    const shaderProgram = this.#effectLoader.useEffect("texture");
    if (!shaderProgram) return;

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

    gl.uniformMatrix3fv(gl.getUniformLocation(shaderProgram, "angleScaleTransMat"), false, mat);

    const opacity = (cConv.getVarNum(item.opacity) / 100) *
      (item.fadeIn > 0 ? Math.min(itemOption.itemFrame / (item.fadeIn * this.#videoInfoStore.fps), 1) : 1) *
      (item.fadeOut > 0 ? Math.min((item.length - itemOption.itemFrame) / (item.fadeOut * this.#videoInfoStore.fps), 1) : 1);
    gl.uniform1f(gl.getUniformLocation(shaderProgram, "opacity"), opacity);

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    this.#createVertexData(shaderProgram, item.isInverted);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  #createVertexData(shaderProgram: WebGLProgram, isInverted: boolean) {
    const gl = this.#gl;
    const m = isInverted ? -1 : 1;
    const vertices = new Float32Array([
      -0.5 * m, -0.5, 0, 1,
       0.5 * m, -0.5, 1, 1,
      -0.5 * m,  0.5, 0, 0,
       0.5 * m,  0.5, 1, 0,
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
