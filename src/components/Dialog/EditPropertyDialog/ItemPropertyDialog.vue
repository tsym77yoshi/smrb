<!-- アイテムのプロパティを表示する、下側からでてくるダイアログ -->
<template>
  <div>
    <PropertyGroups :item-groups="editData" v-slot="{ itemProperty, propertyKey }">
      <!-- エフェクト -->
      <EffectProperty v-if="itemProperty.propertyType == 'VideoEffects' || itemProperty.propertyType == 'AudioEffects'"
        v-bind="{
          itemProperty: itemProperty,
          propertyKey: propertyKey,
          diffVal: diffVal,
          overwriteVal: overwriteVal,
          changeIsEditing: changeIsEditing,
          original: editDataOriginals[0][propertyKey as keyof TLItem] as unknown as VideoEffect[] | AudioEffect[],
          keyFrames: targetItems[0].keyFrames,
        }" />

      <PropertyDialog v-else v-bind="{
        itemProperty: itemProperty,
        propertyKey: propertyKey,
        diffVal: diffVal,
        overwriteVal: overwriteVal,
        changeIsEditing: changeIsEditing,
        keyFrames: targetItems[0].keyFrames
      }" style="display: flex;flex-direction: row;" />

    </PropertyGroups>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import {
  useSettingStore,
} from "@/store/tlStore";
import type {
  TLItem,
  ItemPropertyGroup,
  VideoEffect,
  AudioEffect,
} from "@/types/itemType";
import { itemPropertyGroups as loadItemPropertyGroups } from "@/types/itemType";
import EffectProperty from "./Property/Effect/EffectProperty.vue";
import PropertyGroups from "./PropertyGroups.vue";
import PropertyDialog from "./Property/Property.vue";
import { propertyGroupToPropertyView } from "./getPropertyView";
import type { ItemPropertyGroupView } from "./propertyViewType";

const editDialog = ref()
const show = () => {
  editDialog.value?.show()
}

const props = defineProps<{
  targetItems: TLItem[],
  diffVal: (ids: number[], key: keyof TLItem, value: unknown, orignalVals: unknown[], isSet: boolean) => void,
  overwriteVal: (ids: number[], key: keyof TLItem, value: unknown, orignalVals: unknown[], isSet: boolean) => void,
}>();


const itemPropertyGroups = loadItemPropertyGroups as unknown as Record<
  string,
  ItemPropertyGroup[]
>;
const setting = useSettingStore();
const editData = computed<ItemPropertyGroupView[]>(() => {
  if (!isEditing.value) {
    changeIsEditing("set");
  }
  if (props.targetItems.length > 0) {
    let resultItemGroups = itemPropertyGroups[props.targetItems[0].type];
    // nameが被っていないGroupを削除
    for (let i = 1; i < props.targetItems.length; i++) {
      const searchGroupNames = itemPropertyGroups[props.targetItems[i].type].map(
        (itemGroup) => itemGroup.name
      );
      const removeGroupNames = resultItemGroups
        .map((itemGroup) => itemGroup.name)
        .filter((itemKeysName) => !searchGroupNames.includes(itemKeysName));

      resultItemGroups = resultItemGroups.filter(
        (itemGroup) => !removeGroupNames.includes(itemGroup.name)
      );
    }
    return propertyGroupToPropertyView(resultItemGroups, props.targetItems[0]);
  }
  return [];
});



// 変更前のデータ
let editDataOriginals: TLItem[] = [];
const isEditing = ref<boolean>(false);
const changeIsEditing = (editState: "start" | "end" | "set") => {
  if (editState == "start" || editState == "set") {
    if (editState == "start") {
      isEditing.value = true;
    }
    editDataOriginals = JSON.parse(JSON.stringify(props.targetItems));
  } else if (editState == "end") {
    isEditing.value = false;
  } else {
    console.error("unexpectedを受け取ったよ！");
  }
};
// 変化処理
const diffVal = (value: unknown, key: keyof TLItem, isSet: boolean, option?: "VarNumbers") => {
  if (option == "VarNumbers") {
    console.error("未実装")
  }
  if (!isEditing.value) {
    changeIsEditing("start");
  }
  const originalVals = editDataOriginals.map((item) => item[key]) as number[]
  props.diffVal(editDataOriginals.map((item) => item.id), key, (value as number) - originalVals[0], originalVals, isSet);
  if (isSet) {
    changeIsEditing("end");
  }
};
const overwriteVal = (value: unknown, key: keyof TLItem, isSet: boolean, option?: "VarNumbers") => {
  if (!isEditing.value) {
    changeIsEditing("start");
  }
  props.overwriteVal(editDataOriginals.map((item) => item.id), key, value, editDataOriginals.map((item) => item[key]), isSet);
  if (isSet) {
    changeIsEditing("end");
  }
};

defineExpose({ show, changeIsEditing })
</script>