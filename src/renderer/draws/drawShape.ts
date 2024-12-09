import type { ShapeItem } from "@/type/itemType";
import type { ItemOption } from "../rendererTypes";
import { CurveConverter } from "../curveConverter";
import { createFrameBuffer } from "../webglUtility";
import { useVideoInfoStore } from "@/store/tlStore";
import { convertColorHEXA } from "@/composables/colorConverter";
import { EffectLoader } from "../effectLoader";


const shapeVertexShader = `
attribute vec4 position;
void main() {
  gl_Position = position;
}
`;
const circleVertexShader = `
attribute vec4 position;
varying vec2 v_uv;
void main() {
  v_uv = position.xy * 0.5;
  gl_Position = position;
}
`;

const fillFragmentShader = `
precision mediump float;
uniform vec4 color;
void main() {
  gl_FragColor = color;
}
`;
const circleFragmetnShader = `
precision mediump float;
uniform vec4 color;
varying vec2 v_uv;
uniform float innerRadius;
void main() {
  float dist = length(v_uv);
  float smoothness = 0.01;
  float outerAlpha = smoothstep(smoothness, - smoothness, dist - 0.5);
  float innerAlpha = 1.0 - smoothstep(smoothness, - smoothness, dist - innerRadius);
  gl_FragColor = vec4(color.rgb, color.a * outerAlpha * innerAlpha);
}
`;

//WebGLTextureも返す
export const drawShape = (item: ShapeItem, cConv: CurveConverter, gl: WebGLRenderingContext, videoInfoStore: ReturnType<typeof useVideoInfoStore>): { tex: WebGLTexture, itemOption: ItemOption } | undefined => {
  const [r, g, b, a] = new Float32Array(convertColorHEXA(item.color));
  if (item.shapeType == "background") {
    const texture = createFrameBuffer(videoInfoStore.width, videoInfoStore.height, gl);
    if (texture == null) {
      console.error("フレームバッファの生成に失敗しました");
      return;
    }

    gl.clearColor(r, g, b, a);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return {
      tex: texture,
      itemOption: {
        x: cConv.getVarNum(item.x),
        y: cConv.getVarNum(item.y),
        width: videoInfoStore.width,
        height: videoInfoStore.height,
        pivotX: 0,
        pivotY: 0,
        itemFrame: 0,
      }
    }
  }

  // 大きさ
  let width = cConv.getVarNum(item.size);
  let height = cConv.getVarNum(item.size);
  const aspectRate = cConv.getVarNum(item.aspectRate);
  if (aspectRate >= 0) {
    width *= (100 - aspectRate) / 100;
  } else {
    height *= (100 + aspectRate) / 100;
  }
  // フレームバッファ作成
  const texture = createFrameBuffer(width, height, gl);
  if (texture == null) {
    console.error("フレームバッファの生成に失敗しました");
    return;
  }
  // 背景を設定
  gl.clearColor(0.0, 0.0, 0.0, 0.0);// 背景を透明にする
  gl.clear(gl.COLOR_BUFFER_BIT);

  // 座標を設定
  let array: number[] = [];
  // (cConv.getVarNum(item.size) / 2 - cConv.getVarNum(item.strokeThickness)) / (cConv.getVarNum(item.size) / 2);
  const radius = 1 - cConv.getVarNum(item.strokeThickness) * 2 / cConv.getVarNum(item.size);
  if (["triangle", "pentagon", "hexagon"].includes(item.shapeType)) {
    let n = 1;
    switch (item.shapeType) {
      case "triangle":
        n = 3;
        break;
      case "pentagon":
        n = 5;
        break;
      case "hexagon":
        n = 6;
        break;
    }
    for (let i = 0; i < n; i++) {
      const angle = 2 * Math.PI * Math.ceil(i / 2) * ((-1) ** (i % 2)) / n;
      array.push(Math.sin(angle), -Math.cos(angle));
      if (radius > 0) {
        array.push(Math.sin(angle) * radius, -Math.cos(angle) * radius);
      }
    }
    array.push(array[0], array[1]);
    array.push(array[2], array[3]);
  } else if (["square"].includes(item.shapeType)) {
    // squareだけ線の太さ
    const radiusX = 1 - cConv.getVarNum(item.strokeThickness) * 2 / width;
    const radiusY = 1 - cConv.getVarNum(item.strokeThickness) * 2 / height;
    array = [
      -1.0, -1.0,
      1.0, -1.0,
      -1.0, 1.0,
      1.0, 1.0,
    ]
    if (radiusX > 0 && radiusY > 0) {
      const arrayTemp = [
        -1.0, -1.0,
        1.0, -1.0,
        1.0, 1.0,
        -1.0, 1.0,
      ];
      array = [];
      for (let i = 0; i < arrayTemp.length; i += 2) {
        array.push(arrayTemp[i], arrayTemp[i + 1]);
        array.push(arrayTemp[i] * radiusX, arrayTemp[i + 1] * radiusY);
      }
      array.push(array[0], array[1]);
      array.push(array[2], array[3]);
    }
  } else if (["circle"].includes(item.shapeType)) {
    array = [
      -1.0, -1.0,
      1.0, -1.0,
      -1.0, 1.0,
      1.0, 1.0,
    ]
  }
  const vertices = new Float32Array(array);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  // シェーダー作成
  const effectLoader = new EffectLoader(gl);
  let vertexShader = null;
  let fragmentShader = null;
  if (["triangle", "square", "pentagon", "hexagon"].includes(item.shapeType)) {
    vertexShader = effectLoader.compileShader(shapeVertexShader, gl.VERTEX_SHADER);
    fragmentShader = effectLoader.compileShader(fillFragmentShader, gl.FRAGMENT_SHADER);
  } else if (item.shapeType == "circle") {
    vertexShader = effectLoader.compileShader(circleVertexShader, gl.VERTEX_SHADER);
    fragmentShader = effectLoader.compileShader(circleFragmetnShader, gl.FRAGMENT_SHADER);
  }
  if (!vertexShader || !fragmentShader) {
    return;
  }
  const shaderProgram = effectLoader.useProgram(vertexShader, fragmentShader);
  if (!shaderProgram) {
    return;
  }
  // 色を設定
  const color = gl.getUniformLocation(shaderProgram, "color");
  gl.uniform4fv(color, [r, g, b, a]);
  // 円の内径を設定
  if (item.shapeType == "circle") {
    const innerRadius = gl.getUniformLocation(shaderProgram, "innerRadius");
    gl.uniform1f(innerRadius, radius / 2);
  }

  // 位置情報
  const positionLocation = gl.getAttribLocation(shaderProgram, "position");
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, array.length / 2);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return {
    tex: texture,
    itemOption: {
      x: cConv.getVarNum(item.x),
      y: cConv.getVarNum(item.y),
      width: width,
      height: height,
      pivotX: 0,
      pivotY: 0,
      itemFrame: 0,
    }
  }
}
