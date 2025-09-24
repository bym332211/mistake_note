# Storage模块 DEVSPEC.md

## 模块概述
Storage模块是mistake_note项目的数据持久化层，负责结构化数据存储、媒体文件管理、缓存机制和数据迁移，提供统一的数据访问接口。

## 职责范围
- SQLite数据库管理和数据访问
- 媒体文件（图像、音频）存储管理
- 多级缓存机制实现
- 数据导入导出工具
- 数据库迁移和版本管理
- 数据备份和恢复

## 核心组件

### db.sqlite（数据库管理）
**功能**：基于SQLite的结构化数据存储

**数据模型定义**：
```python
from datetime import datetime
from typing import List, Optional, Dict, Any
import uuid

class MistakeCard:
    """错题卡数据模型"""
    
    def __init__(self):
        self.id: str = str(uuid.uuid4())
        self.timestamp: datetime = datetime.now()
        self.student_id: str = "anon_001"
        self.grade: str = "G6"  # 年级
        self.subject: str = "math"  # 学科
        self.topic_tags: List[str] = []  # 知识点标签
        self.difficulty: int = 3  # 难度等级1-5
        
        # 题目相关
        self.question_text: str = ""  # 题干文本
        self.student_solution_text: str = ""  # 学生解题步骤
        self.voice_transcript: str = ""  # 语音转写文本
        self.gold_solution_brief: str = ""  # 标准解法要点
        
        # 错因分析
        self.error_type: List[str] = []  # 主错因
        self.error_factors: List[str] = []  # 次因
        self.reasoning_gaps: List[str] = []  # 思维漏洞
        self.recommendations: List[str] = []  # 改进建议
        
        # 媒体文件路径
        self.media: Dict[str, str] = {
            "raw_image_url": "",
            "deskew_image_url": "", 
            "roi_image_url": "",
            "tts_audio_url": ""
        }
        
        # 向量嵌入（存储路径或引用）
        self.embeddings: Dict[str, str] = {
            "q_text_emb": "",
            "sol_text_emb": "",
            "concept_emb": "",
            "error_emb": ""
        }
        
        # 元数据
        self.metadata: Dict[str, Any] = {
            "source": "camera+baidu_ocr",
            "lang": "zh",
            "hash": "",
            "pipeline_version": "v0.1.0"
        }
```

**数据库访问层**：
```python
class DatabaseManager:
    def __init__(self, db_path="./data/mistake_note.db"):
        self.db_path = db_path
        self._init_database()
    
    def _init_database(self):
        """初始化数据库表结构"""
        import sqlite3
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # 错题卡主表
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS mistake_cards (
                    id TEXT PRIMARY KEY,
                    timestamp TEXT NOT NULL,
                    student_id TEXT NOT NULL,
                    grade TEXT,
                    subject TEXT,
                    topic_tags TEXT,  -- JSON数组
                    difficulty INTEGER,
                    question_text TEXT,
                    student_solution_text TEXT,
                    voice_transcript TEXT,
                    gold_solution_brief TEXT,
                    error_type TEXT,  -- JSON数组
                    error_factors TEXT,  -- JSON数组
                    reasoning_gaps TEXT,  -- JSON数组
                    recommendations TEXT,  -- JSON数组
                    media TEXT,  -- JSON对象
                    embeddings TEXT,  -- JSON对象
                    metadata TEXT,  -- JSON对象
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # 创建索引
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_grade_subject ON mistake_cards(grade, subject)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_difficulty ON mistake_cards(difficulty)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_timestamp ON mistake_cards(timestamp)')
            
            conn.commit()
    
    async def save_card(self, card: MistakeCard) -> str:
        """保存错题卡"""
        import sqlite3
        import json
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT OR REPLACE INTO mistake_cards 
                (id, timestamp, student_id, grade, subject, topic_tags, difficulty,
                 question_text, student_solution_text, voice_transcript, gold_solution_brief,
                 error_type, error_factors, reasoning_gaps, recommendations,
                 media, embeddings, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                card.id,
                card.timestamp.isoformat(),
                card.student_id,
                card.grade,
                card.subject,
                json.dumps(card.topic_tags),
                card.difficulty,
                card.question_text,
                card.student_solution_text,
                card.voice_transcript,
                card.gold_solution_brief,
                json.dumps(card.error_type),
                json.dumps(card.error_factors),
                json.dumps(card.reasoning_gaps),
                json.dumps(card.recommendations),
                json.dumps(card.media),
                json.dumps(card.embeddings),
                json.dumps(card.metadata)
            ))
            
            conn.commit()
            return card.id
    
    async def get_card(self, card_id: str) -> Optional[MistakeCard]:
        """获取错题卡"""
        import sqlite3
        import json
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM mistake_cards WHERE id = ?', (card_id,))
            row = cursor.fetchone()
            
            if not row:
                return None
                
            return self._row_to_card(row)
    
    async def search_cards(self, filters: Dict = None, limit: int = 100, offset: int = 0) -> List[MistakeCard]:
        """搜索错题卡"""
        import sqlite3
        import json
        
        if filters is None:
            filters = {}
            
        query = "SELECT * FROM mistake_cards WHERE 1=1"
        params = []
        
        # 构建过滤条件
        if 'grade' in filters:
            query += " AND grade = ?"
            params.append(filters['grade'])
            
        if 'subject' in filters:
            query += " AND subject = ?"
            params.append(filters['subject'])
            
        if 'difficulty_min' in filters:
            query += " AND difficulty >= ?"
            params.append(filters['difficulty_min'])
            
        if 'difficulty_max' in filters:
            query += " AND difficulty <= ?"
            params.append(filters['difficulty_max'])
            
        if 'date_from' in filters:
            query += " AND timestamp >= ?"
            params.append(filters['date_from'])
            
        if 'date_to' in filters:
            query += " AND timestamp <= ?"
            params.append(filters['date_to'])
        
        query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            rows = cursor.fetchall()
            
            return [self._row_to_card(row) for row in rows]
    
    def _row_to_card(self, row):
        """数据库行转换为MistakeCard对象"""
        import json
        card = MistakeCard()
        
        card.id = row[0]
        card.timestamp = datetime.fromisoformat(row[1])
        card.student_id = row[2]
        card.grade = row[3]
        card.subject = row[4]
        card.topic_tags = json.loads(row[5]) if row[5] else []
        card.difficulty = row[6]
        card.question_text = row[7]
        card.student_solution_text = row[8]
        card.voice_transcript = row[9]
        card.gold_solution_brief = row[10]
        card.error_type = json.loads(row[11]) if row[11] else []
        card.error_factors = json.loads(row[12]) if row[12] else []
        card.reasoning_gaps = json.loads(row[13]) if row[13] else []
        card.recommendations = json.loads(row[14]) if row[14] else []
        card.media = json.loads(row[15]) if row[15] else {}
        card.embeddings = json.loads(row[16]) if row[16] else {}
        card.metadata = json.loads(row[17]) if row[17] else {}
        
        return card
    
    async def delete_card(self, card_id: str) -> bool:
        """删除错题卡"""
        import sqlite3
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM mistake_cards WHERE id = ?', (card_id,))
            conn.commit()
            return cursor.rowcount > 0
    
    async def get_stats(self) -> Dict:
        """获取数据库统计信息"""
        import sqlite3
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            stats = {}
            cursor.execute('SELECT COUNT(*) FROM mistake_cards')
            stats['total_cards'] = cursor.fetchone()[0]
            
            cursor.execute('SELECT COUNT(DISTINCT student_id) FROM mistake_cards')
            stats['unique_students'] = cursor.fetchone()[0]
            
            cursor.execute('SELECT subject, COUNT(*) FROM mistake_cards GROUP BY subject')
            stats['cards_by_subject'] = dict(cursor.fetchall())
            
            return stats
```

### media.store（媒体文件存储）
**功能**：图像、音频等媒体文件的管理

**实现细节**：
```python
class MediaStore:
    def __init__(self, base_dir="./media"):
        self.base_dir = base_dir
        self._ensure_directories()
    
    def _ensure_directories(self):
        """确保必要的目录存在"""
        import os
        directories = [
            'raw',           # 原始图像
            'deskew',        # 矫正后图像
            'roi',           # ROI区域图像
            'tts',           # TTS音频
            'exports'        # 导出文件
        ]
        
        for dir_name in directories:
            os.makedirs(os.path.join(self.base_dir, dir_name), exist_ok=True)
    
    async def save_image(self, image_data, image_type="raw", filename=None):
        """保存图像文件"""
        import os
        from PIL import Image
        import io
        
        if filename is None:
            timestamp = int(datetime.now().timestamp())
            filename = f"{image_type}_{timestamp}.jpg"
        
        filepath = os.path.join(self.base_dir, image_type, filename)
        
        # 如果是字节数据，先转换为PIL图像
        if isinstance(image_data, bytes):
            image = Image.open(io.BytesIO(image_data))
        else:
            image = image_data
        
        # 保存为JPEG格式（压缩）
        image.save(filepath, "JPEG", quality=85)
        
        return f"/media/{image_type}/{filename}"
    
    async def save_audio(self, audio_data, audio_type="tts", filename=None):
        """保存音频文件"""
        import os
        
        if filename is None:
            timestamp = int(datetime.now().timestamp())
            filename = f"{audio_type}_{timestamp}.mp3"
        
        filepath = os.path.join(self.base_dir, audio_type, filename)
        
        with open(filepath, 'wb') as f:
            f.write(audio_data)
        
        return f"/media/{audio_type}/{filename}"
    
    async def get_media_url(self, filepath):
        """获取媒体文件URL"""
        if filepath.startswith('/media/'):
            return filepath
        return f"/media/{filepath}"
    
    async def delete_media(self, filepath):
        """删除媒体文件"""
        import os
        
        # 从URL中提取实际路径
        if filepath.startswith('/media/'):
            relative_path = filepath[7:]  # 去掉'/media/'
            actual_path = os.path.join(self.base_dir, relative_path)
        else:
            actual_path = os.path.join(self.base_dir, filepath)
        
        if os.path.exists(actual_path):
            os.remove(actual_path)
            return True
        return False
    
    async def cleanup_orphaned_media(self, referenced_paths):
        """清理孤儿媒体文件"""
        import os
        import glob
        
        # 获取所有媒体文件
        all_media_files = []
        for root, dirs, files in os.walk(self.base_dir):
            for file in files:
                relative_path = os.path.relpath(os.path.join(root, file), self.base_dir)
                all_media_files.append(f"/media/{relative_path}")
        
        # 找出未被引用的文件
        orphaned_files = set(all_media_files) - set(referenced_paths)
        
        # 删除孤儿文件
        deleted_count = 0
        for filepath in orphaned_files:
            if await self.delete_media(filepath):
                deleted_count += 1
        
        return deleted_count
```

### cache（缓存管理）
**功能**：多级缓存机制，提升性能

**实现细节**：
```python
class CacheManager:
    def __init__(self, max_memory_size=1000, persist_cache=True):
        self.memory_cache = {}  # 内存缓存
        self.disk_cache_dir = "./data/cache"
        self.max_memory_size = max_memory_size
        self.persist_cache = persist_cache
        
        import os
        os.makedirs(self.disk_cache_dir, exist_ok=True)
    
    async def get(self, key, default=None):
        """获取缓存值"""
        # 首先检查内存缓存
        if key in self.memory_cache:
            return self.memory_cache[key]
        
        # 然后检查磁盘缓存
        if self.persist_cache:
            disk_value = await self._get_from_disk(key)
            if disk_value is not None:
                # 加载到内存缓存
                self._set_memory(key, disk_value)
                return disk_value
        
        return default
    
    async def set(self, key, value, ttl=3600):
        """设置缓存值"""
        # 设置内存缓存
        self._set_memory(key, value)
        
        # 设置磁盘缓存
        if self.persist_cache:
            await self._set_to_disk(key, value, ttl)
    
    def _set_memory(self, key, value):
        """设置内存缓存"""
        # 如果超过最大大小，使用LRU淘汰
        if len(self.memory_cache) >= self.max_memory_size:
            # 移除最旧的键
            oldest_key = next(iter(self.memory_cache))
            del self.memory_cache[oldest_key]
        
        self.memory_cache[key] = value
    
    async def _set_to_disk(self, key, value, ttl):
        """设置磁盘缓存"""
        import pickle
        import os
        import time
        
        filename = self._get_disk_filename(key)
        cache_data = {
            'value': value,
            'expires_at': time.time() + ttl if ttl else None
        }
        
        with open(filename, 'wb') as f:
            pickle.dump(cache_data, f)
    
    async def _get_from_disk(self, key):
        """从磁盘获取缓存"""
        import pickle
        import os
        import time
        
        filename = self._get_disk_filename(key)
        
        if not os.path.exists(filename):
            return None
        
        try:
            with open(filename, 'rb') as f:
                cache_data = pickle.load(f)
            
            # 检查是否过期
            if cache_data['expires_at'] and time.time() > cache_data['expires_at']:
                os.remove(filename)
                return None
            
            return cache_data['value']
        except (pickle.PickleError, EOFError):
            # 缓存文件损坏，删除之
            os.remove(filename)
            return None
    
    def _get_disk_filename(self, key):
        """获取磁盘缓存文件名"""
        import hashlib
        key_hash = hashlib.md5(key.encode()).hexdigest()
        return os.path.join(self.disk_cache_dir, f"{key_hash}.cache")
    
    async def invalidate(self, key):
        """使缓存失效"""
        if key in self.memory_cache:
            del self.memory_cache[key]
        
        if self.persist_cache:
            filename = self._get_disk_filename(key)
            import os
            if os.path.exists(filename):
                os.remove(filename)
    
    async def clear(self):
        """清空所有缓存"""
        self.memory_cache.clear()
        
        if self.persist_cache:
            import os
            import glob
            cache_files = glob.glob(os.path.join(self.disk_cache_dir, "*.cache"))
            for file in cache_files:
                os.remove(file)
```

### migrations（数据迁移）
**功能**：数据库版本管理和迁移

**实现细节**：
```python
class MigrationManager:
    def __init__(self, db_path="./data/mistake_note.db"):
        self.db_path = db_path
        self.migrations_dir = "./storage/migrations"
        self._ensure_migrations_table()
    
    def _ensure_migrations_table(self):
        """确保迁移记录表存在"""
        import sqlite3
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS migrations (
                    version INTEGER PRIMARY KEY,
                    name TEXT NOT NULL,
                    applied_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            conn.commit()
    
    async def get_current_version(self):
        """获取当前数据库版本"""
        import sqlite3
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT MAX(version) FROM migrations')
            result = cursor.fetchone()
            return result[0] if result[0] is not None else 0
    
    async def migrate(self, target_version=None):
        """执行数据库迁移"""
        import os
        import sqlite3
        
        current_version = await self.get_current_version()
        
        # 获取所有迁移文件
        migration_files = []
        if os.path.exists(self.migrations_dir):
            for filename in os.listdir(self.migrations_dir):
                if filename.endswith('.sql'):
                    version = int(filename.split('_')[0])
                    migration_files.append((version, filename))
        
        migration_files.sort()
        
        # 确定目标版本
        if target_version is None:
            target_version = migration_files[-1][0] if migration_files else current_version
        
        # 执行迁移
        with sqlite3.connect(self.db_path) as conn:
            for version, filename in migration_files:
                if version > current_version and version <= target_version:
                    # 执行迁移SQL
                    with open(os.path.join(self.migrations_dir, filename), 'r') as f:
                        sql_script = f.read()
                    
                    try:
                        conn.executescript(sql_script)
                        
                        # 记录迁移
                        cursor = conn.cursor()
                        cursor.execute(
                            'INSERT INTO migrations (version, name) VALUES (?, ?)',
                            (version, filename)
                        )
                        conn.commit()
                        
                        logger.info(f"成功执行迁移: {filename}")
                        
                    except Exception as e:
                        logger.error(f"迁移失败 {filename}: {e}")
                        raise
        
        return await self.get_current_version()
```

## 使用示例

### 数据库操作使用
```python
from storage.db.sqlite import DatabaseManager, MistakeCard

# 初始化数据库管理器
db_manager = DatabaseManager()

# 创建错题卡
card = MistakeCard()
card.question_text = "已知2x+3=11，求x"
card.student_solution_text = "2x=11-3, 2x=9, x=4.5"
card.error_type = ["计算错误"]

# 保存错题卡
card_id = await db_manager.save_card(card)

# 检索错题卡
retrieved_card = await db_manager.get_card(card_id)

# 搜索错题卡
math_cards = await db_manager.search_cards(
    filters={"subject": "math", "grade": "G6"},
    limit=10
)
```

### 媒体文件管理使用
```python
from storage.media.store import MediaStore

media_store = MediaStore()

# 保存图像
image_url = await media_store.save_image(image_data, "deskew")

# 保存音频
audio_url = await media_store.save_audio(audio_data, "tts")

# 清理孤儿文件
deleted_count = await media_store.cleanup_orphaned_media(referenced_paths)
```

### 缓存管理使用
```python
from storage.cache import CacheManager

cache_manager = CacheManager()

# 设置缓存
await cache_manager.set("ocr_result_123", ocr_result, ttl=3600)

# 获取缓存
cached_result = await cache_manager.get("ocr_result_123")

# 使缓存失效
await cache_manager.invalidate("ocr_result_123")
```

### 数据迁移使用
```python
from storage.migrations import MigrationManager

migration_manager = MigrationManager()

# 执行迁移到最新版本
new_version = await migration_manager.migrate()

# 执行迁移到特定版本
target_version = await migration_manager.migrate(target_version=2)
```

## 性能优化

### 数据库优化配置
```python
# SQLite性能优化配置
DB_OPTIMIZATION_CONFIG = {
    "journal_mode": "WAL",  # 写前日志模式
    "synchronous": "NORMAL",  # 同步模式
    "cache_size": -64000,   # 缓存大小（64MB）
    "temp_store": "MEMORY"  # 临时表存储在内存
}

# 应用优化配置
def apply_db_optimizations(conn):
    """应用数据库优化配置"""
    for key, value in DB_OPTIMIZATION_CONFIG.items():
        conn.execute(f"PRAGMA {key} = {value}")
```

### 批量操作优化
```python
class BatchOperations:
    """批量操作优化"""
    
    async def batch_save_cards(self, cards):
        """批量保存错题卡"""
        import sqlite3
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # 开启事务
            cursor.execute('BEGIN TRANSACTION')
            
            try:
                for card in cards:
                    # 执行插入操作
                    cursor.execute('INSERT INTO mistake_cards ...', card_data)
                
                conn.commit()
            except Exception as e:
                conn.rollback()
                raise e
```

## 数据备份和恢复

### 备份工具
```python
class BackupManager:
    """数据备份管理"""
    
    def __init__(self, backup_dir="./backups"):
        self.backup_dir = backup_dir
        import os
        os.makedirs(backup_dir, exist_ok=True)
    
    async def create_backup(self, include_media=True):
        """创建数据备份"""
        import shutil
        import datetime
        
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = os.path.join(self.backup_dir, f"backup_{timestamp}")
        
        # 备份数据库
        shutil.copy2("./data/mistake_note.db", os.path.join(backup_path, "database.db"))
        
        # 备份媒体文件（可选）
        if include_media:
            shutil.copytree("./media", os.path.join(backup_path, "media"))
        
        return backup_path
    
    async def restore_backup(self, backup_path):
        """恢复数据备份"""
        import shutil
        
        # 恢复数据库
        shutil.copy2(os.path.join(backup_path, "database.db"), "./data/mistake_note.db")
        
        # 恢复媒体文件（如果存在）
        media_backup = os.path.join(backup_path, "media")
        if os.path.exists(media_backup):
            shutil.rmtree("./media")
            shutil.copytree(media_backup, "./media")
```

## 测试要点
- 数据库CRUD操作测试
- 媒体文件读写测试
- 缓存命中率测试
- 数据迁移测试
- 备份恢复测试
- 并发访问测试
- 性能基准测试
