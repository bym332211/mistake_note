import os
import uuid
import io
import logging
from typing import Optional
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import json
import sys
import os

# 添加项目根目录到Python路径，以便导入数据库配置
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from db.database_config import get_db, save_mistake_record
    DATABASE_AVAILABLE = True
except ImportError as e:
    logger = logging.getLogger('coze_api')
    logger.warning(f"数据库配置导入失败: {e}，将不会保存数据到数据库")
    DATABASE_AVAILABLE = False



# 配置日志

logging.basicConfig(

    level=logging.INFO,

    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',

    handlers=[

        logging.FileHandler('coze_api.log', encoding='utf-8'),

        logging.StreamHandler()

    ]

)

logger = logging.getLogger('coze_api')



load_dotenv()



app = FastAPI()



# 添加CORS中间件

app.add_middleware(

    CORSMiddleware,

    allow_origins=["*"],  # 允许所有来源，生产环境应该限制

    allow_credentials=True,

    allow_methods=["*"],  # 允许所有方法

    allow_headers=["*"],  # 允许所有头

)



# 挂载媒体目录为静态文件

app.mount("/media", StaticFiles(directory="../media"), name="media")



def transform_coze_result(coze_data):

    '''将 Coze API 返回的题目列表标准化为前端需要的结构'''

    if not isinstance(coze_data, list):

        return []



    normalized = []

    for item in coze_data:

        normalized_item = {

            "id": str(item.get("id", "")),

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



async def call_coze_workflow(image_data: bytes, filename: Optional[str] = None) -> dict:
    """调用 Coze 工作流进行图像分析（非流式 /v1/workflow/run)
    依赖环境变量：
      - COZE_API_HOST          （可选，默认 api.coze.cn；若 token 来自 coze.com，请设为 api.coze.com）
      - COZE_ACCESS_TOKEN 或 COZE_API_KEY  （二选一，建议前者；必须）
      - COZE_WORKFLOW_ID       （必须；工作流已发布）
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
                "section": "计算题",
                "question": "计算：1/2 + 1/3 = ?",
                "answer": "",
                "is_question": True,
                "is_correct": False,
                "correct_answer": "5/6",
                "comment": "需要先找到公分母：2和3的最小公倍数是6，将分数转换为同分母：1/2 = 3/6，1/3 = 2/6，然后相加：3/6 + 2/6 = 5/6",
            }
        ]
        return transform_coze_result(mock_coze_data)

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



    if isinstance(coze_payload, list):

        transformed = transform_coze_result(coze_payload)

        logger.info("[Coze] 转换后数据: %s", json.dumps(transformed, ensure_ascii=False))

        return transformed



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

            return transformed



        transformed = transform_coze_result([coze_payload])

        logger.info("[Coze] 单条数据转换后数据: %s", json.dumps(transformed, ensure_ascii=False))

        return transformed



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

    

    # 验证文件大小（最大10MB）

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

    

    # 调用Coze API进行分析

    try:

        coze_analysis = await call_coze_workflow(content, image.filename)

    except HTTPException:

        # 如果Coze API调用失败，返回基本的上传信息

        coze_analysis = None

    if coze_analysis is None:
        coze_analysis = []

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

    # 保存数据到数据库

    if DATABASE_AVAILABLE and coze_analysis:

        try:

            logger.info(f"开始保存数据到数据库，文件ID: {file_id}")

            logger.info(f"文件信息: filename={filename}, size={len(content)}, type={image.content_type}")

            logger.info(f"Coze分析数据: {json.dumps(coze_analysis, ensure_ascii=False)}")

            

            db = next(get_db())

            record_id = save_mistake_record(db, result, coze_analysis)

            logger.info(f"✅ 数据保存成功！错题记录ID: {record_id}, 文件ID: {file_id}")

            logger.info(f"✅ 保存了 {len(coze_analysis)} 条分析记录")

            

        except Exception as e:

            logger.error(f"❌ 保存数据到数据库失败: {e}")

            logger.error(f"❌ 错误详情: {str(e)}")

    else:

        if not DATABASE_AVAILABLE:

            logger.warning("⚠️ 数据库不可用，数据未保存")

        elif not coze_analysis:

            logger.info("ℹ️ 没有分析数据，跳过数据库保存")

    return result



@app.post("/analyze/image")

async def analyze_image(image: UploadFile = File(...)):

    """直接分析图片，也保存到数据库"""

    

    # 验证文件格式

    allowed_extensions = {'.jpg', '.jpeg', '.png', '.pdf'}

    file_extension = os.path.splitext(image.filename)[1].lower()

    

    if file_extension not in allowed_extensions:

        raise HTTPException(

            status_code=400, 

            detail=f"不支持的文件格式。支持格式: {', '.join(allowed_extensions)}"

        )

    

    # 验证文件大小（最大10MB）

    max_size = 10 * 1024 * 1024  # 10MB

    content = await image.read()

    if len(content) > max_size:

        raise HTTPException(

            status_code=400,

            detail=f"文件大小超过限制。最大支持: {max_size // (1024*1024)}MB"

        )

    

    # 调用Coze API进行分析

    coze_analysis = await call_coze_workflow(content, image.filename)

    if coze_analysis is None:
        coze_analysis = []

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
    if DATABASE_AVAILABLE and coze_analysis:

        try:

            logger.info(f"📝 [analyze/image] 开始保存数据到数据库，文件ID: {file_id}")

            logger.info(f"📁 [analyze/image] 文件信息: filename={filename}, size={len(content)}, type={image.content_type}")

            logger.info(f"📊 [analyze/image] Coze分析数据: {json.dumps(coze_analysis, ensure_ascii=False)}")

            

            db = next(get_db())

            record_id = save_mistake_record(db, file_data, coze_analysis)

            logger.info(f"✅ [analyze/image] 数据保存成功！错题记录ID: {record_id}, 文件ID: {file_id}")

            logger.info(f"✅ [analyze/image] 保存了 {len(coze_analysis)} 条分析记录")

            

        except Exception as e:

            logger.error(f"❌ [analyze/image] 保存数据到数据库失败: {e}")

            logger.error(f"❌ [analyze/image] 错误详情: {str(e)}")

    else:

        if not DATABASE_AVAILABLE:

            logger.warning("⚠️ [analyze/image] 数据库不可用，数据未保存")

        elif not coze_analysis:

            logger.info("ℹ️ [analyze/image] 没有分析数据，跳过数据库保存")



    return {

        "status": "success",

        "message": "图片分析完成",

        "analysis": coze_analysis,

        "analyze_time": datetime.now().isoformat()

    }
