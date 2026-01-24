// x/sigma=2までのガウス分布の計算
const calcGaussMap = (reslution: number): string => {
  let arr: number[] = [];
  const calcGauss = (x: number): number => {
    const x2 = x * x;
    // これはsigmaマクローリン展開をしてx=2くらいまでならちょうどいいように係数を調整したもの
    const y =
      (((-x2 * 0.002 + 0.021) * x2 - 0.125) * x2
        + 0.5) * x2;
    return (1 - y) * 0.1592;
  }
  let sum = 0;
  for (let i = 0; i < reslution; i++) {
    arr[i] = calcGauss(i * 2 / reslution);
    sum += arr[i] * (i == 0 ? 1 : 2);
  }
  let inv_sum = 1 / sum;
  let str = ""
  for (let i = 0; i < reslution; i++) {
    arr[i] *= inv_sum;
    str += "weights[" + i + "] = " + arr[i] + ";\n";
  }
  return str;
}
const gaussMapResolution = 4;
const gaussMap = calcGaussMap(gaussMapResolution);
const directionalBlurGaussMapResolution = 10;
const directionalBlurGaussMap = calcGaussMap(directionalBlurGaussMapResolution);

export const byougaFragmentShaderSources: Record<string, string> = {
  monocolorizationEffect: `
precision mediump float;

varying vec2 vTexCoord;

uniform sampler2D texture;
uniform vec4 monolizeColor;
uniform float u_strength;

/**
 * 0.0: 輝度を保持しない（従来動作）
 * 1.0: 輝度を保持する
 */
uniform float u_keepBrightness;

void main() {
  vec4 color = texture2D(texture, vTexCoord);

  // 輝度計算
  float Brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));

  // monolizeColorの輝度
  float monoBrightness = dot(monolizeColor.rgb, vec3(0.299, 0.587, 0.114));

  // 輝度を保持した単色化
  // ゼロ除算を避ける
  vec3 keepBrightnessColor = monoBrightness > 0.001 ? monolizeColor.rgb * (Brightness / monoBrightness) : vec3(0.0);

  // 輝度保持 or 単色化
  vec3 monoRgb = mix(
    monolizeColor.rgb,
    keepBrightnessColor,
    u_keepBrightness
  );

  gl_FragColor = vec4(
    mix(color.rgb, monoRgb, u_strength),
    color.a * monolizeColor.a
  );
}`,
  colorCorrectionEffect: `
precision highp float;

uniform sampler2D u_texture;

/*
  全パラメータの意味:
  u_lightness   100 = 変更なし
  u_contrast    100 = 変更なし
  u_hueRotation   0 = 変更なし（度）
  u_brightness  100 = 変更なし
  u_saturation  100 = 変更なし
*/

uniform float u_lightness;
uniform float u_contrast;
uniform float u_hueRotation;
uniform float u_brightness;
uniform float u_saturation;

varying vec2 vTexCoord;

/* sRGB <-> Linear */
vec3 toLinear(vec3 c) {
  return pow(c, vec3(2.2));
}
vec3 toSRGB(vec3 c) {
  return pow(max(c, 0.0), vec3(1.0 / 2.2));
}

/* Hue rotation matrix (YIQ based) */
mat3 hueMatrix(float angle) {
  float a = radians(angle);
  float c = cos(a);
  float s = sin(a);

  return mat3(
    0.213 + c*0.787 - s*0.213, 0.715 - c*0.715 - s*0.715, 0.072 - c*0.072 + s*0.928,
    0.213 - c*0.213 + s*0.143, 0.715 + c*0.285 + s*0.140, 0.072 - c*0.072 - s*0.283,
    0.213 - c*0.213 - s*0.787, 0.715 - c*0.715 + s*0.715, 0.072 + c*0.928 + s*0.072
  );
}

void main() {
  vec4 src = texture2D(u_texture, vTexCoord);

  /* ---- Linear color space ---- */
  vec3 c = toLinear(src.rgb);

  /* ---- Brightness (offset) ---- */
  c += (u_brightness - 100.0) / 100.0;

  /* ---- Contrast (pivot = 0.5) ---- */
  c = (c - 0.5) * (u_contrast / 100.0) + 0.5;

  /* ---- Lightness (luma mix) ---- */
  float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(luma), c, u_lightness / 100.0);

  /* ---- Saturation (luma based) ---- */
  vec3 gray = vec3(luma);
  c = mix(gray, c, u_saturation / 100.0);

  /* ---- Hue rotation ---- */
  c = hueMatrix(u_hueRotation) * c;

  /* ---- Back to sRGB ---- */
  c = toSRGB(c);

  gl_FragColor = vec4(clamp(c, 0.0, 1.0), src.a);
}`,
  borderBlurEffect: `
precision mediump float;
uniform sampler2D u_texture;
uniform vec2 u_texelSize; // (1.0 / width, 1.0 / height)
uniform float u_blur;     // ブラー半径（ピクセル）
varying vec2 vTexCoord;

float getTexAlpha(vec2 pos) {
  if (pos.x < 0.0 || pos.x > 1.0 || pos.y < 0.0 || pos.y > 1.0) {
    return 0.0;
  }
  return texture2D(u_texture, pos).a;
}

void main() {
    // ガウス重み（σ=2.0相当、正規化済み）
    float weights[${gaussMapResolution}];
    ${gaussMap}

    vec4 base = texture2D(u_texture, vTexCoord);
    float alpha = base.a * weights[0] * weights[0];
    if (alpha <= 0.001 || u_blur <= 0.001) {
        gl_FragColor = base;
        return;
    }

    float k = u_blur * ${2.0/gaussMapResolution}; // sigma/i_max
    for (int i = 0; i < ${gaussMapResolution}; i++) {
      for (int j = 1; j < ${gaussMapResolution}; j++) {
        float weight = weights[i] * weights[j];
        vec2 offset = vec2(u_texelSize.x * float(i), u_texelSize.y * float(j)) * k;
        alpha += getTexAlpha(vTexCoord + offset) * weight;
        alpha += getTexAlpha(vTexCoord - offset) * weight;
        alpha += getTexAlpha(vTexCoord + vec2(-offset.y, offset.x)) * weight;
        alpha += getTexAlpha(vTexCoord - vec2(-offset.y, offset.x)) * weight;
      }
    }

    gl_FragColor = vec4(base.rgb, alpha);
}`,
  gaussianBlurEffect: `
precision mediump float;
uniform sampler2D u_texture;
uniform vec2 u_texelSize; // (1.0 / width, 1.0 / height)
uniform float u_blur;     // ブラー半径（ピクセル）

varying vec2 vTexCoord;

void main() {
    // ガウス重み（σ=2.0相当、正規化済み）
    float weights[${gaussMapResolution}];
    ${gaussMap}

    vec4 color = 0.0;
    float k = u_blur * ${2.0 / gaussMapResolution};

    for (int i = 0; i < ${gaussMapResolution}; i++) {
      for (int j = 1; j < ${gaussMapResolution}; j++) {
        float weight = weights[i] * weights[j];
        vec2 offset = vec2(u_texelSize.x * float(i), u_texelSize.y * float(j)) * k;
        color += texture2D(u_texture, vTexCoord + offset) * weight;
        color += texture2D(u_texture, vTexCoord - offset) * weight;
        color += texture2D(u_texture, vTexCoord + vec2(-offset.y, offset.x)) * weight;
        color += texture2D(u_texture, vTexCoord - vec2(-offset.y, offset.x)) * weight;
      }
    }

    gl_FragColor = color;
}`,
  directionalBlurEffect: `
precision mediump float;
uniform sampler2D u_texture;
uniform vec2 u_texelSize; // (1.0 / width, 1.0 / height)
uniform float u_standardDeviation;
uniform float u_angle;

varying vec2 vTexCoord;

void main() {
    // ガウス重み（σ=2.0相当、正規化済み）
    float weights[${directionalBlurGaussMapResolution}];
    ${directionalBlurGaussMap}

    vec4 color = texture2D(u_texture, vTexCoord) * weights[0];
    float k = u_standardDeviation * 0.5 * 0.1;
    float angle = (-u_angle - 45.0) * 3.1416 / 180.0;
    mat2 direction = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));

    for (int i = 1; i < ${directionalBlurGaussMapResolution}; i++) {
        vec2 offset = direction * u_texelSize * float(i) * k;
        color += texture2D(u_texture, vTexCoord + offset) * weights[i];
        color += texture2D(u_texture, vTexCoord - offset) * weights[i];
    }

    gl_FragColor = color;
}`,
  outlineEffect: `
precision mediump float;
uniform sampler2D u_texture;
uniform float u_strokeThickness;
uniform vec4 u_color;
uniform vec2 u_resolution;
uniform float u_isOutlineOnly;
varying vec2 vTexCoord;

void main() {
    vec2 texelSize = 1.0 / u_resolution;
    vec4 originalColor = texture2D(u_texture, vTexCoord);
    float maxAlpha = 0.0;
    float step = u_strokeThickness;

    maxAlpha = max(maxAlpha, texture2D(u_texture, vTexCoord + vec2(0.0, -step) * texelSize).a);
    maxAlpha = max(maxAlpha, texture2D(u_texture, vTexCoord + vec2(0.0, step) * texelSize).a);
    maxAlpha = max(maxAlpha, texture2D(u_texture, vTexCoord + vec2(-step, 0.0) * texelSize).a);
    maxAlpha = max(maxAlpha, texture2D(u_texture, vTexCoord + vec2(step, 0.0) * texelSize).a);
    maxAlpha = max(maxAlpha, texture2D(u_texture, vTexCoord + vec2(-step, -step) * texelSize).a);
    maxAlpha = max(maxAlpha, texture2D(u_texture, vTexCoord + vec2(step, -step) * texelSize).a);
    maxAlpha = max(maxAlpha, texture2D(u_texture, vTexCoord + vec2(-step, step) * texelSize).a);
    maxAlpha = max(maxAlpha, texture2D(u_texture, vTexCoord + vec2(step, step) * texelSize).a);

    float outlineAlpha = maxAlpha * (1.0 - originalColor.a) * u_color.a;
    vec4 outlineColor = vec4(u_color.rgb, outlineAlpha);
    
    gl_FragColor = u_isOutlineOnly > 0.5 ? outlineColor : mix(outlineColor, originalColor, originalColor.a);
}`,
  shadowEffect: `
precision mediump float;
uniform sampler2D u_texture;
uniform float u_x;
uniform float u_y;
uniform vec4 u_color;
uniform vec2 u_resolution;
varying vec2 vTexCoord;

void main() {
    vec4 originalColor = texture2D(u_texture, vTexCoord);
    vec2 texelSize = 1.0 / u_resolution;
    vec2 offset = vec2(u_x, -u_y) * texelSize;
    
    float shadowAlpha = texture2D(u_texture, vTexCoord - offset).a * (1.0 - originalColor.a);

    vec4 shadowColor = vec4(u_color.rgb, u_color.a * shadowAlpha);
    
    gl_FragColor = mix(shadowColor, originalColor, originalColor.a);
}`,
  opacityEffect: `
precision mediump float;
uniform sampler2D u_texture;
uniform float u_opacity;
uniform float u_isAbsolute;
varying vec2 vTexCoord;

void main() {
  vec4 color = texture2D(u_texture, vTexCoord);
  gl_FragColor = vec4(color.rgb, (u_isAbsolute > 0.5 ? 1.0 : color.a) * u_opacity);
}`,
  cropByAngleEffect: `
precision mediump float;

varying vec2 vTexCoord;

uniform sampler2D u_texture;
uniform vec2 u_center;
uniform float u_angle;
uniform float u_width;
uniform float u_blur;
uniform vec2 u_resolution;

void main() {
    vec4 color = texture2D(u_texture, vTexCoord);

    vec2 pos_from_center = (vTexCoord * u_resolution) - u_resolution / 2.0;
    vec2 final_pos = pos_from_center - u_center;

    // Rotate the coordinate system
    float angle_rad = radians(u_angle);
    float s = sin(-angle_rad);
    float c = cos(-angle_rad);
    mat2 rotationMatrix = mat2(c, -s, s, c);
    vec2 rotatedPos = rotationMatrix * final_pos;

    // Distance from the center line of the band
    float dist = abs(rotatedPos.x);

    // Calculate alpha
    float halfWidth = u_width / 2.0;
    float alpha = 1.0 - smoothstep(halfWidth - u_blur, halfWidth, dist);

    gl_FragColor = vec4(color.rgb, color.a * alpha);
}`,
};
export const byougaVertexShaderSources: Record<string, string> = {

}