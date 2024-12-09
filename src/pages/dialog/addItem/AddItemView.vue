<template>
  <FullPageDialog title="アイテム追加">
    <FileDialog style="z-index: 0;" startFilterFileType="image">
    </FileDialog>
  </FullPageDialog>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import FullPageDialog from "@/components/DialogPage/FullPageDialog.vue";
import FileDialog from "@/components/DialogPage/FileDialog.vue";

const router = useRouter();

const addVoiceScript = () => {
  router.push({ name: "addVoiceScript" });
};
/* 
const addItems: ButtonItemType[] = [
  { name: "ボイス", action: addVoiceItem, icon: "chat" },
  { name: "ボイス（from 台本）", action: addVoiceScript, icon: "chat" },
  { name: "テキスト", action: addTextItem, icon: "text_fields" },
  { name: "動画", action: addVideoItem, icon: "videocam" },
  { name: "音声", action: addAudioItem, icon: "music_note" },
  { name: "画像", action: addImageItem, icon: "image" },
  { name: "図形", action: addShapeItem, icon: "interests" },
  { name: "立ち絵", action: addTachieItem, icon: "person" },
]; */
</script>