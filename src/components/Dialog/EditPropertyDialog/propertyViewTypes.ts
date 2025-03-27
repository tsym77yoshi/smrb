import type { Property, TLItem } from "@/types/itemType";


export type PropertyView = Property & {
  valueModel: any;
  numberForm?: NumberForm;
};
export type PropertyGroupView = {
  name: string;
  properties: Record<keyof TLItem, PropertyView>;
};
export type NumberForm = {
  min: number;
  max: number;
  validMin: number | undefined;
  validMax: number | undefined;
  step: number; // フォームでの数値の刻み。整数なら1, 小数なら基本0.1
  rate: number; // x2, x3...など
};
export type DiffValFuncType = (itemIds: number[], itemPropertyKey: keyof TLItem, value: unknown, orignalVals: unknown[], isSet: boolean) => void;
export type OverwriteValFuncType = (itemIds: number[], itemPropertyKey: keyof TLItem, value: unknown, orignalVals: unknown[], isSet: boolean) => void;
export type ChangeIsEdigtingFuncType = (editState: "start" | "end" | "set") => void