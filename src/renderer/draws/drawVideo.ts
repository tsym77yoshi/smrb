import type { TextItem } from "@/types/itemType";
import type { ItemOption } from "../rendererTypes";
import { CurveConverter } from "../curveConverter";
import { createTexture } from "../webglUtility";
import type { useFileStore } from "@/store/fileStore";

//WebGLTextureも返す
export const drawVideo = (item: TextItem, cConv: CurveConverter, gl: WebGLRenderingContext): { tex: WebGLTexture, itemOption: ItemOption } | undefined => {
};

export type StoredVideoCanvasType = {
  fileId: number;
  canvas: OffscreenCanvas;
  width: number;
  height: number;
};
export class VideoStore {
  #store: StoredVideoCodecsType[] = [];
  #gl: WebGLRenderingContext;
  constructor(gl: WebGLRenderingContext) {
    this.#gl = gl;
  }
  get(fileId: number, fileStore: ReturnType<typeof useFileStore>): StoredVideoCanvasType | number | undefined {
    const stored = this.#store.find((_stored) => _stored.fileId == fileId);
    if (stored != undefined) {
      return stored;
    }

    // storedにない場合
    const videoBlob = fileStore.getBlob(fileId);
    if (status == "loaded") {
      if (videoBlob == undefined) {
        console.error("ファイルが想定外に存在しませんでした");
        return undefined;
      }
      return this.set(fileId, videoBlob);
    } else if (status == "unload") {
      fileStore.startLoadFileById(fileId);
      return fileId;
    } else if (status == "loading") {
      return fileId;
    } else if (status == "missing") {
      return undefined;
    } else if (status == "error") {
      return undefined;
    }
    console.error("謎の場合分けに遭遇しました status:" + status);
    return undefined;
  }
  set(fileId: number, videoBlob: Blob): StoredVideoCanvasType | undefined {
    const texture = createTexture(texImageSource, this.#gl);
    if (texture == null) {
      console.error("テクスチャの生成に失敗しました");
      return;
    }
    const store = {
      fileId: fileId,
      texture: texture,
      width: texImageSource.width,
      height: texImageSource.height,
    }
    this.#store.unshift(store);
    // 多すぎる分を消す
    if (this.#store.length > 100) {
      this.#store.pop();
    }

    return store;
  }
}