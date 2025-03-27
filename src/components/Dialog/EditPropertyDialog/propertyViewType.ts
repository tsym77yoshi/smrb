import type { ItemProperty, TLItem } from "@/types/itemType";

export type ItemPropertyView = ItemProperty & {
  valueModel: any;
  numberForm?: NumberForm;
};
export type ItemPropertyGroupView = {
  name: string;
  properties: Record<keyof TLItem, ItemPropertyView>;
};
export type NumberForm = {
  min: number;
  max: number;
  validMin: number | undefined;
  validMax: number | undefined;
  step: number; // フォームでの数値の刻み。整数なら1, 小数なら基本0.1
  rate: number; // x2, x3...など
};