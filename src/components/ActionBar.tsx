import { useEffect, useRef, useState } from 'react';
import './ActionBar.scss';

const ActionBar: React.FC<{
  audioCtxState: 'closed' | 'running' | 'suspended' | undefined;
  audioStarted: boolean;
  arrayBuffer: ArrayBuffer | null;
  setArrayBuffer: React.Dispatch<React.SetStateAction<ArrayBuffer | null>>;
  togglePlayStatus: () => void;
}> = ({ audioCtxState, audioStarted, arrayBuffer, setArrayBuffer, togglePlayStatus }) => {
  const InputRef = useRef<HTMLInputElement>(null);
  const fileReaderRef = useRef<FileReader>(new FileReader());
  const [file, setFile] = useState<File | null>(null);
  const [playButtonText, setPlayButtonText] = useState<string>('');

  useEffect(() => {
    if (!audioStarted || (audioStarted && audioCtxState === 'suspended')) {
      setPlayButtonText('播放');
    } else if (audioCtxState === 'running') {
      setPlayButtonText('暂停');
    }
  }, [audioCtxState, audioStarted]);

  useEffect(() => {
    fileReaderRef.current.onload = function () {
      // 将读取到的 File 转为 ArrayBuffer
      const result = fileReaderRef.current.result;
      if (result instanceof ArrayBuffer) {
        setArrayBuffer(result);
      }
    };
  }, [setArrayBuffer]);

  /** 处理文件上传 */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const newFile = e.target.files[0];
      if (!newFile.type.startsWith('audio')) {
        alert('请上传音频文件');
      } else {
        console.log('音频文件：', newFile);
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

  return (
    <div className="action-bar">
      <input
        type="file"
        accept="audio/*"
        onChange={handleInputChange}
        ref={InputRef}
        style={{ display: 'none' }}
      />
      <button onClick={() => InputRef.current?.click()}>
        <img className="icon" src="img/add.svg" alt="选择音乐" />
        选择音乐
      </button>
      {arrayBuffer && (
        <button onClick={() => togglePlayStatus()}>
          {playButtonText === '播放' ? (
            <img className="icon" src="img/play.svg" alt="播放" />
          ) : (
            <img className="icon" src="img/pause.svg" alt="暂停" />
          )}
          {playButtonText}
        </button>
      )}
    </div>
  );
};

export default ActionBar;
