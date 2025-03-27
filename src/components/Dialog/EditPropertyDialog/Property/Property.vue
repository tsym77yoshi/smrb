<template>
  <div style="width:100%">
    <div style="width: 20%">{{ itemProperty.name }}</div>
    <!-- プロパティのフォーム -->
    <div style="width: 80%">
      <!-- フレーム・長さ・レイヤー(複数選択時に差分で動くものたち) -->
      <NumberPropertyForm v-if="
        propertyKey == 'frame' ||
        propertyKey == 'length' ||
        propertyKey == 'layer'
      " :item-property="itemProperty" :property-key="propertyKey" :change-is-editing="changeIsEditing"
        :changeVal="diffVal" />

      <!-- 中間点みたいなのがおけない数値 -->
      <NumberPropertyForm v-else-if="itemProperty.propertyType == 'number'" :item-property="itemProperty"
        :property-key="propertyKey" :change-is-editing="changeIsEditing" :changeVal="overwriteVal" />

      <!-- 中間点みたいなのがおける数値 -->
      <VarNumberPropertyForm v-else-if="itemProperty.propertyType == 'VarNumbers'" :item-property="itemProperty"
        :property-key="propertyKey" :change-is-editing="changeIsEditing" :changeVal="overwriteVal"
        :key-frames="keyFrames" />

      <!-- 秒 -->
      <div v-else-if="itemProperty.propertyType == 'Time'">
        <q-input v-model="itemProperty.valueModel" outlined type="number" step="0.01"
          @update:model-value="(value) => overwriteVal(value, propertyKey, false)" @focus="changeIsEditing('start')"
          @blur="overwriteVal(itemProperty.valueModel, propertyKey, true);" />
      </div>

      <!-- 文字列(テキストエリア) -->
      <div v-else-if="
        itemProperty.propertyType == 'string'
      ">
        <q-input v-model="itemProperty.valueModel" outlined type="textarea"
          @update:model-value="(value) => overwriteVal(value, propertyKey, false)" @focus="changeIsEditing('start')"
          @blur="overwriteVal(itemProperty.valueModel, propertyKey, true);" />
      </div>

      <!-- フォント -->
      <div v-else-if="
        itemProperty.propertyType == 'Font'
      ">
        <q-input v-model="itemProperty.valueModel" outlined
          @update:model-value="(value) => overwriteVal(value, propertyKey, false)" @focus="changeIsEditing('start')"
          @blur="overwriteVal(itemProperty.valueModel, propertyKey, true);" />
      </div>

      <!-- ブール値 -->
      <div v-else-if="itemProperty.propertyType == 'boolean'">
        <q-toggle class="q-gutter-sm" v-model="itemProperty.valueModel" color="primary" dense
          @update:model-value="(value) => overwriteVal(value, propertyKey, true)" />
      </div>

      <!-- カラー -->
      <div v-else-if="itemProperty.propertyType == 'ColorHEXA'">
        <q-color v-model="itemProperty.valueModel" default-view="tune" format-model="hexa" no-header-tabs
          @update:model-value="(value) => overwriteVal(value, propertyKey, false)"
          @change="(value) => overwriteVal(value, propertyKey, true)" />
      </div>

      <!-- ドロップダウン -->
      <div v-else-if="Object.keys(dropDowns).includes(itemProperty.propertyType)">
        <q-select v-model="itemProperty.valueModel" outlined map-options
          :options="dropDowns[itemProperty.propertyType as keyof typeof dropDowns]"
          @update:model-value="(value) => overwriteVal(value.value, propertyKey, true)" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {defineProps}from "vue";
import {
  dropDowns,
  type ItemKey,
  type KeyFrames,
  type TLItem,
} from "@/types/itemType";
import NumberPropertyForm from "./NumberPropertyForm.vue";
import VarNumberPropertyForm from "./VarNumberPropertyForm.vue";
import type { ItemPropertyView }from "../propertyViewType";

const props = defineProps<{
  itemProperty:ItemPropertyView,
  propertyKey: ItemKey,
  changeIsEditing:(editState: "start" | "end" | "set") => void,
  diffVal:(value: unknown, key: keyof TLItem, isSet: boolean, option?: "VarNumbers") =>void,
  overwriteVal:(value: unknown, key: keyof TLItem, isSet: boolean, option?: "VarNumbers") =>void,
  keyFrames: KeyFrames
}>();


</script>