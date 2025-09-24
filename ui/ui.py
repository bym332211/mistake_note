import gradio as gr
import requests
import os
from datetime import datetime

# 后端API地址
API_BASE_URL = "http://localhost:7860"

def upload_image(image):
    """上传图片到后端API"""
    if image is None:
        return "请选择要上传的图片"
    
    try:
        # 准备文件数据
        files = {"image": (image.name, open(image, "rb"), "image/jpeg")}
        
        # 发送请求到后端
        response = requests.post(f"{API_BASE_URL}/upload/image", files=files)
        
        if response.status_code == 200:
            result = response.json()
            return f"""
**上传成功！**

- 文件ID: {result['file_id']}
- 文件名: {result['filename']}
- 文件大小: {result['file_size']} 字节
- 上传时间: {result['upload_time']}
- 文件URL: {result['file_url']}

后续将集成OCR识别和引导功能。
"""
        else:
            return f"上传失败: {response.json().get('detail', '未知错误')}"
            
    except Exception as e:
        return f"上传过程中发生错误: {str(e)}"
    finally:
        # 确保文件被关闭
        if 'files' in locals():
            files["image"][1].close()

def main():
    with gr.Blocks(title="mistake_note - 错题笔记系统") as demo:
        gr.Markdown("# mistake_note - 错题笔记系统")
        gr.Markdown("支持图片上传进行OCR识别，作为摄像头功能的替代方案")
        
        with gr.Tab("图片上传"):
            with gr.Row():
                with gr.Column():
                    image_input = gr.File(
                        label="上传题目图片",
                        file_types=[".jpg", ".jpeg", ".png", ".pdf"],
                        file_count="single"
                    )
                    upload_btn = gr.Button("上传图片", variant="primary")
                
                with gr.Column():
                    output_text = gr.Markdown(label="上传结果")
            
            upload_btn.click(
                fn=upload_image,
                inputs=image_input,
                outputs=output_text
            )
            
            gr.Markdown("### 使用说明")
            gr.Markdown("""
            1. 点击"选择文件"或拖拽图片到上传区域
            2. 支持格式: JPG, JPEG, PNG, PDF
            3. 最大文件大小: 10MB
            4. 上传成功后，系统将保存图片并准备后续处理
            """)
        
        with gr.Tab("系统状态"):
            status_btn = gr.Button("检查系统状态", variant="secondary")
            status_output = gr.Textbox(label="系统状态", interactive=False)
            
            def check_status():
                try:
                    response = requests.get(f"{API_BASE_URL}/health")
                    if response.status_code == 200:
                        return f"系统状态正常: {response.json()}"
                    else:
                        return f"系统状态异常: {response.status_code}"
                except Exception as e:
                    return f"无法连接到后端服务: {str(e)}"
            
            status_btn.click(
                fn=check_status,
                inputs=[],
                outputs=status_output
            )
    
    demo.launch(server_name="0.0.0.0", server_port=7861)

if __name__ == "__main__":
    main()
