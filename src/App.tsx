import { useEffect, useRef, useState, useCallback } from 'react';
import './App.scss';
import { ActionBar, Canvas } from './components';
import { circleCoordinate } from './utils/canvas';
import { CANVAS, TIME, FREQ } from './utils/config';

const { HEIGHT, WIDTH, BACKGROUND } = CANVAS;
const { WAVE_BUFFER_SIZE, TIME_BUFFER_LENGTH, TIME_MERGE_LENGTH } = TIME;
const {
  FREQ_BUFFER_LENGTH,
  CIRCLE_IN_RADIUS,
  CIRCLE_IN_WAVE,
  CIRCLE_IN_ROTATE,
  CIRCLE_OUT_RADIUS,
  CIRCLE_OUT_WAVE,
  CIRCLE_OUT_ROTATE,
} = FREQ;

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [arrayBuffer, setArrayBuffer] = useState<ArrayBuffer | null>(null);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const [source, setSource] = useState<AudioBufferSourceNode | null>(null);
  const [timeAnalyser, setTimeAnalyser] = useState<AnalyserNode | null>(null);
  const [freqAnalyser, setFreqAnalyser] = useState<AnalyserNode | null>(null);
  const [audioStarted, setAudioStarted] = useState<boolean>(false);
  const [audioCtxState, setAudioCtxState] = useState<
    'closed' | 'running' | 'suspended' | undefined
  >('running');
  const waveBufferRef = useRef<Uint8Array>(
    new Uint8Array(WAVE_BUFFER_SIZE * TIME_BUFFER_LENGTH).fill(128)
  );
  const animationFrameFlag = useRef<number>(-1);

  /** 切换播放暂停 */
  const togglePlayStatus = () => {
    if (!source || !audioCtx) {
      alert('无法找到播放源！');
      return;
    }
    if (!audioStarted) {
      setAudioStarted(true);
      source.start();
      animationFrameFlag.current = requestAnimationFrame(draw);
    } else {
      if (audioCtx.state === 'running') {
        setAudioCtxState('suspended');
        audioCtx.suspend();
        cancelAnimationFrame(animationFrameFlag.current);
      } else if (audioCtx.state === 'suspended') {
        setAudioCtxState('running');
        audioCtx.resume();
        animationFrameFlag.current = requestAnimationFrame(draw);
      }
    }
  };

  /** 绘制 */
  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!timeAnalyser || !freqAnalyser || !ctx) {
      return;
    }

    // 清屏
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // 绘制时域图像，纵向条形图展示幅度
    timeAnalyser.fftSize = TIME_BUFFER_LENGTH;
    const timeDataArray = new Uint8Array(TIME_BUFFER_LENGTH);
    timeAnalyser.getByteTimeDomainData(timeDataArray);

    // 加入缓冲
    waveBufferRef.current.set(waveBufferRef.current.slice(TIME_BUFFER_LENGTH));
    waveBufferRef.current.set(timeDataArray, TIME_BUFFER_LENGTH * (WAVE_BUFFER_SIZE - 1));

    /** 横条数量（单边）
     * 如果不合并数据点，总条数即当前 waveBuffer 中所有数据项数，合并取商即可
     */
    const barCount = Math.floor((WAVE_BUFFER_SIZE * TIME_BUFFER_LENGTH) / TIME_MERGE_LENGTH);

    /** 横条宽度 */
    const barWidth = HEIGHT / barCount;

    // 从上到下画横条
    for (let i = 0; i < barCount; i++) {
      const slice = Array.from(
        waveBufferRef.current.slice(i * TIME_MERGE_LENGTH, (i + 1) * TIME_MERGE_LENGTH)
      );
      const baseColor = BACKGROUND;

      /** 右侧横条空间百分比 */
      const rightHeightRadio = (Math.max(...slice, 128) - 128) / 128;

      // 渐变色
      const rightGrad = ctx.createLinearGradient(
        WIDTH / 2,
        0,
        (WIDTH / 2) * (1 + rightHeightRadio),
        0
      );
      rightGrad.addColorStop(0, baseColor);
      // rightGrad.addColorStop(1, `rgb(${Math.floor(255 * rightHeightRadio)}, 204, 255)`);
      rightGrad.addColorStop(1, `rgb(${Math.floor(255 * rightHeightRadio)}, 166, 0)`);

      ctx.fillStyle = rightGrad;

      // 绘制
      ctx.fillRect(WIDTH / 2, i * barWidth, (WIDTH / 2) * rightHeightRadio, barWidth);

      /** 左侧横条空间百分比 */
      const leftHeightRadio = (128 - Math.min(...slice, 128)) / 128;

      // 渐变色
      const leftGrad = ctx.createLinearGradient(
        WIDTH / 2,
        0,
        (WIDTH / 2) * (1 - leftHeightRadio),
        0
      );
      leftGrad.addColorStop(0, baseColor);
      // leftGrad.addColorStop(1, `rgb(${Math.floor(255 * leftHeightRadio)}, 204, 255)`);
      leftGrad.addColorStop(1, `rgb(${Math.floor(255 * leftHeightRadio)}, 166, 0)`);
      ctx.fillStyle = leftGrad;

      // 绘制
      ctx.fillRect(
        (WIDTH / 2) * (1 - leftHeightRadio),
        i * barWidth,
        (WIDTH / 2) * leftHeightRadio,
        barWidth
      );
    }

    // 绘制频域图像，以圆形齿轮展示
    freqAnalyser.fftSize = FREQ_BUFFER_LENGTH;
    const freqDataArray = new Uint8Array(FREQ_BUFFER_LENGTH);
    freqAnalyser.getByteFrequencyData(freqDataArray);
    /** 时间戳， 用于频域旋转 */
    const timeStamp = audioCtx?.currentTime || 0;

    /** 画布中心 */
    ctx.lineCap = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ccf5';

    ctx.beginPath();
    /** 两个有效数据点的角度间隔 */
    let angleStep = (360 / FREQ_BUFFER_LENGTH) * 2;
    let startPoint: [number, number] = [WIDTH / 2, HEIGHT / 2];

    // 外圈
    for (let i = 0; i < FREQ_BUFFER_LENGTH / 2; i++) {
      const radius = CIRCLE_OUT_RADIUS + (CIRCLE_OUT_WAVE * freqDataArray[i]) / 255;
      let [x, y] = circleCoordinate(WIDTH / 2, HEIGHT / 2, radius, angleStep * i + 120 + timeStamp * CIRCLE_OUT_ROTATE);
      if (i === 0) {
        ctx.moveTo(x, y);
        startPoint = [x, y];
      } else {
        ctx.lineTo(x, y);
      }
      // 间隔点
      [x, y] = circleCoordinate(WIDTH / 2, HEIGHT / 2, radius, angleStep * (i + 0.4) + 120 + timeStamp * CIRCLE_OUT_ROTATE);
      ctx.lineTo(x, y);
      [x, y] = circleCoordinate(
        WIDTH / 2,
        HEIGHT / 2,
        CIRCLE_OUT_RADIUS,
        angleStep * (i + 0.6) + 120 + timeStamp * CIRCLE_OUT_ROTATE
      );
      ctx.lineTo(x, y);
      [x, y] = circleCoordinate(
        WIDTH / 2,
        HEIGHT / 2,
        CIRCLE_OUT_RADIUS,
        angleStep * (i + 0.8) + 120 + timeStamp * CIRCLE_OUT_ROTATE
      );
      ctx.lineTo(x, y);
    }
    ctx.lineTo(...startPoint);

    // 内圈
    for (let i = 0; i < FREQ_BUFFER_LENGTH / 2; i++) {
      const radius = CIRCLE_IN_RADIUS - (CIRCLE_IN_WAVE * freqDataArray[i]) / 255;
      let [x, y] = circleCoordinate(WIDTH / 2, HEIGHT / 2, radius, angleStep * i + 120 + timeStamp * CIRCLE_IN_ROTATE);
      if (i === 0) {
        ctx.moveTo(x, y);
        startPoint = [x, y];
      } else {
        ctx.lineTo(x, y);
      }
      // 间隔点
      [x, y] = circleCoordinate(WIDTH / 2, HEIGHT / 2, radius, angleStep * (i + 0.4) + 120 + timeStamp * CIRCLE_IN_ROTATE);
      ctx.lineTo(x, y);
      [x, y] = circleCoordinate(
        WIDTH / 2,
        HEIGHT / 2,
        CIRCLE_IN_RADIUS,
        angleStep * (i + 0.6) + 120 + timeStamp * CIRCLE_IN_ROTATE
      );
      ctx.lineTo(x, y);
      [x, y] = circleCoordinate(
        WIDTH / 2,
        HEIGHT / 2,
        CIRCLE_IN_RADIUS,
        angleStep * (i + 0.8) + 120 + timeStamp * CIRCLE_IN_ROTATE
      );
      ctx.lineTo(x, y);
    }
    ctx.lineTo(...startPoint);

    ctx.stroke();
    animationFrameFlag.current = requestAnimationFrame(draw);
  }, [audioCtx, timeAnalyser, freqAnalyser]);

  // useEffect(() => {
  //   if (audioCtx) {
  //     draw();
  //   }
  // }, [audioCtx, draw]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationFrameFlag.current);
    };
  }, []);

  // arrayBuffer 变化时
  useEffect(() => {
    if (!arrayBuffer || arrayBuffer.byteLength === 0) return;
    cancelAnimationFrame(animationFrameFlag.current);
    if (audioCtx) {
      audioCtx.close();
    }
    const audioContext = new window.AudioContext();
    const timeAnalyserNode = audioContext.createAnalyser();
    const freqAnalyserNode = audioContext.createAnalyser();
    const sourceNode = audioContext.createBufferSource();
    sourceNode.connect(timeAnalyserNode);
    timeAnalyserNode.connect(freqAnalyserNode);
    freqAnalyserNode.connect(audioContext.destination);
    audioContext.decodeAudioData(arrayBuffer).then((buffer) => {
      sourceNode.buffer = buffer;
      // audioCtxRef.current = audioContext;
      // analyserRef.current = analyserNode;
      // sourceRef.current = sourceNode;
      setAudioCtx(audioContext);
      setTimeAnalyser(timeAnalyserNode);
      setFreqAnalyser(freqAnalyserNode);
      setSource(sourceNode);
      setAudioStarted(false);
      setAudioCtxState('running');
    });
  }, [audioCtx, arrayBuffer, draw]);

  return (
    <div className="App" style={{ background: BACKGROUND }}>
      <Canvas ref={canvasRef} />
      <ActionBar
        audioCtxState={audioCtxState}
        audioStarted={audioStarted}
        arrayBuffer={arrayBuffer}
        setArrayBuffer={setArrayBuffer}
        togglePlayStatus={togglePlayStatus}
      />
    </div>
  );
}

export default App;
