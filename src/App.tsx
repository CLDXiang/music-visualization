import { useEffect, useRef, useState, useCallback } from 'react';
import './App.scss';
import { ActionBar, Canvas } from './components';
import { circleCoordinate } from './utils/canvas';
import { CANVAS, TIME, FREQ } from './utils/config';

const { HEIGHT, WIDTH } = CANVAS;
const { WAVE_BUFFER_SIZE, TIME_BUFFER_LENGTH, TIME_MERGE_LENGTH } = TIME;
const {
  FREQ_BUFFER_LENGTH,
  CIRCLE_RADIUS_IN,
  CIRCLE_RADIUS_OUT,
  CIRCLE_WAVE_IN,
  CIRCLE_WAVE_OUT,
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
    animationFrameFlag.current = requestAnimationFrame(draw);
    const ctx = canvasRef.current?.getContext('2d');
    if (!timeAnalyser || !freqAnalyser || !ctx) {
      return;
    }
    // clear screen
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // time
    timeAnalyser.fftSize = TIME_BUFFER_LENGTH;
    const timeDataArray = new Uint8Array(TIME_BUFFER_LENGTH);
    timeAnalyser.getByteTimeDomainData(timeDataArray);
    waveBufferRef.current.set(waveBufferRef.current.slice(TIME_BUFFER_LENGTH));
    waveBufferRef.current.set(timeDataArray, TIME_BUFFER_LENGTH * (WAVE_BUFFER_SIZE - 1));

    // 纵向绘制
    /** 横条数量（单边）
     * 如果不合并数据点，总条数即当前 waveBuffer 中所有数据项数，合并取商即可
     */
    const barCount = Math.floor((WAVE_BUFFER_SIZE * TIME_BUFFER_LENGTH) / TIME_MERGE_LENGTH);

    /** 横条宽度 */
    const barWidth = HEIGHT / barCount;
    for (let i = 0; i < barCount; i++) {
      const slice = Array.from(
        waveBufferRef.current.slice(i * TIME_MERGE_LENGTH, (i + 1) * TIME_MERGE_LENGTH)
      );
      const baseColor = '#000';

      /** 右侧横条空间百分比 */
      const rightHeightRadio = (Math.max(...slice, 128) - 128) / 128;
      const rightGrad = ctx.createLinearGradient(
        WIDTH / 2,
        0,
        (WIDTH / 2) * (1 + rightHeightRadio),
        0
      );
      rightGrad.addColorStop(0, baseColor);
      rightGrad.addColorStop(1, `rgb(${Math.floor(255 * rightHeightRadio)}, 204, 255)`);
      ctx.fillStyle = rightGrad;
      ctx.fillRect(WIDTH / 2, i * barWidth, (WIDTH / 2) * rightHeightRadio, barWidth);

      /** 左侧横条空间百分比 */
      const leftHeightRadio = (128 - Math.min(...slice, 128)) / 128;
      const leftGrad = ctx.createLinearGradient(
        WIDTH / 2,
        0,
        (WIDTH / 2) * (1 - leftHeightRadio),
        0
      );
      leftGrad.addColorStop(0, baseColor);
      leftGrad.addColorStop(1, `rgb(${Math.floor(255 * leftHeightRadio)}, 204, 255)`);
      ctx.fillStyle = leftGrad;
      ctx.fillRect(
        (WIDTH / 2) * (1 - leftHeightRadio),
        i * barWidth,
        (WIDTH / 2) * leftHeightRadio,
        barWidth
      );
    }

    // freq
    freqAnalyser.fftSize = FREQ_BUFFER_LENGTH;
    const freqDataArray = new Uint8Array(FREQ_BUFFER_LENGTH);
    freqAnalyser.getByteFrequencyData(freqDataArray);

    /** 画布中心 */
    ctx.lineCap = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ccccff55';

    ctx.beginPath();
    /** 两个有效数据点的角度间隔 */
    let angleStep = (360 / FREQ_BUFFER_LENGTH) * 2;
    let startPoint: [number, number] = [WIDTH / 2, HEIGHT / 2];
    for (let i = 0; i < FREQ_BUFFER_LENGTH / 2; i++) {
      const radius = CIRCLE_RADIUS_OUT + (CIRCLE_WAVE_OUT * freqDataArray[i]) / 255;
      let [x, y] = circleCoordinate(WIDTH / 2, HEIGHT / 2, radius, angleStep * i + 120);
      if (i === 0) {
        ctx.moveTo(x, y);
        startPoint = [x, y];
      } else {
        ctx.lineTo(x, y);
      }
      // 间隔点
      [x, y] = circleCoordinate(WIDTH / 2, HEIGHT / 2, radius, angleStep * (i + 0.4) + 120);
      ctx.lineTo(x, y);
      [x, y] = circleCoordinate(
        WIDTH / 2,
        HEIGHT / 2,
        CIRCLE_RADIUS_OUT,
        angleStep * (i + 0.6) + 120
      );
      ctx.lineTo(x, y);
      [x, y] = circleCoordinate(
        WIDTH / 2,
        HEIGHT / 2,
        CIRCLE_RADIUS_OUT,
        angleStep * (i + 0.8) + 120
      );
      ctx.lineTo(x, y);
    }
    ctx.lineTo(...startPoint);

    for (let i = 0; i < FREQ_BUFFER_LENGTH / 2; i++) {
      const radius = CIRCLE_RADIUS_IN - (CIRCLE_WAVE_IN * freqDataArray[i]) / 255;
      let [x, y] = circleCoordinate(WIDTH / 2, HEIGHT / 2, radius, angleStep * i + 120);
      if (i === 0) {
        ctx.moveTo(x, y);
        startPoint = [x, y];
      } else {
        ctx.lineTo(x, y);
      }
      // 间隔点
      [x, y] = circleCoordinate(WIDTH / 2, HEIGHT / 2, radius, angleStep * (i + 0.4) + 120);
      ctx.lineTo(x, y);
      [x, y] = circleCoordinate(
        WIDTH / 2,
        HEIGHT / 2,
        CIRCLE_RADIUS_IN,
        angleStep * (i + 0.6) + 120
      );
      ctx.lineTo(x, y);
      [x, y] = circleCoordinate(
        WIDTH / 2,
        HEIGHT / 2,
        CIRCLE_RADIUS_IN,
        angleStep * (i + 0.8) + 120
      );
      ctx.lineTo(x, y);
    }
    ctx.lineTo(...startPoint);

    ctx.stroke();
  }, [timeAnalyser, freqAnalyser]);

  useEffect(() => {
    if (audioCtx) {
      draw();
    }
  }, [audioCtx, draw]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationFrameFlag.current);
    };
  }, []);

  // arrayBuffer 变化时
  useEffect(() => {
    if (!arrayBuffer || arrayBuffer.byteLength === 0) return;
    console.log(arrayBuffer);
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
  }, [arrayBuffer, draw]);

  return (
    <div className="App">
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
