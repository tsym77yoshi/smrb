<!-- アイテムをタップすると出てくる、アイテムのプロパティを編集するダイアログの中の内側の方 -->
<template>
  <EditDialog ref="editDialog" :items="selectedItems">
    <ItemPropertyDialog :targetItems="selectedItems" :diffVal="diffValTLItem" :overwriteVal="overwriteValTLItem" />
  </EditDialog>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue"
import EditDialog from "@/components/Dialog/ItemPropertyEditDialog.vue";
import ItemPropertyDialog from '@/components/Dialog/EditPropertyDialog/ItemPropertyGroups.vue';
import type { TLItem } from "@/types/itemType";
import {
  useItemsStore,
  useSelectionStore,
  useLogStore,
} from "@/store/tlStore"

const editDialog = ref();

const items = useItemsStore();
const selections = useSelectionStore();
const logs = useLogStore();

const selectedItems = ref<TLItem[]>([]);

const diffValTLItem = (ids: number[], key: keyof TLItem, diffValue: unknown, orignalVals: unknown[], isSet: boolean) => {
  const log = items.diffwrite(
    ids,
    key,
    orignalVals as number[],
    diffValue as number,
    isSet,
  );
  if (isSet) {
    logs.add([log])
  }
}
const overwriteValTLItem = (ids: number[], key: keyof TLItem, overwriteValue: unknown, originalVals: unknown[], isSet: boolean) => {
  const log = items.overwrite(
    ids,
    key,
    originalVals,
    overwriteValue,
    isSet,
  );
  if (isSet) {
    logs.add([log])
  }
}

// 注:最後に選択されたオブジェクトは[0]に置いてある
const refreshItems = () => {
  const selectedIds = selections.selections.concat();
  if (selectedIds.length == 0) {
    selectedItems.value = []
  } else {
    let result: TLItem[] = [];
    const lastSelectedTLItem = items.items.find(
      (item) => item.id == selectedIds[selectedIds.length - 1]
    );
    if (lastSelectedTLItem != undefined) {
      result.push(lastSelectedTLItem);
    }
    if (selectedIds.length > 1) {
      selectedIds.pop();
      result = result.concat(
        items.items.filter((item) => selectedIds.includes(item.id))
      );
    }
    selectedItems.value = result;
  }
}
onMounted(() => {
  refreshItems();
})
watch(() => [items.items, selections.selections], () => {
  refreshItems();
}, { deep: true });

const show = () => {
  editDialog.value.show();
}
defineExpose({ show })
</script>