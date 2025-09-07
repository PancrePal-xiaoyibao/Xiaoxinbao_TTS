// AI语音助手前端应用逻辑
class VoiceAssistant {
    constructor() {
        this.isRecording = false;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.voiceBtn = document.getElementById('voiceBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.statusIndicator = document.getElementById('statusIndicator');
        this.voiceIndicator = document.getElementById('voiceIndicator');
        
        this.init();
    }
    
    init() {
        // 初始化语音识别
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'zh-CN';
            
            this.recognition.onstart = () => {
                this.isRecording = true;
                this.updateUI();
            };
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.messageInput.value = transcript;
                this.sendMessage();
            };
            
            this.recognition.onerror = (event) => {
                console.error('语音识别错误:', event.error);
                this.updateStatus('语音识别出错，请重试', 'error');
                this.stopRecording();
            };
            
            this.recognition.onend = () => {
                this.stopRecording();
            };
        } else {
            this.updateStatus('浏览器不支持语音识别', 'error');
            this.voiceBtn.disabled = true;
        }
        
        // 绑定事件
        this.voiceBtn.addEventListener('click', () => this.startRecording());
        this.stopBtn.addEventListener('click', () => this.stopRecording());
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
        
        // 输入框状态监听
        this.messageInput.addEventListener('input', () => {
            this.sendBtn.disabled = !this.messageInput.value.trim();
        });
    }
    
    startRecording() {
        if (this.recognition && !this.isRecording) {
            this.recognition.start();
            this.updateStatus('正在聆听...', 'recording');
        }
    }
    
    stopRecording() {
        if (this.recognition && this.isRecording) {
            this.recognition.stop();
        }
        this.isRecording = false;
        this.updateUI();
        this.updateStatus('就绪', 'ready');
    }
    
    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;
        
        // 添加用户消息到聊天界面
        this.addMessage(message, 'user');
        this.messageInput.value = '';
        this.sendBtn.disabled = true;
        
        // 更新状态
        this.updateStatus('正在思考...', 'thinking');
        
        try {
            // 调用后端API
            const response = await fetch('/api/chat/completion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            const aiResponse = data.response || '抱歉，我现在无法回复您。';
            
            // 添加AI回复到聊天界面
            this.addMessage(aiResponse, 'ai');
            
            // 语音合成
            this.speak(aiResponse);
            
            this.updateStatus('就绪', 'ready');
            
        } catch (error) {
            console.error('API调用错误:', error);
            const errorMessage = '抱歉，服务暂时不可用，请稍后再试。';
            this.addMessage(errorMessage, 'ai');
            this.updateStatus('服务错误', 'error');
        }
    }
    
    addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.innerHTML = `<p>${this.escapeHtml(content)}</p>`;
        
        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = new Date().toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(messageTime);
        
        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    speak(text) {
        if (this.synthesis) {
            // 取消之前的语音
            this.synthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'zh-CN';
            utterance.rate = 0.9;
            utterance.pitch = 1;
            
            utterance.onstart = () => {
                this.updateStatus('正在播放语音...', 'speaking');
            };
            
            utterance.onend = () => {
                this.updateStatus('就绪', 'ready');
            };
            
            utterance.onerror = () => {
                console.error('语音合成错误');
                this.updateStatus('就绪', 'ready');
            };
            
            this.synthesis.speak(utterance);
        }
    }
    
    updateStatus(text, type = 'ready') {
        const statusText = this.statusIndicator.querySelector('.status-text');
        statusText.textContent = text;
        
        // 更新状态样式
        this.statusIndicator.className = 'status-indicator';
        if (type === 'error') {
            this.statusIndicator.classList.add('error');
        } else if (type === 'recording') {
            this.statusIndicator.classList.add('recording');
        } else if (type === 'thinking') {
            this.statusIndicator.classList.add('thinking');
        } else if (type === 'speaking') {
            this.statusIndicator.classList.add('speaking');
        }
    }
    
    updateUI() {
        if (this.isRecording) {
            this.voiceBtn.style.display = 'none';
            this.stopBtn.style.display = 'block';
            this.voiceIndicator.style.display = 'block';
        } else {
            this.voiceBtn.style.display = 'block';
            this.stopBtn.style.display = 'none';
            this.voiceIndicator.style.display = 'none';
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new VoiceAssistant();
});