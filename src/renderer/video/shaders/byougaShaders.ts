export const byougaFragmentShaderSources: Record<string, string> = {
  colorCorrectionEffect: `
precision mediump float;

uniform sampler2D u_texture;
uniform float u_lightness;    // 100 = 基準
uniform float u_contrast;     // 100 = 基準
uniform float u_hueRotation;  // 単位：度
uniform float u_brightness;   // 100 = 基準
uniform float u_saturation;   // 100 = 基準

varying vec2 vTexCoord;

vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs((q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  vec4 color = texture2D(u_texture, vTexCoord);
  vec3 c = color.rgb;

  // 1. Hue rotation & saturation
  vec3 hsv = rgb2hsv(c);
  hsv.x += u_hueRotation / 360.0;
  hsv.x = mod(hsv.x, 1.0);
  hsv.y *= u_saturation / 100.0;
  c = hsv2rgb(hsv);

  // 2. Brightness
  c *= u_brightness / 100.0;

  // 3. Lightness
  float avg = (c.r + c.g + c.b) / 3.0;
  c = mix(vec3(avg), c, u_lightness / 100.0);

  // 4. Contrast
  c = ((c - 0.5) * (u_contrast / 100.0)) + 0.5;

  gl_FragColor = vec4(clamp(c, 0.0, 1.0), color.a);
}
  `,
  // 他のフラグメントシェーダーをここに追加できます
};
export const byougaVertexShaderSources: Record<string, string> = {

}