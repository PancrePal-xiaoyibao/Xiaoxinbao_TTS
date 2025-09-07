class TTSManager {
    constructor() {
        this.synthesis = null;
        this.voices = [];
        this.currentVoice = null;
        this.isPlaying = false;
        this.audioQueue = [];
        this.currentUtterance = null;
        
        this.init();
    }

    async init() {
        if ('speechSynthesis' in window) {
            this.synthesis = window.speechSynthesis;
            await this.loadVoices();
            this.setupEventListeners();
            this.updateUI();
        } else {
            this.showError('您的浏览器不支持语音合成功能');
        }
    }

    async loadVoices() {
        return new Promise((resolve) => {
            const loadVoices = () => {
                this.voices = this.synthesis.getVoices();
                
                // 过滤中文语音
                this.chineseVoices = this.voices.filter(voice => 
                    voice.lang.startsWith('zh') || voice.lang.includes('CN')
                );
                
                if (this.chineseVoices.length > 0) {
                    this.currentVoice = this.chineseVoices[0];
                }
                
                this.populateVoiceList();
                resolve();
            };

            if (this.synthesis.getVoices().length > 0) {
                loadVoices();
            } else {
                this.synthesis.addEventListener('voiceschanged', loadVoices);
            }
        });
    }

    populateVoiceList() {
        const voiceSelect = document.getElementById('voiceSelect');
        if (!voiceSelect) return;

        voiceSelect.innerHTML = '';
        
        this.chineseVoices.forEach((voice, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${voice.name} (${voice.lang})`;
            voiceSelect.appendChild(option);
        });

        if (this.currentVoice) {
            const index = this.chineseVoices.findIndex(v => v.name === this.currentVoice.name);
            if (index !== -1) {
                voiceSelect.value = index;
            }
        }
    }

    setupEventListeners() {
        // 播放按钮
        const playBtn = document.getElementById('playBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const stopBtn = document.getElementById('stopBtn');
        const voiceSelect = document.getElementById('voiceSelect');
        const speedSlider = document.getElementById('speedSlider');
        const pitchSlider = document.getElementById('pitchSlider');
        const volumeSlider = document.getElementById('volumeSlider');

        if (playBtn) {
            playBtn.addEventListener('click', () => this.play());
        }

        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.pause());
        }

        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stop());
        }

        if (voiceSelect) {
            voiceSelect.addEventListener('change', (e) => {
                const index = parseInt(e.target.value);
                this.currentVoice = this.chineseVoices[index];
            });
        }

        // 监听合成状态变化
        this.synthesis.addEventListener('start', () => {
            this.isPlaying = true;
            this.updateUI();
        });

        this.synthesis.addEventListener('end', () => {
            this.isPlaying = false;
            this.updateUI();
            this.processQueue();
        });

        this.synthesis.addEventListener('error', (e) => {
            console.error('语音合成错误:', e);
            this.isPlaying = false;
            this.updateUI();
            this.showError('语音合成失败，请重试');
        });
    }

    async play() {
        const textInput = document.getElementById('textInput');
        const text = textInput?.value.trim();

        if (!text) {
            this.showError('请输入要合成的文本');
            return;
        }

        if (!this.currentVoice) {
            this.showError('请先选择语音');
            return;
        }

        // 停止当前播放
        this.stop();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = this.currentVoice;
        utterance.rate = parseFloat(document.getElementById('speedSlider')?.value || 1);
        utterance.pitch = parseFloat(document.getElementById('pitchSlider')?.value || 1);
        utterance.volume = parseFloat(document.getElementById('volumeSlider')?.value || 1);

        // 设置语言
        utterance.lang = this.currentVoice.lang;

        this.currentUtterance = utterance;
        this.synthesis.speak(utterance);
    }

    pause() {
        if (this.synthesis.speaking) {
            if (this.synthesis.paused) {
                this.synthesis.resume();
            } else {
                this.synthesis.pause();
            }
            this.updateUI();
        }
    }

    stop() {
        this.synthesis.cancel();
        this.isPlaying = false;
        this.audioQueue = [];
        this.updateUI();
    }

    processQueue() {
        if (this.audioQueue.length > 0 && !this.isPlaying) {
            const nextText = this.audioQueue.shift();
            this.playText(nextText);
        }
    }

    playText(text) {
        if (!this.currentVoice) return;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = this.currentVoice;
        utterance.rate = parseFloat(document.getElementById('speedSlider')?.value || 1);
        utterance.pitch = parseFloat(document.getElementById('pitchSlider')?.value || 1);
        utterance.volume = parseFloat(document.getElementById('volumeSlider')?.value || 1);

        this.currentUtterance = utterance;
        this.synthesis.speak(utterance);
    }

    updateUI() {
        const playBtn = document.getElementById('playBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const stopBtn = document.getElementById('stopBtn');
        const statusText = document.getElementById('statusText');

        if (playBtn) {
            playBtn.disabled = this.isPlaying;
        }

        if (pauseBtn) {
            pauseBtn.disabled = !this.isPlaying;
        }

        if (stopBtn) {
            stopBtn.disabled = !this.isPlaying && this.audioQueue.length === 0;
        }

        if (statusText) {
            if (this.isPlaying) {
                statusText.textContent = '正在播放...';
                statusText.className = 'status playing';
            } else if (this.synthesis?.paused) {
                statusText.textContent = '已暂停';
                statusText.className = 'status paused';
            } else {
                statusText.textContent = '就绪';
                statusText.className = 'status ready';
            }
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 3000);
        }
    }

    // 批量处理文本
    async batchProcess(texts) {
        if (!Array.isArray(texts)) {
            texts = [texts];
        }

        this.audioQueue = [...texts];
        this.processQueue();
    }

    // 获取当前状态
    getStatus() {
        return {
            isPlaying: this.isPlaying,
            isPaused: this.synthesis?.paused || false,
            queueLength: this.audioQueue.length,
            currentVoice: this.currentVoice?.name || null,
            voices: this.chineseVoices.length
        };
    }
}

// 初始化TTS管理器
document.addEventListener('DOMContentLoaded', () => {
    window.ttsManager = new TTSManager();
});