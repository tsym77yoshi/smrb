<template>
  <q-dialog ref="addEffectDialog">
    <q-card>
      <q-card-section>
        エフェクト選択
        <q-input v-model="effectSearchName" label="検索"></q-input>
        <q-select label="絞り込み" outlined v-model="categoryFilter" :options="options"></q-select>
      </q-card-section>

      <q-separator />

      <q-card-section class="scroll" style="max-height:80vh">
        <q-card-actions vertical align="left">
          <q-btn outline v-for="(videoEffect, key) in filteredEffectGroup" style="width:100%" @click="onEffectAddInDialog(key)">
            {{ videoEffect.name }}
          </q-btn>
        </q-card-actions>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { auidoEffectGroup, allVideoEffectGroup, videoEffectCategories, audioEffectCategories } from '@/types/itemType';
import type { EffectPropertyGroup, EffectKindType, EffectType } from '@/types/itemType';

const props = defineProps<{
  onEffectAdd: (effectName: EffectType) => void,
  effectKindType: EffectKindType
}>();

const onEffectAddInDialog = (key: EffectType) => {
  props.onEffectAdd(key);
  addEffectDialog.value.hide();
}

const effectSearchName = ref("");
const categoryFilter = ref("すべて");
const options = computed(() => {
  switch (props.effectKindType) {
    case 'VideoEffects':
      return videoEffectCategories.concat("すべて")
    case 'AudioEffects':
      return audioEffectCategories.concat("すべて")
  }
})

const effectGroup = computed<Record<EffectType, EffectPropertyGroup>>(() => {
  switch (props.effectKindType) {
    case 'VideoEffects':
      return allVideoEffectGroup as unknown as Record<EffectType, EffectPropertyGroup>
    case 'AudioEffects':
      return auidoEffectGroup as unknown as Record<EffectType, EffectPropertyGroup>
  }
})
const searchedEffectGroup = computed(() => {
  if (effectSearchName.value === "") {
    return effectGroup.value
  }
  return Object.fromEntries(Object.entries(effectGroup.value).filter(([_key, value]) => {
    const key = _key as EffectType;
    const searchTargets = [effectGroup.value[key].name, effectGroup.value[key].searchName, key]
    for (const searchTarget of searchTargets) {
      if (searchTarget === undefined) {
        continue
      }
      if (searchTarget.includes(effectSearchName.value)) {
        return true
      }
    }
    return false;
  }))
})
const filteredEffectGroup = computed(() => {
  if (categoryFilter.value === "すべて") {
    return searchedEffectGroup.value
  }
  return Object.fromEntries(Object.entries(searchedEffectGroup.value).filter(([key, value]) => {
    return searchedEffectGroup.value[key as EffectType].category === categoryFilter.value
  }))
})

const addEffectDialog = ref()
const show = () => {
  addEffectDialog.value.show();
}


defineExpose({
  show
})

</script>