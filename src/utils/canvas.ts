/** 计算圆上的坐标
 * @param centerX: 圆心 x
 * @param centerY: 圆心 y
 * @param radius: 半径
 * @param angle: 极角
 */
export const circleCoordinate = (centerX: number, centerY: number, radius: number, angle: number) => {
  const parsedAngle = (angle % 360) * Math.PI / 180;
  return [centerX + Math.cos(parsedAngle) * radius, centerY + Math.sin(parsedAngle) * radius]
}

// /** 画线 */
// export const lineTo = (ctx: CanvasRenderingContext2D, x:number, y: number, config?: { color?: string, width?: number, cap?: CanvasLineCap}) => {
//   ctx.save();

//   if (config?.cap) {
//     ctx.lineCap = config.cap;
//   }
//   if (config?.width) {
//     ctx.lineWidth = config.width;
//   }
//   if (config?.color) {
//     ctx.strokeStyle = config.color;
//   }
//   ctx.lineTo(x, y);

//   ctx.restore();
// }

// /** 从某点画线 */
// export const lineFromTo = (ctx: CanvasRenderingContext2D, x0:number, y0: number, x1:number, y1: number, config?: { color?: string, width?: number, cap?: CanvasLineCap}) => {
//   ctx.save();

//   ctx.moveTo(x0, y0);

//   if (config?.cap) {
//     ctx.lineCap = config.cap;
//   }
//   if (config?.width) {
//     ctx.lineWidth = config.width;
//   }
//   if (config?.color) {
//     ctx.strokeStyle = config.color;
//   }
//   ctx.lineTo(x1, y1);

//   ctx.restore();
// }
