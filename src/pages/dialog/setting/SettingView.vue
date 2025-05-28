<template>
  <FullPageDialog title="設定">
    <ButtonsDialog :button-items="settingButtons" />
  </FullPageDialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useFileStore } from "@/store/fileStore";
import FullPageDialog from "@/components/DialogPage/FullPageDialog.vue";
import ButtonsDialog from "@/components/DialogPage/ButtonsDialog.vue";
import type { ButtonItemType } from "@/components/DialogPage/ButtonsDialog.vue";
import {encode} from "../../../renderer/encode";

const fileStore = useFileStore();
const resetStore = () => {
  fileStore.reset();
  window.indexedDB.deleteDatabase("FileDatabase");
  localStorage.clear();
}

const settingButtons: ButtonItemType[] = [
  { name: "ストア削除", action: resetStore, icon: "interests" },
  { name: "出力", action: () => { encode() }, icon: "record" },
];



</script>