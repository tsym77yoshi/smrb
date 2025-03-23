<template>
  {{ itemName }}
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ImageItem, Item, ShapeItem, TextItem } from "@/types/itemType";
import { dropDowns } from "@/types/itemType";
import { useFileStore } from "@/store/fileStore";

const props = defineProps<{
  item: Item;
}>();

const file = useFileStore();
const itemName = computed(() => {
  let item = props.item;
  switch (item.type) {
    case "text":
      return (item as TextItem).text + "/ﾃｷｽﾄ"
    case "image":
      return file.getInfo((item as ImageItem).fileId)?.name + "/画像"
    case "video":
      return file.getInfo((item as ImageItem).fileId)?.name + "/動画"
    case "audio":
      return file.getInfo((item as ImageItem).fileId)?.name + "/音声"
    case "shape":
      return dropDowns.ShapeType.find((shapeType) => shapeType.value == (item as ShapeItem).shapeType)?.label + "/図形"
  }
});
</script>