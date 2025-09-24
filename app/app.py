import os
import uuid
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# 挂载媒体目录为静态文件
app.mount("/media", StaticFiles(directory="media"), name="media")

@app.get("/")
def read_root():
    missing_keys = []
    for key in ["BAIDU_OCR_API_KEY", "BAIDU_ASR_API_KEY", "BAIDU_TTS_API_KEY", "LLM_API_KEY"]:
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
    file_path = os.path.join("media", "uploads", filename)
    
    # 保存文件
    with open(file_path, "wb") as f:
        f.write(content)
    
    # 返回处理结果（后续会集成OCR和引导功能）
    return {
        "status": "success",
        "message": "图片上传成功",
        "file_id": file_id,
        "filename": filename,
        "file_url": f"/media/uploads/{filename}",
        "upload_time": datetime.now().isoformat(),
        "file_size": len(content),
        "file_type": image.content_type
    }

@app.get("/health")
async def health_check():
    """健康检查接口"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
