import { allVideoEffectGroup, type DrawingItem, type ToEffectType } from "@/types/itemType";
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
      case "cropEffect":
        // 完全cropならcontinue
        const cropedWidth = itemOption.width - (cConv.getVarNum(effect.left) + cConv.getVarNum(effect.right));
        const cropedHeight = itemOption.height - (cConv.getVarNum(effect.top) + cConv.getVarNum(effect.bottom));
        if (cropedHeight <= 0 || cropedWidth <= 0) {
          continue;
        }
        // 上下左右
        const cropRates = [
          cConv.getVarNum(effect.top) / itemOption.height,
          cConv.getVarNum(effect.bottom) / itemOption.height,
          cConv.getVarNum(effect.left) / itemOption.width,
          cConv.getVarNum(effect.right) / itemOption.width,
        ];
        gl.viewport(0, 0, cropedWidth, cropedHeight);
        // itemOptionの変更
        const positions = new Float32Array([
          1, 1, 1 - cropRates[3], 1,// x y u v
          1, -1, 1 - cropRates[3], 0,
          -1, 1, cropRates[2], 1,
          -1, -1, cropRates[2], 0,
        ]);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
        const positionLoc = gl.getAttribLocation(effectProgram, "position");
        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 16, 0);
        const texCoordLoc = gl.getAttribLocation(effectProgram, "texCoord");
        gl.enableVertexAttribArray(texCoordLoc);
        gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 16, 8);
        break;
      default:
        isNullVertexShader = true;
        break;
    }
    // fragmentShaderのみ
    switch (effect.type) {
      case "monocolorizationEffect":
        let luminanceColor = convertColorHEXA(effect.color);
        if (effect.keepBrightness) {
          let sum = luminanceColor[0] + luminanceColor[1] + luminanceColor[2];
          if (sum == 0) {
            luminanceColor = [0.333, 0.333, 0.333, luminanceColor[3]];
          } else {
            luminanceColor = [
              luminanceColor[0] / sum,
              luminanceColor[1] / sum,
              luminanceColor[2] / sum,
              luminanceColor[3],
            ];
          }
        }
        gl.uniform4fv(gl.getUniformLocation(effectProgram, "monolizeColor"), luminanceColor);
        gl.uniform1f(gl.getUniformLocation(effectProgram, "u_keepBrightness"), effect.keepBrightness ? 1 : 0);
        gl.uniform1f(gl.getUniformLocation(effectProgram, "u_strength"), cConv.getVarNum(effect.strength) / 100);
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
        gl.uniform2f(gl.getUniformLocation(effectProgram, "u_resolution"), itemOption.width, itemOption.height);
        uVarNumParameterNames = ["blur"];
        break;
      case "gaussianBlurEffect":
        gl.uniform2f(gl.getUniformLocation(effectProgram, "u_resolution"), itemOption.width, itemOption.height);
        uVarNumParameterNames = ["blur"];
        break;
      case "outlineEffect":
        gl.uniform2f(gl.getUniformLocation(effectProgram, "u_resolution"), itemOption.width, itemOption.height);
        gl.uniform4fv(gl.getUniformLocation(effectProgram, "u_color"), convertColorHEXA(effect.color));
        gl.uniform1f(gl.getUniformLocation(effectProgram, "u_isOutlineOnly"), effect.isOutlineOnly ? 1 : 0);
        uVarNumParameterNames = ["strokeThickness"];
        break;
      case "shadowEffect":
        gl.uniform2f(gl.getUniformLocation(effectProgram, "u_resolution"), itemOption.width, itemOption.height);
        gl.uniform4fv(gl.getUniformLocation(effectProgram, "u_color"), convertColorHEXA(effect.color));
        uVarNumParameterNames = ["x", "y"];
        break;
      case "directionalBlurEffect":
        break;
      case "cropByAngleEffect":
        break;
      case "opacityEffect":
        gl.uniform1f(gl.getUniformLocation(effectProgram, "u_opacity"), cConv.getVarNum(effect.opacity) / 100);
        gl.uniform1f(gl.getUniformLocation(effectProgram, "u_isAbsolute"), effect.isAbsolute ? 1.0 : 0.0);
        break;
    }

    // 書き込み先: writeTex
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, writeTex, 0);
    // 読み込み元: readTex
    gl.bindTexture(gl.TEXTURE_2D, readTex);

    // Uniform など設定
    for (const uVarNumParameterName of uVarNumParameterNames) {
      // @ts-ignore
      const value = cConv.getVarNum(effect[uVarNumParameterName]);
      gl.uniform1f(gl.getUniformLocation(effectProgram, "u_" + uVarNumParameterName), value);
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
    if (!writeTex) {
      throw new Error("writeTex is undefined");
    }
    readTex = writeTex;
    writeTex = tmp;
  }

  // FBOから切り離し
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return readTex; // 最終結果は最後に読み込みに使っていた方
}

const applyCenterPointEffect = (effect: ToEffectType<typeof allVideoEffectGroup["centerPointEffect"], "centerPointEffect">, itemOption: ItemOption, cConv: CurveConverter) => {
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
      itemOption.pivotX = -cConv.getVarNum(effect.x);
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