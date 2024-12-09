<!--TimeLine Item-->
<template>
  <div class="item" :class="isSelected ? 'selected' : 'normal'" :style="{
    left: item.frame * state.ppf + 'px',
    width: item.length * state.ppf + 'px',
    backgroundColor: color,
  }">
    <ItemName :item="item" />
    <div class="item-edge item-edge-left" @pointerdown="onEdgePointDown($event, item.id, 'Left')"></div>
    <div class="item-edge item-edge-right" @pointerdown="onEdgePointDown($event, item.id, 'Right')"></div>
  </div>
</template>

<script setup lang="ts">
import { useStateStore } from "@/store/tlStore";
import type { TLItem } from "@/type/itemType";
import ItemName from "@/components/TLItem/ItemName.vue";

const state = useStateStore();

const props = defineProps<{
  item: TLItem;
  color: string;
  isSelected: boolean;
  onEdgePointDown: (event: PointerEvent, id: number, edge: "Left" | "Right") => void;
}>();
</script>

<style scoped>
.item {
  position: absolute;
  top: 0;
  margin-top: var(--height-tlmargin);
  overflow: hidden;
  user-select: none;
  /* テキスト選択を禁止 */
  -webkit-user-select: none;
  /* Safari用 */
  -moz-user-select: none;
  /* Firefox用 */
  -ms-user-select: none;
  /* 旧IE用 */
}

.selected {
  border: 3px dotted var(--color-border);
  padding-left: 0.5rem;
}

.normal {
  border: 1px solid var(--color-border);
  padding: 2px 2px 2px calc(2px + 0.5rem);
}

.item-edge {
  position: absolute;
  top: 0;
  height: 100%;
  width: 1rem;
}

.item-edge-left {
  left: 0;
  background: linear-gradient(to right, #00000060, #00000000);
}

.item-edge-right {
  right: 0;
  background: linear-gradient(to left, #00000060, #00000000);
}
</style>