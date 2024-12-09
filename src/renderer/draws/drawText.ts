import type { TextItem } from "@/type/itemType";
import type { ItemOption } from "../rendererTypes";
import { CurveConverter } from "../curveConverter";
import { createTexture } from "../webglUtility";

//WebGLTextureも返す
export const drawText = (item: TextItem, cConv: CurveConverter, gl: WebGLRenderingContext): { tex: WebGLTexture, itemOption: ItemOption } | undefined => {
  const canvasText = document.createElement("canvas");
  const ctxText = canvasText.getContext("2d");
  if (ctxText == undefined) {
    return undefined;
  }
  const textlines = item.text.split("\n");
  const fontHeight = cConv.getVarNum(item.fontSize);
  ctxText.font = fontHeight + "px " + item.font;
  ctxText.textBaseline = "middle";
  const width = Math.max(...textlines.map((text) => ctxText.measureText(text).width));
  const lineHeight = fontHeight * 2 * cConv.getVarNum(item.lineHeight2) / 100;
  const height = lineHeight * (textlines.length - 1) + fontHeight;
  // Österreichの上のちょんちょん(ウムラウト?)とかはみ出るのを調整<=フォントによっては日本語もはみ出ます
  const top = Math.max(...textlines.map(
    (text, index) => ctxText.measureText(text).actualBoundingBoxAscent - index * lineHeight)) - fontHeight / 2;
  const bottom = Math.max(...textlines.map(
    (text, index) => ctxText.measureText(text).actualBoundingBoxDescent - (textlines.length - index - 1) * lineHeight)) - fontHeight / 2;
  /// 左右のはみだしについても書くべき？利用例が思いつかなかったので後回し
  // canvasの値を決定
  canvasText.width = width;
  canvasText.height = height + top + bottom;
  // alignの処理
  const itemOption: ItemOption = {
    x: cConv.getVarNum(item.x),
    y: cConv.getVarNum(item.y),
    width: canvasText.width,
    height: canvasText.height,
    pivotX: 0,// 後で+=するので注意
    pivotY: -(bottom - top) / 2,// 同上
    itemFrame: 0,// 外で設定
  }
  if (item.basePoint.startsWith("Left")) {
    ctxText.textAlign = "left";
    itemOption.pivotX += width / 2;
  } else if (item.basePoint.startsWith("Center")) {
    ctxText.textAlign = "center";
  } else if (item.basePoint.startsWith("Right")) {
    ctxText.textAlign = "right";
    itemOption.pivotX -= width / 2;
  }
  if (item.basePoint.endsWith("Top")) {
    itemOption.pivotY -= height / 2;
  } else if (item.basePoint.endsWith("Center")) {
  } else if (item.basePoint.endsWith("Bottom")) {
    itemOption.pivotY += height / 2;
  }

  // Debug用
  // ctxText.fillStyle = "red";
  // ctxText.fillRect(0, 0, width, height);

  ctxText.font = fontHeight + "px " + item.font;
  ctxText.textBaseline = "middle";
  ctxText.fillStyle = item.fontColor;
  for (let i = 0; i < textlines.length; i++) {
    ctxText.fillText(textlines[i], -itemOption.pivotX + width / 2, lineHeight * i + fontHeight * 0.5 + top);
  }
  if (canvasText.width > 0 && canvasText.height > 0) {
    const texture = createTexture(canvasText, gl);
    if (texture == null) {
      console.log("文字からテクスチャを作成することに失敗しました");
      return undefined;
    }
    return {
      tex: texture,
      itemOption: itemOption
    };
  }
};