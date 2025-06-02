import { allVideoEffects, type DrawingItem, type ToEffectType } from "@/types/itemType";
import type { ItemOption } from "./rendererTypes";
import type { CurveConverter } from "./curveConverter";
import { EffectLoader } from "./effectLoader";
import { setTextureSetting } from "./webglUtility"

export const applyEffect = (gl: WebGLRenderingContext, item: DrawingItem, sourceTexture: WebGLTexture, itemOption: ItemOption, cConv: CurveConverter): WebGLTexture => {
  if (item.videoEffects.length == 0) return sourceTexture;

  const effectLoader = new EffectLoader(gl);

  const targetTexture = gl.createTexture();
  // フレームバッファ作成
  const framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.viewport(0, 0, itemOption.width, itemOption.height);
  gl.bindTexture(gl.TEXTURE_2D, targetTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, itemOption.width, itemOption.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  setTextureSetting(gl);
  // フレームバッファにテクスチャをアタッチ
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, targetTexture, 0);

  for (const effect of item.videoEffects) {
    if (!effect.isEnabled) {
      continue;
    }
    // shaderが不要なエフェクトはここで適用
    switch (effect.type) {
      case "centerPointEffect":
        applyCenterPointEffect(effect, itemOption, cConv);
        continue;// forに対してcontinue
    }

    const effectProgram = effectLoader.useEffect(effect.type);
    if (!effectProgram) {
      console.warn(`Effect program for ${effect.type} not found`);
      continue;
    }
    // shaderを使うエフェクトはここで適用
    let uVarNumParameterNames: string[] = [];
    switch (effect.type) {
      // 色だけ変更するエフェクト
      case "monocolorizationEffect":
        break;
      case "colorCorrectionEffect":
        uVarNumParameterNames = [
          "lightness",
          "contrast",
          "hueRotation", // 角度
          "brightness",
          "saturation",
        ];
        break;
      case "borderBlurEffect":
      case "directionalBlurEffect":
      case "gaussianBlurEffect":
      case "cropByAngleEffect":
      case "cropEffect":
    }
    // gl.bindTexture(gl.TEXTURE_2D, texture);
    for (const uVarNumParameterName of uVarNumParameterNames) {
      // @ts-ignore
      gl.uniform1f(gl.getUniformLocation(effectProgram, "u_" + uVarNumParameterName), cConv.getVarNum(effect[uVarNumParameterName]));
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  console.log("test");
  return targetTexture;
}

const applyCenterPointEffect = (effect: ToEffectType<typeof allVideoEffects["centerPointEffect"], "centerPointEffect">, itemOption: ItemOption, cConv: CurveConverter) => {
  let originalPivotX: number = itemOption.pivotX;
  let originalPivotY: number = itemOption.pivotY;
  switch (effect.horizontal) {
    case "Original":
      break;
    case "Left":
      itemOption.pivotX = itemOption.width / 2;
      break;
    case "Right":
      itemOption.pivotX = - itemOption.width / 2;
      break;
    case "Center":
      itemOption.pivotX = 0;
      break;
    case "Custom":
      itemOption.pivotX = cConv.getVarNum(effect.x);
      break;
  }
  switch (effect.vertical) {
    case "Original":
      break;
    case "Top":
      itemOption.pivotY = - itemOption.height / 2;
      break;
    case "Bottom":
      itemOption.pivotY = itemOption.height / 2;
      break;
    case "Center":
      itemOption.pivotY = 0;
      break;
    case "Custom":
      itemOption.pivotY = cConv.getVarNum(effect.y);
      break;
  }
  if (effect.isKeepPosition) {
    itemOption.x -= itemOption.pivotX - originalPivotX;
    itemOption.y -= itemOption.pivotY - originalPivotY;
  }
}