import { useFileStore } from "@/store/fileStore";
import { createTexture } from "../webglUtility";

export type StoredTextureType = {
  fileId: number;
  texture: WebGLTexture;
  width: number;
  height: number;
};
export class TextureStore {
  #store: StoredTextureType[] = [];
  #gl: WebGLRenderingContext;
  constructor(gl: WebGLRenderingContext) {
    this.#gl = gl;
  }
  get(fileId: number, fileStore: ReturnType<typeof useFileStore>): StoredTextureType | number | undefined {
    const stored = this.#store.find((_stored) => _stored.fileId == fileId);
    if (stored != undefined) {
      return stored;
    }

    // storedにない場合
    const [image, status] = fileStore.get(fileId);
    if (status == "loaded") {
      if (image == undefined || image?.file == undefined) {
        console.error("ファイルが想定外に存在しませんでした");
        return undefined;
      }
      return this.set(fileId, image?.file);
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
    console.error("謎の場合分けに遭遇しました status:"+status);
    return undefined;
  }
  set(fileId: number, texImageSource: HTMLImageElement): StoredTextureType | undefined {
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
    if(this.#store.length > 100){
      this.#store.pop();
    }

    return store;
  }
}