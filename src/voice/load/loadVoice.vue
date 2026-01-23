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
        <q-card style="text-align: center;vertical-align:center;margin:5px;margin-left:auto" bordered
            @click="addVoiceItem">
              タイムラインへ追加
        </q-card>
      </div>
    </q-card-section>

    <q-separator />

    <!-- ファイル入力結果のビューワー -->
    <q-card-section>
      <div class="scroll">
        <q-card v-for="voiceView in voiceViews" :key="voiceView.fileId" class="col-4"
          style="padding: 0;overflow: hidden;" bordered flat>
          <q-card-section horizontal>
            <q-card-section style="padding:0" class="col">
              <div class="text-h6">{{ voiceView.characterId }}</div>
              <div class="text-h6">{{ voiceView.fileName }}</div>
              <q-input filled v-model="voiceView.text" type="textarea" autogrow />
            </q-card-section>
          
            <q-card-actions vertical class="justify-around q-px-md">
              <q-btn flat round icon="arrow_drop_up" />
              <q-btn flat round icon="arrow_drop_down" />
            </q-card-actions>
          </q-card-section>
        </q-card>
      </div>
    </q-card-section>
  </q-card>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useFileStore } from "@/store/fileStore"
import type { FileCreditDetail, FileSearchInfo, FileType } from "@/types/fileType";
import { defaultVoice } from '@/data/defaultItem';
import { useItemsStore, useStateStore, useSelectionStore, useLogStore } from "@/store/tlStore";
import { useCharacterStore } from '@/store/presetStore';
import { searchVoicevoxSpeakerName } from "./voicevoxLoad"
import { removeExtension, removeUnderscore} from "@/composables/splitText"

const items = useItemsStore();
const state = useStateStore();
const selections = useSelectionStore();
const logs = useLogStore();
const character = useCharacterStore();

const fileStore = useFileStore();

type VoiceView = {
  fileId: number,
  fileName: string,
  characterId: number,
  text: string,
}
const voiceViews = ref<VoiceView[]>([]);

type FileNameAndText = {
  fileName: string,
  text: string,
}

const openFolder = () => {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "audio/*,.txt";// すべてが正しく読み込めるか不明
  fileInput.multiple = true;
  fileInput.addEventListener("change", async (event: Event) => {
    let tempVoiceViews: VoiceView[] = [];
    const target = event.target as HTMLInputElement;

    const files = (target.files as FileList);
    let fileNameAndTexts:FileNameAndText[] = [];
    let fileAddQueue = 0;
    for (const file of files) {
      if(file.type == "text/plain") {
        fileAddQueue++;
        file.text().then((text) => {
          fileNameAndTexts.push({
            fileName: file.name,
            text: text,
          });
          fileAddQueue--;
        });
        continue;
      }
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

      tempVoiceViews.push({
        fileId: fileId,
        fileName: file.name,
        characterId: -1,
        text: "",
      })
    }
    // テキスト読み込みがすべて終わるまで待つ
    while(fileAddQueue > 0){
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    for(const fileNameAndText of fileNameAndTexts){
      const tempVoiceView = tempVoiceViews.find((tempVoiceView) => removeExtension(tempVoiceView.fileName) == removeExtension(fileNameAndText.fileName));
      if(!tempVoiceView) continue;
      tempVoiceView.text = fileNameAndText.text;
    }
    loadVoiceWay.value?.onLoadAction(tempVoiceViews);
  });
  fileInput.click();
};

const loadVoicevoxRenban_SpeakerId = (tempVoiceViews: VoiceView[], isNameInFileName: boolean = false) => {
  // voiceViewsを並び替える
  tempVoiceViews.sort((a, b) => parseInt(a.fileName.split("_")[0]) - parseInt(b.fileName.split("_")[0]));

  // characterIdを割り当てる
  for(const tempVoiceView of tempVoiceViews){
    if(isNameInFileName){
      tempVoiceView.text = removeExtension(removeUnderscore(tempVoiceView.fileName, 2));
    }
    const characterName = searchVoicevoxSpeakerName(Number(tempVoiceView.fileName.split("_")[1]));
    if (!characterName) continue;
    const characterId = character.getCharacterIdByName(characterName);
    if(!characterId) continue;
    tempVoiceView.characterId = characterId;
  }
  voiceViews.value.push(...tempVoiceViews);
}
const loadVoicevoxRenban_SpeakerId_text = (tempVoiceViews: VoiceView[]) => {
  loadVoicevoxRenban_SpeakerId(tempVoiceViews, true);
}
const loadCoefont = () => {
}

const addVoiceItem = () => {
  for (let i = 0; i < voiceViews.value.length; i++) {
    const voiceView = voiceViews.value[i];
    const addVoiceItem = structuredClone(defaultVoice);
    addVoiceItem.voiceId = voiceView.fileId;
    addVoiceItem.characterId = voiceView.characterId;
    addVoiceItem.text = voiceView.text;
    addVoiceItem.frame = state.frame
    const log = items.add([addVoiceItem]);
    selections.select(log.itemIds)
    logs.add([log]);
  }
};


const loadVoiceWays = [{
  label: "WEB版VOICEVOX(複数)",
  link: "https://www.voicevox.su-shiki.com/multiple",
  description: `命名規則を{連番}_{話者ID}に変更してから作成し.zipでダウンロードしたものを、ファイルアプリで解凍し、各ファイルを入れてください`,
  onLoadAction: loadVoicevoxRenban_SpeakerId,
}, {
  label: "ボイボTTS - テキスト読み上げ",
  link: "https://play.google.com/store/apps/details?id=app.shinagawa.voicevoxtts",
  description: `ブックマークの所の上の共有ボタンからzipファイルを保存したものを、ファイルアプリで解凍し、各ファイルを入れてください`,
  onLoadAction: loadVoicevoxRenban_SpeakerId_text,
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