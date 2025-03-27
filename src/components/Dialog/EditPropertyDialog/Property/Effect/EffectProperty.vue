<template>
  <div>
    <div style="border: 1px solid black;padding-bottom: 1rem;">
      <div v-for="effect, index in effects" :key="index" @click="(e) => { selectedIndex = index; e.stopPropagation(); }"
        style="width:100%" :class="{ selectedEffect: selectedIndex == index }">
        <q-checkbox v-model:model-value="effect.isEnabled" @update:model-value="" />
        {{ getEffectLabel(effect, effectType) }}
      </div>
    </div>
    <q-btn @click="addEffect" label="追加" color="primary" />
    <q-btn @click="removeEffect" :disable="!effects.length" label="削除" color="primary" />
    <PropertyGroups v-if="selectedIndex >= 0" :propertyGroups="editEffect" v-slot="{ property, propertyKey }">
      <Property v-bind="{
        property: property,
        propertyKey: propertyKey,
        diffVal: () => { },
        overwriteVal: overwriteVal,
        changeIsEditing: changeIsEditing,
        keyFrames: keyFrames
      }" style="display: flex;flex-direction: row;" />
    </PropertyGroups>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { allVideoEffects, type VideoEffect, type AudioEffect, auidoEffectGroup, type TLItem, type KeyFrames } from "@/types/itemType";
// 後で移動
import { defaultVideoEffects } from "@/data/defaultEffects";
import PropertyGroups from "../../PropertyGroups.vue";
import Property from "../PropertyForm.vue";
import { propertyGroupToPropertyView } from "../../getPropertyView";
import type { PropertyGroupView, PropertyView } from "../../propertyViewTypes";


type EffectsType = "VideoEffects" | "AudioEffects";
const props = defineProps<{
  property: PropertyView,
  propertyKey: keyof TLItem,
  changeIsEditing: (editState: "start" | "end" | "set") => void,
  overwriteVal: (value: unknown, key: keyof TLItem, isSet: boolean, option?: "VarNumbers") => void,
  original: VideoEffect[] | AudioEffect[],
  keyFrames: KeyFrames,
}>();

const effects = computed<VideoEffect[] | AudioEffect[]>(() => {
  return props.property.valueModel as VideoEffect[] | AudioEffect[]
})
const effectType = computed<EffectsType>(() => {
  return props.property.propertyType as EffectsType
})

const editEffect = computed<PropertyGroupView[]>(() => {
  if (selectedIndex.value < 0 || props.original.length <= selectedIndex.value) {
    return [];
  }

  const model = props.property.valueModel[selectedIndex.value] as VideoEffect | AudioEffect;
  const targetEffects = effectType.value == "VideoEffects" ? allVideoEffects : auidoEffectGroup

  const targetKey = Object.keys(targetEffects).find(key => key == model.type)
  if (!targetKey) {
    return [];
  }
  const itemGroup = targetEffects[targetKey as keyof typeof targetEffects]

  // ここ、無理やりすぎるので注意
  return propertyGroupToPropertyView([itemGroup], model as unknown as TLItem)
})

// 負なら非選択
const selectedIndex = ref<number>(0);

const getEffectLabel = (effect: VideoEffect | AudioEffect, effectType: EffectsType) => {
  if (effectType === "VideoEffects") {
    const key = Object.keys(allVideoEffects).find(key => key == effect.type) as keyof typeof allVideoEffects | undefined;
    return key ? allVideoEffects[key]?.name : "";
  } else if (effectType === "AudioEffects") {
    const key = Object.keys(auidoEffectGroup).find(key => key == effect.type) as keyof typeof auidoEffectGroup | undefined;
    return key ? auidoEffectGroup[key]?.name : "";
  }
  console.log(effectType)
  return "";
}

const addEffect = () => {
  props.overwriteVal(
    props.original.concat([defaultVideoEffects["centerPointEffect"]]),
    props.propertyKey,
    true,
  )
}
const removeEffect = () => {
  if (selectedIndex.value < 0 || props.original.length <= selectedIndex.value) {
    return;
  }
  const originalCopy = JSON.parse(JSON.stringify(props.original))
  originalCopy.splice(selectedIndex.value, 1)

  if (originalCopy.length == 0) {
    selectedIndex.value = -1;
  }

  props.overwriteVal(
    originalCopy,
    props.propertyKey,
    true,
  )
}
const overwriteEffect = (value: unknown, key: keyof TLItem, isSet: boolean, option?: "VarNumbers") => {
  if (selectedIndex.value < 0 || props.original.length <= selectedIndex.value) {
    return;
  }
  const originalCopy = JSON.parse(JSON.stringify(props.original))
  originalCopy[selectedIndex.value] = value as VideoEffect | AudioEffect

  props.overwriteVal(
    originalCopy,
    props.propertyKey,
    isSet,
  )
}
</script>

<style scoped>
.selectedEffect {
  background-color: var(--color-primary);
}
</style>