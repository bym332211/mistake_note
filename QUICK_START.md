# 快速启动指南

## 数据库安装完成！

您的本地数据库环境已经成功配置。系统提供了多种数据库选项：

## 已完成的配置

### ✅ SQLite数据库（推荐使用）
- **状态**: 已安装并测试通过
- **数据库文件**: `mistake_note.db`
- **包含示例数据**: 2条错题记录和对应的分析数据
- **测试结果**: 所有功能正常

### ✅ PostgreSQL Docker配置
- **状态**: 配置完成（需要Docker环境）
- **配置文件**: `docker-compose.yml`
- **初始化脚本**: `docker/postgres/init/01-init-tables.sql`

### ✅ 数据库连接配置
- **PostgreSQL配置**: `database_config.py`
- **SQLite配置**: `sqlite_config.py`
- **使用说明**: `DATABASE_SETUP.md` 和 `LOCAL_DB_SETUP.md`

## 立即开始使用

### 使用SQLite数据库（推荐）

1. **数据库已自动初始化**，包含示例数据
2. **在代码中使用数据库**：

```python
from sqlite_config import get_db, save_mistake_record, get_mistake_records

# 获取数据库会话
db = next(get_db())

# 保存新的错题记录
file_data = {
    "file_id": "new-file-id",
    "filename": "new_problem.png",
    "file_url": "/media/uploads/new_problem.png",
    "file_size": 153600,
    "file_type": "image/png",
    "upload_time": "2024-01-01T10:00:00"
}

analysis_data = [
    {
        "section": "代数题",
        "question": "解方程：2x + 5 = 15",
        "answer": "x=4",
        "is_question": True,
        "is_correct": False,
        "correct_answer": "x=5",
        "comment": "应该是2x=10，所以x=5",
        "error_type": "计算错误",
        "knowledge_point": "一元一次方程"
    }
]

save_mistake_record(db, file_data, analysis_data)
```

3. **查询数据**：

```python
from sqlite_config import get_db, get_mistake_records

db = next(get_db())
records = get_mistake_records(db)

for record in records:
    print(f"文件: {record.filename}, 上传时间: {record.upload_time}")
```

## 集成到现有应用

### 修改app.py使用数据库

在`app/app.py`中添加数据库集成：

```python
# 在文件顶部添加导入
from sqlite_config import get_db, save_mistake_record

# 在upload_image函数中保存数据
@app.post("/upload/image")
async def upload_image(image: UploadFile = File(...)):
    # ... 现有代码 ...
    
    # 在返回结果前保存到数据库
    db = next(get_db())
    try:
        save_mistake_record(db, result, coze_analysis)
    except Exception as e:
        logger.error(f"保存到数据库失败: {e}")
    
    return result
```

## 数据库管理

### 查看数据库内容

```bash
# 使用SQLite命令行工具查看
sqlite3 mistake_note.db

# 在SQLite命令行中
.tables                    # 查看所有表
SELECT * FROM mistake_records;  # 查看错题记录
SELECT * FROM mistake_analysis; # 查看分析记录
.quit                      # 退出
```

### 备份数据库

```bash
# 备份SQLite数据库
cp mistake_note.db mistake_note_backup.db
```

## 下一步操作

1. **集成数据库到应用**: 修改`app/app.py`使用数据库功能
2. **添加数据查询API**: 创建查询错题记录的API端点
3. **实现相似错题推荐**: 使用数据库查询实现错题推荐功能
4. **数据统计功能**: 添加错题统计和分析功能

## 故障排除

如果遇到问题：

1. **数据库连接失败**
   - 检查`mistake_note.db`文件是否存在
   - 确保有文件读写权限

2. **表不存在**
   - 重新运行`python sqlite_config.py`初始化数据库

3. **数据保存失败**
   - 检查数据格式是否符合模型定义
   - 查看日志文件获取详细错误信息

## 生产环境建议

对于生产环境，建议：

1. **使用PostgreSQL**: 性能更好，支持并发
2. **设置定期备份**: 自动备份数据库
3. **监控数据库性能**: 使用数据库监控工具
4. **数据迁移**: 使用Alembic进行数据库版本管理

---

**您现在可以开始使用数据库功能了！** 数据库已准备就绪，包含示例数据供测试使用。
