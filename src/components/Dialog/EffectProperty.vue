<template>
  <div>
    <div style="border: 1px solid black;padding-bottom: 1rem;">
      <q-checkbox v-for="effect, index in props.effects" :key="index" :label="getEffectLabel(effect, props.effectType)"
        v-model:model-value="effect.isEnabled" @update:model-value="" />
    </div>
    <q-button @click="">追加</q-button>
    <q-button @click="" :disable="!props.effects.length">削除</q-button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { allVideoEffects, type EffectPropertyGroup, type VideoEffect, type AudioEffect, auidoEffectGroup } from "@/types/itemType";

type EffectType = "video" | "audio";
const props = defineProps<{
  effects: VideoEffect[] | AudioEffect[],
  effectType: EffectType,
  changeVal: 
}>();

// 負なら非選択
const selectedIndex = ref<number>(-1);

const getEffectLabel = (effect: VideoEffect | AudioEffect, effectType: EffectType) => {
  if (effectType === "video") {
    const key = Object.keys(allVideoEffects).find(key => key == effect.type) as keyof typeof allVideoEffects | undefined;
    return key ? allVideoEffects[key]?.name : "";
  } else if (effectType === "audio") {
    const key = Object.keys(auidoEffectGroup).find(key => key == effect.type) as keyof typeof auidoEffectGroup | undefined;
    return key ? auidoEffectGroup[key]?.name : "";
  }
  return "";
}

</script>