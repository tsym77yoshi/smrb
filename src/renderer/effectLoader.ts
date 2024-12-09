export class EffectLoader {
  #gl: WebGLRenderingContext;
  #shaders = new Map<string, WebGLShader>();
  #vertexShader: WebGLShader | null;

  constructor(gl: WebGLRenderingContext) {
    this.#gl = gl;
    this.#vertexShader = null;
  }

  useEffect(effectName: string): WebGLProgram | undefined {
    if (this.#vertexShader == null) {
      this.#vertexShader = this.compileShader(`
        attribute vec4 position;
        attribute vec2 texCoord;
        varying vec2 vTexCoord;
        uniform mat3 angleScaleTransMat;// 回転拡大移動行列
  
        void main() {
          vec3 pos = angleScaleTransMat * vec3(position.xy, 1.0);
          gl_Position = vec4(pos.x, pos.y, position.zw);
          vTexCoord = texCoord;
        }`, this.#gl.VERTEX_SHADER);
    }
    const fragmentShader = this.#getShader(effectName);
    if (this.#vertexShader == null || fragmentShader == null) {
      console.error("Shader load error");
      return;
    }
    return this.useProgram(this.#vertexShader, fragmentShader);
  }

  #getShader(shaderName: string): WebGLShader | null {
    if (this.#shaders.has(shaderName)) {
      return this.#shaders.get(shaderName)!;
    }
    const shader = this.compileShader(this.#getShaderSource(shaderName), this.#gl.FRAGMENT_SHADER);
    if (shader == null) {
      return null;
    }
    this.#shaders.set(shaderName, shader);
    return shader;
  }

  // このメソッドは実装されていません
  #getShaderSource(shaderName: string): string {
    // フラグメントシェーダー
    if (shaderName === "texture") {
      return `
            precision mediump float;
            varying vec2 vTexCoord;
            uniform sampler2D texture;
            uniform float opacity;

            void main() {
              vec4 color = texture2D(texture, vTexCoord);
              gl_FragColor = vec4(color.rgb, color.a * opacity);
            }
        `;
    }
    return "";
  }

  useProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram | undefined {
    const shaderProgram = this.#gl.createProgram();
    if (shaderProgram == null) {
      console.error("Program create error");
      return;
    }
    this.#gl.attachShader(shaderProgram, vertexShader);
    this.#gl.attachShader(shaderProgram, fragmentShader);
    this.#gl.linkProgram(shaderProgram);

    if (!this.#gl.getProgramParameter(shaderProgram, this.#gl.LINK_STATUS)) {
      console.error("Program link error:", this.#gl.getProgramInfoLog(shaderProgram));
      return;
    }

    this.#gl.useProgram(shaderProgram);

    return shaderProgram;
  }

  compileShader(source: string, type: GLenum): WebGLShader | null {
    const shader = this.#gl.createShader(type);
    if (shader == null) {
      console.error("Shader create error");
      return null;
    }
    this.#gl.shaderSource(shader, source);
    this.#gl.compileShader(shader);
    if (!this.#gl.getShaderParameter(shader, this.#gl.COMPILE_STATUS)) {
      console.error("Shader compile error:", this.#gl.getShaderInfoLog(shader));
      this.#gl.deleteShader(shader);
      return null;
    }
    return shader;
  }
}