<!-- アイテムのプロパティを表示する、下側からでてくるダイアログ -->
<template>
  <div>
    <PropertyGroups :propertyGroups="editData" v-slot="{ property, propertyKey }">
      <!-- エフェクト -->
      <EffectProperty v-if="property.propertyType == 'VideoEffects' || property.propertyType == 'AudioEffects'"
        v-bind="{
          property: property,
          propertyKey: propertyKey,
          diffVal: diffVal,
          overwriteVal: overwriteVal,
          changeIsEditing: changeIsEditing,
          original: editItemOriginals[0][propertyKey as keyof TLItem] as unknown as VideoEffect[] | AudioEffect[],
          keyFrames: targetItems[0].keyFrames,
        }" />

      <PropertyForm v-else v-bind="{
        property: property,
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
import type {
  TLItem,
  PropertyGroup,
  VideoEffect,
  AudioEffect,
} from "@/types/itemType";
import { itemPropertyGroups as loadItemPropertyGroups } from "@/types/itemType";
import EffectProperty from "./Property/Effect/EffectProperty.vue";
import PropertyGroups from "./PropertyGroups.vue";
import PropertyForm from "./Property/PropertyForm.vue";
import { propertyGroupToPropertyView } from "./getPropertyView";
import type { PropertyGroupView, PropertyKey } from "./propertyViewTypes";

const editDialog = ref()
const show = () => {
  editDialog.value?.show()
}

type ItemPropertyChangeValFunc = (itemIds: number[], itemPropertyKey: PropertyKey, value: unknown, orignalVals: unknown[], isSet: boolean) => void;
const props = defineProps<{
  targetItems: TLItem[],
  itemDiffVal: ItemPropertyChangeValFunc,
  itemOverwriteVal: ItemPropertyChangeValFunc,
}>();


const itemPropertyGroups = loadItemPropertyGroups as unknown as Record<
  string,
  PropertyGroup[]
>;
const editData = computed<PropertyGroupView[]>(() => {
  if (!isEditing.value) {
    changeIsEditing("set");
  }
  if (props.targetItems.length > 0) {
    let resultItemGroups = itemPropertyGroups[props.targetItems[0].type];
    // nameが被っていないGroupを削除
    for (let i = 1; i < props.targetItems.length; i++) {
      const searchGroupNames = itemPropertyGroups[props.targetItems[i].type].map(
        (itemPropertyGroup) => itemPropertyGroup.name
      );
      const removeGroupNames = resultItemGroups
        .map((itemPropertyGroup) => itemPropertyGroup.name)
        .filter((itemPropertyGroupName) => !searchGroupNames.includes(itemPropertyGroupName));

      resultItemGroups = resultItemGroups.filter(
        (itemGroup) => !removeGroupNames.includes(itemGroup.name)
      );
    }
    return propertyGroupToPropertyView(resultItemGroups, editItemOriginals[0]);
  }
  return [];
});

// 変更前のデータ
let editItemOriginals: TLItem[] = [];
const isEditing = ref<boolean>(false);
const changeIsEditing = (editState: "start" | "end" | "set") => {
  if (editState == "start" || editState == "set") {
    if (editState == "start") {
      isEditing.value = true;
    }
    editItemOriginals = JSON.parse(JSON.stringify(props.targetItems));
  } else if (editState == "end") {
    isEditing.value = false;
  } else {
    console.error("editStateのunexpectedを受け取ったよ！");
  }
};
// 変化処理
const diffVal = (value: unknown, key: PropertyKey, isSet: boolean, option?: "VarNumbers") => {
  if (option == "VarNumbers") {
    console.error("未実装")
  }
  if (!isEditing.value) {
    changeIsEditing("start");
  }
  const originalVals = editItemOriginals.map((item) => item[key as keyof TLItem]) as number[]
  props.itemDiffVal(editItemOriginals.map((item) => item.id), key, (value as number) - originalVals[0], originalVals, isSet);
  if (isSet) {
    changeIsEditing("end");
  }
};
const overwriteVal = (value: unknown, key: PropertyKey, isSet: boolean, option?: "VarNumbers") => {
  if (!isEditing.value) {
    changeIsEditing("start");
  }
  props.itemOverwriteVal(editItemOriginals.map((item) => item.id), key, value, editItemOriginals.map((item) => item[key as keyof TLItem]), isSet);
  if (isSet) {
    changeIsEditing("end");
  }
};

defineExpose({ show, changeIsEditing })
</script>