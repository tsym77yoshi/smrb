import type{ VarNumbers, ItemProperty } from "@/types/itemType";
import type{ NumberForm } from "../propertyViewType";

export const getNumberForm = (targetProperty: ItemProperty, targetNumVal: number | VarNumbers): NumberForm => {
  let viewMin = 0;
  let viewMax = 100;
  let viewRate = 1;
  if (targetProperty.min != undefined) {
    viewMin = targetProperty.min;
    if (targetProperty.max != undefined) {
      viewMax = targetProperty.max;
    } else if (targetProperty.range != undefined) {
      // 切り捨て。例えばmin:0,range:100の時に100でも101でも0~200と表示する
      viewRate = getRate(targetNumVal, targetProperty.range);
      viewMax = viewRate * targetProperty.range;
    } else {
      console.error(`{key}はmaxもrangeもなく、不正な数字の型でした`);
    }
  } else if (targetProperty.range != undefined) {
    if (targetProperty.max != undefined) {
      console.error(
        `{key}はminがなくてmaxがあるという型で、想定してなかったのでコードが書かれていません。実装お願いします`
      );
    } else {
      viewRate = getRate(targetNumVal, targetProperty.range);
      viewMin = -viewRate * targetProperty.range;
      viewMax = +viewRate * targetProperty.range;
    }
  } else {
    console.error(`{key}はminもrangeもなく、不正な数字の型でした`);
  }
  return {
    min: viewMin,
    max: viewMax,
    validMin: targetProperty.min,
    validMax: targetProperty.max,
    step: targetProperty.step ? targetProperty.step : 0.1,
    rate: viewRate,
  }
}
const getRate = (targetNumVal: number | VarNumbers, range: number): number => {
  if (typeof targetNumVal == "number") {
    return getPowerCeil(
      Math.floor(Math.abs(targetNumVal) / range) + 1
    );
  } else {
    // VarNumbersの場合
    const maxVal = targetNumVal.values.reduce((prev, current) => {
      return Math.max(Math.abs(prev), Math.abs(current.value));
    }, 0);
    return getRate(maxVal, range);
  }
};
const getPowerCeil = (rate: number): number => {
  let result = 1;
  while (result < rate) {
    result = result * 2;
  }
  return result;
};