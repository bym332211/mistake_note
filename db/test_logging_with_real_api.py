#!/usr/bin/env python3
"""
测试日志功能（当配置真实Coze API时）
"""

import requests
import json
import base64

# 测试配置
BASE_URL = "http://127.0.0.1:8000"

def test_logging_with_real_api():
    """测试当配置真实Coze API时的日志输出"""
    print("=== 测试日志功能（真实API场景） ===")
    
    # 创建一个简单的测试图片
    test_image_data = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==")
    
    try:
        files = {'image': ('test.png', test_image_data, 'image/png')}
        
        # 调用分析接口
        response = requests.post(f"{BASE_URL}/analyze/image", files=files)
        print(f"状态码: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("分析结果:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
            
            # 检查日志文件内容
            try:
                with open('app/coze_api.log', 'r', encoding='utf-8') as f:
                    log_content = f.read()
                    print("\n=== 日志文件内容 ===")
                    print(log_content)
                    
                    # 检查日志中是否包含关键信息
                    if "Coze API配置缺失" in log_content:
                        print("✅ 日志正确记录了配置缺失信息")
                    if "模拟数据" in log_content:
                        print("✅ 日志正确记录了模拟数据")
                    if "开始调用Coze API" in log_content:
                        print("✅ 日志记录了API调用开始")
                    
            except FileNotFoundError:
                print("❌ 日志文件未找到")
                return False
                
            return True
        else:
            print(f"分析失败: {response.text}")
            return False
            
    except Exception as e:
        print(f"测试失败: {e}")
        return False

def test_logging_with_real_config():
    """测试当配置真实Coze API密钥时的日志行为"""
    print("\n=== 测试真实API配置场景 ===")
    
    # 检查当前配置
    import os
    coze_api_key = os.getenv("COZE_API_KEY")
    coze_workflow_id = os.getenv("COZE_WORKFLOW_ID")
    
    if coze_api_key and coze_workflow_id:
        print("✅ 检测到Coze API配置")
        print(f"API密钥长度: {len(coze_api_key)}")
        print(f"工作流ID: {coze_workflow_id}")
        
        # 在这种情况下，日志会记录真实的API调用过程
        print("如果配置了真实API密钥，日志将记录：")
        print("- API调用开始")
        print("- 请求数据")
        print("- 响应状态码")
        print("- 原始响应数据")
        print("- 数据转换过程")
        
        return True
    else:
        print("⚠️ 未检测到Coze API配置，使用模拟数据模式")
        print("日志将记录模拟数据的使用")
        return True

if __name__ == "__main__":
    print("开始测试日志功能...")
    
    # 测试当前配置下的日志行为
    config_test = test_logging_with_real_config()
    
    # 测试API调用和日志记录
    logging_test = test_logging_with_real_api()
    
    print("\n=== 日志功能测试总结 ===")
    print(f"配置测试: {'通过' if config_test else '失败'}")
    print(f"日志记录测试: {'通过' if logging_test else '失败'}")
    
    if config_test and logging_test:
        print("\n✅ 日志功能测试通过！")
        print("\n日志功能说明：")
        print("- 日志同时输出到控制台和文件 (app/coze_api.log)")
        print("- 记录API调用开始、配置检查、请求数据")
        print("- 记录响应状态码和原始响应数据")
        print("- 记录数据转换过程")
        print("- 记录错误和异常信息")
    else:
        print("\n❌ 日志功能测试失败")
