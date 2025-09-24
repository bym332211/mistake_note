# 手动测试指南

## 测试准备
1. 确保已安装依赖：
```bash
pip install -r requirements.txt
```

2. 创建环境配置文件：
```bash
copy .env.example .env
```

## 测试方法

### 方法1：分别启动后端和前端（推荐用于调试）

**步骤1：启动后端API**
```bash
python app/app.py
```
预期输出：
```
INFO:     Started server process [PID]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:7860 (Press CTRL+C to quit)
```

**步骤2：测试API端点**
在浏览器中访问：`http://localhost:7860`
或使用curl：
```bash
curl http://localhost:7860
```
预期响应（无API密钥时）：
```json
{"status":"warning","missing_keys":["BAIDU_OCR_API_KEY","BAIDU_ASR_API_KEY","BAIDU_TTS_API_KEY","LLM_API_KEY"]}
```

**步骤3：启动前端UI**
```bash
python ui/ui.py
```
预期输出：
```
Running on local URL:  http://127.0.0.1:7861
```

**步骤4：访问前端界面**
在浏览器中访问：`http://localhost:7861`

### 方法2：使用Makefile一键启动

```bash
make dev
```
这会同时启动后端和前端服务。

## 测试验证点

✅ **后端服务验证**：
- FastAPI服务器正常启动
- 环境变量加载正常
- API密钥缺失检测功能正常
- 返回正确的JSON响应

✅ **前端服务验证**：
- Gradio界面正常启动
- 基本UI组件显示正常
- 无摄像头权限弹窗（符合设计原则）

✅ **项目结构验证**：
- 所有必要目录存在：`/app`, `/ui`, `/data`, `/media`, `/scripts`
- 核心配置文件完整：`requirements.txt`, `README.md`, `.env.example`, `.gitignore`

## 故障排除

**如果启动失败**：
1. 检查Python版本：`python --version`（推荐Python 3.8+）
2. 检查依赖安装：`pip list | grep -E "(gradio|fastapi)"`
3. 检查端口占用：`netstat -ano | findstr :7860`

**如果API响应异常**：
1. 检查.env文件是否存在
2. 确认服务是否正常启动
3. 查看控制台错误日志

## 测试完成标准

- [ ] 后端API在7860端口正常启动
- [ ] 前端UI在7861端口正常启动  
- [ ] API返回正确的状态信息
- [ ] 无摄像头权限弹窗干扰
- [ ] 所有核心文件可正常访问
