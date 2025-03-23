<template>
  <div style="position: relative;display: flex;justify-content: space-between;">
    <q-input v-model.number="props.itemProperty.valueModel" type="number" @focus="changeIsEditing('start')"
      @update:model-value="(value) => {
          if (isValidNumber(value, itemProperty.numberForm)) {
            changeVal(value, propertyKey, false, option)
          }
        }
        " @blur="(value) => {
          if (isValidNumber(value, itemProperty.numberForm)) {
            changeVal(value, propertyKey, true, option)
          }
        }" dense outlined style="width:25%;">
      <template v-slot:append>
        <div style="font-size: 0.75rem;padding-top: 0.25rem;">
          {{ itemProperty?.unit }}
        </div>
      </template>
    </q-input>
    <span style="width:70%;display: flex;justify-content: space-between;align-items: center;">
      <span style="position: relative;width:100%">
        <q-slider v-model="props.itemProperty.valueModel" :min="itemProperty.numberForm?.min"
          :max="itemProperty.numberForm?.max" :step="itemProperty.numberForm?.step"
          @update:model-value="(value) => changeVal(value, propertyKey, false, option)"
          @change="(value) => changeVal(value, propertyKey, true, option)" label color="primary"
          style="position: relative;" />
        <div v-if="itemProperty.numberForm?.rate != 1" style="position: absolute; right: 0; bottom: 0">
          x{{ itemProperty.numberForm?.rate }}
        </div>
      </span>
      <slot name="optionalButton"></slot>
    </span>
  </div>
</template>

<script setup lang="ts">
import type { TLItem } from "@/types/itemType";
import type { ItemPropertyView } from "./ItemPropertyDialog.vue";
import type { NumberForm } from "./getNumberForm";

const props = defineProps<{
  itemProperty: ItemPropertyView,
  propertyKey: keyof TLItem,
  changeIsEditing: (editState: "start" | "end" | "set") => void,
  changeVal: (value: unknown, key: keyof TLItem, isSet: boolean, option?: "VarNumbers") => void,
  option?: "VarNumbers",
}>();

const isValidNumber = (value: any, numberForm: NumberForm | undefined): boolean => {
  if (numberForm == undefined) {
    return false;
  }
  if (typeof value != "number") {
    return false;
  }
  if (numberForm.validMin) {
    if (value < numberForm.validMin) {
      return false;
    }
  }
  if (numberForm.validMax) {
    if (numberForm.validMax < value) {
      return false;
    }
  }
  return true;
}
</script>