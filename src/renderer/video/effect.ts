import { allVideoEffects, type DrawingItem, type ToEffectType } from "@/types/itemType";
import type { ItemOption } from "./rendererTypes";
import type { CurveConverter } from "./curveConverter";
import { EffectLoader } from "./effectLoader";
import { setTextureSetting } from "./webglUtility";
import { convertColorHEXA } from "@/composables/colorConverter";

export const applyEffect = (gl: WebGLRenderingContext, item: DrawingItem, sourceTexture: WebGLTexture, itemOption: ItemOption, cConv: CurveConverter): WebGLTexture => {
  if (item.videoEffects.length == 0) return sourceTexture;

  const effectLoader = new EffectLoader(gl);

  const targetTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, targetTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, itemOption.width, itemOption.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  setTextureSetting(gl);

  // フレームバッファ
  const framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);


  // 処理ループ
  let readTex = sourceTexture;
  let writeTex = targetTexture;

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
    let isNullVertexShader = false;
    // fragment + vertexShader
    switch (effect.type) {
      default:
        isNullVertexShader = true;
        break;
    }
    // fragmentShaderのみ
    switch (effect.type) {
      case "monocolorizationEffect":
        gl.uniform4fv(gl.getUniformLocation(effectProgram, "monolizeColor"), convertColorHEXA(effect.color));
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

    // 書き込み先: writeTex
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, writeTex, 0);
    // 読み込み元: readTex
    gl.bindTexture(gl.TEXTURE_2D, readTex);

    // Uniform など設定
    for (const uVarNumParameterName of uVarNumParameterNames) {
      // @ts-ignore
      gl.uniform1f(gl.getUniformLocation(effectProgram, "u_" + uVarNumParameterName), cConv.getVarNum(effect[uVarNumParameterName]));
    }

    if (isNullVertexShader) {
      gl.viewport(0, 0, itemOption.width, itemOption.height);
      const positions = new Float32Array([
        1, 1, 1, 1,// x y u v
        1, -1, 1, 0,
        -1, 1, 0, 1,
        -1, -1, 0, 0,
      ]);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
      const positionLoc = gl.getAttribLocation(effectProgram, "position");
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 16, 0);
      const texCoordLoc = gl.getAttribLocation(effectProgram, "texCoord");
      gl.enableVertexAttribArray(texCoordLoc);
      gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 16, 8);
    }

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // 入れ替え
    const tmp = readTex;
    readTex = writeTex;
    writeTex = tmp;
  }

  // FBOから切り離し
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return readTex; // 最終結果は最後に読み込みに使っていた方
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