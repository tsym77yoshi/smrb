import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import Dexie, { type EntityTable } from 'dexie'
import type { LoadedFile, FileInfo, FileSearchInfo, FileCreditDetail, FileStatus, FileType } from '@/types/fileType'
import { isAudioItem } from '@/types/itemType';

const db = new Dexie('FileDatabase') as Dexie & {
  files: EntityTable<
    { id: number; blob: Blob },
    'id'
  >;
};
db.version(1).stores({
  files: "id",
});
async function saveFileDB(id: number, fileBlob: Blob) {
  try {
    await db.files.put({ id, blob: fileBlob });
    console.log("File saved successfully");
  } catch (error) {
    console.error("Failed to save file:", error);
  }
}
async function getFileDB(id: number): Promise<Blob | undefined> {
  try {
    const result = await db.files.get(id);
    console.log("File got successfully");
    return result?.blob;
  } catch (error) {
    console.error("Failed to save file:", error);
  }
}
function resetDB() {
  db.files.clear();
}

type IdAndVoids = {
  id: number;
  void: () => void,
}

// getFileDB: DB -> Blob 
// ReadFile: Blob -> LoadedFile
// LoadFile: DBLoad & ReadFile

export const useFileStore = defineStore("file", () => {
  let onReadFileVoids: IdAndVoids[] = [];
  let files: LoadedFile[] = [];// 使いやすい形に変更済みのデータ、localStorageに保存しない
  const storeInfos = ref<FileInfo[]>([]);// 情報
  const infos = computed(() => storeInfos.value)
  const maxId = ref<number>(0);
  const add = (fileSearchInfo: FileSearchInfo, fileType: FileType, fileCreditDetail: FileCreditDetail, file: Blob) => {
    const addFileId = maxId.value;
    storeInfos.value.push({
      id: addFileId,
      ...fileSearchInfo,
      status: "loading",
      fileType: fileType,
      ...fileCreditDetail,
    });
    startReadFile(file, addFileId, fileType);
    saveFileDB(addFileId, file);
    maxId.value++;
    return addFileId;
  }
  // onFileReadはrenderで読み込み後に再描画する為
  const addOnReadFileFunc = (fileId: number, onFileLoad: () => void) => {
    onReadFileVoids.push({ id: fileId, void: onFileLoad })
  }
  const onReadFile = (fileId: number) => {
    const info = getInfo(fileId)
    if (info) {
      info.status = "loaded"
    }
    onReadFileVoids.forEach((value) => { if (value.id == fileId) { value.void() } })
  }
  const startLoadFileById = async (fileId: number) => {
    const info = getInfo(fileId);
    if (info == undefined) {
      console.error("FileId:" + fileId + "の情報が存在しません")
    } else {
      if (info.status == "unload") {
        info.status = "loading";
        const file = await getFileDB(fileId)
        if (file != undefined) {
          startReadFile(file, fileId, info.fileType);
        } else {
          console.error("FileId:" + fileId + "がdbに存在しません")
          return;
        }
      } else {
        console.error("FildId:" + fileId + "のstatusが" + info.status + "なのにstartFileLoadByIdが呼ばれました")
      }
    }
  }
  const startReadFile = (file: Blob, fileId: number, fileType: FileType) => {
    if (fileType === "image") {
      // videoは未実装
      startReadImage(file, fileId);
    } else if (isAudioItem(fileType)) {
      startReadAudio(file, fileId);
    }
  }
  const startReadImage = async (file: Blob, fileId: number) => {
    const reader = new FileReader();
    reader.onload = async (e: ProgressEvent<FileReader>) => {
      try {
        // イメージオブジェクトの生成
        let img = new Image();
        const result = e.target?.result;
        if (result == undefined) {
          console.error("resultがundefinedです")
          return;
        }
        img.onload = () => {
          files.push({
            id: fileId,
            file: img,
          });
          onReadFile(fileId);
        };
        img.src = result as string;
      } catch (error) {
        console.error("Error processing the image:", error);
        const info = getInfo(fileId)
        if (info) {
          info.status = "error"
        }
      }
    };
    reader.readAsDataURL(file);
  }
  const startReadAudio = async (file: Blob, fileId: number) => {
    try {
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(await file.arrayBuffer());
      files.push({
        id: fileId,
        file: audioBuffer,
      });
      onReadFile(fileId);
      console.log("fileId")
    } catch (error) {
      console.error("Error processing the audio:", error);
      const info = getInfo(fileId)
      if (info) {
        info.status = "error"
      }
    }
  }

  const get = (fileId: number): [LoadedFile | undefined, FileStatus | undefined] => {
    return [files.find((file) => file.id == fileId), getInfo(fileId)?.status]
  }
  const getBlob = async (fileId: number): Promise<Blob | undefined> => {
    return await getFileDB(fileId)
  }
  const getInfo = (fileId: number) => {
    return storeInfos.value.find((file) => file.id == fileId)
  }

  const resetFileInfoStatus = () => {
    storeInfos.value.forEach((info) => {
      info.status = "unload";
    })
  }
  const reset = () => {
    resetDB();
  }

  return {
    add, get, getInfo, getBlob, startLoadFileById, addOnReadFileFunc, resetFileInfoStatus, reset,
    infos/* 読み取り専用 */,
    maxId/* persist用だがアクセスどうせしないのでそのままにしている */,
    storeInfos/**store--にはアクセスしないようにする！persist用だから！FileDialogでアクセスする！他にいいコードが思いつかなかったから！ */
  }
}, {
  persist: {
    storage: localStorage,
    pick: ["storeInfos", "maxId"],
  }
});