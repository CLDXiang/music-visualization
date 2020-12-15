/** 画布设置 */
export const CANVAS = {
  /** 画布宽度 */
  WIDTH: 300,
  /** 画布高度 */
  HEIGHT: 500,
}

/** 时域设置 */
export const TIME = {
  /** 同时展示多少帧数据 */
  WAVE_BUFFER_SIZE: 200,
  /** 单帧数据项数 */
  TIME_BUFFER_LENGTH: 256,
  /** 可视化时合并展示的数据项数 */
  TIME_MERGE_LENGTH: 64,
}

/** 频域设置 */
export const FREQ = {
  /** 单帧数据项数，也是 FFT size */
  FREQ_BUFFER_LENGTH: 64,
  /** 外圆的基本半径 */
  CIRCLE_RADIUS_OUT: 100,
  /** 内圆的基本半径 */
  CIRCLE_RADIUS_IN: 95,
  /** 圆的凸起范围 */
  CIRCLE_WAVE_OUT: 20,
  /** 圆的下凹范围 */
  CIRCLE_WAVE_IN: 15,
}
