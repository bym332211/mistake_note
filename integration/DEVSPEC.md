# Integration模块 DEVSPEC.md

## 模块概述
Integration模块是mistake_note项目的外部服务适配层，负责与第三方API解耦，提供稳定的接口封装、重试机制、错误处理和性能监控。

## 职责范围
- 百度OCR API封装和适配
- 百度ASR（ATR）语音识别服务集成
- 百度TTS语音合成服务集成
- LLM服务网关和协议适配
- 离线OCR兜底方案（可选）
- 重试策略和退避机制实现
- 速率限制和配额管理

## 核心组件

### baidu_ocr（百度OCR服务）
**功能**：图像文字识别，支持手写、公式、通用等多种模式

**实现细节**：
```python
class BaiduOCRClient:
    def __init__(self, api_key, secret_key):
        self.client = AipOcr(api_key, secret_key)
        self.retry_policy = RetryPolicy(max_retries=3, backoff_factor=2)
        
    async def recognize(self, image_data, mode="handwriting"):
        """OCR识别主方法"""
        # 模式优先级：手写 → 公式 → 通用
        modes = self._get_mode_priority(mode)
        
        for current_mode in modes:
            try:
                result = await self._recognize_with_mode(image_data, current_mode)
                if result and self._is_valid_result(result):
                    return OCRResult(
                        text=result.get('words_result', [{}])[0].get('words', ''),
                        confidence=result.get('words_result', [{}])[0].get('probability', 0),
                        mode=current_mode,
                        raw_result=result
                    )
            except (BaiduOCRError, TimeoutError) as e:
                logger.warning(f"OCR模式{current_mode}失败: {e}")
                continue
                
        raise OCRServiceError("所有OCR模式均失败")
    
    def _get_mode_priority(self, preferred_mode):
        """获取模式优先级列表"""
        priorities = {
            "handwriting": ["handwriting", "formula", "general"],
            "formula": ["formula", "handwriting", "general"], 
            "general": ["general", "handwriting", "formula"]
        }
        return priorities.get(preferred_mode, ["handwriting", "formula", "general"])
    
    async def _recognize_with_mode(self, image_data, mode):
        """使用特定模式进行识别"""
        options = self._get_mode_options(mode)
        
        # 带重试的API调用
        return await self.retry_policy.execute(
            lambda: self.client.basicGeneral(image_data, options)
        )
    
    def _get_mode_options(self, mode):
        """获取模式特定参数"""
        options = {
            "handwriting": {"recognize_granularity": "big", "language_type": "CHN_ENG"},
            "formula": {"recognize_granularity": "big"},
            "general": {"language_type": "CHN_ENG", "detect_direction": True}
        }
        return options.get(mode, {})
    
    def _is_valid_result(self, result):
        """验证OCR结果有效性"""
        words_result = result.get('words_result', [])
        return bool(words_result and words_result[0].get('words', '').strip())
```

### baidu_asr（百度语音识别）
**功能**：语音转文本，支持实时流式和文件识别

**实现细节**：
```python
class BaiduASRClient:
    def __init__(self, api_key, secret_key):
        self.client = AipSpeech(api_key, secret_key)
        self.silence_detector = SilenceDetector()
        
    async def recognize(self, audio_data, format='wav', rate=16000):
        """语音识别"""
        try:
            # 静音检测和截断
            processed_audio = await self._preprocess_audio(audio_data)
            
            result = await self.retry_policy.execute(
                lambda: self.client.asr(processed_audio, format, rate, {'dev_pid': 1537})  # 普通话模型
            )
            
            return self._parse_asr_result(result)
            
        except Exception as e:
            logger.error(f"ASR识别失败: {e}")
            raise ASRServiceError(f"语音识别失败: {e}")
    
    async def _preprocess_audio(self, audio_data):
        """音频预处理"""
        # 1. 静音检测和截断
        trimmed_audio = await self.silence_detector.trim_silence(audio_data)
        
        # 2. 音量归一化
        normalized_audio = await self._normalize_volume(trimmed_audio)
        
        # 3. 格式转换（如果需要）
        return await self._convert_format(normalized_audio)
    
    def _parse_asr_result(self, result):
        """解析ASR结果"""
        if result.get('err_no') == 0:
            return ASRResult(
                text=result.get('result', [''])[0],
                confidence=result.get('result', [{}])[0].get('confidence', 0),
                raw_result=result
            )
        else:
            raise ASRServiceError(f"ASR错误: {result.get('err_msg', '未知错误')}")
```

### baidu_tts（百度语音合成）
**功能**：文本转语音，支持多种音色和语速

**实现细节**：
```python
class BaiduTTSClient:
    def __init__(self, api_key, secret_key):
        self.client = AipSpeech(api_key, secret_key)
        
    async def synthesize(self, text, voice=0, speed=5, pitch=5, volume=5):
        """语音合成"""
        try:
            # 文本长度限制检查
            if len(text) > 1024:
                text = text[:1020] + "..."
                
            result = await self.retry_policy.execute(
                lambda: self.client.synthesis(
                    text, 'zh', 1, {
                        'vol': volume,
                        'spd': speed,
                        'pit': pitch,
                        'per': voice
                    }
                )
            )
            
            return self._save_audio_result(result)
            
        except Exception as e:
            logger.error(f"TTS合成失败: {e}")
            raise TTSServiceError(f"语音合成失败: {e}")
    
    def _save_audio_result(self, result):
        """保存音频结果"""
        if isinstance(result, dict):
            raise TTSServiceError(f"TTS错误: {result.get('err_msg', '未知错误')}")
        
        # 生成唯一文件名
        filename = f"tts_{int(time.time())}_{hash(text)}.mp3"
        filepath = os.path.join(MEDIA_DIR, 'tts', filename)
        
        # 确保目录存在
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        # 保存音频文件
        with open(filepath, 'wb') as f:
            f.write(result)
            
        return TTSResult(audio_url=f"/media/tts/{filename}", filepath=filepath)
```

### llm_client（LLM服务网关）
**功能**：统一的LLM服务接口，支持多种后端和输出格式

**实现细节**：
```python
class LLMClient:
    def __init__(self, api_key, base_url=None, model="gpt-3.5-turbo"):
        self.api_key = api_key
        self.base_url = base_url or "https://api.openai.com/v1"
        self.model = model
        
    async def generate(self, prompt, temperature=0.7, max_tokens=1000):
        """生成文本"""
        try:
            response = await self._make_request({
                "model": self.model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": temperature,
                "max_tokens": max_tokens
            })
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"LLM生成失败: {e}")
            raise LLMServiceError(f"LLM服务错误: {e}")
    
    async def generate_with_schema(self, prompt, schema, temperature=0.1):
        """带JSON Schema的生成"""
        try:
            response = await self._make_request({
                "model": self.model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": temperature,
                "response_format": {"type": "json_object"},
                "functions": [{
                    "name": "format_response",
                    "parameters": schema
                }],
                "function_call": {"name": "format_response"}
            })
            
            return json.loads(response.choices[0].message.function_call.arguments)
            
        except Exception as e:
            logger.error(f"LLM Schema生成失败: {e}")
            raise LLMServiceError(f"LLM Schema错误: {e}")
    
    async def _make_request(self, payload):
        """发起HTTP请求"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url}/chat/completions",
                json=payload,
                headers=headers,
                timeout=30
            ) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise LLMServiceError(f"HTTP {response.status}: {await response.text()}")
```

### paddle_ocr_fallback（离线OCR兜底）
**功能**：网络不可用时的离线OCR解决方案

**实现细节**：
```python
class PaddleOCRFallback:
    def __init__(self):
        try:
            from paddleocr import PaddleOCR
            self.ocr = PaddleOCR(use_angle_cls=True, lang='ch')
            self.available = True
        except ImportError:
            self.available = False
            logger.warning("PaddleOCR未安装，离线OCR不可用")
    
    async def recognize(self, image_data):
        """离线OCR识别"""
        if not self.available:
            raise OCRServiceError("离线OCR不可用")
            
        try:
            result = self.ocr.ocr(image_data, cls=True)
            text = ' '.join([line[1][0] for line in result[0] if line[1][1] > 0.5])
            
            return OCRResult(
                text=text,
                confidence=0.8,  # 离线识别置信度较低
                mode="offline",
                raw_result=result
            )
        except Exception as e:
            logger.error(f"离线OCR失败: {e}")
            raise OCRServiceError(f"离线OCR错误: {e}")
```

## 重试策略和错误处理

### RetryPolicy实现
```python
class RetryPolicy:
    def __init__(self, max_retries=3, backoff_factor=2, timeout=30):
        self.max_retries = max_retries
        self.backoff_factor = backoff_factor
        self.timeout = timeout
        
    async def execute(self, coro, description=""):
        """带重试的执行"""
        last_exception = None
        
        for attempt in range(self.max_retries):
            try:
                return await asyncio.wait_for(coro(), timeout=self.timeout)
            except (TimeoutError, ConnectionError, ServiceError) as e:
                last_exception = e
                logger.warning(f"第{attempt+1}次尝试失败: {e}")
                
                if attempt == self.max_retries - 1:
                    break
                    
                # 指数退避
                wait_time = self.backoff_factor ** attempt
                await asyncio.sleep(wait_time)
        
        raise last_exception or ServiceError(f"{description}执行失败")
```

### 错误类型定义
```python
class ServiceError(Exception):
    """服务错误基类"""
    pass

class OCRServiceError(ServiceError):
    """OCR服务错误"""
    pass

class ASRServiceError(ServiceError):
    """ASR服务错误"""
    pass

class TTSServiceError(ServiceError):
    """TTS服务错误"""
    pass

class LLMServiceError(ServiceError):
    """LLM服务错误"""
    pass
```

## 配置管理

### 服务配置
```python
class ServiceConfig:
    """服务配置类"""
    
    # 百度服务配置
    BAIDU_OCR_KEY: str = os.getenv("BAIDU_OCR_KEY")
    BAIDU_ASR_KEY: str = os.getenv("BAIDU_ASR_KEY")
    BAIDU_TTS_KEY: str = os.getenv("BAIDU_TTS_KEY")
    
    # LLM配置
    LLM_API_KEY: str = os.getenv("LLM_API_KEY")
    LLM_BASE_URL: str = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-3.5-turbo")
    
    # 性能配置
    OCR_TIMEOUT: int = 30
    ASR_TIMEOUT: int = 30
    TTS_TIMEOUT: int = 30
    LLM_TIMEOUT: int = 60
    
    # 重试配置
    MAX_RETRIES: int = 3
    BACKOFF_FACTOR: int = 2
```

## 使用示例

### OCR服务使用
```python
from integration.baidu_ocr import BaiduOCRClient

ocr_client = BaiduOCRClient(api_key="your_key", secret_key="your_secret")
result = await ocr_client.recognize(image_data, mode="handwriting")
print(f"识别结果: {result.text}")
```

### 语音服务使用
```python
from integration.baidu_asr import BaiduASRClient
from integration.baidu_tts import BaiduTTSClient

# 语音识别
asr_client = BaiduASRClient(api_key="your_key", secret_key="your_secret")
asr_result = await asr_client.recognize(audio_data)

# 语音合成
tts_client = BaiduTTSClient(api_key="your_key", secret_key="your_secret")
tts_result = await tts_client.synthesize("引导建议文本", voice=0, speed=5)
```

### LLM服务使用
```python
from integration.llm_client import LLMClient

llm_client = LLMClient(api_key="your_key")
response = await llm_client.generate("请生成引导建议...")

# 带Schema的生成
schema = {
    "type": "object",
    "properties": {
        "hints": {"type": "array", "items": {"type": "string"}},
        "checklist": {"type": "array", "items": {"type": "string"}}
    }
}
structured_response = await llm_client.generate_with_schema(prompt, schema)
```

## 性能监控

### 指标收集
```python
class ServiceMetrics:
    """服务指标收集"""
    
    def __init__(self):
        self.ocr_calls = 0
        self.asr_calls = 0
        self.tts_calls = 0
        self.llm_calls = 0
        self.success_rates = {}
        self.average_latencies = {}
    
    def record_call(self, service, success, latency):
        """记录调用指标"""
        # 更新调用计数、成功率、平均延迟等
```

## 测试要点
- API连通性测试
- 错误场景处理测试
- 重试机制验证测试
- 性能基准测试
- 离线兜底功能测试
