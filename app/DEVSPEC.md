# App模块 DEVSPEC.md

## 模块概述
App模块是mistake_note项目的API网关和业务编排层，基于FastAPI/Gradio构建，负责统一API接口、请求路由、鉴权、限流和业务逻辑编排。

## 职责范围
- REST API网关和请求路由
- 业务逻辑编排和流程控制
- 鉴权和权限管理
- 速率限制和流量控制
- 日志记录和错误处理
- 外部服务调用协调

## 核心API接口

### 摄像头相关接口
**`POST /camera/frame`**
- **功能**：接收抽帧图像并进行处理
- **参数**：`frame`（图像数据）, `roi`（可选，感兴趣区域）
- **流程**：预处理 → OCR → 引导生成
- **响应**：处理结果和引导建议

**实现细节**：
```python
@app.post("/camera/frame")
async def process_camera_frame(frame: UploadFile, roi: Optional[str] = None):
    """处理摄像头帧数据"""
    # 1. 图像预处理
    processed_frame = await vision_preprocess(frame, roi)
    
    # 2. OCR识别
    ocr_result = await baidu_ocr(processed_frame)
    
    # 3. 生成引导建议
    guidance = await guidance_engine(ocr_result.text)
    
    return {
        "processed_image": processed_frame.url,
        "ocr_text": ocr_result.text,
        "guidance": guidance,
        "timestamp": datetime.now()
    }
```

### 语音相关接口
**`POST /voice/asr`**
- **功能**：语音识别（百度ATR）
- **参数**：`audio`（音频数据）
- **流程**：音频预处理 → ASR识别 → 结果规整
- **响应**：转写文本和置信度

**`POST /voice/tts`**
- **功能**：语音合成（百度TTS）
- **参数**：`text`（合成文本）, `speed`（语速）, `voice`（人声）
- **响应**：音频文件URL

### 图片上传接口
**`POST /upload/image`**
- **功能**：接收上传的图片文件并进行处理
- **参数**：`image`（图片文件）, `mode`（OCR模式，可选）
- **流程**：文件验证 → 保存到媒体目录 → OCR识别 → 引导生成
- **响应**：处理结果和引导建议

### OCR接口
**`POST /ocr/run`**
- **功能**：图像OCR识别
- **参数**：`image`（图像数据）, `mode`（识别模式）
- **策略**：手写优先 → 公式回退 → 通用回退
- **响应**：识别文本和置信度

### 引导接口
**`POST /guidance`**
- **功能**：生成引导建议
- **参数**：`ocr_text`, `voice_transcript`, `mode`（template/llm）
- **策略**：模板优先 → LLM增强
- **约束**：强制"不直答"策略

### 存储接口
**`POST /ingest/mistake_card`**
- **功能**：保存错题卡
- **参数**：完整的MistakeCard数据
- **流程**：数据验证 → 媒体存储 → 数据库写入 → 向量索引

### 检索接口
**`GET /search/similar`**
- **功能**：相似题检索
- **参数**：`query`（查询文本）, `top_k`（返回数量）
- **流程**：向量生成 → 相似度计算 → 结果排序

**`GET /search/same-error`**
- **功能**：同错因检索
- **参数**：`error_type`（错因类型）
- **流程**：错因向量检索 → 结果过滤

### 导出接口
**`POST /export/learning_sheet`**
- **功能**：生成学习单
- **参数**：`card_id`（错题卡ID）
- **流程**：数据收集 → 模板渲染 → PDF生成

## 业务编排逻辑

### 最小闭环流程
```python
async def minimal_pipeline(frame_data, roi=None):
    """最小闭环流程：摄像头 → OCR → 引导 → 入库 → 检索"""
    
    # 1. 图像预处理和OCR
    ocr_text = await process_image_to_text(frame_data, roi)
    
    # 2. 生成引导建议
    guidance = await generate_guidance(ocr_text)
    
    # 3. 构建错题卡
    card = await build_mistake_card(ocr_text, guidance)
    
    # 4. 保存到存储
    saved_card = await save_mistake_card(card)
    
    # 5. 生成向量索引
    await index_card_embeddings(saved_card)
    
    # 6. 检索相似题
    similar_cards = await search_similar_cards(ocr_text)
    
    return {
        "card": saved_card,
        "guidance": guidance,
        "similar_cards": similar_cards
    }
```

### 错误处理和重试机制
```python
class RetryPolicy:
    """重试策略配置"""
    MAX_RETRIES = 3
    BACKOFF_FACTOR = 2
    TIMEOUT = 30
    
    @classmethod
    async def with_retry(cls, coro, description=""):
        """带重试的执行"""
        for attempt in range(cls.MAX_RETRIES):
            try:
                return await asyncio.wait_for(coro, timeout=cls.TIMEOUT)
            except (TimeoutError, ConnectionError) as e:
                if attempt == cls.MAX_RETRIES - 1:
                    raise
                await asyncio.sleep(cls.BACKOFF_FACTOR ** attempt)
```

## 配置管理

### 环境变量配置
```python
class Config:
    """应用配置"""
    BAIDU_OCR_KEY: str = os.getenv("BAIDU_OCR_KEY")
    BAIDU_ASR_KEY: str = os.getenv("BAIDU_ASR_KEY") 
    BAIDU_TTS_KEY: str = os.getenv("BAIDU_TTS_KEY")
    LLM_API_KEY: str = os.getenv("LLM_API_KEY")
    
    # 性能配置
    FRAME_INTERVAL: int = 2  # 抽帧间隔（秒）
    MAX_FRAME_SIZE: int = 720  # 最大帧尺寸
    OCR_QPS_LIMIT: float = 0.7  # OCR QPS限制
    
    # 业务配置
    GUIDANCE_MODE: str = "template"  # 引导模式
    TTS_ENABLED: bool = True  # TTS开关
```

### 中间件配置
```python
# 速率限制中间件
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """速率限制中间件"""
    # 实现基于IP和端点的限流
    
# 日志中间件  
@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    """请求日志中间件"""
    # 结构化日志记录
```

## 使用示例

### 基本API调用
```python
import requests

# OCR识别
response = requests.post(
    "http://localhost:8000/ocr/run",
    files={"image": open("problem.jpg", "rb")},
    data={"mode": "handwriting"}
)

# 引导生成
guidance_response = requests.post(
    "http://localhost:8000/guidance",
    json={
        "ocr_text": "已知2x+3=11，求x",
        "mode": "llm"
    }
)

# 相似题检索
search_response = requests.get(
    "http://localhost:8000/search/similar",
    params={"query": "一次方程求解"}
)
```

### 错误处理示例
```python
try:
    response = requests.post("/camera/frame", data=frame_data, timeout=30)
    response.raise_for_status()
    return response.json()
except requests.exceptions.RequestException as e:
    logger.error(f"API调用失败: {e}")
    return {"error": "处理失败，请重试"}
```

## 性能优化

### 异步处理
```python
@app.post("/batch/process")
async def batch_process(frames: List[UploadFile]):
    """批量处理接口"""
    tasks = [process_single_frame(frame) for frame in frames]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return {"results": results}
```

### 缓存策略
```python
from functools import lru_cache

@lru_cache(maxsize=1000)
async def cached_ocr(image_hash: str, image_data: bytes):
    """带缓存的OCR调用"""
    # 实现基于图像哈希的缓存
```

## 监控和指标

### 健康检查
```python
@app.get("/health")
async def health_check():
    """健康检查接口"""
    return {
        "status": "healthy",
        "timestamp": datetime.now(),
        "version": "1.0.0"
    }
```

### 性能指标
```python
@app.get("/metrics")
async def get_metrics():
    """性能指标接口"""
    return {
        "ocr_calls": metrics.ocr_calls,
        "asr_calls": metrics.asr_calls,
        "average_latency": metrics.avg_latency,
        "cache_hit_rate": metrics.cache_hit_rate
    }
```

## 测试要点
- API接口功能测试
- 错误场景处理测试
- 性能压测和限流测试
- 集成测试和端到端测试
- 安全性和权限测试
