# Platform模块 DEVSPEC.md

## 模块概述
Platform模块是mistake_note项目的平台与运维层，负责配置管理、日志记录、性能监控、评估测试和系统运维，确保系统的稳定性和可观测性。

## 职责范围
- 配置管理和环境变量处理
- 结构化日志记录和脱敏处理
- 速率限制和流量控制
- 性能指标收集和监控
- 评估脚本和基准测试
- 压力测试和性能优化

## 核心组件

### config（配置管理）
**功能**：统一的配置管理，支持环境变量、配置文件和多环境部署

**实现细节**：
```python
import os
from typing import Dict, Any, Optional
from pydantic import BaseSettings, validator

class AppConfig(BaseSettings):
    """应用配置类"""
    
    # 百度服务配置
    baidu_ocr_key: str
    baidu_ocr_secret: str
    baidu_asr_key: str  
    baidu_asr_secret: str
    baidu_tts_key: str
    baidu_tts_secret: str
    
    # LLM服务配置
    llm_api_key: str
    llm_base_url: str = "https://api.openai.com/v1"
    llm_model: str = "gpt-3.5-turbo"
    
    # 应用配置
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    debug: bool = False
    log_level: str = "INFO"
    
    # 性能配置
    frame_interval: int = 2  # 抽帧间隔（秒）
    max_frame_size: int = 720  # 最大帧尺寸
    ocr_qps_limit: float = 0.7  # OCR QPS限制
    cache_ttl: int = 3600  # 缓存过期时间（秒）
    
    # 业务配置
    guidance_mode: str = "template"  # 引导模式：template/llm
    tts_enabled: bool = True  # TTS功能开关
    auto_save: bool = False  # 自动保存开关
    privacy_mode: bool = True  # 隐私模式
    
    # 存储配置
    db_path: str = "./data/mistake_note.db"
    media_dir: str = "./media"
    vector_db_dir: str = "./data/vector_db"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
    
    @validator("log_level")
    def validate_log_level(cls, v):
        """验证日志级别"""
        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if v.upper() not in valid_levels:
            raise ValueError(f"日志级别必须是: {valid_levels}")
        return v.upper()
    
    @validator("frame_interval")
    def validate_frame_interval(cls, v):
        """验证抽帧间隔"""
        if v < 1 or v > 10:
            raise ValueError("抽帧间隔必须在1-10秒之间")
        return v

class ConfigManager:
    """配置管理器"""
    
    _instance: Optional[AppConfig] = None
    
    @classmethod
    def get_config(cls) -> AppConfig:
        """获取配置实例（单例模式）"""
        if cls._instance is None:
            cls._instance = AppConfig()
            cls._validate_required_keys()
        return cls._instance
    
    @classmethod
    def _validate_required_keys(cls):
        """验证必需配置项"""
        required_keys = [
            'baidu_ocr_key', 'baidu_ocr_secret',
            'baidu_asr_key', 'baidu_asr_secret', 
            'baidu_tts_key', 'baidu_tts_secret',
            'llm_api_key'
        ]
        
        missing_keys = []
        for key in required_keys:
            if not getattr(cls._instance, key):
                missing_keys.append(key)
        
        if missing_keys:
            raise ValueError(f"缺少必需配置项: {missing_keys}")
    
    @classmethod
    def reload_config(cls):
        """重新加载配置"""
        cls._instance = None
        return cls.get_config()
    
    @classmethod
    def get_safe_config(cls) -> Dict[str, Any]:
        """获取安全的配置（脱敏敏感信息）"""
        config = cls.get_config().dict()
        
        # 脱敏敏感信息
        sensitive_fields = ['key', 'secret', 'password', 'token']
        for field in config:
            if any(sensitive in field.lower() for sensitive in sensitive_fields):
                if config[field]:
                    config[field] = "***" + config[field][-4:] if len(config[field]) > 4 else "***"
        
        return config
```

### logging（日志管理）
**功能**：结构化日志记录，支持脱敏、分级和文件输出

**实现细节**：
```python
import logging
import json
import sys
from datetime import datetime
from typing import Dict, Any

class StructuredLogger:
    """结构化日志记录器"""
    
    def __init__(self, name: str, level: str = "INFO"):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(getattr(logging, level))
        
        # 避免重复添加处理器
        if not self.logger.handlers:
            self._setup_handlers()
    
    def _setup_handlers(self):
        """设置日志处理器"""
        # 控制台处理器
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(StructuredFormatter())
        self.logger.addHandler(console_handler)
        
        # 文件处理器
        file_handler = logging.FileHandler("./logs/app.log", encoding="utf-8")
        file_handler.setFormatter(StructuredFormatter())
        self.logger.addHandler(file_handler)
    
    def _sanitize_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """数据脱敏"""
        sanitized = data.copy()
        
        # 敏感字段脱敏
        sensitive_fields = ['key', 'secret', 'password', 'token', 'image_data', 'audio_data']
        for field in sanitized:
            if any(sensitive in field.lower() for sensitive in sensitive_fields):
                if sanitized[field]:
                    if isinstance(sanitized[field], str) and len(sanitized[field]) > 10:
                        sanitized[field] = sanitized[field][:10] + "..."
                    else:
                        sanitized[field] = "***"
        
        return sanitized
    
    def info(self, message: str, extra: Dict[str, Any] = None):
        """信息级别日志"""
        self._log(logging.INFO, message, extra)
    
    def warning(self, message: str, extra: Dict[str, Any] = None):
        """警告级别日志"""
        self._log(logging.WARNING, message, extra)
    
    def error(self, message: str, extra: Dict[str, Any] = None):
        """错误级别日志"""
        self._log(logging.ERROR, message, extra)
    
    def debug(self, message: str, extra: Dict[str, Any] = None):
        """调试级别日志"""
        self._log(logging.DEBUG, message, extra)
    
    def _log(self, level: int, message: str, extra: Dict[str, Any] = None):
        """通用日志方法"""
        log_data = {
            "timestamp": datetime.now().isoformat(),
            "level": logging.getLevelName(level),
            "message": message,
            "module": self.logger.name
        }
        
        if extra:
            log_data.update(self._sanitize_data(extra))
        
        self.logger.log(level, json.dumps(log_data, ensure_ascii=False))

class StructuredFormatter(logging.Formatter):
    """结构化日志格式化器"""
    
    def format(self, record):
        """格式化日志记录"""
        try:
            # 解析JSON日志
            log_data = json.loads(record.getMessage())
            return json.dumps(log_data, ensure_ascii=False, indent=2)
        except (json.JSONDecodeError, TypeError):
            # 非JSON日志，使用默认格式
            return super().format(record)

# 全局日志实例
app_logger = StructuredLogger("mistake_note")
pipeline_logger = StructuredLogger("pipeline")
api_logger = StructuredLogger("api")
```

### rate_limit（速率限制）
**功能**：API速率限制，防止滥用和保证系统稳定性

**实现细节**：
```python
import time
from typing import Dict, Tuple
from collections import defaultdict

class RateLimiter:
    """速率限制器"""
    
    def __init__(self):
        self.limits: Dict[str, Tuple[int, int]] = {}  # endpoint -> (requests, window_seconds)
        self.requests: Dict[str, list] = defaultdict(list)
    
    def set_limit(self, endpoint: str, max_requests: int, window_seconds: int):
        """设置速率限制"""
        self.limits[endpoint] = (max_requests, window_seconds)
    
    def is_allowed(self, endpoint: str, identifier: str) -> bool:
        """检查是否允许请求"""
        if endpoint not in self.limits:
            return True
        
        max_requests, window_seconds = self.limits[endpoint]
        key = f"{endpoint}:{identifier}"
        
        # 清理过期请求
        current_time = time.time()
        self.requests[key] = [
            req_time for req_time in self.requests[key] 
            if current_time - req_time < window_seconds
        ]
        
        # 检查是否超过限制
        if len(self.requests[key]) >= max_requests:
            return False
        
        # 记录当前请求
        self.requests[key].append(current_time)
        return True
    
    def get_remaining(self, endpoint: str, identifier: str) -> int:
        """获取剩余请求次数"""
        if endpoint not in self.limits:
            return float('inf')
        
        max_requests, window_seconds = self.limits[endpoint]
        key = f"{endpoint}:{identifier}"
        
        # 清理过期请求
        current_time = time.time()
        self.requests[key] = [
            req_time for req_time in self.requests[key] 
            if current_time - req_time < window_seconds
        ]
        
        return max(0, max_requests - len(self.requests[key]))

class TokenBucket:
    """令牌桶算法实现"""
    
    def __init__(self, capacity: int, refill_rate: float):
        self.capacity = capacity  # 桶容量
        self.tokens = capacity    # 当前令牌数
        self.refill_rate = refill_rate  # 每秒补充令牌数
        self.last_refill = time.time()
    
    def _refill(self):
        """补充令牌"""
        now = time.time()
        time_passed = now - self.last_refill
        new_tokens = time_passed * self.refill_rate
        self.tokens = min(self.capacity, self.tokens + new_tokens)
        self.last_refill = now
    
    def consume(self, tokens: int = 1) -> bool:
        """消费令牌"""
        self._refill()
        
        if self.tokens >= tokens:
            self.tokens -= tokens
            return True
        return False
    
    def get_wait_time(self, tokens: int = 1) -> float:
        """获取需要等待的时间"""
        self._refill()
        
        if self.tokens >= tokens:
            return 0
        
        deficit = tokens - self.tokens
        return deficit / self.refill_rate
```

### metrics（指标监控）
**功能**：性能指标收集、存储和展示

**实现细节**：
```python
import time
from typing import Dict, List, Any
from dataclasses import dataclass
from collections import defaultdict, deque
import statistics

@dataclass
class MetricPoint:
    """指标数据点"""
    timestamp: float
    value: float
    tags: Dict[str, str]

class MetricsCollector:
    """指标收集器"""
    
    def __init__(self, retention_period: int = 3600):  # 保留1小时数据
        self.metrics: Dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))
        self.retention_period = retention_period
    
    def record(self, metric_name: str, value: float, tags: Dict[str, str] = None):
        """记录指标"""
        if tags is None:
            tags = {}
        
        point = MetricPoint(
            timestamp=time.time(),
            value=value,
            tags=tags
        )
        
        self.metrics[metric_name].append(point)
        self._cleanup_old_data()
    
    def _cleanup_old_data(self):
        """清理过期数据"""
        current_time = time.time()
        for metric_name, points in self.metrics.items():
            # 移除过期数据点
            while points and current_time - points[0].timestamp > self.retention_period:
                points.popleft()
    
    def get_stats(self, metric_name: str, time_window: int = 300) -> Dict[str, Any]:
        """获取指标统计信息"""
        if metric_name not in self.metrics:
            return {}
        
        current_time = time.time()
        recent_points = [
            point for point in self.metrics[metric_name]
            if current_time - point.timestamp <= time_window
        ]
        
        if not recent_points:
            return {}
        
        values = [point.value for point in recent_points]
        
        return {
            "count": len(values),
            "mean": statistics.mean(values),
            "median": statistics.median(values),
            "min": min(values),
            "max": max(values),
            "p95": statistics.quantiles(values, n=20)[18] if len(values) >= 20 else max(values),
            "latest": values[-1]
        }

class ServiceMetrics:
    """服务指标监控"""
    
    def __init__(self):
        self.collector = MetricsCollector()
        
        # 定义监控指标
        self.metrics_config = {
            "ocr_latency": {"unit": "ms", "description": "OCR识别延迟"},
            "asr_latency": {"unit": "ms", "description": "ASR识别延迟"},
            "llm_latency": {"unit": "ms", "description": "LLM响应延迟"},
            "cache_hit_rate": {"unit": "%", "description": "缓存命中率"},
            "api_requests": {"unit": "count", "description": "API请求数"},
            "error_rate": {"unit": "%", "description": "错误率"}
        }
    
    def record_ocr_call(self, latency: float, success: bool):
        """记录OCR调用指标"""
        self.collector.record("ocr_latency", latency, {"success": str(success)})
        self.collector.record("api_requests", 1, {"service": "ocr"})
        if not success:
            self.collector.record("errors", 1, {"service": "ocr"})
    
    def record_asr_call(self, latency: float, success: bool):
        """记录ASR调用指标"""
        self.collector.record("asr_latency", latency, {"success": str(success)})
        self.collector.record("api_requests", 1, {"service": "asr"})
        if not success:
            self.collector.record("errors", 1, {"service": "asr"})
    
    def record_llm_call(self, latency: float, success: bool):
        """记录LLM调用指标"""
        self.collector.record("llm_latency", latency, {"success": str(success)})
        self.collector.record("api_requests", 1, {"service": "llm"})
        if not success:
            self.collector.record("errors", 1, {"service": "llm"})
    
    def record_cache_hit(self, hit: bool):
        """记录缓存命中"""
        self.collector.record("cache_operations", 1, {"hit": str(hit)})
    
    def get_service_health(self) -> Dict[str, Any]:
        """获取服务健康状态"""
        health = {}
        
        for metric_name in self.metrics_config:
            stats = self.collector.get_stats(metric_name, 300)  # 5分钟窗口
            if stats:
                health[metric_name] = stats
        
        # 计算总体健康分数
        if health:
            # 基于延迟和错误率的简单健康评分
            latency_score = 100
            error_score = 100
            
            if "ocr_latency" in health:
                latency_score = min(latency_score, max(0, 100 - health["ocr_latency"]["mean"] / 10))
            if "error_rate" in health:
                error_score = min(error_score, max(0, 100 - health["error_rate"]["mean"] * 10))
            
            health["overall_score"] = (latency_score + error_score) / 2
        
        return health
```

### eval（评估脚本）
**功能**：离线评估和性能基准测试

**实现细节**：
```python
import json
import time
from typing import List, Dict, Any
from dataclasses import dataclass
import numpy as np
from sklearn.metrics import precision_recall_fscore_support

@dataclass
class EvaluationResult:
    """评估结果"""
    metric: str
    value: float
    description: str

class RetrievalEvaluator:
    """检索评估器"""
    
    def __init__(self, ground_truth: Dict[str, List[str]]):
        """
        ground_truth: {query_id: [relevant_doc_ids]}
        """
        self.ground_truth = ground_truth
    
    def evaluate(self, results: Dict[str, List[str]], k_values: List[int] = [1, 3, 5, 10]) -> List[EvaluationResult]:
        """评估检索结果"""
        eval_results = []
        
        for k in k_values:
            precision_at_k = self._precision_at_k(results, k)
            recall_at_k = self._recall_at_k(results, k)
            ndcg_at_k = self._ndcg_at_k(results, k)
            
            eval_results.extend([
                EvaluationResult(f"P@{k}", precision_at_k, f"Precision at {k}"),
                EvaluationResult(f"R@{k}", recall_at_k, f"Recall at {k}"),
                EvaluationResult(f"nDCG@{k}", ndcg_at_k, f"Normalized DCG at {k}")
            ])
        
        return eval_results
    
    def _precision_at_k(self, results: Dict[str, List[str]], k: int) -> float:
        """计算Precision@k"""
        precisions = []
        
        for query_id, retrieved in results.items():
            if query_id not in self.ground_truth:
                continue
                
            relevant = set(self.ground_truth[query_id])
            retrieved_k = set(retrieved[:k])
            
            if len(retrieved_k) == 0:
                precisions.append(0.0)
            else:
                precisions.append(len(relevant & retrieved_k) / len(retrieved_k))
        
        return np.mean(precisions) if precisions else 0.0
    
    def _recall_at_k(self, results: Dict[str, List[str]], k: int) -> float:
        """计算Recall@k"""
        recalls = []
        
        for query_id, retrieved in results.items():
            if query_id not in self.ground_truth:
                continue
                
            relevant = set(self.ground_truth[query_id])
            retrieved_k = set(retrieved[:k])
            
            if len(relevant) == 0:
                recalls.append(0.0)
            else:
                recalls.append(len(relevant & retrieved_k) / len(relevant))
        
        return np.mean(recalls) if recalls else 0.0
    
    def _ndcg_at_k(self, results: Dict[str, List[str]], k: int) -> float:
        """计算nDCG@k"""
        ndcgs = []
        
        for query_id, retrieved in results.items():
            if query_id not in self.ground_truth:
                continue
                
            relevant = set(self.ground_truth[query_id])
            retrieved_k = retrieved[:k]
            
            # 计算DCG
            dcg = 0.0
            for i, doc_id in enumerate(retrieved_k):
                if doc_id in relevant:
                    dcg += 1.0 / np.log2(i + 2)  # i+2 because i starts from 0
            
            # 计算IDCG（理想DCG）
            ideal_relevance = [1] * min(len(relevant), k)
            idcg = sum(1.0 / np.log2(i + 2) for i in range(len(ideal_relevance)))
            
            ndcgs.append(dcg / idcg if idcg > 0 else 0.0)
        
        return np.mean(ndcgs) if ndcgs else 0.0

class AttributionEvaluator:
    """错因归因评估器"""
    
    def evaluate(self, predictions: List[Dict], ground_truth: List[Dict]) -> List[EvaluationResult]:
        """评估错因归因准确性"""
        # 提取预测和真实标签
        y_true = [gt.get('primary_error', '') for gt in ground_truth]
        y_pred = [pred.get('primary_error', '') for pred in predictions]
        
        # 计算分类指标
        precision, recall, f1, _ = precision_recall_fscore_support(
            y_true, y_pred, average='weighted', zero_division=0
        )
        
        # 计算准确率
        accuracy = sum(1 for i in range(len(y_true)) if y_true[i] == y_pred[i]) / len(y_true)
        
        return [
            EvaluationResult("accuracy", accuracy, "主错因分类准确率"),
            EvaluationResult("precision", precision, "加权精确率"),
            EvaluationResult("recall", recall, "加权召回率"),
            EvaluationResult("f1_score", f1, "加权F1分数")
        ]

class PerformanceBenchmark:
    """性能基准测试"""
    
    def __init__(self):
        self.results = {}
    
    def benchmark_ocr(self, test_images: List, iterations: int = 10) -> Dict[str, float]:
        """OCR性能基准测试"""
        latencies = []
        
        for i in range(iterations):
            for image in test_images:
                start_time = time.time()
                # 调用OCR服务
                # result = ocr_client.recognize(image)
                latency = time.time() - start_time
                latencies.append(latency)
        
        return {
            "average_latency": np.mean(latencies),
            "p95_latency": np.percentile(latencies, 95),
            "throughput": len(test_images) * iterations / sum(latencies)
        }
    
    def benchmark_llm(self, test_prompts: List, iterations: int = 5) -> Dict[str, float]:
        """LLM性能基准测试"""
        latencies = []
        
        for i in range(iterations):
            for prompt in test_prompts:
                start_time = time.time()
                # 调用LLM服务
                # result = llm_client.generate(prompt)
                latency = time.time() - start_time
                latencies.append(latency)
        
        return {
            "average_latency": np.mean(latencies),
            "p95_latency": np.percentile(latencies, 95),
            "tokens_per_second": len(test_prompts) * 100 / sum(latencies)  # 估算
        }
    
    def run_comprehensive_benchmark(self):
        """运行综合性能基准测试"""
        benchmarks = {
            "ocr_performance": self.benchmark_ocr,
            "llm_performance": self.benchmark_llm,
            # 可以添加更多基准测试
        }
        
        results = {}
        for name, benchmark_func in benchmarks.items():
            try:
                results[name] = benchmark_func()
            except Exception as e:
                results[name] = {"error": str(e)}
        
        return results
```

### bench（压力测试）
**功能**：系统压力测试和性能优化

**实现细节**：
```python
import asyncio
import aiohttp
from concurrent.futures import ThreadPoolExecutor
import psutil
import time

class StressTester:
    """压力测试器"""
    
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.results = {}
    
    async def test_concurrent_requests(self, endpoint: str, num_requests: int, concurrency: int) -> Dict[str, Any]:
        """并发请求测试"""
        semaphore = asyncio.Semaphore(concurrency)
        latencies = []
        errors = 0
        
        async def make_request(session, request_id):
            async with semaphore:
                start_time = time.time()
                try:
                    async with session.get(f"{self.base_url}{endpoint}") as response:
                        if response.status == 200:
                            latencies.append(time.time() - start_time)
                        else:
                            errors += 1
                except Exception:
                    errors += 1
        
        async with aiohttp.ClientSession() as session:
            tasks = [make_request(session, i) for i in range(num_requests)]
            await asyncio.gather(*tasks)
        
        return {
            "total_requests": num_requests,
            "successful_requests": len(latencies),
            "failed_requests": errors,
            "average_latency": np.mean(latencies) if latencies else 0,
            "p95_latency": np.percentile(latencies, 95) if latencies else 0,
            "requests_per_second": len(latencies) / (max(latencies) if latencies else 1)
        }
    
    def monitor_system_resources(self, duration: int = 60) -> Dict[str, List[float]]:
        """监控系统资源使用"""
        cpu_usage = []
        memory_usage = []
        disk_io = []
        network_io = []
        
        start_time = time.time()
        while time.time() - start_time < duration:
            # CPU使用率
            cpu_usage.append(psutil.cpu_percent(interval=1))
            
            # 内存使用
            memory = psutil.virtual_memory()
            memory_usage.append(memory.percent)
            
            # 磁盘IO
            disk = psutil.disk_io_counters()
            disk_io.append(disk.read_bytes + disk.write_bytes if disk else 0)
            
            # 网络IO
            network = psutil.net_io_counters()
            network_io.append(network.bytes_sent + network.bytes_recv if network else 0)
            
            time.sleep(1)
        
        return {
            "cpu_usage": cpu_usage,
            "memory_usage": memory_usage,
            "disk_io": disk_io,
            "network_io": network_io
        }
    
    async def run_stress_test(self, test_scenarios: List[Dict]) -> Dict[str, Any]:
        """运行压力测试"""
        results = {}
        
        for scenario in test_scenarios:
            scenario_name = scenario['name']
            print(f"运行压力测试场景: {scenario_name}")
            
            # 监控系统资源
            monitor_task = asyncio.create_task(
                asyncio.to_thread(self.monitor_system_resources, scenario['duration'])
            )
            
            # 运行压力测试
            stress_results = await self.test_concurrent_requests(
                scenario['endpoint'],
                scenario['num_requests'],
                scenario['concurrency']
            )
            
            # 获取监控结果
            resource_usage = await monitor_task
            
            results[scenario_name] = {
                "stress_test": stress_results,
                "resource_usage": resource_usage
            }
        
        return results
```

## 使用示例

### 配置管理使用
```python
from platform.config import ConfigManager

# 获取配置
config = ConfigManager.get_config()

# 使用配置
ocr_key = config.baidu_ocr_key
app_port = config.app_port

# 获取脱敏配置（用于日志）
safe_config = ConfigManager.get_safe_config()
```

### 日志记录使用
```python
from platform.logging import app_logger, pipeline_logger

# 记录普通日志
app_logger.info("应用启动成功")

# 记录带额外信息的日志
pipeline_logger.info("OCR处理完成", {
    "image_size": "720x480",
    "ocr_text": "已知2x+3=11，求x",
    "processing_time": 1.23
})
```

### 速率限制使用
```python
from platform.rate_limit import RateLimiter

rate_limiter = RateLimiter()
rate_limiter.set_limit("/api/ocr", 10, 60)  # 每分钟10次

# 检查是否允许请求
if rate_limiter.is_allowed("/api/ocr", "user_123"):
    # 处理请求
    pass
else:
    # 返回限流错误
    pass
```

### 指标监控使用
```python
from platform.metrics import ServiceMetrics

metrics = ServiceMetrics()

# 记录OCR调用
metrics.record_ocr_call(150.5, True)  # 150.5ms延迟，成功

# 获取服务健康状态
health = metrics.get_service_health()
```

### 评估测试使用
```python
from platform.eval import RetrievalEvaluator, AttributionEvaluator

# 检索评估
evaluator = RetrievalEvaluator(ground_truth)
results = evaluator.evaluate(retrieval_results, [1, 3, 5])

# 错因归因评估
attribution_evaluator = AttributionEvaluator()
attribution_results = attribution_evaluator.evaluate(predictions, ground_truth)
```

### 压力测试使用
```python
from platform.bench import StressTester

tester = StressTester("http://localhost:8000")

# 定义测试场景
scenarios = [
    {
        "name": "高并发OCR",
        "endpoint": "/api/ocr",
        "num_requests": 100,
        "concurrency": 10,
        "duration": 30
    }
]

# 运行压力测试
results = await tester.run_stress_test(scenarios)
```

## 性能优化建议

### 配置优化
```python
# 生产环境配置优化
PRODUCTION_CONFIG = {
    "log_level": "WARNING",
    "frame_interval": 3,  # 降低抽帧频率
    "ocr_qps_limit": 0.5,  # 降低OCR QPS
    "cache_ttl": 7200,  # 延长缓存时间
}
```

### 监控告警
```python
class AlertManager:
    """告警管理器"""
    
    def __init__(self, thresholds: Dict[str, float]):
        self.thresholds = thresholds
    
    def check_alerts(self, metrics: Dict[str, Any]) -> List[str]:
        """检查告警条件"""
        alerts = []
        
        if "error_rate" in metrics and metrics["error_rate"] > self.thresholds.get("error_rate", 0.1):
            alerts.append(f"错误率过高: {metrics['error_rate']:.2%}")
        
        if "ocr_latency" in metrics and metrics["ocr_latency"] > self.thresholds.get("ocr_latency", 5000):
            alerts.append(f"OCR延迟过高: {metrics['ocr_latency']}ms")
        
        return alerts
```

## 测试要点
- 配置加载和验证测试
- 日志脱敏和格式测试
- 速率限制功能测试
- 指标收集准确性测试
- 评估脚本正确性测试
- 压力测试稳定性测试
- 系统资源监控测试
