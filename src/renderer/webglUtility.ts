export const createTexture = (texImageSource: TexImageSource, gl: WebGLRenderingContext): WebGLTexture | null => {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // 画像データを適用
  gl.texImage2D(
    gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texImageSource
  );

  // テクスチャの設定
  setTextureSetting(gl);

  // テクスチャのバインドを無効化
  gl.bindTexture(gl.TEXTURE_2D, null);

  return texture;
}

export const createFrameBuffer = (width: number, height: number, gl: WebGLRenderingContext): WebGLTexture | null => {
  // フレームバッファ作成
  const framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  // 大きさを合わせる
  gl.viewport(0, 0, width, height);

  // テクスチャ作成
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

  // テクスチャの設定
  setTextureSetting(gl);

  // フレームバッファにテクスチャをアタッチ
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

  return texture;

  // 後でフレームバッファのバインドを解除してください
  // gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

const setTextureSetting = (gl: WebGLRenderingContext): void => {
  // テクスチャの拡大・縮小フィルタを設定
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  // テクスチャの繰り返し方法を設定
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}