import os
from fastapi import FastAPI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

@app.get("/")
def read_root():
    missing_keys = []
    for key in ["BAIDU_OCR_API_KEY", "BAIDU_ASR_API_KEY", "BAIDU_TTS_API_KEY", "LLM_API_KEY"]:
        if not os.getenv(key):
            missing_keys.append(key)
    if missing_keys:
        return {"status": "warning", "missing_keys": missing_keys}
    return {"status": "ok", "message": "mistake_note API is running."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
