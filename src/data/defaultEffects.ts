import type { VideoEffectType, VarNumbers, VideoEffect, AudioEffectType, AudioEffect } from "@/types/itemType";

const Varnum = (arg: number) => {
  return {
    values: [{ value: arg }],
    span: 0,
    animationType: "なし",
  } as VarNumbers;
};
// 個々の型は
// ToEffectType<typeof allEffects["/*エフェクト名*/"]>
export const defaultVideoEffects:Record<VideoEffectType, VideoEffect> = {
  centerPointEffect:{
    type: "centerPointEffect",
    isEnabled:true,
    horizontal: "Original",
    vertical: "Original",
    x:Varnum(0),
    y:Varnum(0),
    isKeepPosition: false,
  },
  borderBlurEffect: {
    type:"borderBlurEffect",
    isEnabled: true,
    blur: Varnum(0),
  },
  gaussianBlurEffect: {
    type:"gaussianBlurEffect",
    isEnabled: true,
    blur: Varnum(0),
    isHardBorderMode: false,
  },
}
export const defaultAudioEffects:Record<AudioEffectType, AudioEffect> ={
  echoEffect:{
    type:"echoEffect",
    isEnabled:true,
    strength:Varnum(0),
    delay:Varnum(0),
    feedBack:Varnum(0),
  },
}