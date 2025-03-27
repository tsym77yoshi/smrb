import { effect } from "vue";
import type { ColorHEXA } from "./utilityType";

export type Item = (ImageItem /* | TachieItem */ | ShapeItem | VoiceItem | TextItem | AudioItem | VideoItem) & {
  id?: number;
}
export const isAudioItem = (itemType: ItemType): boolean => {
  return itemType == "audio" || itemType == "voice" || itemType == "video"
}
export type TLItem = Item & {
  id: number;
};
export type ItemKey = keyof TLItem

// json.stringfyを使ってdeepcopyをする場面(timeline.vue)があるのでundefinedは使わないように
type ItemPropertyTypeMap = {
  number: number;
  KeyFrames: KeyFrames;// キーフレーム専用
  VarNumbers: VarNumbers;// 中間点をつけられる時間変化で動くことを想定しているものに対して
  string: string;
  boolean: boolean;
  ItemType: ItemType;
  BlendMode: BlendMode;
  VideoEffects: VideoEffect[];
  AudioEffects: AudioEffect[];
  FileId: FileId;
  CharacterName: CharacterName;
  Serif: Serif;
  Time: Time;
  Font: Font;
  BasePoint: BasePoint;
  ColorHEXA: ColorHEXA;
  // TachieItemParameter: TachieItemParameter;
  TachieId: TachieId,
  TachieOption: TachieOption,
  ShapeType: ShapeType;
  // ShapeParameter: ShapeParameter;
  JimakuVisibility: JimakuVisibility;
  CenterPointHorizontal: CenterPointHorizontal;
  CenterPointVertical: CenterPointVertical;
  Direction: Direction;
  EasingType: EasingType;
  EasingMode: EasingMode;
};
type ItemPropertyType = keyof ItemPropertyTypeMap;
export type ItemProperty = {
  propertyType: ItemPropertyType;
  name: string;
  unit?: string;
  min?: number;
  max?: number;
  range?: number;
  step?: number;// undefined => 0.1
  hideLevel?: HideLevel;
};
export type HideLevel =
  undefined |// 表示する
  "always" |// 常に表示しない
  "unimplemented" |// 未実装なので表示しない
  "advanced";// 高度な機能がオンの時だけ実装
export type ItemPropertyGroup = {
  name: string;
  properties: Record<string, ItemProperty>;
}
// なんでここでT extends ItemKeysが要るかわからんが、ないとTがunion型の時に正常に動作しない
type Convert<T extends Record<string, ItemProperty>> = T extends Record<string, ItemProperty> ? {
  -readonly [K in keyof T]:
  T[K]["propertyType"] extends keyof ItemPropertyTypeMap
  ? ItemPropertyTypeMap[T[K]["propertyType"]]
  : never;
} : never;
type Convert2<T extends ItemPropertyGroup> = T extends ItemPropertyGroup ? Convert<T["properties"]> : never;
type UnionToIntersection<T> =
  (T extends any ? (U: T) => void : never) extends
  ((U: infer R) => void) ? R : never;
type ToItemType<T extends ReadonlyArray<ItemPropertyGroup>> = UnionToIntersection<Convert2<T[number]>>;

// :ItemKeys <===ここの下のobjectたちは型宣言してはダメ！任意の値が入るようになっちゃう！かも
// ちなみに、不正な値を入れると後の Convert<typeof > のところで怒られるよ！
// テスト書きたいけど厳し～
// 検証用： : Record<string, ItemProperty>
const itemCommon = {
  name: "全般",
  properties: {
    type: { propertyType: "ItemType", name: "アイテムタイプ", hideLevel: "always" },// YMMと違うところ。常に非表示
    keyFrames: { propertyType: "KeyFrames", name: "キーフレーム", hideLevel: "always" },// 常に非表示
    frame: { propertyType: "number", name: "フレーム", min: 0, range: 1000, step: 1, },
    layer: { propertyType: "number", name: "レイヤー", min: 0, range: 10, step: 1, },
    length: { propertyType: "number", name: "長さ", min: 1, range: 1000, step: 1, },
    isLocked: { propertyType: "boolean", name: "ロック", hideLevel: "unimplemented" },
    isHidden: { propertyType: "boolean", name: "非表示" },
  }
} as const;
const drawingPropertiesWithoutFade = {
  x: { propertyType: "VarNumbers", name: "X", unit: "px", range: 500, },// 中心を0
  y: { propertyType: "VarNumbers", name: "Y", unit: "px", range: 500, },
  z: { propertyType: "VarNumbers", name: "Z", unit: "px", range: 500, hideLevel: "unimplemented" },
  opacity: { propertyType: "VarNumbers", name: "不透明度", unit: "%", min: 0, max: 100 },
  zoom: { propertyType: "VarNumbers", name: "拡大率", unit: "%", min: 0, range: 100 },
  rotation: { propertyType: "VarNumbers", name: "回転角", unit: "°", range: 360 },
  blend: { propertyType: "BlendMode", name: "合成モード", hideLevel: "unimplemented", },
  isInverted: { propertyType: "boolean", name: "左右反転", },
  isClippingWithObjectAbove: { propertyType: "boolean", name: "クリッピング", hideLevel: "unimplemented", },
  isAlwaysOnTop: { propertyType: "boolean", name: "手前に表示", hideLevel: "unimplemented", },
  isZOrderEnabled: { propertyType: "boolean", name: "Z値順に表示", hideLevel: "unimplemented", },
} as const;
const drawing = {
  name: "描画",
  properties: {
    ...drawingPropertiesWithoutFade,
    fadeIn: { propertyType: "number", name: "ﾌｪｰﾄﾞｲﾝ", unit: "秒", min: 0, range: 1, step: 0.01 },
    fadeOut: { propertyType: "number", name: "ﾌｪｰﾄﾞｱｳﾄ", unit: "秒", min: 0, range: 1, step: 0.01 },
  }
} as const;
const videoEffect = {
  name: "映像エフェクト",
  properties: {
    videoEffects: { propertyType: "VideoEffects", name: "映像エフェクト", },
  }
} as const;
const audioEffect = {
  name: "音声エフェクト",
  properties: {
    audioEffects: { propertyType: "AudioEffects", name: "音声エフェクト", },
  }
} as const;

const fileProperty = {
  fileId: { propertyType: "FileId", name: "ファイル", },// YMMと違うところ
} as const;
const timeChangeProperty = {
  isLooped: { propertyType: "boolean", name: "ループ再生", },
  playbackRate: { propertyType: "number", name: "再生速度", unit: "%", min: 0, range: 400, },
  contentOffset: { propertyType: "Time", name: "再生開始位置", unit: "秒", },
} as const;
const characterProperty = {
  characterName: { propertyType: "CharacterName", name: "キャラクター", }
} as const;
// VoiceItemでaudioPropertyをハードコードしている点に注意
const audioProperty = {
  volume: { propertyType: "VarNumbers", name: "音量", unit: "%", min: 0, range: 100, },
  pan: { propertyType: "VarNumbers", name: "パン", unit: "%", min: -100, max: 100 },
  fadeIn: { propertyType: "number", name: "ﾌｪｰﾄﾞｲﾝ", unit: "秒", min: 0, range: 1, step: 0.01 },
  fadeOut: { propertyType: "number", name: "ﾌｪｰﾄﾞｱｳﾄ", unit: "秒", min: 0, range: 1, step: 0.01 },
} as const;
const echo = {
  name: "エコー",
  properties: {
    echoIsEnabled: { propertyType: "boolean", name: "有効", },
    echoInterval: { propertyType: "number", name: "間隔", unit: "秒", min: 0, range: 0.5, step: 0.01, },
    echoAttenuation: { propertyType: "number", name: "減衰", unit: "%", min: 0, max: 90, step: 0.01, },
  }
} as const;

const textProperty = {
  text: { propertyType: "string", name: "テキスト", },
  // decorations
  font: { propertyType: "Font", name: "フォント", },
  fontSize: { propertyType: "VarNumbers", name: "サイズ", min: 1, range: 50, step: 1 },
  lineHeight2: { propertyType: "VarNumbers", name: "行の高さ", unit: "%", min: 0, range: 200 },
  letterSpacing2: { propertyType: "VarNumbers", name: "文字間隔", unit: "px", range: 100 },
  displayInterval: { propertyType: "number", name: "表示間隔", unit: "㍉秒", min: 0, range: 100, },
  // wordWrap maxWidth
  basePoint: { propertyType: "BasePoint", name: "文字揃え", },
  fontColor: { propertyType: "ColorHEXA", name: "文字色", },
  // style styleCOlor bold italic isTrimEndSpace isDevidedPerCharacter※ここでは文字の意味
} as const;
// YMM4と違う
const shapeProperty = {
  shapeType: { propertyType: "ShapeType", name: "種類", },
  size: { propertyType: "VarNumbers", name: "サイズ", unit: "px", min: 0, range: 500, },
  aspectRate: { propertyType: "VarNumbers", name: "縦横比", min: -100, max: 100 },
  strokeThickness: { propertyType: "VarNumbers", name: "線の太さ", unit: "px", min: 0, range: 50, },
  color: { propertyType: "ColorHEXA", name: "色", },
} as const;

// これのkey名はtypeと一致させること Record<ItemType,ItemPropertyGroup[]>型
export const itemPropertyGroups/* : Record<string, ItemPropertyGroup[]> */ = {
  voice: [
    itemCommon,
    {
      name: "ボイス",
      properties: {
        ...characterProperty,
        voiceStyle: { propertyType: "string", name: "発音" },// YMM4と違う
        serif: { propertyType: "Serif", name: "セリフ", },
        hatsuon: { propertyType: "string", name: "発音" },
        // pronounce 抑揚のデータを細かく設定した時など
        voiceLength: { propertyType: "number", name: "ボイスの長さ", unit: "秒", min: 0, hideLevel: "always" },
        voiceId: { propertyType: "number", name: "ボイスのファイルのID", hideLevel: "always" },// YMM4と違う
        volume: audioProperty.volume,
        pan: audioProperty.pan,
        voiceFadeIn: audioProperty.fadeIn,
        voiceFadeOut: audioProperty.fadeOut,
        ...timeChangeProperty,
      }
    },
    echo,
    audioEffect,
    {
      name: "字幕",
      properties: {
        jimakuVisibility: { propertyType: "JimakuVisibility", name: "字幕の設定", },
        ...drawingPropertiesWithoutFade,
        jimakuFadeIn: drawing.properties.fadeIn,
        jimakuFadeOut: drawing.properties.fadeOut,
        ...textProperty,
        jimakuVideoEffects: { propertyType: "VideoEffects", name: "エフェクト", },
      }
    },
    // 立ち絵の関連
  ],
  text: [
    itemCommon,
    drawing,
    {
      name: "テキスト",
      properties: {
        ...textProperty
      }
    },
    videoEffect,
  ],
  video: [
    itemCommon,
    drawing,
    {
      name: "動画",
      properties: {
        ...fileProperty,
        ...audioProperty,
        ...timeChangeProperty,
      }
    },
    echo,
    audioEffect,
    videoEffect,
  ],
  audio: [
    itemCommon,
    {
      name: "音声",
      properties: {
        ...fileProperty,
        ...audioProperty,
        ...timeChangeProperty,
      }
    },
    echo,
    audioEffect,
  ],
  image: [
    itemCommon,
    drawing,
    {
      name: "画像",
      properties: fileProperty,
    },
    videoEffect,
  ],
  // YMM4と違う
  shape: [
    itemCommon,
    drawing,
    {
      name: "図形",
      properties: shapeProperty,
    },
    videoEffect,
  ],
  // YMM4と違う
  tachie: [
    itemCommon,
    drawing,
    {
      name: "立ち絵",
      properties: {
        ...characterProperty,
        /* tachieItemParameter: { propertyType: "TachieItemParameter", name: "立ち絵", }, */
        tachieId: { propertyType: "TachieId", name: "立ち絵", },
        isHiddenWhenNoSpeech: { propertyType: "boolean", name: "喋る時のみ表示", },
      }
    }
  ],
} as const;

/* ここでエラーが出たらtypeofの後ろの部分のobjectがItemKeys型に従っていないor"as const"を書き忘れている可能性大(n敗) */
export type VoiceItem = ToItemType<typeof itemPropertyGroups["voice"]>;// ボイス
export type TextItem = ToItemType<typeof itemPropertyGroups["text"]>;// テキスト
export type VideoItem = ToItemType<typeof itemPropertyGroups["video"]>;// 動画
export type AudioItem = ToItemType<typeof itemPropertyGroups["audio"]>;// 音声
export type ImageItem = ToItemType<typeof itemPropertyGroups["image"]>;// 画像
export type ShapeItem = ToItemType<typeof itemPropertyGroups["shape"]>;// 図形
//export type TachieItem = ItemCommon & Visible & Character & Tachie;
/* const test: ImageItem = {

} */

//console.log(JSON.stringify(itemPropertyGroups["image"].map((group)=>Object.keys(group.properties)),null,2).replaceAll('"',""))


/**renderer.ts用 */
const drawingItem = [
  itemCommon,
  drawing,
  videoEffect,
] as const;
export type DrawingItem = ToItemType<typeof drawingItem>;

// isEnabledは別でつける
export type EffectPropertyGroup = ItemPropertyGroup & {
  searchName?: string;// 検索時に利用される別名
}
// VideoEffect
export const videoEffectGroup/* : Record<string, EffectPropertyGroup> */ = {
  centerPointEffect: {
    name: "中心位置",
    properties: {
      horizontal: { propertyType: "CenterPointHorizontal", name: "水平位置", min: 0, range: 50, },
      vertical: { propertyType: "CenterPointVertical", name: "垂直位置", min: 0, range: 50, },
      x: { propertyType: "VarNumbers", name: "ｶｽﾀﾑ時X", unit: "px", range: 500, },// YMM4では水平位置がｶｽﾀﾑ時以外は非表示だった
      y: { propertyType: "VarNumbers", name: "ｶｽﾀﾑ時Y", unit: "px", range: 500, },// 同上
      isKeepPosition: { propertyType: "boolean", name: "位置を維持", },
    }
  },
  borderBlurEffect: {
    name: "境界ぼかし",
    properties: {
      blur: { propertyType: "VarNumbers", name: "ぼかし度", min: 0, range: 50, },
    }
  },
  gaussianBlurEffect: {
    name: "ぼかし",
    properties: {
      blur: { propertyType: "VarNumbers", name: "ぼかし度", min: 0, range: 50, },
      isHardBorderMode: { propertyType: "boolean", name: "サイズを固定", },
    }
  },
  shadowEffect: {
    name: "影",
    searchName: "シャドー",
    properties: {
      x: { propertyType: "VarNumbers", name: "X", unit: "px", range: 100, },
      y: { propertyType: "VarNumbers", name: "Y", unit: "px", range: 100, },
      opacity: { propertyType: "VarNumbers", name: "不透明度", unit: "%", min: 0, max: 100, },
      zoom: { propertyType: "VarNumbers", name: "拡大率", unit: "%", min: 0, range: 400, },
      angle: { propertyType: "VarNumbers", name: "回転角", unit: "°", range: 360, },
      blur: { propertyType: "VarNumbers", name: "ぼかし", unit: "px", min: 0, range: 10, },
      color: { propertyType: "ColorHEXA", name: "影色", },
      isRotateAtCenter: { propertyType: "boolean", name: "中心で回転", }
      // brush -> colorへ
    }
  },
  outlineEffect: {
    name: "縁取り",
    properties: {
      strokeThickness: { propertyType: "VarNumbers", name: "太さ", unit: "px", min: 0, range: 10, },
      blur: { propertyType: "VarNumbers", name: "ぼかし", unit: "px", min: 0, range: 10, },
      x: { propertyType: "VarNumbers", name: "X", unit: "px", range: 100, },
      y: { propertyType: "VarNumbers", name: "Y", unit: "px", range: 100, },
      opacity: { propertyType: "VarNumbers", name: "不透明度", unit: "%", min: 0, max: 100, },
      zoom: { propertyType: "VarNumbers", name: "拡大率", unit: "%", min: 0, range: 400, },
      rotation: { propertyType: "VarNumbers", name: "回転角", unit: "°", range: 360, },
      color: { propertyType: "ColorHEXA", name: "縁色", },
      isOutlineOnly: { propertyType: "boolean", name: "縁のみ", },
      isAngular: { propertyType: "boolean", name: "角縁取り", },
      // StrokeBrush -> colorへ
    }
  },
  cropByAngleEffect: {
    name: "斜めクリッピング",
    properties: {
      x: { propertyType: "VarNumbers", name: "X", unit: "px", range: 100, },
      y: { propertyType: "VarNumbers", name: "Y", unit: "px", range: 100, },
      angle: { propertyType: "VarNumbers", name: "回転角", unit: "°", range: 360, },
      blur: { propertyType: "VarNumbers", name: "ぼかし", unit: "px", min: 0, range: 10, },
      width: { propertyType: "VarNumbers", name: "幅", unit: "px", range: 500, },
    }
  },
  monocolorizationEffect: {
    name: "単色化",
    properties: {
      strength: { propertyType: "VarNumbers", name: "強さ", unit: "%", min: 0, max: 100, },
      color: { propertyType: "ColorHEXA", name: "縁色", },
      keepBrightness: { propertyType: "boolean", name: "輝度を保持", },
    }
  },
  opacityEffect: {
    name: "不透明",
    properties: {
      opacity: { propertyType: "VarNumbers", name: "不透明度", unit: "%", min: 0, max: 100 },
      isAbsolute: { propertyType: "boolean", name: "絶対値", },
    }
  },
  tilingEffect: {
    name: "敷き詰め",
    searchName: "画像ループ",
    properties: {
      x: { propertyType: "VarNumbers", name: "横", min: 1, range: 10, },
      y: { propertyType: "VarNumbers", name: "縦", min: 1, range: 10, },
    }
  },
  marginEffect: {
    name: "余白追加",
    searchName: "領域拡張",
    properties: {
      top: { propertyType: "VarNumbers", name: "上", unit: "px", min: 0, range: 100, },
      bottom: { propertyType: "VarNumbers", name: "下", unit: "px", min: 0, range: 100, },
      left: { propertyType: "VarNumbers", name: "左", unit: "px", min: 0, range: 100, },
      right: { propertyType: "VarNumbers", name: "右", unit: "px", min: 0, range: 100, },
    }
  },
  /* gradientEffect: {
    name: "グラデーション",
    properties: {
      // gradientType
      // stops
      x: { propertyType: "VarNumbers", name: "X", unit: "px", range: 100, },
      y: { propertyType: "VarNumbers", name: "Y", unit: "px", range: 100, },
      opacity: { propertyType: "VarNumbers", name: "不透明度", unit: "%", min: 0, max: 100, },
      size: { propertyType: "VarNumbers", name: "サイズ", unit: "%", min: 0, range: 500, },
      rotation: { propertyType: "VarNumbers", name: "回転角", unit: "°", range: 360, },
      // extendMode
      // blend
    }
  }, */
  colorCorrectionEffect: {
    name: "色調補正",
    properties: {
      lightness: { propertyType: "VarNumbers", name: "明るさ", unit: "%", min: 0, range: 100, },
      contrast: { propertyType: "VarNumbers", name: "コントラスト", unit: "%", min: 0, range: 100, },
      hueRotation: { propertyType: "VarNumbers", name: "色相", unit: "°", range: 360, },
      brightness: { propertyType: "VarNumbers", name: "輝度", unit: "%", min: 0, range: 100, },
      saturation: { propertyType: "VarNumbers", name: "彩度", unit: "%", min: 0, range: 100, },
    }
  },
  cropEffect: {
    name: "クリッピング",
    properties: {
      top: { propertyType: "VarNumbers", name: "上", unit: "px", min: 0, range: 500, },
      bottom: { propertyType: "VarNumbers", name: "下", unit: "px", min: 0, range: 500, },
      left: { propertyType: "VarNumbers", name: "左", unit: "px", min: 0, range: 500, },
      right: { propertyType: "VarNumbers", name: "右", unit: "px", min: 0, range: 500, },
      isCentering: { propertyType: "boolean", name: "中央寄せ", }
    }
  },
  jumpEffect: {
    name: "跳ねる",
    properties: {
      // 跳ねる 着地 移動先で分かれているが一緒にしてしまっているので名前を変更
      jumpHeight: { propertyType: "VarNumbers", name: "跳ね高さ", unit: "px", min: 0, range: 500, },
      stretch: { propertyType: "VarNumbers", name: "跳ね伸び", unit: "%", min: 0, range: 30, },
      period: { propertyType: "VarNumbers", name: "跳ね周期", unit: "秒", min: 0, range: 1, step: 0.01, },
      distortion: { propertyType: "VarNumbers", name: "着地歪み", unit: "%", min: 0, range: 30, },
      interval: { propertyType: "VarNumbers", name: "着地間隔", unit: "秒", min: 0, range: 300, step: 0.01 },
      x: { propertyType: "VarNumbers", name: "移動先X", unit: "px", range: 500, },
      y: { propertyType: "VarNumbers", name: "移動先Y", unit: "px", range: 500, },
    }
  },
  radialBlurEffect: {
    name: "放射ブラー",
    properties: {
      blur: { propertyType: "VarNumbers", name: "サイズ", min: 0, max: 75, },
      x: { propertyType: "VarNumbers", name: "中心X", unit: "px", range: 500, },
      y: { propertyType: "VarNumbers", name: "中心Y", unit: "px", range: 500, },
      isHardBorderMode: { propertyType: "boolean", name: "サイズを固定", },
    }
  },
  directionalBlurEffect: {
    name: "方向ブラー",
    properties: {
      standardDeviation: { propertyType: "VarNumbers", name: "ぼかし度", min: 0, max: 250, },
      angle: { propertyType: "VarNumbers", name: "回転角", unit: "°", range: 360, },
      isHardBorderMode: { propertyType: "boolean", name: "サイズを固定", },
    }
  },
  zoomEffect:{
    name:"拡大縮小",
    properties:{
      zoom: { propertyType: "VarNumbers", name: "全体", unit: "%", min: 0, range: 500, },
      zoomX: { propertyType: "VarNumbers", name: "横方向", unit: "%", range: 500, },
      zoomY: { propertyType: "VarNumbers", name: "縦方向", unit: "%", range: 500, },
      isNearestNeighbor: { propertyType: "boolean", name: "ドット絵", },
    }
  }
} as const;

const inOutEffectCommonProperties/* : EffectPropertyGroup["properties"] */ = {
  isInEffect: { propertyType: "boolean", name: "登場時", },
  isOutEffect: { propertyType: "boolean", name: "退場時", },
  effectTimeSeconds: { propertyType: "number", name: "効果時間", unit: "秒", min: 0, range: 0.5, step: 0.01 },
  easingType: { propertyType: "EasingType", name: "種類" },
  easingMode: { propertyType: "EasingMode", name: "加減速" },
} as const;
export const inOutEffectGroup/* : Record<string, EffectPropertyGroup> */ = {
  inOutGaussianBlurEffect: {
    name: "ぼかしを解除しながら登場退場",
    properties: {
      ...inOutEffectCommonProperties,
      value: { propertyType: "number", name: "ぼかし度", min: 0, range: 10, },
    }
  },
  inOutMosaicEffect: {
    name: "モザイクを解除しながら登場退場",
    properties: {
      ...inOutEffectCommonProperties,
      value: { propertyType: "number", name: "サイズ", unit: "px", min: 0, range: 500, },
    }
  },
  inOutMoveEffect: {
    name: "移動しながら登場退場",
    properties: {
      ...inOutEffectCommonProperties,
      value: { propertyType: "number", name: "X", unit: "px", range: 500, },
      value1: { propertyType: "number", name: "Y", unit: "px", range: 500, },
      value2: { propertyType: "number", name: "Z", unit: "px", range: 500, hideLevel: "unimplemented"},
    }
  },
  inOutMoveFromOutsideFrameEffect: {
    name: "画面外から登場退場",
    properties: {
      ...inOutEffectCommonProperties,
      value: { propertyType: "Direction", name: "方向" },
    }
  },
  inOutRotateEffect: {
    name: "回転しながら登場退場",
    properties: {
      ...inOutEffectCommonProperties,
      valueX: { propertyType: "number", name: "X軸", unit: "°", range: 360, },
      valueY: { propertyType: "number", name: "Y軸", unit: "°", range: 360, },
      valueZ: { propertyType: "number", name: "Z軸", unit: "°", range: 360, },
      is3D: { propertyType: "boolean", name: "三次元配置", hideLevel:"unimplemented" },
    }
  },
  inOutZoomEffect: {
    name: "拡大しながら登場退場",
    properties: {
      ...inOutEffectCommonProperties,
      value: { propertyType: "number", name: "全体", unit: "%", min: 0, range: 400, },
      x: { propertyType: "number", name: "横方向", unit: "%", range: 400, },
      y: { propertyType: "number", name: "縦方向", unit: "%", range: 400, },
    }
  },
  /* inOutGetUpEffect:{
    name:"起き上がりながら登場退場",
    properties:{
      ...inOutEffectCommonProperties,
      effectTimeSeconds: {propertyType:"number",name:"効果時間",unit:"秒",min:0,range:0.5,step:0.01},
    }
  }, */
  inOutJumpEffect: {
    name: "跳ねながら登場退場",
    properties: {
      ...inOutEffectCommonProperties,
      // 跳ねる 着地 移動先で分かれているが一緒にしてしまっているので名前を変更
      jumpHeight: { propertyType: "number", name: "跳ね高さ", unit: "px", min: 0, range: 500, },
      stretch: { propertyType: "number", name: "跳ね伸び", unit: "%", min: 0, range: 30, },
      period: { propertyType: "number", name: "跳ね周期", unit: "秒", min: 0, range: 1, step: 0.01, },
      distortion: { propertyType: "number", name: "着地歪み", unit: "%", min: 0, range: 30, },
      interval: { propertyType: "number", name: "着地間隔", unit: "秒", min: 0, range: 300, step: 0.01 },
      x: { propertyType: "number", name: "移動先X", unit: "px", range: 500, },
      y: { propertyType: "number", name: "移動先Y", unit: "px", range: 500, },
    }
  },
  inOutMoveFromOutsideImageEffect: {
    name: "領域外から登場退場",
    properties: {
      ...inOutEffectCommonProperties,
      value: { propertyType: "Direction", name: "方向" },
    }
  },
} as const;
export const allVideoEffects = {
  ...videoEffectGroup,
  ...inOutEffectGroup,
} as const;
export const auidoEffectGroup = {
  echoEffect:{
    name:"エコー",
    properties:{
      strength: {propertyType:"VarNumbers",name:"強度",unit:"%",min:0,max:100,},
      delay: {propertyType:"VarNumbers",name:"遅延",unit:"㍉秒",min:0,range:50,step:1,},
      feedBack:{propertyType:"VarNumbers",name:"フィードバック",unit:"%",min:0,max:100,},
    }
  },
} as const;
export type ToEffectType<T extends Readonly<EffectPropertyGroup>, U extends string> = UnionToIntersection<Convert<T["properties"]>> & {
  type: U;// hideLevel alywas
  isEnabled: boolean;// hideLevel alywas
};
export type VideoEffectType = keyof typeof allVideoEffects;
export type AudioEffectType = keyof typeof auidoEffectGroup;
export type EffectType = VideoEffectType | AudioEffectType;
export type VideoEffect = {
  [K in keyof typeof allVideoEffects]: ToEffectType<(typeof allVideoEffects)[K], K>
}[keyof typeof allVideoEffects];
export type AudioEffect = {
  [K in keyof typeof auidoEffectGroup]: ToEffectType<(typeof auidoEffectGroup)[K], K>
}[keyof typeof auidoEffectGroup];

export type KeyFrames = {
  frames: number[];
  count: number;// 処理に使用しない
}

const linearEasingAniamtionType = { label: "等速", value: "Linear", } as const;
const easingAnimationTypes = [
  { label: "緩急1(弱)", value: "Sine", },
  { label: "緩急2", value: "Quad", },
  { label: "緩急3", value: "Cubic", },
  { label: "緩急4", value: "Quart", },
  { label: "緩急5", value: "Quint", },
  { label: "緩急6(強)", value: "Expo", },
  { label: "円弧", value: "Circ", },
  { label: "戻る", value: "Back", },
  { label: "バネ", value: "Elastic", },
  { label: "バウンド", value: "Bounce", }
] as const;
const easingModeTypes = [
  { label: "加速", value: "In" },
  { label: "減速", value: "Out" },
  { label: "加減速", value: "InOut" },
  { label: "減加速", value: "OutIn" },
] as const;
type ValuesType = "none" | "span" | "keyFrames";
const originalAnimationTypes = [
  { name: "なし", valuesType: "none" },
  { name: "直線移動", valuesType: "keyFrames" },
  { name: "加減速移動", valuesType: "keyFrames" },
  { name: "瞬間移動", valuesType: "keyFrames" },
  { name: "ランダム移動", valuesType: "span" },
  { name: "反復移動", valuesType: "span" },
] as const;
export const animationTypeLabelAndValues = originalAnimationTypes.map((type) => {
  return { label: type.name as string, value: type.name as AnimationType }
}).concat(easingAnimationTypes
  .flatMap((value) => easingModeTypes.map((mode) => {
    return { label: value.label + "@" + mode.label, value: value.value + "_" + mode.value as AnimationType }
  }))
);
export const getAnimationValuesType = (animationType: AnimationType): ValuesType => {
  if (isEasingAnimationType(animationType)) {
    return "keyFrames";
  }
  return originalAnimationTypes.find((type) => type.name === animationType)!.valuesType;
}
// easingの結合のやつか判定
const wordPattern1 = easingAnimationTypes.map((type) => type.value).join('|');
const wordPattern2 = easingModeTypes.map((type) => type.value).join('|');
const regex = new RegExp(`^(${wordPattern1})_(${wordPattern2})$`);
export const isEasingAnimationType = (animationType: AnimationType): boolean => {
  return regex.test(animationType);
}
export type AnimationType = typeof originalAnimationTypes[number]["name"] | `${typeof easingAnimationTypes[number]["value"]}_${typeof easingModeTypes[number]["value"]}`;

export type VarNumbers = {
  values: { value: number }[];
  span: number;
  animationType: AnimationType;
};

export type ItemType = keyof typeof itemPropertyGroups;

type FileId = number;
type CharacterName = string;
type Serif = string;
type Time = number;// YMM4だと"00:00:00"だが、ここでは秒数で扱う
type Font = string;
// dropDownのもの(除:imageとかフォントとか可変の物)
// itemPropertyTypeの名前そのままにするので大文字スタートで
export const dropDowns = {
  BlendMode: [
    // 未実装
    { label: "通常", value: "Normal" },
  ],
  // textItem
  BasePoint: [
    { label: "左揃え　[上]", value: "LeftTop" },
    { label: "中央揃え[上]", value: "CenterTop" },
    { label: "右揃え　[上]", value: "RightTop" },
    { label: "左揃え　[中]", value: "LeftCenter" },
    { label: "中央揃え[中]", value: "CenterCenter" },
    { label: "右揃え　[中]", value: "RightCenter" },
    { label: "左揃え　[下]", value: "LeftBottom" },
    { label: "中央揃え[下]", value: "CenterBottom" },
    { label: "右揃え　[下]", value: "RightBottom" },
  ],
  // shapeItem
  ShapeType: [
    { label: "背景", value: "background" },
    { label: "円", value: "circle" },
    { label: "三角形", value: "triangle" },
    { label: "四角形", value: "square" },
    { label: "五角形", value: "pentagon" },
    { label: "六角形", value: "hexagon" },
  ],
  // VoiceItemの字幕の設定
  JimakuVisibility: [
    { label: "キャラクターの設定に従う", value: "UseCharacterSetting" },
  ],
  // centerPointEffect
  CenterPointHorizontal: [
    { label: "変更しない", value: "Original" },
    { label: "左", value: "Left" },
    { label: "中央", value: "Center" },
    { label: "右", value: "Right" },
    { label: "カスタム", value: "Custom" },
  ],
  CenterPointVertical: [
    { label: "変更しない", value: "Original" },
    { label: "上", value: "Top" },
    { label: "中央", value: "Center" },
    { label: "下", value: "Bottom" },
    { label: "カスタム", value: "Custom" },
  ],
  Direction: [
    { label: "上", value: "Top" },
    { label: "下", value: "Bottom" },
    { label: "左", value: "Left" },
    { label: "右", value: "Right" },
  ],
  EasingType: [
    linearEasingAniamtionType,
    ...easingAnimationTypes,
  ],
  EasingMode: easingModeTypes,
} as const;
type BlendMode = typeof dropDowns["BlendMode"][number]["value"];
type BasePoint = typeof dropDowns["BasePoint"][number]["value"];
type ShapeType = typeof dropDowns["ShapeType"][number]["value"];
type JimakuVisibility = typeof dropDowns["JimakuVisibility"][number]["value"];
type CenterPointHorizontal = typeof dropDowns["CenterPointHorizontal"][number]["value"];
type CenterPointVertical = typeof dropDowns["CenterPointVertical"][number]["value"];
type Direction = typeof dropDowns["Direction"][number]["value"];
export type EasingType = typeof dropDowns["EasingType"][number]["value"];
export type EasingMode = typeof dropDowns["EasingMode"][number]["value"];

type TachieId = number;
type TachieOption = string; // 無理やり色々をstringに変換する？
/* type TachieItemParameter = {
  tachieId: number;// YMMと違う
} */
/* type ShapeParameter = {
  brush: {
    parameter: {
      color: ColorHEXA;
    }
  }
}; */ // YMMと違う方式にする