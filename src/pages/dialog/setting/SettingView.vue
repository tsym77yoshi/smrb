<template>
  <FullPageDialog title="設定">
    <ButtonsDialog :button-items="settingButtons" />
    <Log ref="log" style="margin-bottom: 0;" />
  </FullPageDialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useFileStore } from "@/store/fileStore";
import FullPageDialog from "@/components/DialogPage/FullPageDialog.vue";
import ButtonsDialog from "@/components/DialogPage/ButtonsDialog.vue";
import type { ButtonItemType } from "@/components/DialogPage/ButtonsDialog.vue";
import Log from "@/components/Utilities/log.vue";
import { encode } from "@/renderer/encode";

const fileStore = useFileStore();
const resetStore = () => {
  fileStore.reset();
  window.indexedDB.deleteDatabase("FileDatabase");
  localStorage.clear();
}

const log = ref<InstanceType<typeof Log> | null>(null);

const onEncodeButtonClick = () => {
  log.value?.reset();
  encode((message: string) => {
    console.log(message);
    log.value?.addLog(message);
  });
};

const settingButtons: ButtonItemType[] = [
  { name: "ストア削除", action: resetStore, icon: "interests" },
  { name: "出力", action: onEncodeButtonClick, icon: "record" },
];



</script>