# Core模块 DEVSPEC.md

## 模块概述
Core模块是mistake_note项目的业务核心层，包含面向领域的业务逻辑实现，与外部服务和存储解耦，负责核心算法和业务规则的实现。

## 职责范围
- 图像预处理和视觉算法
- 引导建议生成引擎
- 解题步骤提取和规范化
- 错因归因分析
- 错题卡构建和验证
- 学习单模板渲染
- 隐私保护逻辑

## 核心子模块

### vision.preprocess（图像预处理）
**功能**：图像增强和优化，提升OCR成功率

**核心算法**：
```python
class ImagePreprocessor:
    def __init__(self):
        self.max_size = 720  # 最大边长
        
    async def preprocess(self, image_data, roi=None):
        """图像预处理流水线"""
        # 1. 尺寸调整
        resized = await self.resize_image(image_data)
        
        # 2. 灰度化
        gray = await self.to_grayscale(resized)
        
        # 3. 自适应阈值
        thresholded = await self.adaptive_threshold(gray)
        
        # 4. 透视矫正
        deskewed = await self.deskew_image(thresholded)
        
        # 5. 去阴影和噪声
        cleaned = await self.remove_shadow_noise(deskewed)
        
        return cleaned
    
    async def resize_image(self, image_data):
        """调整图像尺寸"""
        # 保持长宽比，最长边不超过max_size
        
    async def to_grayscale(self, image):
        """转换为灰度图"""
        
    async def adaptive_threshold(self, gray_image):
        """自适应阈值二值化"""
        
    async def deskew_image(self, image):
        """透视矫正（最大四边形检测）"""
        
    async def remove_shadow_noise(self, image):
        """去除阴影和噪声"""
```

**感知哈希去重**：
```python
class FrameDeduplicator:
    """帧去重器"""
    def __init__(self, similarity_threshold=0.9):
        self.threshold = similarity_threshold
        self.hash_cache = {}
        
    def calculate_hash(self, image_data):
        """计算感知哈希"""
        # 使用imagehash库计算phash
        
    def is_duplicate(self, current_hash, previous_hash):
        """判断是否为重复帧"""
        similarity = 1 - (current_hash - previous_hash) / 64.0
        return similarity > self.threshold
```

### guidance.engine（引导引擎）
**功能**：生成"不直答"的提问式引导建议

**实现细节**：
```python
class GuidanceEngine:
    def __init__(self, mode="template"):
        self.mode = mode
        self.template_rules = self._load_template_rules()
        
    async def generate_guidance(self, ocr_text, voice_transcript="", retrieved_snippets=None):
        """生成引导建议"""
        # 1. 模板匹配
        template_hints = await self._apply_templates(ocr_text)
        
        if self.mode == "template":
            return template_hints
        
        # 2. LLM增强
        llm_hints = await self._enhance_with_llm(
            ocr_text, voice_transcript, template_hints, retrieved_snippets
        )
        
        return llm_hints
    
    async def _apply_templates(self, text):
        """应用模板规则"""
        hints = []
        
        # 数学题模板
        if self._contains_math_keywords(text):
            hints.extend(self._math_guidance_templates(text))
            
        # 语文题模板  
        elif self._contains_chinese_keywords(text):
            hints.extend(self._chinese_guidance_templates(text))
            
        return hints
    
    async def _enhance_with_llm(self, ocr_text, voice_transcript, template_hints, snippets):
        """LLM增强引导"""
        prompt = self._build_llm_prompt(ocr_text, voice_transcript, template_hints, snippets)
        response = await llm_client.generate(prompt)
        return self._parse_llm_response(response)
    
    def _build_llm_prompt(self, ocr_text, voice_transcript, template_hints, snippets):
        """构建LLM提示词"""
        return f"""
        你是一个数学辅导助手，请根据以下信息生成提问式引导建议：
        
        题目：{ocr_text}
        学生思路：{voice_transcript}
        模板建议：{template_hints}
        相关题目：{snippets}
        
        要求：
        1. 绝对不要直接给出答案
        2. 使用提问式引导（例如："你能先尝试..."）
        3. 提供2-3个具体的检查点
        4. 语言简洁明了，适合中学生理解
        
        请返回JSON格式：
        {{
            "hints": ["引导建议1", "引导建议2"],
            "checklist": ["检查点1", "检查点2"]
        }}
        """
```

### steps.extractor（步骤提取器）
**功能**：合并OCR和ASR文本，规范化为关键步骤

**实现细节**：
```python
class StepsExtractor:
    def __init__(self):
        self.patterns = self._load_extraction_patterns()
        
    async def extract_steps(self, ocr_text, voice_transcript):
        """提取规范化步骤"""
        # 1. 文本合并和清洗
        combined_text = await self._combine_texts(ocr_text, voice_transcript)
        
        # 2. 初步步骤识别
        raw_steps = await self._identify_raw_steps(combined_text)
        
        # 3. LLM步骤规整
        normalized_steps = await self._normalize_with_llm(raw_steps)
        
        return normalized_steps
    
    async def _combine_texts(self, ocr_text, voice_transcript):
        """合并OCR和语音文本"""
        # 去重、排序、合并逻辑
        
    async def _identify_raw_steps(self, text):
        """识别原始步骤"""
        steps = []
        
        # 基于正则的模式匹配
        for pattern in self.patterns:
            matches = re.findall(pattern, text)
            steps.extend(matches)
            
        return steps
    
    async def _normalize_with_llm(self, raw_steps):
        """LLM步骤规整"""
        prompt = f"""
        请将以下解题步骤规整为2-4个关键步骤：
        {raw_steps}
        
        要求：
        1. 每个步骤清晰明确
        2. 步骤间有逻辑顺序
        3. 语言简洁规范
        4. 适合中学生理解
        
        返回JSON格式：
        {{
            "steps": ["步骤1", "步骤2", "步骤3"]
        }}
        """
        return await llm_client.generate(prompt)
```

### attribution.rules（规则归因）
**功能**：基于规则的错因分析

**实现细节**：
```python
class RuleBasedAttribution:
    def __init__(self):
        self.rules = self._load_attribution_rules()
        
    async def analyze_errors(self, question, student_solution, correct_solution):
        """基于规则的错因分析"""
        errors = []
        
        # 等式校验
        if await self._check_equation_errors(student_solution, correct_solution):
            errors.append("等式错误")
            
        # 单位校验
        if await self._check_unit_errors(student_solution):
            errors.append("单位错误")
            
        # 通分校验
        if await self._check_fraction_errors(student_solution):
            errors.append("分数计算错误")
            
        # 符号校验
        if await self._check_symbol_errors(student_solution):
            errors.append("符号错误")
            
        return errors
    
    async def _check_equation_errors(self, student, correct):
        """等式错误检查"""
        # 等式平衡性检查
        
    async def _check_unit_errors(self, solution):
        """单位一致性检查"""
        
    async def _check_fraction_errors(self, solution):
        """分数计算检查"""
        
    async def _check_symbol_errors(self, solution):
        """数学符号检查"""
```

### attribution.llm（LLM归因）
**功能**：基于LLM的结构化错因分析

**实现细节**：
```python
class LLMAttribution:
    def __init__(self):
        self.schema = {
            "type": "object",
            "properties": {
                "primary_error": {"type": "string", "enum": ERROR_TYPES},
                "secondary_factors": {"type": "array", "items": {"type": "string"}},
                "reasoning_gaps": {"type": "array", "items": {"type": "string"}},
                "recommendations": {"type": "array", "items": {"type": "string"}}
            },
            "required": ["primary_error", "secondary_factors", "reasoning_gaps", "recommendations"]
        }
        
    async def analyze_with_llm(self, question, student_solution, correct_solution):
        """LLM结构化错因分析"""
        prompt = self._build_attribution_prompt(question, student_solution, correct_solution)
        
        response = await llm_client.generate_with_schema(
            prompt, 
            schema=self.schema,
            temperature=0.1  # 低随机性确保一致性
        )
        
        return self._validate_attribution(response)
```

### card.builder（错题卡构建器）
**功能**：组装完整的MistakeCard数据结构

**实现细节**：
```python
class MistakeCardBuilder:
    def __init__(self):
        self.embedder = TextEmbedder()
        
    async def build_card(self, raw_data):
        """构建错题卡"""
        card = MistakeCard(
            id=generate_uuid(),
            timestamp=datetime.now(),
            student_id=raw_data.get('student_id', 'anon_001'),
            # ... 其他字段赋值
        )
        
        # 生成向量嵌入
        card.embeddings = await self._generate_embeddings(card)
        
        return card
    
    async def _generate_embeddings(self, card):
        """生成多视角向量"""
        return {
            "q_text_emb": await self.embedder.embed(card.question_text),
            "sol_text_emb": await self.embedder.embed(card.student_solution_text),
            "concept_emb": await self.embedder.embed(" ".join(card.topic_tags)),
            "error_emb": await self.embedder.embed(" ".join(card.error_type))
        }
```

### exporter.sheet（学习单导出器）
**功能**：学习单模板渲染和导出

**实现细节**：
```python
class LearningSheetExporter:
    def __init__(self):
        self.templates = self._load_templates()
        
    async def export_sheet(self, card, similar_cards, same_error_cards):
        """导出学习单"""
        # 1. 数据收集和整理
        data = await self._prepare_export_data(card, similar_cards, same_error_cards)
        
        # 2. Markdown模板渲染
        md_content = await self._render_markdown(data)
        
        # 3. PDF转换
        pdf_path = await self._convert_to_pdf(md_content)
        
        return pdf_path
    
    async def _prepare_export_data(self, card, similar_cards, same_error_cards):
        """准备导出数据"""
        return {
            "card": card,
            "similar_problems": similar_cards[:3],
            "same_error_problems": same_error_cards[:3],
            "concept_summary": await self._summarize_concepts(card),
            "action_plan": await self._generate_action_plan(card)
        }
```

### privacy.guard（隐私保护）
**功能**：隐私合规管理和数据保护

**实现细节**：
```python
class PrivacyGuard:
    def __init__(self):
        self.consent_log = ConsentLogger()
        
    async def log_camera_activation(self, student_id, reason):
        """记录摄像头开启"""
        await self.consent_log.log_event(
            student_id=student_id,
            event_type="camera_activation",
            reason=reason,
            timestamp=datetime.now()
        )
    
    async def anonymize_data(self, data):
        """数据脱敏"""
        # 人脸模糊、PII信息脱敏
```

## 使用示例

### 图像预处理使用
```python
from core.vision.preprocess import ImagePreprocessor

preprocessor = ImagePreprocessor()
processed_image = await preprocessor.preprocess(image_data, roi="100,100,300,300")
```

### 引导生成使用
```python
from core.guidance.engine import GuidanceEngine

engine = GuidanceEngine(mode="llm")
guidance = await engine.generate_guidance(
    ocr_text="解方程: 2x + 3 = 11",
    voice_transcript="我先移项..."
)
```

### 错因分析使用
```python
from core.attribution.llm import LLMAttribution

attribution = LLMAttribution()
analysis = await attribution.analyze_with_llm(
    question="2x + 3 = 11",
    student_solution="2x = 9, x = 4.5",
    correct_solution="2x = 8, x = 4"
)
```

## 配置参数
- `preprocessing.max_size`: 图像最大尺寸
- `guidance.mode`: 引导模式（template/llm）
- `steps.max_steps`: 最大步骤数
- `attribution.error_types`: 预置错因类型

## 性能优化
- 算法复杂度控制
- 内存使用优化
- 并行处理能力
- 缓存策略应用

## 测试要点
- 算法正确性测试
- 边界条件处理测试
- 性能基准测试
- 集成一致性测试
