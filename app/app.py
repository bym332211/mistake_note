import os
import uuid
import io
import logging
from contextlib import contextmanager
from typing import Optional
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import json
import sys
# -*- coding: utf-8 -*-
import os

# 将项目根目录加入 Python 路径，便于导入数据库配置
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from db.database_config import get_db, save_mistake_record, MistakeRecord, MistakeAnalysis, MistakePractice
    DATABASE_AVAILABLE = True
except ImportError as e:
    logger = logging.getLogger('coze_api')
    logger.warning(f"数据库配置导入失败: {e}，将不会保存数据到数据库")
    DATABASE_AVAILABLE = False



# 配置日志

LOG_DIR = os.getenv("LOG_DIR", "logs")
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "coze_api.log")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE, encoding='utf-8'),
        logging.StreamHandler(),
    ],
)

logger = logging.getLogger('coze_api')



load_dotenv()



app = FastAPI()

class ErrorTypeUpdateRequest(BaseModel):
    """请求体：更新错题的错误原因"""
    mistake_record_id: int
    error_type: str
    analysis_id: Optional[int] = None


@contextmanager
def db_session():
    """Provide a one-off SQLAlchemy session that always closes."""
    db_gen = get_db()
    db = next(db_gen)
    try:
        yield db
    finally:
        db_gen.close()


# 添加 CORS 中间件

app.add_middleware(

    CORSMiddleware,

    allow_origins=["*"],  # 允许所有来源（生产环境请按需限制）

    allow_credentials=True,

    allow_methods=["*"],  # 允许所有方法

    allow_headers=["*"],  # 允许所有头

)



# 挂载媒体目录为静态文件
import os
media_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "media")
app.mount("/media", StaticFiles(directory=media_dir), name="media")



def transform_coze_result(coze_data):
    """将 Coze API 返回的题目列表标准化为前端需要的结构"""
    if not isinstance(coze_data, list):
        return []

    normalized = []
    for item in coze_data:
        # 处理嵌套结构：如果 item 包含 output 字段，则提取其中的 questions
        if isinstance(item, dict) and "output" in item and isinstance(item["output"], list):
            for output_item in item["output"]:
                if isinstance(output_item, dict) and "questions" in output_item and isinstance(output_item["questions"], list):
                    for question in output_item["questions"]:
                        normalized_item = {
                            "id": output_item.get("id", ""),
                            "subject": output_item.get("subject") or "",  # 学科
                            "section": output_item.get("section") or "",
                            "question": question.get("question") or "",
                            "answer": question.get("answer") or "",
                            "is_question": bool(question.get("is_question", True)),
                            "is_correct": bool(question.get("is_correct", False)),
                            "correct_answer": question.get("correct_answer") or "",
                            "comment": question.get("comment") or "",
                            "error_type": None,
                            "knowledge_point": ", ".join(output_item.get("knowledge_points", [])) if output_item.get("knowledge_points") else None
                        }
                        normalized.append(normalized_item)
        else:
            # 处理普通结构
            normalized_item = {
                "id": str(item.get("id", "")),
                "subject": item.get("subject") or "",  # 学科
                "section": item.get("section") or "",
                "question": item.get("question") or "",
                "answer": item.get("answer") or "",
                "is_question": bool(item.get("is_question", True)),
                "is_correct": bool(item.get("is_correct", False)),
                "correct_answer": item.get("correct_answer") or "",
                "comment": item.get("comment") or "",
            }

            for key, value in item.items():
                if key not in normalized_item:
                    normalized_item[key] = value

            normalized.append(normalized_item)

    return normalized



def extract_practices_from_payload(data):
    """从 Coze 返回中提取 practices 列表。
    兼容顶层/嵌套 output 节点两种结构。
    """
    practices = []

    def normalize(p):
        return {
            "question": (p or {}).get("question") or "",
            "correct_answer": (p or {}).get("correct_answer") or "",
            "comment": (p or {}).get("comment") or "",
        }

    def collect_from_obj(obj):
        if not isinstance(obj, dict):
            return
        if isinstance(obj.get("practices"), list):
            for p in obj["practices"]:
                if isinstance(p, dict):
                    practices.append(normalize(p))
        # 遍历 output 节点
        outs = obj.get("output")
        if isinstance(outs, list):
            for out in outs:
                if isinstance(out, dict) and isinstance(out.get("practices"), list):
                    for p in out["practices"]:
                        if isinstance(p, dict):
                            practices.append(normalize(p))
                # 同时检查每个 output 下的 questions 中是否内嵌 practices
                if isinstance(out, dict) and isinstance(out.get("questions"), list):
                    for q in out["questions"]:
                        if isinstance(q, dict) and isinstance(q.get("practices"), list):
                            for p in q["practices"]:
                                if isinstance(p, dict):
                                    practices.append(normalize(p))

    if isinstance(data, list):
        for item in data:
            if isinstance(item, dict):
                collect_from_obj(item)
    elif isinstance(data, dict):
        collect_from_obj(data)
        # 常见嵌套载荷 data/items/records 等
        for key in ("data", "items", "records", "result", "payload"):
            v = data.get(key)
            if isinstance(v, (list, dict)):
                practices.extend(extract_practices_from_payload(v))

    return practices


async def call_coze_workflow(image_data: bytes, filename: Optional[str] = None) -> dict:
    """调用 Coze 工作流进行图像分析（非流式 /v1/workflow/run)
    依赖环境变量：
      - COZE_API_HOST          （可选，默认 api.coze.cn；若 token 来自 coze.com，请设为 api.coze.com）
      - COZE_ACCESS_TOKEN 或 COZE_API_KEY  （二选一，建议前者；必需）
      - COZE_WORKFLOW_ID       （必需；工作流已发布）
      - COZE_BOT_ID            （可选；某些工作流需要）
      - COZE_APP_ID            （可选；与 BOT_ID 二选一传，不要都传）
    """
    import json

    from fastapi import HTTPException

    try:
        from cozepy import AsyncCoze
        from cozepy.auth import AsyncTokenAuth
        from cozepy.config import COZE_CN_BASE_URL, COZE_COM_BASE_URL
        from cozepy.exception import CozeAPIError
    except ImportError as exc:  # SDK 未安装或版本过旧
        logger.error("[Coze] cozepy SDK 未安装: %s", exc)
        raise HTTPException(status_code=500, detail="Coze SDK 未安装，请执行 `pip install cozepy`.") from exc

    # === 读取配置 ===
    coze_host = os.getenv("COZE_API_HOST", "api.coze.cn").strip()
    coze_token = (os.getenv("COZE_ACCESS_TOKEN") or os.getenv("COZE_API_KEY") or "").strip()
    coze_workflow_id = os.getenv("COZE_WORKFLOW_ID", "").strip()
    coze_bot_id = os.getenv("COZE_BOT_ID", "").strip()
    coze_app_id = os.getenv("COZE_APP_ID", "").strip()

    # === 配置校验/回退 ===
    if not coze_token or not coze_workflow_id:
        logger.info("Coze 配置缺失（token 或 workflow_id），返回模拟数据以便前端联调。")
        mock_coze_data = [
            {
                "id": "1.1",
                "subject": "数学",  # 学科
                "section": "计算题",
                "question": "计算：1/2 + 1/3 = ?",
                "answer": "",
                "is_question": True,
                "is_correct": False,
                "correct_answer": "5/6",
                "comment": "需要先找到公分母：2 和 3 的最小公倍数是 6，将分数转换为同分母：1/2 = 3/6，1/3 = 2/6，然后相加：3/6 + 2/6 = 5/6",
            }
        ]
        return {"analysis": transform_coze_result(mock_coze_data), "practices": []}

    coze_workflow_id = coze_workflow_id.strip()
    masked_token = coze_token[:6] + "****" if len(coze_token) >= 10 else "****"

    normalized_host = coze_host.lower().strip()
    normalized_host = normalized_host.replace("https://", "").replace("http://", "").strip("/")
    if normalized_host.endswith("coze.cn"):
        base_url = COZE_CN_BASE_URL
    elif normalized_host.endswith("coze.com"):
        base_url = COZE_COM_BASE_URL
    else:
        base_url = f"https://{normalized_host}"

    logger.info(
        "[Coze] host=%s, workflow_id='%s', token(head)=%s, bot_id=%s, app_id=%s, base_url=%s",
        coze_host,
        coze_workflow_id,
        masked_token,
        "SET" if coze_bot_id else "NONE",
        "SET" if coze_app_id else "NONE",
        base_url,
    )

    file_name = filename or f"mistake-note-{uuid.uuid4().hex}.png"
    upload_buffer = io.BytesIO(image_data)
    upload_buffer.name = file_name
    upload_buffer.seek(0)

    coze_client = AsyncCoze(auth=AsyncTokenAuth(token=coze_token), base_url=base_url)

    try:
        uploaded_file = await coze_client.files.upload(file=upload_buffer)
        logger.info("[Coze] 文件上传成功，file_id=%s, size=%d", uploaded_file.id, len(image_data))
    except CozeAPIError as exc:
        error_message = f"Coze 文件上传失败：code={exc.code}, msg={exc.msg}, logid={exc.logid}"
        logger.error("[Coze] %s", error_message)
        raise HTTPException(status_code=502, detail=error_message) from exc
    except Exception as exc:
        logger.error("[Coze] 文件上传异常: %s", exc)
        raise HTTPException(status_code=500, detail=f"无法上传文件至 Coze：{exc}") from exc
    finally:
        upload_buffer.close()

    input_param_key = os.getenv("COZE_INPUT_PARAM_KEY", "input").strip() or "input"
    nested_file_param = os.getenv("COZE_IMAGE_FILE_FIELD", "file_id").strip() or "file_id"

    parameters = {
        "analyze_type": "math_error_analysis",
    }
    parameters[input_param_key] = {
        nested_file_param: uploaded_file.id,
    }

    if coze_bot_id and coze_app_id:
        logger.warning("[Coze] BOT_ID 与 APP_ID 同时存在，按约定优先使用 BOT_ID。")
        coze_app_id = ""

    safe_dbg = {
        "workflow_id": coze_workflow_id,
        "has_bot_id": bool(coze_bot_id),
        "has_app_id": bool(coze_app_id),
        "file_id": uploaded_file.id,
        "input_param_key": input_param_key,
        "nested_file_param": nested_file_param,
        "image_bytes": len(image_data),
        "parameters": {input_param_key: parameters.get(input_param_key)},
    }
    logger.info("[Coze] 请求摘要: %s", json.dumps(safe_dbg, ensure_ascii=False))

    try:
        result = await coze_client.workflows.runs.create(
            workflow_id=coze_workflow_id,
            parameters=parameters,
            bot_id=coze_bot_id or None,
            app_id=coze_app_id or None,
        )
    except CozeAPIError as exc:
        error_message = f"Coze SDK 调用失败：code={exc.code}, msg={exc.msg}, logid={exc.logid}"
        logger.error("[Coze] %s", error_message)
        raise HTTPException(status_code=502, detail=error_message) from exc
    except Exception as exc:
        logger.error("[Coze] 调用 /workflow/run 失败: %s", exc)
        raise HTTPException(status_code=500, detail=f"无法调用 Coze 工作流：{exc}") from exc

    if result.debug_url:
        logger.info("[Coze] debug_url=%s", result.debug_url)

    raw_payload = result.data or ""
    logger.info("[Coze] 完整响应: %s", raw_payload)
    if not raw_payload.strip():
        logger.error("[Coze] 工作流返回为空。")
        raise HTTPException(status_code=502, detail="Coze 未返回任何数据，请检查工作流输出。")

    try:
        parsed_payload = json.loads(raw_payload)
        logger.info("[Coze] 成功解析工作流返回，长度=%d", len(raw_payload))
    except json.JSONDecodeError:
        logger.error("[Coze] 工作流返回非 JSON，示例=%s", raw_payload[:200])
        raise HTTPException(status_code=502, detail="Coze 返回内容无法解析，请检查工作流输出。")

    if isinstance(parsed_payload, dict) and "data" in parsed_payload:
        coze_payload = parsed_payload.get("data")
    else:
        coze_payload = parsed_payload

    logger.info("[Coze] 转换前数据类型: %s", type(coze_payload).__name__)



    practices = extract_practices_from_payload(coze_payload)
    try:
        logger.info("[Coze] 提取到类练习条目数: %d", len(practices))
    except Exception:
        pass

    if isinstance(coze_payload, list):

        transformed = transform_coze_result(coze_payload)

        logger.info("[Coze] 转换后数据: %s", json.dumps(transformed, ensure_ascii=False))

        return {"analysis": transformed, "practices": practices}



    if isinstance(coze_payload, dict):

        logger.info("[Coze] 返回 dict 数据: %s", json.dumps(coze_payload, ensure_ascii=False))

        nested_candidates = []

        for key in ("data", "items", "records", "questions"):

            value = coze_payload.get(key) if isinstance(coze_payload, dict) else None

            if isinstance(value, list):

                nested_candidates = value

                break



        if nested_candidates:

            transformed = transform_coze_result(nested_candidates)

            logger.info("[Coze] 嵌套列表转换后数据: %s", json.dumps(transformed, ensure_ascii=False))

            return {"analysis": transformed, "practices": practices}



        transformed = transform_coze_result([coze_payload])

        logger.info("[Coze] 单条数据转换后数据: %s", json.dumps(transformed, ensure_ascii=False))

        return {"analysis": transformed, "practices": practices}



    logger.error("[Coze] 返回数据类型 %s 暂不支持", type(coze_payload).__name__)

    raise HTTPException(status_code=502, detail="Coze 返回数据格式不支持，请检查工作流输出。")



@app.get("/")

def read_root():

    missing_keys = []

    for key in ["BAIDU_OCR_API_KEY", "BAIDU_ASR_API_KEY", "BAIDU_TTS_API_KEY", "LLM_API_KEY", "COZE_API_KEY", "COZE_WORKFLOW_ID"]:

        if not os.getenv(key):

            missing_keys.append(key)

    if missing_keys:

        return {"status": "warning", "missing_keys": missing_keys}

    return {"status": "ok", "message": "mistake_note API is running."}



@app.post("/upload/image")

async def upload_image(image: UploadFile = File(...)):

    """上传图片文件并进行处理"""

    

    # 验证文件格式

    allowed_extensions = {'.jpg', '.jpeg', '.png', '.pdf'}

    file_extension = os.path.splitext(image.filename)[1].lower()

    

    if file_extension not in allowed_extensions:

        raise HTTPException(

            status_code=400, 

            detail=f"不支持的文件格式。支持格式: {', '.join(allowed_extensions)}"

        )

    

    # 验证文件大小（最大 10MB）

    max_size = 10 * 1024 * 1024  # 10MB

    content = await image.read()

    if len(content) > max_size:

        raise HTTPException(

            status_code=400,

            detail=f"文件大小超过限制。最大支持: {max_size // (1024*1024)}MB"

        )

    

    # 生成唯一文件名

    file_id = str(uuid.uuid4())

    filename = f"{file_id}{file_extension}"

    file_path = os.path.join("../media", "uploads", filename)

    

    # 保存文件

    with open(file_path, "wb") as f:

        f.write(content)

    

    # 调用 Coze API 进行分析

    try:

        coze_result = await call_coze_workflow(content, image.filename)

    except HTTPException:

        # 如果 Coze API 调用失败，返回基础的上传信息

        coze_result = None

    if coze_result is None:
        coze_result = {"analysis": [], "practices": []}

    if isinstance(coze_result, list):
        coze_result = {"analysis": coze_result, "practices": []}

    coze_analysis = coze_result.get("analysis", [])
    practices = coze_result.get("practices", [])

    # 返回处理结果

    result = {

        "status": "success",

        "message": "图片上传成功",

        "file_id": file_id,

        "filename": filename,

        "file_url": f"/media/uploads/{filename}",

        "upload_time": datetime.now().isoformat(),

        "file_size": len(content),

        "file_type": image.content_type

    }

    

    result["coze_analysis"] = coze_analysis
    if practices:
        result["practices"] = practices

    # 保存数据到数据库

    if DATABASE_AVAILABLE and (coze_analysis or (practices if 'practices' in locals() else [])):

        try:

            logger.info(f"开始保存数据到数据库，文件ID: {file_id}")

            logger.info(f"文件信息: filename={filename}, size={len(content)}, type={image.content_type}")

            logger.info(f"Coze 分析数据: {json.dumps(coze_analysis, ensure_ascii=False)}")

            

            with db_session() as db:
                record_id = save_mistake_record(db, result, coze_analysis, practices)

            logger.info(f"数据保存成功！错题记录ID: {record_id}, 文件ID: {file_id}")

            logger.info(f"保存了 {len(coze_analysis)} 条分析记录")

            

        except Exception as e:

            logger.error(f"保存数据到数据库失败: {e}")

            logger.error(f"错误详情: {str(e)}")

    else:

        if not DATABASE_AVAILABLE:

            logger.warning("数据库不可用，数据未保存")

        elif not coze_analysis:

            logger.info("没有分析数据，跳过数据库保存")

    return result



@app.post("/analyze/image")

async def analyze_image(image: UploadFile = File(...)):

    """直接分析图片，并保存到数据库"""

    

    # 验证文件格式

    allowed_extensions = {'.jpg', '.jpeg', '.png', '.pdf'}

    file_extension = os.path.splitext(image.filename)[1].lower()

    

    if file_extension not in allowed_extensions:

        raise HTTPException(

            status_code=400, 

            detail=f"不支持的文件格式。支持格式: {', '.join(allowed_extensions)}"

        )

    

    # 验证文件大小（最大 10MB）

    max_size = 10 * 1024 * 1024  # 10MB

    content = await image.read()

    if len(content) > max_size:

        raise HTTPException(

            status_code=400,

            detail=f"文件大小超过限制。最大支持: {max_size // (1024*1024)}MB"

        )

    

    # 调用 Coze API 进行分析

    coze_result = await call_coze_workflow(content, image.filename)

    # ??? Coze ????,????????????
    if not coze_result:
        coze_result = {"analysis": [], "practices": []}
    elif isinstance(coze_result, list):
        coze_result = {"analysis": coze_result, "practices": []}

    coze_analysis = coze_result.get("analysis", [])
    practices = coze_result.get("practices", [])

    # 生成文件信息用于数据库保存
    file_id = str(uuid.uuid4())
    filename = f"{file_id}{file_extension}"

    # 准备数据库保存数据
    file_data = {
        "file_id": file_id,
        "filename": filename,
        "file_url": f"/media/uploads/{filename}",
        "file_size": len(content),
        "file_type": image.content_type,
        "upload_time": datetime.now().isoformat()
    }

    # 保存数据到数据库
    record_id = None
    if DATABASE_AVAILABLE and (coze_analysis or practices):

        try:

            logger.info(f"[analyze/image] 开始保存数据到数据库，文件ID: {file_id}")

            logger.info(f"[analyze/image] 文件信息: filename={filename}, size={len(content)}, type={image.content_type}")

            logger.info(f"[analyze/image] Coze 分析数据: {json.dumps(coze_analysis, ensure_ascii=False)}")

            

            with db_session() as db:
                record_id = save_mistake_record(db, file_data, coze_analysis, practices)

            logger.info(f"[analyze/image] 数据保存成功！错题记录ID: {record_id}, 文件ID: {file_id}")

            logger.info(f"[analyze/image] 共保存 {len(coze_analysis)} 条分析记录，类练习 {len(practices)} 条")

            

        except Exception as e:

            logger.error(f"[analyze/image] 保存数据到数据库失败: {e}")

            logger.error(f"[analyze/image] 错误详情: {str(e)}")

    else:

        if not DATABASE_AVAILABLE:

            logger.warning("[analyze/image] 数据库不可用，数据未保存")

        elif not coze_analysis:

            logger.info("[analyze/image] 没有分析数据，跳过数据库保存")


    # 构建响应数据
    response_data = {
        "status": "success",
        "message": "图片分析完成",
        "analysis": coze_analysis,
        "analyze_time": datetime.now().isoformat()
    }
    
    # 若已保存到数据库，附加错题记录ID
    if DATABASE_AVAILABLE and coze_analysis and record_id is not None:
        response_data["mistake_record_id"] = record_id
    
    # 组装类练习到返回结果（analyze 接口）
    try:
        for p in practices_data:
            response_data["practices"].append({
                "id": getattr(p, "id", None),
                "question": getattr(p, "question", None),
                "correct_answer": getattr(p, "correct_answer", None),
                "comment": getattr(p, "comment", None),
                "created_at": p.created_at.isoformat() if getattr(p, "created_at", None) else None,
            })
    except Exception:
        pass

    return response_data


@app.post("/mistake/error_type")
async def update_error_type(payload: ErrorTypeUpdateRequest):
    """更新错题的错误原因，可按错题记录或具体分析项更新"""
    if not DATABASE_AVAILABLE:
        raise HTTPException(status_code=503, detail="数据库不可用，无法保存错误原因")

    with db_session() as db:
        error_value = (payload.error_type or "").strip()
        if not error_value:
            raise HTTPException(status_code=400, detail="错误原因不能为空")
        if len(error_value) > 100:
            error_value = error_value[:100]

        record = db.query(MistakeRecord).filter(MistakeRecord.id == payload.mistake_record_id).first()
        if not record:
            raise HTTPException(status_code=404, detail=f"未找到ID为 {payload.mistake_record_id} 的错题记录")

        query = db.query(MistakeAnalysis).filter(MistakeAnalysis.mistake_record_id == payload.mistake_record_id)
        if payload.analysis_id:
            query = query.filter(MistakeAnalysis.id == payload.analysis_id)

        analyses = query.all()
        if not analyses:
            raise HTTPException(status_code=404, detail="未找到对应的错题分析记录，无法更新错误原因")

        for analysis in analyses:
            analysis.error_type = error_value

        record.updated_at = datetime.now()
        db.commit()

        return {
            "status": "success",
            "mistake_record_id": payload.mistake_record_id,
            "analysis_ids": [a.id for a in analyses],
            "error_type": error_value,
            "updated_count": len(analyses),
        }


@app.get("/mistake/{mistake_id}")
async def get_mistake_detail(mistake_id: int):
    """查询错题详情
    参数: mistake_id - 错题记录主键ID
    返回: 错题详情信息，包括文件信息和分析结果
    """
    if not DATABASE_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="数据库不可用，无法查询错题详情"
        )
    
    db_gen = None
    try:
        db_gen = get_db()
        db = next(db_gen)
        
        # 根据主键ID查询错题记录
        mistake_record = db.query(MistakeRecord).filter(MistakeRecord.id == mistake_id).first()
        
        if not mistake_record:
            raise HTTPException(
                status_code=404,
                detail=f"未找到ID为 {mistake_id} 的错题记录"
            )
        
        # 查询相关的分析记录
        analysis_data = db.query(MistakeAnalysis).filter(MistakeAnalysis.mistake_record_id == mistake_id).all()
        practices_data = db.query(MistakePractice).filter(MistakePractice.mistake_record_id == mistake_id).all()
        
        # 构建响应数据
        response_data = {
            "file_info": {
                "id": mistake_record.id,
                "file_id": mistake_record.file_id,
                "filename": mistake_record.filename,
                "file_url": mistake_record.file_url,
                "file_size": mistake_record.file_size,
                "file_type": mistake_record.file_type,
                "upload_time": mistake_record.upload_time.isoformat() if mistake_record.upload_time else None,
                "created_at": mistake_record.created_at.isoformat() if mistake_record.created_at else None
            },
            "analysis": [],
            "practices": []
        }
        
        # 添加所有分析记录
        for analysis in analysis_data:
            # 若主要字段为空但 analysis_data 字段有数据，则从 analysis_data 中提取
            if (not analysis.section and not analysis.question and not analysis.answer and 
                analysis.analysis_data and isinstance(analysis.analysis_data, dict)):
                
                analysis_data_dict = analysis.analysis_data
                # 处理嵌套结构
                if "output" in analysis_data_dict and isinstance(analysis_data_dict["output"], list):
                    for output_item in analysis_data_dict["output"]:
                        if isinstance(output_item, dict) and "questions" in output_item and isinstance(output_item["questions"], list):
                            for question in output_item["questions"]:
                                analysis_item = {
                                    "id": output_item.get("id", ""),
                                    "section": output_item.get("section") or "",
                                    "question": question.get("question") or "",
                                    "answer": question.get("answer") or "",
                                    "is_question": bool(question.get("is_question", True)),
                                    "is_correct": bool(question.get("is_correct", False)),
                                    "correct_answer": question.get("correct_answer") or "",
                                    "comment": question.get("comment") or "",
                                    "error_type": None,
                                    "knowledge_point": ", ".join(output_item.get("knowledge_points", [])) if output_item.get("knowledge_points") else None,
                                    "created_at": analysis.created_at.isoformat() if analysis.created_at else None
                                }
                                response_data["analysis"].append(analysis_item)
            else:
                # 使用正常的字段数据
                analysis_item = {
                    "id": analysis.id,
                    "section": analysis.section,
                    "question": analysis.question,
                    "answer": analysis.answer,
                    "is_question": analysis.is_question,
                    "is_correct": analysis.is_correct,
                    "correct_answer": analysis.correct_answer,
                    "comment": analysis.comment,
                    "error_type": analysis.error_type,
                    "knowledge_point": analysis.knowledge_point,
                    "created_at": analysis.created_at.isoformat() if analysis.created_at else None
                }
                response_data["analysis"].append(analysis_item)
        
        logger.info(
            f"查询错题详情成功，记录ID: {mistake_id}, 分析记录数: {len(response_data['analysis'])}"
        )
        try:
            for p in practices_data:
                response_data["practices"].append({
                    "id": getattr(p, "id", None),
                    "question": getattr(p, "question", None),
                    "correct_answer": getattr(p, "correct_answer", None),
                    "comment": getattr(p, "comment", None),
                    "created_at": p.created_at.isoformat() if getattr(p, "created_at", None) else None,
                })
        except Exception:
            pass

        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"查询错题详情失败: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"查询错题详情时发生错误: {str(e)}"
        )
    finally:
        if db_gen:
            db_gen.close()



@app.get("/mistakes")
async def get_mistakes_list(
    subject: str = '',
    error_type: str = '',
    knowledge_point: str = '',
    skip: int = 0,
    limit: int = 100
):
    """错题本一览查询 API
    支持按学科、按错误类型、按知识点查询（知识点支持模糊查询）
    
    参数:
    - subject: 学科（如：数学、物理、化学等）
    - error_type: 错误类型（如：计算错误、概念不清等）
    - knowledge_point: 知识点（支持模糊查询）
    - skip: 跳过的记录数（分页用）
    - limit: 返回的最大记录数（分页用）
    
    返回: 错题列表，包含文件信息和分析结果
    """
    if not DATABASE_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="数据库不可用，无法查询错题列表"
        )
    
    db_gen = None
    try:
        db_gen = get_db()
        db = next(db_gen)
        
        # 构建查询
        query = db.query(MistakeAnalysis).join(MistakeRecord)

        logger.info(f"查询错题列表，初始记录数: {query.count()}")
        
        # 按学科查询
        if subject:
            query = query.filter(MistakeAnalysis.subject == subject)
        
        # 按错误类型查询
        if error_type:
            query = query.filter(MistakeAnalysis.error_type == error_type)
        
        # 按知识点查询（支持模糊查询）
        if knowledge_point:
            query = query.filter(MistakeAnalysis.knowledge_point.ilike(f"%{knowledge_point}%"))
        
        # 应用分页
        total_count = query.count()
        analysis_data = query.offset(skip).limit(limit).all()
        
        # 构建响应数据
        response_data = {
            "total_count": total_count,
            "skip": skip,
            "limit": limit,
            "mistakes": []
        }
        
        # 添加所有错题记录
        for analysis in analysis_data:
            mistake_record = analysis.mistake_record
            
            # 构建错题项
            mistake_item = {
                "mistake_record_id": mistake_record.id,
                "file_info": {
                    "file_id": mistake_record.file_id,
                    "filename": mistake_record.filename,
                    "file_url": mistake_record.file_url,
                    "file_size": mistake_record.file_size,
                    "file_type": mistake_record.file_type,
                    "upload_time": mistake_record.upload_time.isoformat() if mistake_record.upload_time else None,
                    "created_at": mistake_record.created_at.isoformat() if mistake_record.created_at else None
                },
                "analysis": {
                    "id": analysis.id,
                    "subject": analysis.subject,
                    "section": analysis.section,
                    "question": analysis.question,
                    "answer": analysis.answer,
                    "is_question": analysis.is_question,
                    "is_correct": analysis.is_correct,
                    "correct_answer": analysis.correct_answer,
                    "comment": analysis.comment,
                    "error_type": analysis.error_type,
                    "knowledge_point": analysis.knowledge_point,
                    "created_at": analysis.created_at.isoformat() if analysis.created_at else None
                }
            }
            response_data["mistakes"].append(mistake_item)
        
        logger.info(f"查询错题列表成功，总数: {total_count}, 返回: {len(response_data['mistakes'])} 条记录")
        logger.info(f"查询条件: subject={subject}, error_type={error_type}, knowledge_point={knowledge_point}")

        # 返回构造好的数据
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"查询错题列表失败: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"查询错题列表时发生错误: {str(e)}"
        )
    finally:
        if db_gen:
            db_gen.close()








