// カーブ
import type { AnimationType, VarNumbers, KeyFrames, EasingType, EasingMode } from "@/types/itemType";
import { getAnimationValuesType, isEasingAnimationType } from "@/types/itemType";

// frameはアイテム開始からのフレーム数、fpsは全体としてのフレームレート、itemLengthはアイテムの長さ(フレーム)
export const animation = (varNum: VarNumbers, frame: number, inputKeyFrames: KeyFrames, itemLength: number, fps: number): number => {
  // framesの中でframeより小さい最大のインデックスを取得
  const keyFrames = [0, ...inputKeyFrames.frames, itemLength];
  // keyFramesの中でframeより小さい最大のインデックスを取得
  const keyFramesIndex = keyFrames.reduce((acc, cur, i) => {
    return cur <= frame ? i : acc;
  }, 0);

  // 内分比を取得
  let division;
  const animationType = varNum.animationType;
  const animationValuesType = getAnimationValuesType(animationType);
  if (animationValuesType === "none") {
    division = 0;
  }
  else if (animationValuesType === "keyFrames") {
    const keyFrameInterval = keyFrames[keyFramesIndex + 1] - keyFrames[keyFramesIndex];
    const timeInKeyFrame = frame - keyFrames[keyFramesIndex];
    division = animationKeyFrames(timeInKeyFrame / keyFrameInterval, animationType);
  }
  else if (animationValuesType === "span") {
    division = animationSpan(frame / fps, animationType, varNum.span);
  }
  if (division === undefined) {
    console.error("アニメーションタイプが不正です");
    return 0;
  }

  // 前後の値を取得
  const formerValue = varNum.values[keyFramesIndex];
  let latterValue = varNum.values[keyFramesIndex + 1];
  if (latterValue == undefined) {
    latterValue = formerValue;
  }

  // 内分比を使って値を取得
  return formerValue.value + (latterValue.value - formerValue.value) * division;
}

// 出力値は0~1の範囲
// tが0~1の範囲で入力される
const animationKeyFrames = (t: number, animationType: AnimationType): number => {
  // easingとしてまとめて登録されているもの
  if (isEasingAnimationType(animationType)) {
    const easingAnimationTypeAndMode = animationType.split("_");
    const easingType = easingAnimationTypeAndMode[0] as EasingType;
    const easingMode = easingAnimationTypeAndMode[1] as EasingMode;
    return easingReturnVal(t, easing(easingArgVal(t, easingMode), easingType), easingMode);
  }
  // 非ステップ
  switch (animationType) {
    case "直線移動":
      return t;
    case "加減速移動":
      return easeInOut(t);
    case "瞬間移動":
      return 0;
  }

  console.error("アニメーションタイプが不正です");
  return 0;
}
const easingArgVal = (x: number, easingMode: EasingMode): number => {
  switch (easingMode) {
    case "In":
      return x;
    case "Out":
      return 1 - x;
    case "InOut":
      return x < 0.5 ? 2 * x : 2 - 2 * x;// 1 - (x - 0.5) * 2
    case "OutIn":
      return x < 0.5 ? 1 - 2 * x : 2 * x - 1;// (x - 0.5) * 2
  }
  console.error("イージングモードが不正です");
  return x;
}
const easing = (x: number, easingType: EasingType): number => {
  switch (easingType) {
    case "Linear":
      return x;
    case "Sine":
      return 1 - Math.cos(x * Math.PI / 2);
    case "Quad":
      return x * x;
    case "Cubic":
      return x * x * x;
    case "Quart":
      return x * x * x * x;
    case "Quint":
      return x * x * x * x * x;
    case "Expo":
      return x === 0 ? 0 : 2 ** (10 * x - 10);
    case "Circ":
      return 1 - Math.sqrt(1 - x * x);
    case "Back":
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return c3 * x * x * x - c1 * x * x;
    case "Elastic":
      const c4 = (2 * Math.PI) / 3;
      return x === 0 ? 0 : x === 1 ? 1 : -Math.pow(2, 10 * x - 10) * Math.sin((x * 10 - 10.75) * c4);
    case "Bounce":
      const n1 = 7.5625;
      const d1 = 2.75;
      let _x = 1 - x;
      if (_x < 1 / d1) {
        return 1 - n1 * _x * _x;
      } else if (_x < 2 / d1) {
        return 1 - (n1 * (_x -= 1.5 / d1) * _x + 0.75);
      } else if (_x < 2.5 / d1) {
        return 1 - (n1 * (_x -= 2.25 / d1) * _x + 0.9375);
      } else {
        return 1 - (n1 * (_x -= 2.625 / d1) * _x + 0.984375);
      }
  }
  console.error("イージングタイプが不正です");
  return 0;
}
const easingReturnVal = (x: number, y: number, easingMode: EasingMode): number => {
  switch (easingMode) {
    case "In":
      return y;
    case "Out":
      return 1 - y;
    case "InOut":
      return x < 0.5 ? y * 0.5 : 1 - y * 0.5;
    case "OutIn":
      return x < 0.5 ? 0.5 - 0.5 * y : 0.5 + 0.5 * y;
  }
  console.error("イージングモードが不正です");
  return y;
}
const easeInOut = (t: number): number => {
  return 3 * t * t - 2 * t * t * t;
}

// ステップの場合はt, stepが秒の単位で入力される
const animationSpan = (t: number, animationType: AnimationType, step: number): number => {
  if (step == 0) {
    step = 0.01;// stepが0の時は0.01になる
  }

  switch (animationType) {
    case "ランダム移動":
      // 疑似乱数的なやつ
      return Math.abs(Math.sin(Math.floor(t / step)));
    case "反復移動":
      const stepT = t % step;
      if (stepT <= step / 2) {
        return 1 - easeInOut(1 - stepT * 2 / step);
      }
      else {
        return 1 - easeInOut(stepT * 2 / step - 1);
      }
  }

  console.error("アニメーションタイプが不正です");
  return 0;
}