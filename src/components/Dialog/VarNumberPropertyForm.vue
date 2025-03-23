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
import AnimationTypeDialog from "./AnimationTypeDialog.vue";
import NumberPropertyForm from "./NumberPropertyForm.vue";
import type { ItemProperty, TLItem, VarNumbers, AnimationType, KeyFrames } from "@/types/itemType";
import { getAnimationValuesType } from "@/types/itemType";
import type { ItemPropertyView } from "./ItemPropertyDialog.vue"
import type { NumberForm } from "./getNumberForm"

const props = defineProps<{
  itemProperty: ItemPropertyView,
  propertyKey: keyof TLItem,
  changeIsEditing: (editState: "start" | "end" | "set") => void,
  changeVal: (value: unknown, key: keyof TLItem, isSet: boolean, option?: "VarNumbers") => void,
  keyFrames: KeyFrames,
}>();

const anmDialog = ref()

const stepItemProperty: ItemProperty = {
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
  itemProperty: ItemPropertyView,
  propertyKey: keyof TLItem,
  changeIsEditing: (editState: "start" | "end" | "set") => void,
  changeVal: (value: unknown, key: keyof TLItem, isSet: boolean, option?: "VarNumbers") => void,
  option: 'VarNumbers',
}

const binds = computed<bindType[]>(() => {
  const valModel = props.itemProperty.valueModel as VarNumbers;
  const valuesType = getAnimationValuesType(valModel.animationType);

  if (valuesType == undefined) {
    console.error("valuesType is undefined");
    return [];
  }
  else if (valuesType == "none") {
    return [{
      itemProperty: getNewItemProperty(0),
      propertyKey: props.propertyKey,
      changeIsEditing: props.changeIsEditing,
      changeVal: (value: unknown, key: keyof TLItem, isSet: boolean, option?: "VarNumbers") => {
        changeVarVal(value, key, isSet, 0)
      },
      option: 'VarNumbers',
    }];
  }
  else if (valuesType == "span") {

    const newItemPropertySpan: ItemPropertyView = {
      ...stepItemProperty,
      valueModel: props.itemProperty.valueModel.span,
      numberForm: stepNumberForm,
    }

    return [{
      itemProperty: getNewItemProperty(0),
      propertyKey: props.propertyKey,
      changeIsEditing: props.changeIsEditing,
      changeVal: (value: unknown, key: keyof TLItem, isSet: boolean, option?: "VarNumbers") => {
        changeVarVal(value, key, isSet, 0)
      },
      option: 'VarNumbers',
    }, {
      itemProperty: getNewItemProperty(1),
      propertyKey: props.propertyKey,
      changeIsEditing: props.changeIsEditing,
      changeVal: (value: unknown, key: keyof TLItem, isSet: boolean, option?: "VarNumbers") => {
        changeVarVal(value, key, isSet, 1)
      },
      option: 'VarNumbers',
    }, {
      itemProperty: newItemPropertySpan,
      propertyKey: props.propertyKey,
      changeIsEditing: props.changeIsEditing,
      changeVal: (value: unknown, key: keyof TLItem, isSet: boolean, option?: "VarNumbers") => {
        changeSpanVal(value, key, isSet)
      },
      option: 'VarNumbers',
    },];
  }
  else if (valuesType == "keyFrames") {
    return Array.from({ length: props.keyFrames.count+2 }, (_, index) => {return {
      itemProperty: getNewItemProperty(index),
      propertyKey: props.propertyKey,
      changeIsEditing: props.changeIsEditing,
      changeVal: (value: unknown, key: keyof TLItem, isSet: boolean, option?: "VarNumbers") => {
        changeVarVal(value, key, isSet, index)
      },
      option: 'VarNumbers',
    }});
  }
  return [];
})

// コピーしたうえでvalueを更新
const getNewItemProperty = (index: number) => {
  const newItemProperty = JSON.parse(JSON.stringify(props.itemProperty)) as ItemPropertyView;
  newItemProperty.valueModel = props.itemProperty.valueModel.values[index].value;
  return newItemProperty;
}

const changeVarVal = (value: unknown, key: keyof TLItem, isSet: boolean, index: number) => {
  let newVal = JSON.parse(JSON.stringify(props.itemProperty.valueModel)) as VarNumbers;
  newVal.values[index].value = value as number;
  props.changeVal(newVal, key, isSet, "VarNumbers")
}

const changeSpanVal = (value: unknown, key: keyof TLItem, isSet: boolean) => {
  let newVal = JSON.parse(JSON.stringify(props.itemProperty.valueModel)) as VarNumbers;
  newVal.span = value as number;
  props.changeVal(newVal, key, isSet, "VarNumbers")
}

const setAnimationType = (name: AnimationType) => {
  let newVal = JSON.parse(JSON.stringify(props.itemProperty.valueModel)) as VarNumbers;

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