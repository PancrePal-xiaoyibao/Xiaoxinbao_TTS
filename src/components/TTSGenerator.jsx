import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Square, Download, Settings, Volume2, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

const TTSGenerator = () => {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('zh-CN-XiaoxiaoNeural');
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [duration, setDuration] = useState(0);
  const [filename, setFilename] = useState('');
  const [voices, setVoices] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchVoices();
    loadSavedSettings();
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      
      const handleLoadedMetadata = () => {
        setDuration(audio.duration || 0);
      };
      
      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
      };
      
      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleEnded);

      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [audioUrl]);

  const fetchVoices = async () => {
    try {
      const response = await fetch('/api/tts/voices');
      const data = await response.json();
      if (data.success) {
        setVoices(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch voices:', error);
      toast.error('获取语音列表失败');
    }
  };

  const loadSavedSettings = () => {
    const saved = localStorage.getItem('ttsSettings');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        setVoice(settings.voice || 'zh-CN-XiaoxiaoNeural');
        setRate(settings.rate || 1.0);
        setPitch(settings.pitch || 1.0);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  };

  const saveSettings = () => {
    const settings = { voice, rate, pitch };
    localStorage.setItem('ttsSettings', JSON.stringify(settings));
  };

  const generateTTS = async () => {
    if (!text.trim()) {
      toast.error('请输入要转换的文本');
      return;
    }

    setIsGenerating(true);
    saveSettings();

    try {
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          voice,
          rate,
          pitch
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setAudioUrl(data.data.url);
        setDuration(data.data.duration);
        setFilename(data.data.filename);
        toast.success('音频生成成功！');
      } else {
        toast.error(data.error || '音频生成失败');
      }
    } catch (error) {
      console.error('TTS generation error:', error);
      toast.error('网络错误，请稍后重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `tts-${Date.now()}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setText(e.target.result);
        toast.success('文件导入成功');
      };
      reader.readAsText(file);
    } else {
      toast.error('请选择文本文件');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRateChange = (newRate) => {
    setRate(Math.round(newRate * 100) / 100);
  };

  const handlePitchChange = (newPitch) => {
    setPitch(Math.round(newPitch * 100) / 100);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">文字转语音生成器</h1>
        <p className="text-gray-600">输入文本，选择语音参数，生成高质量语音</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：文本输入和设置 */}
        <div className="space-y-6">
          {/* 文本输入 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              输入文本
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="请输入要转换为语音的文本..."
              className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              maxLength={1000}
            />
            <div className="text-right text-sm text-gray-500 mt-1">
              {text.length}/1000
            </div>
          </div>

          {/* 文件上传 */}
          <div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              或上传文本文件
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* 语音选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择语音
            </label>
            <select
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              {voices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.gender === 'female' ? '女声' : '男声'})
                </option>
              ))}
            </select>
          </div>

          {/* 语速和音调控制 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                语速: {rate.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={rate}
                onChange={(e) => handleRateChange(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                音调: {pitch.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={pitch}
                onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {/* 生成按钮 */}
          <button
            onClick={generateTTS}
            disabled={isGenerating || !text.trim()}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Volume2 className="w-5 h-5" />
                生成语音
              </>
            )}
          </button>
        </div>

        {/* 右侧：音频播放和控制 */}
        <div className="space-y-6">
          {audioUrl && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">音频播放器</h3>
              
              {/* 音频元素 */}
              <audio ref={audioRef} src={audioUrl} className="hidden" />
              
              {/* 进度条 */}
              <div className="mb-4">
                <div className="bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* 播放控制 */}
              <div className="flex justify-center gap-4 mb-4">
                <button
                  onClick={handlePlayPause}
                  className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                
                <button
                  onClick={handleStop}
                  className="p-3 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors"
                >
                  <Square className="w-5 h-5" />
                </button>
                
                <button
                  onClick={handleDownload}
                  className="p-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>

              {/* 文件信息 */}
              <div className="text-sm text-gray-600 space-y-1">
                <p>文件名: {filename}</p>
                <p>时长: {formatTime(duration)}</p>
                <p>语音: {voice}</p>
              </div>
            </div>
          )}

          {!audioUrl && (
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <Volume2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">输入文本并点击"生成语音"开始</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TTSGenerator;