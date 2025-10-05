<!-- セリフ(台本)のファイル複数のロード -->
<template>
  <q-card>
    <q-card-section>
      <q-card-section>読み込み</q-card-section>
      <q-select label="生成元" outlined v-model="selectedVoiceWayLabel"
        :options="loadVoiceWays.map(voiceWay => voiceWay.label)" />
      <a :href="loadVoiceWay?.link" target="_blank">{{ loadVoiceWay?.label }}</a>
      {{ loadVoiceWay?.description }}
    </q-card-section>

    <q-separator />

    <!-- ファイル入力する -->
    <q-card-section>
      <div class="row no-wrap" style="background-color: var(--color-background);">
        <q-card style="text-align: center;margin:5px" bordered
            @click="openFolder">
            <q-card-section style="padding:0">
              <div>ファイル読み込み</div>
            </q-card-section>
            <q-icon name="folder" size="xl" />
          </q-card>
      </div>
    </q-card-section>

    <!-- ファイル入力結果のビューワー -->
    <!--q-card-section>
      <div class="scroll">
        
      </div>
    </q-card-section-->
  </q-card>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useFileStore } from "@/store/fileStore"
import type { FileCreditDetail, FileSearchInfo, FileType } from "@/types/fileType";

const fileStore = useFileStore();

const openFolder = () => {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "audio/*";// すべてが正しく読み込めるか不明
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
      const fileId = fileStore.add(
        fileSearchInfo,
        "voice",
        fileCreditDetail,
        file,
      );

      // selectedFileIds.value.push(fileId);
    }
    // isPreviewOpen.value = true;
  });
  fileInput.click();
};

const loadVoicevoxRenban_SpeakerId = () => {
}
const loadCoefont = () => {
}

const loadVoiceWays = [{
  label: "WEB版VOICEVOX(複数)",
  link: "https://www.voicevox.su-shiki.com/multiple",
  description: `命名規則を{連番}_{話者ID}に変更してから作成し.zipでダウンロードしたものを、ファイルアプリで解凍し、各ファイルを入れてください`,
  onLoadAction: loadVoicevoxRenban_SpeakerId,
}, {
  label: "ボイボTTS - テキスト読み上げ",
  link: "https://play.google.com/store/apps/details?id=app.shinagawa.voicevoxtts",
  description: `ブックマークの所の上の共有ボタンからzipファイルを保存したものを、ファイルアプリで解凍し、各ファイルを入れてください`,
  onLoadAction: loadVoicevoxRenban_SpeakerId,
}/*, {// 複数読み込みがわからなかったので後回し
  label: "ずんだもんボイス・ムービーメーカー",
  link: "https://t.co/BfrZzOV8nF",
  description: ``,
  onLoadAction:
}*/, {
  label: "Coefont",
  link: "https://coefont.cloud/home",
  description: `プロジェクト全体をダウンロードし、zipファイルアプリで解凍し、各ファイルを入れてください`,
  onLoadAction: loadCoefont,
}, {
  label: "その他",
  linke: "",
  description: ``,
  onLoadAction: () => {
  }
}];
const selectedVoiceWayLabel = ref(loadVoiceWays[0].label)
const loadVoiceWay = computed(() => {
  return loadVoiceWays.find(voiceWay => voiceWay.label === selectedVoiceWayLabel.value)
})



</script>