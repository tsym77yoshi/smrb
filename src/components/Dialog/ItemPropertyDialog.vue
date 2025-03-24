<!-- アイテムのプロパティを表示する、下側からでてくるダイアログ -->
<template>
  <div>
    <div v-for="(itemGroup, index) in editData" :key="index">
      <q-expansion-item switch-toggle-side expand-separator defaultOpened expand-icon="arrow_drop_down_circle"
        :label="itemGroup.name">
        <q-card style="background-color: var(--color-background)">
          <q-card-section>
            <div v-for="(
itemProperty, propertyKey, index2
                  ) in itemGroup.properties" :key="index2" style="
                    display: flex;
                    flex-direction: row;
                    margin-bottom: 1rem;
                  ">
              <div style="width: 20%">{{ itemProperty.name }}</div>
              <!-- プロパティのフォーム -->
              <div style="width: 75%">
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
                <VarNumberPropertyForm v-else-if="itemProperty.propertyType == 'VarNumbers'"
                  :item-property="itemProperty" :property-key="propertyKey" :change-is-editing="changeIsEditing"
                  :changeVal="overwriteVal" :key-frames="targetItems[0].keyFrames" />

                <!-- 秒 -->
                <div v-else-if="itemProperty.propertyType == 'Time'">
                  <q-input v-model="itemProperty.valueModel" outlined type="number" step="0.01"
                    @update:model-value="(value) => overwriteVal(value, propertyKey, false)"
                    @focus="changeIsEditing('start')"
                    @blur="overwriteVal(itemProperty.valueModel, propertyKey, true);" />
                </div>

                <!-- 文字列(テキストエリア) -->
                <div v-else-if="
                  itemProperty.propertyType == 'string'
                ">
                  <q-input v-model="itemProperty.valueModel" outlined type="textarea"
                    @update:model-value="(value) => overwriteVal(value, propertyKey, false)"
                    @focus="changeIsEditing('start')"
                    @blur="overwriteVal(itemProperty.valueModel, propertyKey, true);" />
                </div>

                <!-- フォント -->
                <div v-else-if="
                  itemProperty.propertyType == 'Font'
                ">
                  <q-input v-model="itemProperty.valueModel" outlined
                    @update:model-value="(value) => overwriteVal(value, propertyKey, false)"
                    @focus="changeIsEditing('start')"
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

                <!-- エフェクト -->
                <EffectProperty
                  v-else-if="itemProperty.propertyType == 'VideoEffects'"
                  :changeVal="overwriteVal"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-expansion-item>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import {
  useSettingStore,
} from "@/store/tlStore";
import {
  type TLItem,
  type ItemKey,
  type ItemPropertyGroup,
  type ItemProperty,
  type VarNumbers,
  dropDowns,
} from "@/types/itemType";
import { itemPropertyGroups as loadItemPropertyGroups } from "@/types/itemType";
import NumberPropertyForm from "./NumberPropertyForm.vue";
import VarNumberPropertyForm from "./VarNumberPropertyForm.vue";
import EffectProperty from "./EffectProperty.vue";
import { getNumberForm, type NumberForm } from "./getNumberForm";

const editDialog = ref()
const show = () => {
  editDialog.value?.show()
}

const props = defineProps<{
  targetItems: TLItem[],
  diffVal: (ids: number[], key: keyof TLItem, value: unknown, orignalVals: unknown[], isSet: boolean) => void,
  overwriteVal: (ids: number[], key: keyof TLItem, value: unknown, orignalVals: unknown[], isSet: boolean) => void,
}>();

export type ItemPropertyView = ItemProperty & {
  valueModel: any;
  numberForm?: NumberForm;
};
type ItemPropertyGroupView = {
  name: string;
  properties: Record<keyof TLItem, ItemPropertyView>;
};

const itemPropertyGroups = loadItemPropertyGroups as unknown as Record<
  string,
  ItemPropertyGroup[]
>;
const setting = useSettingStore();
const editData = computed<ItemPropertyGroupView[]>(() => {
  if (!isEditing.value) {
    changeIsEditing("set");
  }
  if (props.targetItems.length > 0) {
    let resultItemGroups = itemPropertyGroups[props.targetItems[0].type];
    // nameが被っていないGroupを削除
    for (let i = 1; i < props.targetItems.length; i++) {
      const searchGroupNames = itemPropertyGroups[props.targetItems[i].type].map(
        (itemGroup) => itemGroup.name
      );
      const removeGroupNames = resultItemGroups
        .map((itemGroup) => itemGroup.name)
        .filter((itemKeysName) => !searchGroupNames.includes(itemKeysName));

      resultItemGroups = resultItemGroups.filter(
        (itemGroup) => !removeGroupNames.includes(itemGroup.name)
      );
    }
    // hideLevelに応じてpropertyを消す
    resultItemGroups = resultItemGroups.map((itemGroup) => {
      Object.keys(itemGroup.properties)
        .filter(
          (key) =>
            itemGroup.properties[key].hideLevel != undefined &&
            !setting.showHideLevels.includes(
              itemGroup.properties[key].hideLevel
            )
        )
        .forEach((key) => delete itemGroup.properties[key]);
      return itemGroup;
    });
    // valueModelを追加していく
    const lastSelectedItem = props.targetItems[0];
    return resultItemGroups.map((itemGroup) => {
      let resultItemGroupView: Record<string, ItemPropertyView> = {};
      Object.keys(itemGroup.properties).map((strKey) => {
        const key = strKey as ItemKey;
        const targetProperty = itemGroup.properties[key];
        const targetPropertyType = targetProperty.propertyType;
        // valueModelのやつ
        let valueModel = undefined;
        valueModel = lastSelectedItem[key as ItemKey];
        const lastSelectedItemOriginal = editDataOriginals[0];
        // 数字限定。min, max, stepのやつ
        let numberForm = {};
        if (
          targetPropertyType == "VarNumbers" ||
          targetPropertyType == "number"
        ) {
          const targetNumVal = lastSelectedItemOriginal[
            key
          ] as number | VarNumbers;
          numberForm = {
            numberForm: getNumberForm(targetProperty, targetNumVal)
          }
        }
        const property: ItemPropertyView = {
          ...itemGroup.properties[key],
          valueModel: valueModel,
          ...numberForm,
        };
        resultItemGroupView[key] = property;
        return { [key]: property };
      });
      return {
        name: itemGroup.name,
        properties: resultItemGroupView,
      };
    });
  }
  return [];
});

// 変更前のデータ
let editDataOriginals: TLItem[] = [];
const isEditing = ref<boolean>(false);
const changeIsEditing = (editState: "start" | "end" | "set") => {
  if (editState == "start" || editState == "set") {
    if (editState == "start") {
      isEditing.value = true;
    }
    editDataOriginals = JSON.parse(JSON.stringify(props.targetItems));
  } else if (editState == "end") {
    isEditing.value = false;
  } else {
    console.error("unexpectedを受け取ったよ！");
  }
};
// 変化処理
const diffVal = (value: unknown, key: keyof TLItem, isSet: boolean, option?: "VarNumbers") => {
  if (option == "VarNumbers") {
    console.error("未実装")
  }
  if (!isEditing.value) {
    changeIsEditing("start");
  }
  const originalVals = editDataOriginals.map((item) => item[key]) as number[]
  props.diffVal(editDataOriginals.map((item) => item.id), key, (value as number) - originalVals[0], originalVals, isSet);
  if (isSet) {
    changeIsEditing("end");
  }
};
const overwriteVal = (value: unknown, key: keyof TLItem, isSet: boolean, option?: "VarNumbers") => {
  if (!isEditing.value) {
    changeIsEditing("start");
  }
  props.overwriteVal(editDataOriginals.map((item) => item.id), key, value, editDataOriginals.map((item) => item[key]), isSet);
  if (isSet) {
    changeIsEditing("end");
  }
};

defineExpose({ show, changeIsEditing })
</script>