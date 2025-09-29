# 数据库目录结构

本目录包含所有数据库相关的配置、文档和测试文件。

## 目录结构

```
db/
├── README.md                          # 本文件
├── DATABASE_SETUP_COMPLETE.md         # 完整的数据库配置指南
├── database_config.py                 # PostgreSQL数据库配置
├── sqlite_config.py                   # SQLite数据库配置
├── mistake_note.db                    # SQLite数据库文件
├── docker-compose.yml                 # Docker容器配置
├── test_postgres_connection.py        # PostgreSQL连接测试
├── test_full_integration.py           # 完整集成测试
├── test_logging_with_real_api.py      # 日志功能测试
└── docker/                            # Docker相关文件
    └── postgres/
        └── init/
            └── 01-init-tables.sql     # 数据库表初始化脚本
```

## 文件说明

### 配置文件
- **database_config.py**: PostgreSQL数据库配置，包含模型定义和数据库操作函数
- **sqlite_config.py**: SQLite数据库配置，与PostgreSQL版本功能相同
- **docker-compose.yml**: Docker容器配置，用于启动PostgreSQL数据库

### 文档
- **DATABASE_SETUP_COMPLETE.md**: 完整的数据库配置指南，包含所有数据库方案

### 测试文件
- **test_postgres_connection.py**: PostgreSQL数据库连接测试
- **test_full_integration.py**: 完整集成测试
- **test_logging_with_real_api.py**: 数据库日志功能测试

### 数据库文件
- **mistake_note.db**: SQLite数据库文件

### Docker文件
- **docker/postgres/init/01-init-tables.sql**: 数据库表初始化脚本

## 使用说明

### 快速开始（推荐使用SQLite）
```bash
# 初始化SQLite数据库
python db/sqlite_config.py
```

### 使用PostgreSQL Docker
```bash
# 启动PostgreSQL容器
docker-compose -f db/docker-compose.yml up -d
```

### 在应用中使用
```python
# 使用PostgreSQL
from db.database_config import get_db, save_mistake_record

# 使用SQLite
from db.sqlite_config import get_db, save_mistake_record
```

## 数据库方案

### SQLite（推荐用于开发）
- 简单易用，无需额外安装
- 性能良好，适合中小型应用
- 文件存储，便于备份和迁移

### PostgreSQL（推荐用于生产）
- 性能优秀，支持高并发
- 功能完整，适合大型部署
- 支持复杂查询和事务

## 数据表结构

### 主要表
1. **mistake_records** - 错题记录表
2. **mistake_analysis** - 错题分析表
3. **users** - 用户表（未来扩展）
4. **review_plans** - 复习计划表

## 故障排除

### 常见问题
1. **导入错误**: 确保使用正确的导入路径 `from db.database_config import ...`
2. **连接失败**: 检查数据库服务是否运行
3. **权限问题**: 验证数据库用户权限

### 测试数据库连接
```bash
# 测试PostgreSQL连接
python db/test_postgres_connection.py

# 测试SQLite连接
python db/sqlite_config.py
```

## 维护说明

- 定期备份数据库文件
- 更新数据库配置时注意兼容性
- 测试环境使用SQLite，生产环境使用PostgreSQL
