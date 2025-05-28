<template>
  <div>
    <NumberPropertyForm v-for="(bind, index) in binds" :key="index" v-bind="bind">
      <template v-slot:optionalButton>
        <q-btn icon="show_chart" dense color="primary" style="margin-left: 10%;" @click="anmDialog.show()" />
      </template>
    </NumberPropertyForm>
    <AnimationTypeDialog ref="anmDialog" :setAnimationType="setAnimationType" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import AnimationTypeDialog from "../Property/AnimationTypeDialog.vue";
import NumberPropertyForm from "./NumberPropertyForm.vue";
import type { Property, VarNumbers, AnimationType, KeyFrames } from "@/types/itemType";
import { getAnimationValuesType } from "@/types/itemType";
import type { NumberForm, PropertyView, ChangeIsEdigtingFuncType, ChangePropertyValFuncType, PropertyKey } from "../propertyViewTypes"

const props = defineProps<{
  property: PropertyView,
  propertyKey: PropertyKey,
  changeIsEditing: ChangeIsEdigtingFuncType,
  changeVal: ChangePropertyValFuncType,
  keyFrames: KeyFrames,
}>();

const anmDialog = ref()

const stepItemProperty: Property = {
  propertyType: "number",
  name: "ステップ",
  unit: "秒",
}
const stepNumberForm: NumberForm = {
  min: 0,
  max: 0.50,
  step: 0.01,
  validMin: 0,
  validMax: undefined,
  rate: 1,// TODO: 動的に変更したい
}

type bindType = {
  property: PropertyView,
  propertyKey: PropertyKey,
  changeIsEditing: (editState: "start" | "end" | "set") => void,
  changeVal: ChangePropertyValFuncType,
  option: 'VarNumbers',
}

const binds = computed<bindType[]>(() => {
  const valModel = props.property.valueModel as VarNumbers;
  const valuesType = getAnimationValuesType(valModel.animationType);

  if (valuesType == undefined) {
    console.error("valuesType is undefined");
    return [];
  }
  else if (valuesType == "none") {
    return [{
      property: getNewItemProperty(0),
      propertyKey: props.propertyKey,
      changeIsEditing: props.changeIsEditing,
      changeVal: (value: unknown, key: PropertyKey, isSet: boolean, option?: "VarNumbers") => {
        changeVarVal(value, key, isSet, 0)
      },
      option: 'VarNumbers',
    }];
  }
  else if (valuesType == "span") {

    const newItemPropertySpan: PropertyView = {
      ...stepItemProperty,
      valueModel: props.property.valueModel.span,
      numberForm: stepNumberForm,
    }

    return [{
      property: getNewItemProperty(0),
      propertyKey: props.propertyKey,
      changeIsEditing: props.changeIsEditing,
      changeVal: (value: unknown, key: PropertyKey, isSet: boolean, option?: "VarNumbers") => {
        changeVarVal(value, key, isSet, 0)
      },
      option: 'VarNumbers',
    }, {
      property: getNewItemProperty(1),
      propertyKey: props.propertyKey,
      changeIsEditing: props.changeIsEditing,
      changeVal: (value: unknown, key: PropertyKey, isSet: boolean, option?: "VarNumbers") => {
        changeVarVal(value, key, isSet, 1)
      },
      option: 'VarNumbers',
    }, {
      property: newItemPropertySpan,
      propertyKey: props.propertyKey,
      changeIsEditing: props.changeIsEditing,
      changeVal: (value: unknown, key: PropertyKey, isSet: boolean, option?: "VarNumbers") => {
        changeSpanVal(value, key, isSet)
      },
      option: 'VarNumbers',
    },];
  }
  else if (valuesType == "keyFrames") {
    return Array.from({ length: props.keyFrames.count+2 }, (_, index) => {return {
      property: getNewItemProperty(index),
      propertyKey: props.propertyKey,
      changeIsEditing: props.changeIsEditing,
      changeVal: (value: unknown, key: PropertyKey, isSet: boolean, option?: "VarNumbers") => {
        changeVarVal(value, key, isSet, index)
      },
      option: 'VarNumbers',
    }});
  }
  return [];
})

// コピーしたうえでvalueを更新
const getNewItemProperty = (index: number) => {
  const newItemProperty = JSON.parse(JSON.stringify(props.property)) as PropertyView;
  newItemProperty.valueModel = props.property.valueModel.values[index].value;
  return newItemProperty;
}

const changeVarVal = (value: unknown, key: PropertyKey, isSet: boolean, index: number) => {
  let newVal = JSON.parse(JSON.stringify(props.property.valueModel)) as VarNumbers;
  newVal.values[index].value = value as number;
  props.changeVal(newVal, key, isSet, "VarNumbers")
}

const changeSpanVal = (value: unknown, key: PropertyKey, isSet: boolean) => {
  let newVal = JSON.parse(JSON.stringify(props.property.valueModel)) as VarNumbers;
  newVal.span = value as number;
  props.changeVal(newVal, key, isSet, "VarNumbers")
}

const setAnimationType = (name: AnimationType) => {
  let newVal = JSON.parse(JSON.stringify(props.property.valueModel)) as VarNumbers;

  const valuesType = getAnimationValuesType(name);
  if (valuesType == "none") {
    newVal.values = [newVal.values[0]];
  }
  else if (valuesType == "span") {
    // 長さは1以上である
    if (newVal.values.length == 1) {
      newVal.values.push(newVal.values[0]);
    } else {
      newVal.values = [newVal.values[0], newVal.values[newVal.values.length - 1]];
    }
  }
  else if (valuesType == "keyFrames") {
    if (newVal.values.length == 1) {
      newVal.values = Array(props.keyFrames.count + 2).fill(newVal.values[0]);
    } else if (newVal.values.length == 2) {
      newVal.values = [...Array(props.keyFrames.count + 1).fill(newVal.values[0]), newVal.values[newVal.values.length - 1]];
    }
    // それ以外は何もしない
  }

  newVal.animationType = name;
  props.changeVal(newVal, props.propertyKey, true, "VarNumbers")
}
</script>