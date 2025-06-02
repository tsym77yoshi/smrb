import { byougaFragmentShaderSources } from "./shaders/byougaShaders";

const nullVertexShaderSource = `
      attribute vec4 position;
      attribute vec2 texCoord;
      varying vec2 vTexCoord;
  
      void main() {
        gl_Position = position;
        vTexCoord = texCoord;
      }`;

export class EffectLoader {
  #gl: WebGLRenderingContext;
  #shaders = new Map<string, WebGLShader>();
  #nullVertexShaderCache: WebGLShader | null;// 何もしないvertexシェーダーのcache

  constructor(gl: WebGLRenderingContext) {
    this.#gl = gl;
    this.#nullVertexShaderCache = null;
  }

  useEffect(effectName: string): WebGLProgram | undefined {
    let vertexShaderSource = this.#getVertexShaderSource(effectName);
    if (vertexShaderSource == "" && this.#nullVertexShaderCache == null) {
      this.#nullVertexShaderCache = this.compileShader(nullVertexShaderSource, this.#gl.VERTEX_SHADER);
    }
    const vertexShader = (vertexShaderSource == "") ?
      this.#nullVertexShaderCache : this.compileShader(vertexShaderSource, this.#gl.VERTEX_SHADER);

    const fragmentShader = this.#getFragmetShader(effectName);

    if (vertexShader == null || fragmentShader == null) {
      console.error("Shader load error");
      return;
    }
    return this.useProgram(vertexShader, fragmentShader);
  }

  #getFragmetShader(shaderName: string): WebGLShader | null {
    if (this.#shaders.has(shaderName)) {
      return this.#shaders.get(shaderName)!;
    }
    const shader = this.compileShader(this.#getFragmentShaderSource(shaderName), this.#gl.FRAGMENT_SHADER);
    if (shader == null) {
      return null;
    }
    this.#shaders.set(shaderName, shader);
    return shader;
  }

  // このメソッドは実装されていません
  #getVertexShaderSource(shaderName: string): string {
    return ""
  }

  #getFragmentShaderSource(shaderName: string): string {
    const fragmentShaderSourceses = [byougaFragmentShaderSources];

    for (const fragmentShaderSources of fragmentShaderSourceses) {
      if (shaderName in fragmentShaderSources) {
        return fragmentShaderSources[shaderName];
      }
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