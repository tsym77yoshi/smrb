export const byougaFragmentShaderSources: Record<string, string> = {
  monocolorizationEffect:`
precision mediump float;
varying vec2 vTexCoord;
uniform sampler2D texture;
uniform vec4 monolizeColor;

void main() {
  vec4 color = texture2D(texture, vTexCoord);
  gl_FragColor = vec4(monolizeColor.rgb, color.a * monolizeColor.a);
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
};
export const byougaVertexShaderSources: Record<string, string> = {

}