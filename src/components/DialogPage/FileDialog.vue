<template>
  <q-page>
    <!-- 画像カードリスト -->
    <div class="row justify-space">
      <q-card v-for="fileView in filteredFileViews" :key="fileView.id" class="col-4"
        style="padding: 0;overflow: hidden;" bordered flat>
        <q-img :src="fileView.src" :alt="fileView.name" ratio="1" @click="openPreview(fileView)" />
        <q-card-section style="padding:0">
          <div class="text-h6">{{ fileView.name }}</div>
        </q-card-section>
      </q-card>
    </div>

    <q-footer>
      <!--絞り込みと並べ替えのボタン-->
      <!-- <div class="row no-wrap">
        <q-toolbar>
          <q-btn icon="filter_alt" label="絞り込み" color="primary" class="col-5" />
          <q-btn icon="sort" label="並べ替え" color="primary" class="col-7" />
        </q-toolbar>
      </div> -->
      <!-- 色々ボタン -->
      <div class="row no-wrap" style="background-color: var(--color-background);">
        <div style="display:flex;flex-wrap: nowrap;justify-content: unset;width:100%;overflow-x: scroll;">
          <q-card v-for="funcCard, index in functionCards" :key="index" style="text-align: center;margin:5px" bordered
            @click="funcCard.action" class="col-4">
            <q-card-section style="padding:0">
              <div>{{ funcCard.name }}</div>
            </q-card-section>
            <q-icon :name="funcCard.icon" size="xl" />
          </q-card>
        </div>
      </div>
    </q-footer>

    <!-- 検索(絞り込み)ダイアログ -->

    <!-- 検索バー -->
    <!-- <q-input filled v-model="searchQuery" label="検索" class="col-6" dense>
            <template v-slot:append>
              <q-icon name="search" />
            </template>
</q-input> -->

    <!-- 並べ替えダイアログ -->

    <!-- プレビュー用ダイアログ -->
    <q-dialog v-model="isPreviewOpen">
      <q-card style="width:100%">
        <q-card-section>
          <q-img :src="selectedFileView?.src" style="max-width: 100%" />
        </q-card-section>
        <q-card-actions align="left">
          <q-btn flat label="閉じる" @click="closePreview" />
          <q-btn flat label="ﾀｲﾑﾗｲﾝに追加" @click="addItem" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { onBeforeRouteLeave, useRouter, useRoute } from "vue-router";
import { useItemsStore, useStateStore, useLogStore, useVideoInfoStore, useSettingStore } from "@/store/tlStore"
import { useFileStore } from "@/store/fileStore"
import type { FileCreditDetail, FileSearchInfo, FileType, FileInfo } from "@/types/fileType";
import { fileTypes } from "@/types/fileType";
import { defaultImage, defaultVideo, defaultAudio } from "@/data/defaultItem";

const items = useItemsStore();
const state = useStateStore();
const videoInfo = useVideoInfoStore();
const logs = useLogStore();
const setting = useSettingStore();
const fileStore = useFileStore();
const router = useRouter();
const route = useRoute();

/// 表示させるやつたち
const fileTypeToImageSrcs: { fileType: FileType, src: string }[] = [
  { fileType: "video", src: "./video.png" },
  { fileType: "audio", src: "./audio.png" },
]
const LOADING_IMAGE_SRC = "./loading.png"
// fileURLsは表示画像と、読み込み(現状はﾀｲﾑﾗｲﾝに追加しようと)をした音声が入るところ
type FileView = FileInfo & { src: string };
const fileURLs = ref<{ id: number, objURL: string | undefined/* URL.createObjectURL(), undefinedならロード中 */ }[]>([]);
const fileViews = computed<FileView[]>(() => {
  return fileStore.infos.map((fileInfo) => {
    let src = fileTypeToImageSrcs.find((fileTypeToImageSrc) => fileTypeToImageSrc.fileType == fileInfo.fileType)?.src
    if (src == undefined) {
      const existedURL = fileURLs.value.find((fileURL) => fileURL.id == fileInfo.id);
      if (existedURL != undefined) {
        src = existedURL.objURL;
        if (src == undefined) {
          src = LOADING_IMAGE_SRC
        }
      } else {
        src = LOADING_IMAGE_SRC
        fileURLs.value.push({ id: fileInfo.id, objURL: undefined })// undefinedにしておく
        loadFileBlob(fileInfo.id)
      }
    }
    return { ...fileInfo, src: src }
  })
});
const loadFileBlob = async (fileId: number) => {
  const fileBlob = await fileStore.getBlob(fileId)
  const targetFileURL = fileURLs.value.find((fileURL) => fileURL.id == fileId)
  if (targetFileURL != undefined && fileBlob != undefined) {
    targetFileURL.objURL = URL.createObjectURL(fileBlob)
  } else {
    console.error("loadFileにエラー")
  }
}
const revokeObjURLs = () => {
  fileURLs.value.forEach((fileURL) => {
    if (fileURL.objURL != undefined) {
      URL.revokeObjectURL(fileURL.objURL);// objURLを削除させる。ページ遷移時
    }
  });
}
onBeforeRouteLeave((to, from, next) => {
  revokeObjURLs();
  next(); // 次のルートに進む
})

/// フィルター
// 検索
const searchQuery = ref<string>("");

// ファイルタイプ絞り込み
const activeFileTypes = ref<FileType[]>([]);
onMounted(() => {
  const fileType = Array.isArray(route.query.fileType) ? route.query.fileType[0] : route.query.fileType;
  if (fileType && (fileTypes as readonly string[]).includes(fileType)) {
    activeFileTypes.value.push(fileType as FileType);
  }
})

// タグ
const availableTags = computed(() => {
  const tags = new Set<string>();// 一意性を保証する配列
  fileViews.value.forEach((fileView) => fileView.tags.forEach((tag) => tags.add(tag)));
  return Array.from(tags);
});
const activeTags = ref<string[]>([]);

// フィルタリング
const filteredFileViews = computed(() =>
  fileViews.value.filter((fileView) => {
    // 検索
    const matchesSearch = fileView.name.toLowerCase().includes(searchQuery.value.toLowerCase());
    // ファイルタイプ
    const matchesFileType =
      activeFileTypes.value.length === 0 || activeFileTypes.value.includes(fileView.fileType);
    // タグ
    const matchesTags =
      activeTags.value.length === 0 || fileView.tags.some((tag) => activeTags.value.includes(tag));
    return matchesSearch && matchesFileType && matchesTags;
  })
);


/// 並べ替え
const sortTypes: { name: string, func: (fileViews: FileView[]) => FileView[] }[] = [
  { name: "日付", func: (fViews: FileView[]) => { return fViews } },
  { name: "ファイル名", func: (fViews: FileView[]) => { return fViews } },
]


/// プレビューダイアログ
const selectedFileIds = ref<number[]>([]);// [0]から順に処理されていく
const selectedFileView = computed(() => {
  return fileViews.value.find((fileView) => fileView.id == selectedFileIds.value[0])
})
const isPreviewOpen = ref<boolean>(false);
// プレビューを開く
const openPreview = (fileView: FileView) => {
  selectedFileIds.value = [fileView.id];
  isPreviewOpen.value = true;
};
// プレビューを閉じる
const closePreview = () => {
  if (selectedFileIds.value.length < 1) {
    return;
  }
  selectedFileIds.value.shift();// 先頭を削る
  if (selectedFileIds.value.length == 0) {
    isPreviewOpen.value = false;
  }
}
// アイテム追加
const addItem = async () => {
  let addItem;
  const fileId = selectedFileIds.value[0];
  const fileType = selectedFileView.value?.fileType;
  if (!fileType) {
    return;
  }
  if (fileType == "image") {
    addItem = defaultImage;
  }
  else if (fileType == "video") {
    addItem = defaultVideo;
  }
  else if (fileType == "audio") {
    addItem = defaultAudio;
  }
  if (["video", "audio"].includes(fileType) && addItem) {
    // ファイルの時間を取得されるまで待つ。良くない実装
    for (let i = 0; i < 30; i++) {
      const duration = fileStore.getInfo(fileId)?.duration;
      if (duration != undefined) {
        addItem.length = Math.ceil(duration * videoInfo.fps)
        break;
      }
      // 0.1秒待つ
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  if (addItem == undefined) {
    console.error("このファイルの種類のアイテムがありません");
    return;
  }
  addItem.fileId = fileId;
  addItem.frame = state.frame;
  const log = items.add([addItem]);
  logs.add([log]);
  if (selectedFileIds.value.length == 1) {
    backToTimeline();
  }
  closePreview();
}
const setAudioDuration = async (audioBlob: Blob, fileId: number) => {
  // 音声ファイルの長さ取得
  try {
    const audioBlobURL = URL.createObjectURL(audioBlob);
    const duration = (await loadAudioDuration(audioBlobURL)) as number
    const targetInfo = fileStore.storeInfos.find((info) => info.id == fileId)
    if (targetInfo == undefined) {
      console.error("想定したファイル情報が存在しません")
      return;
    }
    targetInfo.duration = duration;
  }
  catch (err) {
    console.error(err);
  }
}
const loadAudioDuration = (objURL: string) => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.src = objURL

    audio.addEventListener('loadedmetadata', () => {
      // メタデータが読み込まれた後の処理
      resolve(audio.duration); // Promiseを解決
    });

    audio.addEventListener('error', (err) => {
      reject('エラーが発生しました: ' + err);
    });
  });
}

/// フィルターダイアログを開く
// タグフィルターの切り替え
const toggleTagFilter = (tag: string) => {
  if (activeTags.value.includes(tag)) {
    activeTags.value = activeTags.value.filter((t) => t !== tag);
  } else {
    activeTags.value.push(tag);
  }
};

/// フォルダを開く
/*
ファイルを開く
追加時に情報を書き込む画面に
追加ボタンで追加 or 閉じる
 */
const openFolder = () => {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  const accept = activeFileTypes.value;
  fileInput.accept = "image/*,video/*,audio/*";// すべてが正しく読み込めるか不明
  if (accept.length > 0) {
    fileInput.accept = accept.map((fileType) => fileType + "/*").join(",");
  }
  fileInput.multiple = true;
  fileInput.addEventListener("change", async (event: Event) => {
    const target = event.target as HTMLInputElement;

    const files = (target.files as FileList);
    for (const file of files) {
      // デフォルトのファイル情報
      const fileSearchInfo: FileSearchInfo = {
        name: file.name,
        tags: [],
        date: new Date().toISOString(),
        characterId: undefined,
      }
      const fileCreditDetail: FileCreditDetail = {
        parentId: "",
        credit: "",
        remark: "",
      }

      // ファイルの種類
      console.log(file.type)
      let fileType: FileType | undefined;
      if (file.type.split("/")[0] == "image") {
        fileType = "image";
      } else if (file.type.split("/")[0] == "video") {
        fileType = "video";
      } else if (file.type.split("/")[0] == "audio") {
        fileType = "audio";
      }
      if (fileType == undefined) {
        console.error("未対応なファイルの種類です: ", file.type);
        return;
      }
      const fileId = fileStore.add(
        fileSearchInfo,
        fileType,
        fileCreditDetail,
        file,
      );

      // 音源の長さを取得
      if (["video", "audio"].includes(file.type.split("/")[0])) {
        setAudioDuration(file, fileId);
      }

      selectedFileIds.value.push(fileId);
    }
    isPreviewOpen.value = true;
  });
  fileInput.click();
};

const openExternalLink = (url: string) => {
  window.open(url, '_blank')
}
const functionCards = [
  { name: "フォルダを開く", icon: "folder", action: () => { openFolder() } },
  ...setting.fileViewExternalLinks.map((value) => {
    return { name: value.name, icon: "link", action: () => openExternalLink(value.link) }
  }),
]
const backToTimeline = () => {
  router.push({ name: "timeline" });
};
</script>

<style scoped></style>
