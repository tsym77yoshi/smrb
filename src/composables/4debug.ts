// デバッグ用

export const measureSt = () =>{
  performance.mark('myPerformanceStart') // 開始点
}
export const measureEnd = () => {
  performance.mark('myPerformanceEnd') // 終了点
  performance.measure('myPerformance', // 計測名
    'myPerformanceStart', // 計測開始点
    'myPerformanceEnd' // 計測終了点
  ); // 結果の取得
  const results = performance.getEntriesByName('myPerformance'); // 表示
  console.log(results[results.length-1]);
}