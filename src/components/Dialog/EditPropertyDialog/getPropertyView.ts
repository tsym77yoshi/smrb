import type {
  TLItem,
  ItemKey,
  ItemPropertyGroup,
  VarNumbers,
} from "@/types/itemType";
import { getNumberForm } from "./Property/getNumberForm";
import type { ItemPropertyView, ItemPropertyGroupView } from "./propertyViewType";
import { useSettingStore } from "@/store/tlStore";


let setting:ReturnType<typeof useSettingStore>;

export const propertyGroupToPropertyView = (
  itemPropertyGroups: ItemPropertyGroup[],
  lastSelectedItemOriginal: TLItem,
): ItemPropertyGroupView[] => {
  if(!setting){
    setting = useSettingStore();
  }
  // hideLevelに応じてpropertyを消す
  itemPropertyGroups = itemPropertyGroups.map((itemGroup) => {
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
  const lastSelectedItem = lastSelectedItemOriginal;
  return itemPropertyGroups.map((itemGroup) => {
    let resultItemGroupView: Record<string, ItemPropertyView> = {};
    Object.keys(itemGroup.properties).map((strKey) => {
      const key = strKey as ItemKey;
      const targetProperty = itemGroup.properties[key];
      const targetPropertyType = targetProperty.propertyType;
      // valueModelのやつ
      let valueModel = undefined;
      valueModel = lastSelectedItem[key as ItemKey];
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