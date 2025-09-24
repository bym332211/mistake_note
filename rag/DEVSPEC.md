# RAG模块 DEVSPEC.md

## 模块概述
RAG模块是mistake_note项目的检索增强生成核心，负责向量嵌入生成、索引管理、相似度检索和多维度过滤，支持题干、解法、知识点、错因等多视角检索。

## 职责范围
- 文本向量嵌入生成（CPU友好）
- 向量索引构建和管理（Chroma + HNSW）
- 多维度相似度检索
- 过滤和重排机制
- 索引维护和优化
- 检索性能监控

## 核心组件

### embedder（嵌入生成器）
**功能**：文本向量化，支持多视角嵌入生成

**实现细节**：
```python
class TextEmbedder:
    def __init__(self, model_name="BAAI/bge-m3", device="cpu"):
        """初始化嵌入模型"""
        try:
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer(model_name, device=device)
            self.model.max_seq_length = 512  # 优化CPU性能
        except ImportError:
            raise ImportError("请安装sentence-transformers: pip install sentence-transformers")
    
    async def embed(self, text, embedding_type="question"):
        """生成文本嵌入向量"""
        if not text or not text.strip():
            return np.zeros(self.model.get_sentence_embedding_dimension())
        
        # 文本预处理
        processed_text = self._preprocess_text(text, embedding_type)
        
        # 批量处理优化（单条也走批量接口）
        embeddings = self.model.encode([processed_text], 
                                     batch_size=1,
                                     show_progress_bar=False,
                                     normalize_embeddings=True)
        
        return embeddings[0]  # 返回单条结果的向量
    
    def _preprocess_text(self, text, embedding_type):
        """根据嵌入类型预处理文本"""
        preprocessing_rules = {
            "question": lambda t: f"题目：{t}",
            "solution": lambda t: f"解法：{t}", 
            "concept": lambda t: f"知识点：{t}",
            "error": lambda t: f"错因：{t}"
        }
        
        preprocessor = preprocessing_rules.get(embedding_type, lambda t: t)
        return preprocessor(text.strip())
    
    async def batch_embed(self, texts, embedding_type="question"):
        """批量生成嵌入向量"""
        if not texts:
            return []
            
        processed_texts = [self._preprocess_text(text, embedding_type) for text in texts]
        embeddings = self.model.encode(processed_texts,
                                     batch_size=min(32, len(texts)),  # 控制批量大小
                                     show_progress_bar=False,
                                     normalize_embeddings=True)
        return embeddings
    
    def get_dimension(self):
        """获取向量维度"""
        return self.model.get_sentence_embedding_dimension()
```

### vector_store（向量存储）
**功能**：基于Chroma的向量索引管理，支持HNSW算法

**实现细节**：
```python
class VectorStore:
    def __init__(self, persist_directory="./data/vector_db"):
        """初始化向量数据库"""
        import chromadb
        self.client = chromadb.PersistentClient(path=persist_directory)
        self.collection = None
        self._ensure_collection()
    
    def _ensure_collection(self):
        """确保集合存在"""
        try:
            self.collection = self.client.get_collection("mistake_cards")
        except Exception:
            # 创建新的集合
            self.collection = self.client.create_collection(
                "mistake_cards",
                metadata={"hnsw:space": "cosine"}  # 使用余弦相似度
            )
    
    async def add_documents(self, documents, embeddings, metadatas=None):
        """添加文档到向量库"""
        if not documents or not embeddings:
            return
            
        # 生成唯一ID
        ids = [f"doc_{int(time.time())}_{i}" for i in range(len(documents))]
        
        # 准备元数据
        if metadatas is None:
            metadatas = [{} for _ in documents]
            
        # 添加到集合
        self.collection.add(
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )
        
        return ids
    
    async def search(self, query_embedding, n_results=5, where_filter=None):
        """向量相似度搜索"""
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            where=where_filter,
            include=["documents", "metadatas", "distances"]
        )
        
        return self._format_search_results(results)
    
    def _format_search_results(self, results):
        """格式化搜索结果"""
        formatted = []
        for i in range(len(results['documents'][0])):
            formatted.append({
                "document": results['documents'][0][i],
                "metadata": results['metadatas'][0][i],
                "distance": results['distances'][0][i],
                "score": 1 - results['distances'][0][i]  # 转换为相似度分数
            })
        return formatted
    
    async def delete_documents(self, document_ids):
        """删除文档"""
        self.collection.delete(ids=document_ids)
    
    async def get_collection_stats(self):
        """获取集合统计信息"""
        return self.collection.count()
```

### search（检索引擎）
**功能**：多维度检索和结果组合

**实现细节**：
```python
class SearchEngine:
    def __init__(self, embedder, vector_store):
        self.embedder = embedder
        self.vector_store = vector_store
    
    async def search_similar_questions(self, query_text, top_k=5, filters=None):
        """相似题干检索"""
        # 生成问题向量
        query_embedding = await self.embedder.embed(query_text, "question")
        
        # 构建过滤条件
        where_filter = self._build_where_filter(filters)
        
        # 执行检索
        results = await self.vector_store.search(query_embedding, top_k, where_filter)
        
        return self._rank_results(results, query_text)
    
    async def search_by_solution(self, solution_text, top_k=5, filters=None):
        """解法相似检索"""
        solution_embedding = await self.embedder.embed(solution_text, "solution")
        where_filter = self._build_where_filter(filters)
        results = await self.vector_store.search(solution_embedding, top_k, where_filter)
        return self._rank_results(results, solution_text)
    
    async def search_by_concept(self, concept_text, top_k=5, filters=None):
        """知识点检索"""
        concept_embedding = await self.embedder.embed(concept_text, "concept")
        where_filter = self._build_where_filter(filters)
        results = await self.vector_store.search(concept_embedding, top_k, where_filter)
        return self._rank_results(results, concept_text)
    
    async def search_by_error(self, error_type, top_k=5, filters=None):
        """同错因检索"""
        error_embedding = await self.embedder.embed(error_type, "error")
        where_filter = self._build_where_filter(filters)
        results = await self.vector_store.search(error_embedding, top_k, where_filter)
        return self._rank_results(results, error_type)
    
    async def hybrid_search(self, query_text, weights=None, top_k=5, filters=None):
        """混合检索（多视角加权）"""
        if weights is None:
            weights = {"question": 0.6, "solution": 0.2, "concept": 0.2}
        
        # 生成多视角向量
        embeddings = {}
        for perspective in weights.keys():
            embeddings[perspective] = await self.embedder.embed(query_text, perspective)
        
        # 分别检索
        all_results = []
        for perspective, weight in weights.items():
            results = await self.vector_store.search(embeddings[perspective], top_k*2, filters)
            for result in results:
                result['score'] *= weight
                result['perspective'] = perspective
            all_results.extend(results)
        
        # 合并和重排
        return self._merge_and_rerank(all_results, top_k)
    
    def _build_where_filter(self, filters):
        """构建过滤条件"""
        if not filters:
            return None
            
        where_filter = {}
        if 'grade' in filters:
            where_filter['grade'] = filters['grade']
        if 'subject' in filters:
            where_filter['subject'] = filters['subject']
        if 'difficulty_min' in filters:
            where_filter['difficulty'] = {'$gte': filters['difficulty_min']}
        if 'difficulty_max' in filters:
            where_filter.setdefault('difficulty', {})['$lte'] = filters['difficulty_max']
            
        return where_filter if where_filter else None
    
    def _rank_results(self, results, query_text):
        """结果排序"""
        # 基于相似度分数排序
        return sorted(results, key=lambda x: x['score'], reverse=True)
    
    def _merge_and_rerank(self, results, top_k):
        """合并和重排结果"""
        # 按文档ID去重，保留最高分
        unique_results = {}
        for result in results:
            doc_id = result['metadata'].get('id')
            if doc_id not in unique_results or result['score'] > unique_results[doc_id]['score']:
                unique_results[doc_id] = result
        
        # 按分数排序并返回top_k
        sorted_results = sorted(unique_results.values(), key=lambda x: x['score'], reverse=True)
        return sorted_results[:top_k]
```

### rerank（重排器）
**功能**：检索结果重排优化（可选）

**实现细节**：
```python
class Reranker:
    def __init__(self, model_name="BAAI/bge-reranker-base"):
        """初始化重排模型"""
        try:
            from FlagEmbedding import FlagReranker
            self.reranker = FlagReranker(model_name, use_fp16=False)
        except ImportError:
            self.reranker = None
            logger.warning("重排模型不可用，将使用基础排序")
    
    async def rerank(self, query, candidates, top_k=5):
        """重排检索结果"""
        if not self.reranker or len(candidates) <= 1:
            return candidates[:top_k]
        
        # 准备重排数据
        pairs = [(query, candidate['document']) for candidate in candidates]
        
        try:
            # 计算重排分数
            scores = self.reranker.compute_score(pairs)
            
            # 更新分数并重排
            for i, candidate in enumerate(candidates):
                candidate['rerank_score'] = scores[i]
                candidate['final_score'] = 0.7 * candidate.get('score', 0) + 0.3 * scores[i]
            
            # 按最终分数排序
            reranked = sorted(candidates, key=lambda x: x['final_score'], reverse=True)
            return reranked[:top_k]
            
        except Exception as e:
            logger.error(f"重排失败: {e}")
            return candidates[:top_k]  # 失败时返回原顺序
```

## 索引管理

### 索引构建流程
```python
class IndexManager:
    def __init__(self, embedder, vector_store):
        self.embedder = embedder
        self.vector_store = vector_store
    
    async def build_index_from_cards(self, mistake_cards):
        """从错题卡构建索引"""
        documents = []
        embeddings = []
        metadatas = []
        
        for card in mistake_cards:
            # 生成多视角文档
            perspectives = self._generate_perspectives(card)
            
            for perspective, text in perspectives.items():
                if text:  # 确保文本不为空
                    documents.append(text)
                    embedding = await self.embedder.embed(text, perspective)
                    embeddings.append(embedding)
                    metadatas.append({
                        'card_id': card.id,
                        'perspective': perspective,
                        'grade': card.grade,
                        'subject': card.subject,
                        'difficulty': card.difficulty,
                        'timestamp': card.timestamp.isoformat()
                    })
        
        # 批量添加到向量库
        if documents:
            await self.vector_store.add_documents(documents, embeddings, metadatas)
    
    def _generate_perspectives(self, card):
        """生成多视角文本"""
        return {
            'question': card.question_text,
            'solution': card.student_solution_text or card.gold_solution_brief,
            'concept': ' '.join(card.topic_tags) if card.topic_tags else '',
            'error': ' '.join(card.error_type) if card.error_type else ''
        }
    
    async def update_index(self, new_cards, updated_cards=None, deleted_card_ids=None):
        """更新索引"""
        # 删除旧文档
        if deleted_card_ids:
            await self._delete_documents_by_card_ids(deleted_card_ids)
        
        # 添加新文档
        if new_cards:
            await self.build_index_from_cards(new_cards)
        
        # 更新现有文档（先删后加）
        if updated_cards:
            await self._delete_documents_by_card_ids([card.id for card in updated_cards])
            await self.build_index_from_cards(updated_cards)
```

## 使用示例

### 基本检索使用
```python
from rag.embedder import TextEmbedder
from rag.vector_store import VectorStore
from rag.search import SearchEngine

# 初始化组件
embedder = TextEmbedder()
vector_store = VectorStore()
search_engine = SearchEngine(embedder, vector_store)

# 相似题干检索
results = await search_engine.search_similar_questions(
    "已知2x+3=11，求x",
    top_k=5,
    filters={"subject": "math", "grade": "G6"}
)

# 同错因检索
error_results = await search_engine.search_by_error(
    "计算错误",
    top_k=3,
    filters={"subject": "math"}
)
```

### 索引管理使用
```python
from rag.index_manager import IndexManager

index_manager = IndexManager(embedder, vector_store)

# 构建索引
await index_manager.build_index_from_cards(mistake_cards)

# 更新索引
await index_manager.update_index(
    new_cards=new_cards,
    updated_cards=updated_cards,
    deleted_card_ids=deleted_ids
)
```

### 混合检索使用
```python
# 多视角加权检索
hybrid_results = await search_engine.hybrid_search(
    "一次方程求解问题",
    weights={"question": 0.5, "solution": 0.3, "concept": 0.2},
    top_k=5,
    filters={"subject": "math", "difficulty_min": 2}
)
```

## 性能优化

### CPU友好配置
```python
# 嵌入模型配置
EMBEDDING_CONFIG = {
    "model": "BAAI/bge-m3",  # 轻量且效果好的模型
    "device": "cpu",
    "max_seq_length": 512,   # 限制序列长度
    "batch_size": 32         # 控制批量大小
}

# 向量索引配置
VECTOR_STORE_CONFIG = {
    "persist_directory": "./data/vector_db",
    "hnsw_space": "cosine",  # 余弦相似度
    "hnsw_ef_construction": 200,  # 构建参数
    "hnsw_m": 16             # 连接数
}
```

### 缓存策略
```python
class EmbeddingCache:
    """嵌入向量缓存"""
    def __init__(self, max_size=1000):
        self.cache = {}
        self.max_size = max_size
    
    def get(self, text, embedding_type):
        """获取缓存"""
        key = f"{embedding_type}:{hash(text)}"
        return self.cache.get(key)
    
    def set(self, text, embedding_type, embedding):
        """设置缓存"""
        if len(self.cache) >= self.max_size:
            # LRU淘汰
            self.cache.pop(next(iter(self.cache)))
            
        key = f"{embedding_type}:{hash(text)}"
        self.cache[key] = embedding
```

## 监控指标

### 检索性能监控
```python
class SearchMetrics:
    """检索性能指标"""
    
    def __init__(self):
        self.search_count = 0
        self.average_latency = 0
        self.cache_hit_rate = 0
        self.recall_stats = {}
    
    def record_search(self, latency, cache_hit=False):
        """记录搜索指标"""
        self.search_count += 1
        self.average_latency = (self.average_latency * (self.search_count - 1) + latency) / self.search_count
        
        if cache_hit:
            self.cache_hit_rate = (self.cache_hit_rate * (self.search_count - 1) + 1) / self.search_count
```

## 测试要点
- 嵌入生成准确性测试
- 检索结果相关性测试
- 性能基准测试（延迟、吞吐量）
- 索引构建和更新测试
- 过滤条件有效性测试
- 缓存命中率测试
