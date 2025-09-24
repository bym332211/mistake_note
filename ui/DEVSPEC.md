# UI模块 DEVSPEC.md

## 模块概述
UI模块是mistake_note项目的前端交互层，基于Gradio/WebRTC构建，负责用户界面展示、摄像头/麦克风权限管理、状态提示和结果展示。

## 职责范围
- 摄像头按需开启/关闭控制
- 麦克风录音控制与状态管理
- 预处理图像快照显示
- 引导建议展示与音频播放
- 错题卡保存、检索和导出操作界面
- 用户交互状态提示（Toast、进度条等）

## 核心组件

### CameraController
**功能**：摄像头流管理
- 开启/关闭视频流
- 浏览器权限申请（WebRTC）
- ROI区域选择框
- 预处理图像快照显示
- 资源释放管理

**实现细节**：
```python
class CameraController:
    def __init__(self):
        self.is_active = False
        self.permission_granted = False
        self.stream = None
        
    def request_permission(self):
        """请求摄像头权限"""
        # WebRTC权限申请逻辑
        
    def start_stream(self):
        """开启视频流"""
        
    def stop_stream(self):
        """停止视频流并释放资源"""
        
    def capture_frame(self):
        """捕获当前帧"""
        
    def select_roi(self, frame):
        """选择感兴趣区域"""
```

### MicController
**功能**：麦克风录音管理
- 录音开始/结束控制
- 静音检测与超时处理
- 音频数据预处理
- ASR请求发起

**实现细节**：
```python
class MicController:
    def __init__(self):
        self.is_recording = False
        self.audio_buffer = []
        
    def start_recording(self):
        """开始录音"""
        
    def stop_recording(self):
        """停止录音并返回音频数据"""
        
    def detect_silence(self, audio_data):
        """静音检测"""
        
    def preprocess_audio(self, audio_data):
        """音频预处理"""
```

### GuidancePanel
**功能**：引导建议展示
- 文本引导建议显示
- TTS音频播放控制
- 检查清单展示
- 模式切换（静音/文字/文字+语音）

**实现细节**：
```python
class GuidancePanel:
    def __init__(self):
        self.current_hints = []
        self.checklist = []
        self.tts_enabled = True
        
    def display_hints(self, hints):
        """显示引导建议"""
        
    def play_audio(self, audio_url):
        """播放TTS音频"""
        
    def toggle_tts(self):
        """切换TTS模式"""
```

### StorageActions
**功能**：存储操作界面
- 错题卡保存按钮
- 相似题检索界面
- 学习单导出下载
- 数据管理操作

## API接口调用
UI模块通过HTTP调用后端API：

| 接口 | 方法 | 参数 | 说明 |
|------|------|------|------|
| `/camera/frame` | POST | frame图像数据 | 上传抽帧图像 |
| `/voice/asr` | POST | audio音频数据 | 语音识别 |
| `/voice/tts` | POST | text文本 | 语音合成 |
| `/ocr/run` | POST | image图像 | OCR识别 |
| `/guidance` | POST | ocr_text, voice_transcript | 获取引导建议 |
| `/ingest/mistake_card` | POST | mistake_card数据 | 保存错题卡 |
| `/search/similar` | GET | query文本 | 相似题检索 |
| `/export/learning_sheet` | POST | card_id | 导出学习单 |

## 使用示例

### 基本摄像头使用
```python
# 初始化摄像头控制器
camera = CameraController()

# 请求权限并开启摄像头
if camera.request_permission():
    camera.start_stream()
    
# 捕获帧并上传处理
frame = camera.capture_frame()
response = requests.post('/camera/frame', data=frame)

# 关闭摄像头
camera.stop_stream()
```

### 语音功能使用
```python
# 初始化麦克风控制器
mic = MicController()

# 开始录音
mic.start_recording()

# 停止录音并发送ASR请求
audio_data = mic.stop_recording()
asr_result = requests.post('/voice/asr', data=audio_data)

# 播放TTS音频
tts_response = requests.post('/voice/tts', json={'text': '引导建议文本'})
audio_player.play(tts_response.audio_url)
```

### 错题卡操作
```python
# 保存错题卡
save_response = requests.post('/ingest/mistake_card', json=card_data)

# 检索相似题
search_response = requests.get('/search/similar', params={'query': '题目文本'})

# 导出学习单
export_response = requests.post('/export/learning_sheet', json={'card_id': card_id})
```

## 配置参数
- `camera_resolution`: 摄像头分辨率设置（默认720p）
- `frame_interval`: 抽帧间隔（默认1-2秒）
- `tts_enabled`: TTS功能开关
- `auto_save`: 自动保存设置
- `privacy_mode`: 隐私模式设置

## 错误处理
- 权限拒绝时的友好提示
- 网络异常的重试机制
- 资源不足的降级处理
- 用户操作的确认对话框

## 性能优化
- 图像压缩上传
- 音频流式处理
- 本地缓存机制
- 懒加载组件

## 测试要点
- 摄像头权限测试
- 音频录制质量测试
- 界面响应性测试
- 错误场景处理测试
- 跨浏览器兼容性测试
