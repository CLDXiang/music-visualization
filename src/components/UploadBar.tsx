import { useEffect, useRef, useState } from "react";
import "./UploadBar.scss";

export default function UploadBar() {
  const InputRef = useRef<HTMLInputElement>(null);
  const fileReaderRef = useRef<FileReader>(new FileReader());
  const [file, setFile] = useState<File | null>(null);
  const [arrayBuffer, setArrayBuffer] = useState<ArrayBuffer | null>(null);

  useEffect(() => {
    fileReaderRef.current.onload = function () {
      // 将读取到的 File 转为 ArrayBuffer
      const result = fileReaderRef.current.result;
      if (result instanceof ArrayBuffer) {
        setArrayBuffer(result);
      }
    };
  }, []);

  /** 处理文件上传 */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const newFile = e.target.files[0];
      if (!newFile.type.startsWith("audio")) {
        alert("请上传音频文件");
      } else {
        console.log("音频文件：", newFile);
        setFile(newFile);
      }
    }
  };

  // file 变化时触发 fileReader
  useEffect(() => {
    if (file === null) {
      return;
    }
    fileReaderRef.current.readAsArrayBuffer(file);
  }, [file]);

  // arrayBuffer 变化时
  useEffect(() => {
    if (arrayBuffer === null) {
      return;
    }
    const audioCtx = new window.AudioContext();
    const analyser = audioCtx.createAnalyser();
    audioCtx.decodeAudioData(arrayBuffer).then((decodedData) => {
      console.log({ decodedData });
    });
  }, [arrayBuffer])

  return (
    <div className="upload-bar">
      <input
        type="file"
        accept="audio/*"
        onChange={handleInputChange}
        ref={InputRef}
        style={{ display: "none" }}
      />
      <button onClick={() => InputRef.current?.click()}>点我</button>
    </div>
  );
}
