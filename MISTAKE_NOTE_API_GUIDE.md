# 错题本API使用指南

本文档介绍错题本系统的API功能，包括保存subject字段和错题本查询API。

## 功能概述

### 1. 保存subject字段
- 在保存coze分析结果到数据库时，现在会保存subject（学科）字段
- subject字段存储在`mistake_analysis`表中
- 支持后续按学科进行查询和筛选

### 2. 错题本查询API
- 提供错题本一览查询功能
- 支持多种查询条件组合
- 支持分页查询

## API端点

### 1. 错题本列表查询
```
GET /mistakes
```

**查询参数：**
- `subject` (可选): 按学科查询，如：数学、物理、化学
- `error_type` (可选): 按错误类型查询，如：计算错误、概念不清
- `knowledge_point` (可选): 按知识点查询，支持模糊查询
- `skip` (可选): 跳过的记录数，默认0
- `limit` (可选): 返回的最大记录数，默认100

**响应示例：**
```json
{
  "total_count": 50,
  "skip": 0,
  "limit": 10,
  "mistakes": [
    {
      "mistake_record_id": 1,
      "file_info": {
        "file_id": "uuid-123",
        "filename": "math_problem.png",
        "file_url": "/media/uploads/uuid-123.png",
        "file_size": 102400,
        "file_type": "image/png",
        "upload_time": "2025-01-01T10:00:00",
        "created_at": "2025-01-01T10:00:00"
      },
      "analysis": {
        "id": 1,
        "subject": "数学",
        "section": "计算题",
        "question": "计算：1/2 + 1/3 = ?",
        "answer": "",
        "is_question": true,
        "is_correct": false,
        "correct_answer": "5/6",
        "comment": "需要先找到公分母...",
        "error_type": "计算错误",
        "knowledge_point": "分数运算",
        "created_at": "2025-01-01T10:00:00"
      }
    }
  ]
}
```

### 2. 错题详情查询
```
GET /mistake/{mistake_id}
```

**路径参数：**
- `mistake_id`: 错题记录的主键ID

**响应示例：**
```json
{
  "file_info": {
    "id": 1,
    "file_id": "uuid-123",
    "filename": "math_problem.png",
    "file_url": "/media/uploads/uuid-123.png",
    "file_size": 102400,
    "file_type": "image/png",
    "upload_time": "2025-01-01T10:00:00",
    "created_at": "2025-01-01T10:00:00"
  },
  "analysis": [
    {
      "id": 1,
      "section": "计算题",
      "question": "计算：1/2 + 1/3 = ?",
      "answer": "",
      "is_question": true,
      "is_correct": false,
      "correct_answer": "5/6",
      "comment": "需要先找到公分母...",
      "error_type": "计算错误",
      "knowledge_point": "分数运算",
      "created_at": "2025-01-01T10:00:00"
    }
  ]
}
```

## 使用示例

### 1. 查询所有错题
```bash
curl "http://localhost:8000/mistakes"
```

### 2. 按学科查询
```bash
curl "http://localhost:8000/mistakes?subject=数学"
```

### 3. 按错误类型查询
```bash
curl "http://localhost:8000/mistakes?error_type=计算错误"
```

### 4. 按知识点模糊查询
```bash
curl "http://localhost:8000/mistakes?knowledge_point=分数"
```

### 5. 组合查询
```bash
curl "http://localhost:8000/mistakes?subject=数学&error_type=计算错误"
```

### 6. 分页查询
```bash
curl "http://localhost:8000/mistakes?skip=10&limit=5"
```

## 数据库结构变更

### 新增字段
在`mistake_analysis`表中新增了`subject`字段：

```sql
ALTER TABLE mistake_analysis ADD COLUMN subject VARCHAR(100);
```

### 新增索引
为提高查询性能，新增了subject字段的索引：
```sql
CREATE INDEX idx_mistake_analysis_subject ON mistake_analysis(subject);
```

## 测试方法

### 1. 启动服务
```bash
cd app
uvicorn app:app --reload
```

### 2. 运行测试
```bash
python test_mistake_api.py
```

## 前端集成建议

### 1. 学科筛选
前端可以提供一个学科筛选器，使用`subject`参数进行查询。

### 2. 错误类型筛选
提供错误类型下拉菜单，使用`error_type`参数进行查询。

### 3. 知识点搜索
提供搜索框，使用`knowledge_point`参数进行模糊查询。

### 4. 分页组件
使用`skip`和`limit`参数实现分页功能。

## 注意事项

1. **subject字段来源**: subject字段从coze分析结果中提取，需要确保coze工作流返回的数据中包含subject信息。

2. **查询性能**: 已为subject、error_type、knowledge_point字段添加索引，确保查询性能。

3. **错误处理**: API会返回适当的HTTP状态码和错误信息，前端需要处理这些错误情况。

4. **数据一致性**: 保存数据时会同时保存到文件系统和数据库，确保数据一致性。

## 更新日志

- **2025-01-01**: 新增subject字段保存功能
- **2025-01-01**: 新增错题本查询API
- **2025-01-01**: 新增数据库索引优化查询性能
