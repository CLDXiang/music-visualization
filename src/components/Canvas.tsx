import { forwardRef } from 'react';
import { CANVAS } from '../utils/config';
import './Canvas.scss';

const Canvas = forwardRef<HTMLCanvasElement>((props, ref) => (
  <div className="canvas-container">
    <canvas
      ref={ref}
      height={CANVAS.HEIGHT}
      width={CANVAS.WIDTH}
      style={{ height: CANVAS.HEIGHT, width: CANVAS.WIDTH }}
      {...props}
    >
      Your browser doesn't support canvas.
    </canvas>
  </div>
));

export default Canvas;
