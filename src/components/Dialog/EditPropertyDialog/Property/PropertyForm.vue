<template>
  <div style="width:100%">
    <div style="width: 20%">{{ property.name }}</div>
    <!-- プロパティのフォーム -->
    <div style="width: 80%">
      <!-- フレーム・長さ・レイヤー(複数選択時に差分で動くものたち) -->
      <NumberPropertyForm v-if="
        propertyKey == 'frame' ||
        propertyKey == 'length' ||
        propertyKey == 'layer'
      " :property="property" :propertyKey="propertyKey" :changeIsEditing="changeIsEditing" :changeVal="diffVal" />

      <!-- 中間点みたいなのがおけない数値 -->
      <NumberPropertyForm v-else-if="property.propertyType == 'number'" :property="property" :propertyKey="propertyKey"
        :changeIsEditing="changeIsEditing" :changeVal="overwriteVal" />

      <!-- 中間点みたいなのがおける数値 -->
      <VarNumberPropertyForm v-else-if="property.propertyType == 'VarNumbers'" :property="property"
        :propertyKey="propertyKey" :changeIsEditing="changeIsEditing" :changeVal="overwriteVal"
        :keyFrames="keyFrames" />

      <!-- 秒 -->
      <div v-else-if="property.propertyType == 'Time'">
        <q-input v-model="property.valueModel" outlined type="number" step="0.01"
          @update:model-value="(value) => overwriteVal(value, propertyKey, false)" @focus="changeIsEditing('start')"
          @blur="overwriteVal(property.valueModel, propertyKey, true);" />
      </div>

      <!-- 文字列(テキストエリア) -->
      <div v-else-if="property.propertyType == 'string'">
        <q-input v-model="property.valueModel" outlined type="textarea"
          @update:model-value="(value) => overwriteVal(value, propertyKey, false)" @focus="changeIsEditing('start')"
          @blur="overwriteVal(property.valueModel, propertyKey, true);" />
      </div>

      <!-- フォント -->
      <div v-else-if="property.propertyType == 'Font'">
        <q-input v-model="property.valueModel" outlined
          @update:model-value="(value) => overwriteVal(value, propertyKey, false)" @focus="changeIsEditing('start')"
          @blur="overwriteVal(property.valueModel, propertyKey, true);" />
      </div>

      <!-- ブール値 -->
      <div v-else-if="property.propertyType == 'boolean'">
        <q-toggle class="q-gutter-sm" v-model="property.valueModel" color="primary" dense
          @update:model-value="(value) => overwriteVal(value, propertyKey, true)" />
      </div>

      <!-- カラー -->
      <div v-else-if="property.propertyType == 'ColorHEXA'">
        <q-color v-model="property.valueModel" default-view="tune" format-model="hexa" no-header-tabs
          @update:model-value="(value) => overwriteVal(value, propertyKey, false)"
          @change="(value) => overwriteVal(value, propertyKey, true)" />
      </div>

      <!-- ドロップダウン -->
      <div v-else-if="Object.keys(dropDowns).includes(property.propertyType)">
        <q-select v-model="property.valueModel" outlined map-options
          :options="dropDowns[property.propertyType as keyof typeof dropDowns]"
          @update:model-value="(value) => overwriteVal(value.value, propertyKey, true)" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from "vue";
import {
  dropDowns,
  type ItemKey,
  type KeyFrames,
  type TLItem,
} from "@/types/itemType";
import NumberPropertyForm from "./NumberPropertyForm.vue";
import VarNumberPropertyForm from "./VarNumberPropertyForm.vue";
import type { PropertyView } from "../propertyViewTypes";

const props = defineProps<{
  property: PropertyView,
  propertyKey: ItemKey,
  changeIsEditing: (editState: "start" | "end" | "set") => void,
  diffVal: (value: unknown, key: keyof TLItem, isSet: boolean, option?: "VarNumbers") => void,
  overwriteVal: (value: unknown, key: keyof TLItem, isSet: boolean, option?: "VarNumbers") => void,
  keyFrames: KeyFrames
}>();


</script>