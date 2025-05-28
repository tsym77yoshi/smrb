import type { AudioEffect, VideoEffect, Property, TLItem } from "@/types/itemType";


export type PropertyKey = keyof TLItem | keyof AudioEffect | keyof VideoEffect;
export type PropertyView = Property & {
  valueModel: any;
  numberForm?: NumberForm;
};
export type PropertyGroupView = {
  name: string;// Todo: より正確に定義できるかも
  properties: Record<PropertyKey, PropertyView>;
};
export type NumberForm = {
  min: number;
  max: number;
  validMin: number | undefined;
  validMax: number | undefined;
  step: number; // フォームでの数値の刻み。整数なら1, 小数なら基本0.1
  rate: number; // x2, x3...など
};
export type ChangePropertyValFuncType = (value: unknown, key: PropertyKey, isSet: boolean, option?: "VarNumbers") => void;
export type ChangeIsEdigtingFuncType = (editState: "start" | "end" | "set") => void;