<template>
  <div style="position: relative;display: flex;justify-content: space-between;">
    <q-input v-model.number="property.valueModel" type="number" @focus="changeIsEditing('start')"
      @update:model-value="(value) => {
          if (isValidNumber(value, property.numberForm)) {
            changeVal(value, propertyKey, false, option)
          }
        }
        " @blur="(value) => {
          if (isValidNumber(value, property.numberForm)) {
            changeVal(value, propertyKey, true, option)
          }
        }" dense outlined style="width:25%;">
      <template v-slot:append>
        <div style="font-size: 0.75rem;padding-top: 0.25rem;">
          {{ property?.unit }}
        </div>
      </template>
    </q-input>
    <span style="width:70%;display: flex;justify-content: space-between;align-items: center;">
      <span style="position: relative;width:100%">
        <q-slider v-model="property.valueModel" :min="property.numberForm?.min"
          :max="property.numberForm?.max" :step="property.numberForm?.step"
          @update:model-value="(value) => changeVal(value, propertyKey, false, option)"
          @change="(value) => changeVal(value, propertyKey, true, option)" label color="primary"
          style="position: relative;" />
        <div v-if="property.numberForm?.rate != 1" style="position: absolute; right: 0; bottom: 0">
          x{{ property.numberForm?.rate }}
        </div>
      </span>
      <slot name="optionalButton"></slot>
    </span>
  </div>
</template>

<script setup lang="ts">
import type { NumberForm, PropertyView, ChangeIsEdigtingFuncType, ChangePropertyValFuncType, PropertyKey } from "../propertyViewTypes";

const props = defineProps<{
  property: PropertyView,
  propertyKey: PropertyKey,
  changeIsEditing: ChangeIsEdigtingFuncType,
  changeVal: ChangePropertyValFuncType,
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