// 拡張子を削る関数
export const removeExtension = (str: string) => {
  const lastDotIndex = str.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return str;
  }
  return str.slice(0, lastDotIndex);
}

// アンダーバーの特定の数まで削る関数
export const removeUnderscore = (str: string, count: number) => {
  // countが0以下の場合は、何もせず元の文字列を返す
  if (count <= 0) {
    return str;
  }

  const segments = str.split('_');

  // count個の要素を取り除く
  const resultSegments = segments.slice(count);

  return resultSegments.join('_');
};