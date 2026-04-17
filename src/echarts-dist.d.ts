/** dist 完整包类型与 `echarts` 主包一致；运行时用 `echartsFromDistBundle` 解析 CJS default interop */
declare module 'echarts/dist/echarts.js' {
  export * from 'echarts';
}
