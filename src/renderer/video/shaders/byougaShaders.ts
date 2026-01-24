export const byougaFragmentShaderSources: Record<string, string> = {
  monocolorizationEffect:`
precision mediump float;

varying vec2 vTexCoord;

uniform sampler2D texture;
uniform vec4 monolizeColor;

/**
 * 0.0: 輝度を保持しない（従来動作）
 * 1.0: 輝度を保持する
 */
uniform float keepLuminance;

void main() {
  vec4 color = texture2D(texture, vTexCoord);

  // 輝度計算
  float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));

  // 輝度保持 or 単色化
  vec3 monoRgb = mix(
    monolizeColor.rgb,
    monolizeColor.rgb * luminance,
    keepLuminance
  );

  gl_FragColor = vec4(
    monoRgb,
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
  borderBlurEffect:`
precision mediump float;
uniform sampler2D u_texture;
uniform float u_blur;
uniform vec2 u_resolution;
varying vec2 vTexCoord;

void main() {
    vec4 sum = vec4(0.0);
    vec2 texelSize = 1.0 / u_resolution * u_blur;
    
    sum += texture2D(u_texture, vTexCoord + vec2(-1.0, -1.0) * texelSize);
    sum += texture2D(u_texture, vTexCoord + vec2( 0.0, -1.0) * texelSize);
    sum += texture2D(u_texture, vTexCoord + vec2( 1.0, -1.0) * texelSize);
    sum += texture2D(u_texture, vTexCoord + vec2(-1.0,  0.0) * texelSize);
    sum += texture2D(u_texture, vTexCoord + vec2( 0.0,  0.0) * texelSize);
    sum += texture2D(u_texture, vTexCoord + vec2( 1.0,  0.0) * texelSize);
    sum += texture2D(u_texture, vTexCoord + vec2(-1.0,  1.0) * texelSize);
    sum += texture2D(u_texture, vTexCoord + vec2( 0.0,  1.0) * texelSize);
    sum += texture2D(u_texture, vTexCoord + vec2( 1.0,  1.0) * texelSize);
    
    gl_FragColor = sum / 9.0;
}`,
  gaussianBlurEffect:`
precision mediump float;
uniform sampler2D u_texture;
uniform float u_blur;
uniform vec2 u_resolution;
varying vec2 vTexCoord;

void main() {
    vec2 texelSize = 1.0 / u_resolution * u_blur;
    vec4 sum = vec4(0.0);

    sum += texture2D(u_texture, vTexCoord + vec2(-1.0, -1.0) * texelSize) * (1.0 / 16.0);
    sum += texture2D(u_texture, vTexCoord + vec2( 0.0, -1.0) * texelSize) * (2.0 / 16.0);
    sum += texture2D(u_texture, vTexCoord + vec2( 1.0, -1.0) * texelSize) * (1.0 / 16.0);
    sum += texture2D(u_texture, vTexCoord + vec2(-1.0,  0.0) * texelSize) * (2.0 / 16.0);
    sum += texture2D(u_texture, vTexCoord + vec2( 0.0,  0.0) * texelSize) * (4.0 / 16.0);
    sum += texture2D(u_texture, vTexCoord + vec2( 1.0,  0.0) * texelSize) * (2.0 / 16.0);
    sum += texture2D(u_texture, vTexCoord + vec2(-1.0,  1.0) * texelSize) * (1.0 / 16.0);
    sum += texture2D(u_texture, vTexCoord + vec2( 0.0,  1.0) * texelSize) * (2.0 / 16.0);
    sum += texture2D(u_texture, vTexCoord + vec2( 1.0,  1.0) * texelSize) * (1.0 / 16.0);

    gl_FragColor = sum;
}`,
  outlineEffect: `
precision mediump float;
uniform sampler2D u_texture;
uniform float u_strokeThickness;
uniform vec4 u_color;
uniform vec2 u_resolution;
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
    
    gl_FragColor = mix(outlineColor, originalColor, originalColor.a);
}`,
  shadowEffect: `
precision mediump float;
uniform sampler2D u_texture;
uniform float u_x;
uniform float u_y;
uniform float u_blur;
uniform vec4 u_color;
uniform vec2 u_resolution;
varying vec2 vTexCoord;

void main() {
    vec4 originalColor = texture2D(u_texture, vTexCoord);
    vec2 texelSize = 1.0 / u_resolution;
    vec2 offset = vec2(u_x, -u_y) * texelSize;
    
    float shadowAlpha = 0.0;
    float blurRadius = u_blur;

    shadowAlpha += texture2D(u_texture, vTexCoord - offset + vec2(-1.0, -1.0) * blurRadius * texelSize).a;
    shadowAlpha += texture2D(u_texture, vTexCoord - offset + vec2( 0.0, -1.0) * blurRadius * texelSize).a;
    shadowAlpha += texture2D(u_texture, vTexCoord - offset + vec2( 1.0, -1.0) * blurRadius * texelSize).a;
    shadowAlpha += texture2D(u_texture, vTexCoord - offset + vec2(-1.0,  0.0) * blurRadius * texelSize).a;
    shadowAlpha += texture2D(u_texture, vTexCoord - offset + vec2( 0.0,  0.0) * blurRadius * texelSize).a;
    shadowAlpha += texture2D(u_texture, vTexCoord + vec2( 1.0,  0.0) * blurRadius * texelSize).a;
    shadowAlpha += texture2D(u_texture, vTexCoord - offset + vec2(-1.0,  1.0) * blurRadius * texelSize).a;
    shadowAlpha += texture2D(u_texture, vTexCoord - offset + vec2( 0.0,  1.0) * blurRadius * texelSize).a;
    shadowAlpha += texture2D(u_texture, vTexCoord - offset + vec2( 1.0,  1.0) * blurRadius * texelSize).a;
    shadowAlpha /= 9.0;
    
    shadowAlpha *= (1.0 - originalColor.a);

    vec4 shadowColor = vec4(u_color.rgb, u_color.a * shadowAlpha);
    
    gl_FragColor = mix(shadowColor, originalColor, originalColor.a);
}`
};
export const byougaVertexShaderSources: Record<string, string> = {

}