import { useEffect, useRef, useState, useCallback } from "react";
import "./App.scss";
import { ActionBar, Canvas } from "./components";
import { CANVAS } from "./utils/config";

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [arrayBuffer, setArrayBuffer] = useState<ArrayBuffer | null>(null);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const [source, setSource] = useState<AudioBufferSourceNode | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  // const audioCtxRef = useRef<AudioContext | null>(null);
  // const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  // const analyserRef = useRef<AnalyserNode | null>(null);

  const playAudio = () => {
    // const source = sourceRef.current;
    if (!source) {
      alert('无法找到播放源！');
      return;
    }
    source.start();
  }

  
  const draw = useCallback(() => {
    requestAnimationFrame(draw);
    // const analyser = analyserRef.current;
    const ctx = canvasRef.current?.getContext('2d');
    if (!analyser || !ctx) {
      return;
    }
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);
    console.log({ dataArray })
    ctx.fillStyle = "rgb(200, 200, 200)";
    ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgb(0, 0, 0)";

    ctx.beginPath();
    const sliceWidth = (CANVAS.WIDTH * 1.0) / bufferLength;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      var v = dataArray[i] / 128.0;
      var y = (v * CANVAS.HEIGHT) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }
    ctx.lineTo(CANVAS.WIDTH, CANVAS.HEIGHT / 2);
    ctx.stroke();
  }, [analyser]);

  useEffect(() => {
    if (analyser) {
      draw();
    }
  }, [analyser, draw]);

  // arrayBuffer 变化时
  useEffect(() => {
    if (!arrayBuffer || arrayBuffer.byteLength === 0) return;
    console.log(arrayBuffer);
    const audioContext = new window.AudioContext();
    const analyserNode = audioContext.createAnalyser();
    const sourceNode = audioContext.createBufferSource();
    sourceNode.connect(analyserNode);
    audioContext.decodeAudioData(arrayBuffer).then((buffer) => {
      sourceNode.buffer = buffer;
      // audioCtxRef.current = audioContext;
      // analyserRef.current = analyserNode;
      // sourceRef.current = sourceNode;
      setAudioCtx(audioContext);
      setAnalyser(analyserNode);
      setSource(sourceNode);
    })
  }, [arrayBuffer, draw]);

  return (
    <div className="App">
      <Canvas ref={canvasRef} />
      <ActionBar
        arrayBuffer={arrayBuffer}
        setArrayBuffer={setArrayBuffer}
        playAudio={playAudio}
      />
    </div>
  );
}

export default App;
