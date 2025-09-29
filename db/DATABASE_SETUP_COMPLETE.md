# 数据库配置完整指南

本文档整合了所有数据库相关的配置、安装、故障排除和集成信息，提供完整的数据库解决方案。

## 🎉 快速开始

### 推荐方案：SQLite（简单快速）
```bash
# 初始化SQLite数据库
python sqlite_config.py
```

### 备选方案：PostgreSQL Docker（生产环境）
```bash
# 启动PostgreSQL容器
docker-compose up -d
```

## 数据库方案选择

| 数据库 | 安装复杂度 | 性能 | 功能完整性 | 推荐场景 |
|--------|------------|------|------------|----------|
| **SQLite** | 非常简单 | 良好 | 完整 | 开发、测试、小型部署 |
| **PostgreSQL** | 中等 | 优秀 | 完整 | 生产环境、大型部署 |
| **SQL Server** | 中等 | 优秀 | 完整 | Windows环境、企业部署 |

## 方案一：SQLite数据库（推荐）

### 1. 安装SQLite
Windows系统通常已预装SQLite，如果没有，从以下地址下载：
https://www.sqlite.org/download.html

### 2. 初始化数据库
```bash
python sqlite_config.py
```

### 3. 验证数据库
```bash
# 查看数据库内容
sqlite3 mistake_note.db
.tables
SELECT * FROM mistake_records;
.quit
```

## 方案二：PostgreSQL Docker

### 1. 启动数据库容器
```bash
docker-compose up -d
```

### 2. 验证运行状态
```bash
# 检查容器状态
docker ps

# 检查数据库健康状态
docker logs mistake_note_db

# 连接到数据库测试
docker exec -it mistake_note_db psql -U mistake_user -d mistake_note
```

### 3. 数据库连接信息
- **主机**: `localhost`
- **端口**: `5432`
- **数据库名**: `mistake_note`
- **用户名**: `mistake_user`
- **密码**: `mistake_password`

## 方案三：手动安装PostgreSQL

### 1. 下载安装
访问官网下载：https://www.postgresql.org/download/windows/

### 2. 创建数据库和用户
```sql
-- 创建数据库
CREATE DATABASE mistake_note;

-- 创建用户
CREATE USER mistake_user WITH PASSWORD 'mistake_password';

-- 授权
GRANT ALL PRIVILEGES ON DATABASE mistake_note TO mistake_user;
```

## 数据库结构

### 主要表结构

#### 1. mistake_records (错题记录表)
- `id`: 主键
- `file_id`: 文件唯一标识
- `filename`: 文件名
- `file_url`: 文件访问URL
- `file_size`: 文件大小
- `file_type`: 文件类型
- `upload_time`: 上传时间
- `created_at`: 创建时间
- `updated_at`: 更新时间

#### 2. mistake_analysis (错题分析表)
- `id`: 主键
- `mistake_record_id`: 关联错题记录ID
- `section`: 题目类型/章节
- `question`: 题目内容
- `answer`: 学生答案
- `is_question`: 是否为问题
- `is_correct`: 是否正确
- `correct_answer`: 正确答案
- `comment`: 评语/解析
- `error_type`: 错因类型
- `knowledge_point`: 知识点
- `analysis_data`: 完整分析数据(JSON)
- `created_at`: 创建时间

#### 3. users (用户表 - 未来扩展)
- `id`: 主键
- `username`: 用户名
- `email`: 邮箱
- `created_at`: 创建时间

#### 4. review_plans (复习计划表)
- `id`: 主键
- `user_id`: 用户ID
- `plan_name`: 计划名称
- `plan_data`: 计划详情(JSON)
- `created_at`: 创建时间
- `scheduled_date`: 计划日期

## 在应用中使用数据库

### 1. 导入数据库配置
```python
# 使用PostgreSQL
from database_config import get_db, save_mistake_record, get_mistake_records

# 使用SQLite
from sqlite_config import get_db, save_mistake_record, get_mistake_records
```

### 2. 保存错题记录
```python
from database_config import get_db, save_mistake_record

# 获取数据库会话
db = next(get_db())

# 保存错题记录
file_data = {
    "file_id": "unique-file-id",
    "filename": "math_problem.png",
    "file_url": "/media/uploads/math_problem.png",
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

### 3. 查询数据
```python
from database_config import get_db, get_mistake_records, get_mistake_analysis_by_file_id

db = next(get_db())

# 获取所有错题记录
records = get_mistake_records(db)

# 根据文件ID获取分析结果
analysis = get_mistake_analysis_by_file_id(db, "unique-file-id")
```

## Coze API与数据库集成

### 集成流程
```
用户上传图片
    ↓
FastAPI接收文件
    ↓
保存文件到media/uploads
    ↓
调用Coze工作流API
    ↓
Coze返回分析结果
    ↓
转换数据格式
    ↓
保存到数据库
    ↓
返回结果给用户
```

### 自动保存
每次Coze API返回后，数据会自动保存到数据库：
- 保存到 `mistake_records` 表：文件信息
- 保存到 `mistake_analysis` 表：分析结果

## 数据库管理

### 容器管理（PostgreSQL Docker）
```bash
# 停止数据库
docker-compose down

# 停止并删除数据卷
docker-compose down -v

# 重启数据库
docker-compose restart

# 查看日志
docker logs mistake_note_db -f
```

### 数据库管理
```bash
# 进入数据库容器
docker exec -it mistake_note_db bash

# 连接到数据库
psql -U mistake_user -d mistake_note

# 查看所有表
\dt

# 查看表结构
\d table_name

# 退出
\q
```

### 数据备份
```bash
# PostgreSQL备份
docker exec mistake_note_db pg_dump -U mistake_user mistake_note > backup.sql

# PostgreSQL恢复
docker exec -i mistake_note_db psql -U mistake_user mistake_note < backup.sql

# SQLite备份
cp mistake_note.db mistake_note.db.backup
```

## 数据库日志

### 日志输出示例
```
📝 开始保存错题记录到数据库...
📁 文件信息: file_id=318eb1ff-a73b-4368-98da-4af37b986532, filename=test.png, size=284
✅ 错题记录创建成功，记录ID: 7
📊 开始保存分析数据，共 1 条记录
🎉 数据库保存完成！错题记录ID: 7, 分析记录数: 1
```

### 查看日志
```bash
# 查看应用日志
type app\coze_api.log | Select-Object -Last 20

# 查看数据库日志（PostgreSQL）
docker logs mistake_note_db
```

## 故障排除

### 常见问题

#### 1. Docker连接失败
**错误信息**：API版本兼容性问题
```bash
# 解决方案：使用SQLite
python sqlite_config.py
```

#### 2. 数据库连接被拒绝
- 检查Docker容器是否正在运行
- 验证端口5432是否被占用
- 检查防火墙设置

#### 3. 认证失败
- 验证用户名和密码
- 检查数据库是否存在

#### 4. 表不存在
- 运行数据库初始化脚本
- 检查初始化脚本是否执行成功

### 日志查看
```bash
# 查看数据库日志
docker logs mistake_note_db

# 查看详细的PostgreSQL日志
docker exec mistake_note_db cat /var/lib/postgresql/data/log/postgresql-*.log
```

## 凭据管理

### 当前配置（开发环境）
- **用户名**: `mistake_user`
- **密码**: `mistake_password`
- **数据库**: `mistake_note`

### 生产环境安全配置

#### 方案一：使用环境变量文件
1. 创建 `.env` 文件：
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mistake_note
DB_USER=your_secure_username
DB_PASSWORD=your_secure_password
```

2. 修改 `docker-compose.yml`：
```yaml
services:
  postgres:
    image: postgres:13
    env_file:
      - .env
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
```

#### 方案二：使用Docker Secrets（生产环境）
```yaml
services:
  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB_FILE: /run/secrets/db_name
      POSTGRES_USER_FILE: /run/secrets/db_user
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_name
      - db_user
      - db_password

secrets:
  db_name:
    file: ./secrets/db_name.txt
  db_user:
    file: ./secrets/db_user.txt
  db_password:
    file: ./secrets/db_password.txt
```

## 性能优化

### 连接池配置
```python
from sqlalchemy.pool import QueuePool

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20
)
```

### 索引优化
已为常用查询字段创建索引：
- `file_id` - 文件唯一标识
- `upload_time` - 上传时间
- `error_type` - 错因类型
- `knowledge_point` - 知识点

## 安全最佳实践

1. **不要提交敏感信息到版本控制**
   - 将 `.env` 添加到 `.gitignore`
   - 使用环境变量或密钥管理服务

2. **定期轮换密码**
   - 生产环境定期更换数据库密码
   - 使用密码管理工具

3. **最小权限原则**
   - 为应用创建专用数据库用户
   - 只授予必要的权限

4. **网络隔离**
   - 限制数据库端口的外部访问
   - 使用内部网络通信

## 生产环境建议

1. **修改默认密码**: 在生产环境中使用强密码
2. **启用SSL**: 配置SSL连接
3. **定期备份**: 设置自动备份策略
4. **监控**: 集成数据库监控工具
5. **高可用**: 考虑主从复制配置

## 数据迁移

如果未来需要从SQLite迁移到PostgreSQL，可以使用以下工具：
- **Alembic**: 数据库迁移工具
- **SQLite to PostgreSQL**: 数据导出导入工具

## 验证和测试

### 验证数据库连接
```bash
# PostgreSQL验证
docker exec mistake_note_db psql -U mistake_user -d mistake_note -c "SELECT current_user;"

# SQLite验证
python sqlite_config.py
```

### 测试上传功能
```bash
# 使用curl测试上传
curl -X POST -F "image=@test_image.png" http://127.0.0.1:8001/upload/image
```

### 检查数据库记录
```bash
# 查看错题记录
docker exec mistake_note_db psql -U mistake_user -d mistake_note -c "SELECT * FROM mistake_records;"

# 查看错题分析
docker exec mistake_note_db psql -U mistake_user -d mistake_note -c "SELECT * FROM mistake_analysis;"
```

## 总结

**推荐使用SQLite方案**进行开发和测试，因为它：
- 简单易用，无需Docker
- 功能完整，性能足够
- 可以无缝迁移到PostgreSQL

**生产环境建议使用PostgreSQL**，因为它：
- 性能更好，支持并发访问
- 功能更完整，适合大型部署
- 有更好的监控和管理工具

---

**您现在可以开始使用数据库了！所有配置已完成并测试通过。**
