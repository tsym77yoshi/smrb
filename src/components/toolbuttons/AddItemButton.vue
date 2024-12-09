<template>
  <q-fab v-model="fab" vertical-actions-align="right" color="primary" glossy icon="add" direction="up"
    label="追加">
    <q-fab-action v-for="action in actions" label-position="left" color="primary" :label="action.name"
      @click="action.action" :icon="action.icon" square />
  </q-fab>
</template>

<script setup lang="ts">
import {
  useItemsStore,
  useStateStore,
  useSelectionStore,
  useLogStore,
} from "@/store/tlStore";
import { ref } from "vue"
import { useRouter } from "vue-router";
import { defaultText, defaultShape } from "@/data/defaultItem";

const items = useItemsStore();
const state = useStateStore();
const selections = useSelectionStore();
const logs = useLogStore();
const router = useRouter();

const fab = ref(false)

const addVoiceItem = () => { };
const addVoiceScript = () => {
  router.push({ name: "addVoiceScript" });
};
const addTextItem = () => {
  const addTextItem = structuredClone(defaultText);
  addTextItem.frame = state.frame
  const log = items.add([addTextItem]);
  selections.select(log.itemIds)
  logs.add([log]);
};
const addVideoItem = () => {
  router.push({ name: "addItem", query: { fileType: "video" } });
};
const addAudioItem = () => {  
  router.push({ name: "addItem", query: { fileType: "audio" } });
};
const addImageItem = () => {
  router.push({ name: "addItem", query: { fileType: "image" } });
};
const addShapeItem = () => {
  const addShapeItem = structuredClone(defaultShape);
  addShapeItem.frame = state.frame
  const log = items.add([addShapeItem]);
  selections.select(log.itemIds)
  logs.add([log]);
};
const addTachieItem = () => { };

const actions: { name: string, action: () => void, icon: string }[] = [
  { name: "ボイス", action: addVoiceItem, icon: "chat" },
  { name: "ボイス（from 台本）", action: addVoiceScript, icon: "chat" },
  { name: "テキスト", action: addTextItem, icon: "text_fields" },
  { name: "動画", action: addVideoItem, icon: "videocam" },
  { name: "音声", action: addAudioItem, icon: "music_note" },
  { name: "画像", action: addImageItem, icon: "image" },
  { name: "図形", action: addShapeItem, icon: "interests" },
  { name: "立ち絵", action: addTachieItem, icon: "person" },
];


</script>