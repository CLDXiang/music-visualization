import { useEffect, useRef, useState, useCallback } from 'react';
import './App.scss';
import { ActionBar, Canvas } from './components';
import { CANVAS } from './utils/config';

const {
  HEIGHT,
  WIDTH,
  WAVE_BUFFER_SIZE,
  TIME_BUFFER_LENGTH,
  FREQ_BUFFER_LENGTH,
} = CANVAS;

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
  const waveBufferRef = useRef<number[]>(
    new Array(WAVE_BUFFER_SIZE * TIME_BUFFER_LENGTH).fill(128)
  );
  const animationFrameFlag = useRef<number>(-1);

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

  const draw = useCallback(() => {
    animationFrameFlag.current = requestAnimationFrame(draw);
    const ctx = canvasRef.current?.getContext('2d');
    if (!timeAnalyser || !freqAnalyser || !ctx) {
      return;
    }
    ctx.fillStyle = 'rgb(200, 200, 200)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // time
    timeAnalyser.fftSize = TIME_BUFFER_LENGTH;
    const timeDataArray = new Uint8Array(TIME_BUFFER_LENGTH);
    timeAnalyser.getByteTimeDomainData(timeDataArray);
    waveBufferRef.current = [
      ...waveBufferRef.current.slice(TIME_BUFFER_LENGTH),
      ...Array.from(timeDataArray),
    ];
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgb(0, 0, 0)';

    ctx.beginPath();
    const sliceWidth = WIDTH / waveBufferRef.current.length;
    let x = 0;
    for (let i = 0; i < waveBufferRef.current.length; i++) {
      var v = waveBufferRef.current[i] / 128.0;
      var y = (v * HEIGHT) / 2;

      if (i === 0) {
        ctx.moveTo(x, y / 2);
      } else {
        ctx.lineTo(x, y / 2);
      }

      x += sliceWidth;
    }
    ctx.lineTo(WIDTH, HEIGHT / 4);
    ctx.stroke();

    // freq
    freqAnalyser.fftSize = FREQ_BUFFER_LENGTH;
    const freqDataArray = new Uint8Array(FREQ_BUFFER_LENGTH);
    freqAnalyser.getByteFrequencyData(freqDataArray);
    const barWidth = WIDTH / FREQ_BUFFER_LENGTH;
    let barHeight;
    x = 0;
    for (let i = 0; i < FREQ_BUFFER_LENGTH; i++) {
      barHeight = freqDataArray[i] / 2;

      ctx.fillStyle = 'rgb(' + (barHeight + 100) + ',50,50)';
      ctx.fillRect(x, HEIGHT - barHeight / 2, barWidth, barHeight);

      x += barWidth + 1;
    }
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
