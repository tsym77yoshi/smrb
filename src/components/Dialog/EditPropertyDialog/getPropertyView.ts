import type {
  TLItem,
  ItemKey,
  PropertyGroup,
  VarNumbers,
} from "@/types/itemType";
import { getNumberForm } from "./Property/getNumberForm";
import type { PropertyView, PropertyGroupView } from "./propertyViewTypes";
import { useSettingStore } from "@/store/tlStore";


let setting:ReturnType<typeof useSettingStore>;

export const propertyGroupToPropertyView = (
  propertyGroups: PropertyGroup[],
  lastSelectedItemOriginal: TLItem,
): PropertyGroupView[] => {
  if(!setting){
    setting = useSettingStore();
  }
  // hideLevelに応じてpropertyを消す
  propertyGroups = propertyGroups.map((propertyGroup) => {
    Object.keys(propertyGroup.properties)
      .filter(
        (key) =>
          propertyGroup.properties[key].hideLevel != undefined &&
          !setting.showHideLevels.includes(
            propertyGroup.properties[key].hideLevel
          )
      )
      .forEach((key) => delete propertyGroup.properties[key]);
    return propertyGroup;
  });
  // valueModelを追加していく
  return propertyGroups.map((propertyGroup) => {
    let resultPropertiesView: Record<string, PropertyView> = {};
    Object.keys(propertyGroup.properties).map((strKey) => {
      const key = strKey as ItemKey;
      const targetProperty = propertyGroup.properties[key];
      const targetPropertyType = targetProperty.propertyType;
      // valueModelのやつ
      let valueModel = undefined;
      valueModel = lastSelectedItemOriginal[key as ItemKey];
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
      const property: PropertyView = {
        ...propertyGroup.properties[key],
        valueModel: valueModel,
        ...numberForm,
      };
      resultPropertiesView[key] = property;
      return { [key]: property };
    });
    return {
      name: propertyGroup.name,
      properties: resultPropertiesView,
    };
  });
}