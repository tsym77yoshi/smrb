import type { VarNumbers, KeyFrames } from "@/type/itemType";
import { animation } from "@/data/animationCurve";

// アイテム毎に
export class CurveConverter {
  keyFrames: KeyFrames;
  itemFrame: number;
  itemLength: number;
  fps: number;

  constructor(keyFrames: KeyFrames, itemFrame: number, itemLength: number, fps: number) {
    this.keyFrames = keyFrames;
    this.itemFrame = itemFrame;
    this.itemLength = itemLength;
    this.fps = fps;
  }
  getVarNum = (varNum: VarNumbers): number => {
    return animation(varNum, this.itemFrame, this.keyFrames, this.itemLength, this.fps);
  }
}