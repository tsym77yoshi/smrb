<!-- アイテムをタップすると出てくる、アイテムのプロパティを編集するダイアログの中の全体を統括する方 -->

<template>
  <q-dialog v-model="isDisplayDialog" full-width position="bottom" ref="dialog" seamless>
    <q-card class="dialog">
      <q-card-section style="display: flex">
        <ItemName v-for="item in items" :item="item" />
        <q-space />
        <q-icon name="close" v-close-popup />
      </q-card-section>

      <q-separator />

      <q-card-section style="max-height: 50vh;padding:0" class="scroll">
        <slot></slot>
      </q-card-section>

      <q-separator />

      <q-card-actions align="left">
        <q-btn flat label="閉じる" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import ItemName from "@/components/TLItem/ItemName.vue";
import type { Item } from "@/types/itemType"

const props = defineProps<{
  items: Item[]
}>()

const dialog = ref()
const show = () => {
  dialog.value.show();
}

const isDisplayDialog = ref(false);

defineExpose({
  show,
})
</script>

<style scoped>
.dialog {
  background-color: var(--color-background);
}
</style>