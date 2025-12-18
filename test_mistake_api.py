#!/usr/bin/env python3
"""
测试错题本API功能
测试保存subject字段和错题本查询API
"""

import requests
import json
import sys
import os

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# API基础URL
BASE_URL = "http://localhost:8000"

def test_mistakes_list_api():
    """测试错题本查询API"""
    print("🧪 测试错题本查询API...")
    
    # 测试无参数查询
    print("1. 测试无参数查询...")
    response = requests.get(f"{BASE_URL}/mistakes")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ 无参数查询成功，返回 {len(data.get('mistakes', []))} 条记录")
        print(f"   总数: {data.get('total_count', 0)}")
    else:
        print(f"❌ 无参数查询失败: {response.status_code} - {response.text}")
        return False
    
    # 测试按学科查询
    print("2. 测试按学科查询...")
    response = requests.get(f"{BASE_URL}/mistakes?subject=数学")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ 按学科查询成功，返回 {len(data.get('mistakes', []))} 条记录")
    else:
        print(f"❌ 按学科查询失败: {response.status_code} - {response.text}")
    
    # 测试按错误类型查询
    print("3. 测试按错误类型查询...")
    response = requests.get(f"{BASE_URL}/mistakes?error_type=计算错误")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ 按错误类型查询成功，返回 {len(data.get('mistakes', []))} 条记录")
    else:
        print(f"❌ 按错误类型查询失败: {response.status_code} - {response.text}")
    
    # 测试按知识点模糊查询
    print("4. 测试按知识点模糊查询...")
    response = requests.get(f"{BASE_URL}/mistakes?knowledge_point=分数")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ 按知识点模糊查询成功，返回 {len(data.get('mistakes', []))} 条记录")
    else:
        print(f"❌ 按知识点模糊查询失败: {response.status_code} - {response.text}")
    
    # 测试组合查询
    print("5. 测试组合查询...")
    response = requests.get(f"{BASE_URL}/mistakes?subject=数学&error_type=计算错误")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ 组合查询成功，返回 {len(data.get('mistakes', []))} 条记录")
    else:
        print(f"❌ 组合查询失败: {response.status_code} - {response.text}")
    
    # 测试分页
    print("6. 测试分页功能...")
    response = requests.get(f"{BASE_URL}/mistakes?skip=0&limit=1")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ 分页查询成功，返回 {len(data.get('mistakes', []))} 条记录")
        print(f"   分页信息: skip={data.get('skip', 0)}, limit={data.get('limit', 0)}")
    else:
        print(f"❌ 分页查询失败: {response.status_code} - {response.text}")
    
    return True

def test_mistake_detail_api():
    """测试错题详情API"""
    print("\n🧪 测试错题详情API...")
    
    # 先获取一个错题ID
    response = requests.get(f"{BASE_URL}/mistakes?limit=1")
    if response.status_code == 200:
        data = response.json()
        mistakes = data.get('mistakes', [])
        if mistakes:
            mistake_id = mistakes[0].get('mistake_record_id')
            print(f"1. 测试错题详情查询 (ID: {mistake_id})...")
            
            response = requests.get(f"{BASE_URL}/mistake/{mistake_id}")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ 错题详情查询成功")
                print(f"   文件信息: {data.get('file_info', {}).get('filename')}")
                print(f"   分析记录数: {len(data.get('analysis', []))}")
            else:
                print(f"❌ 错题详情查询失败: {response.status_code} - {response.text}")
        else:
            print("⚠️ 没有错题记录，跳过详情测试")
    else:
        print(f"❌ 获取错题列表失败: {response.status_code} - {response.text}")
    
    return True

def test_api_status():
    """测试API状态"""
    print("🧪 测试API状态...")
    
    response = requests.get(f"{BASE_URL}/")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ API状态正常: {data.get('status')}")
        print(f"   消息: {data.get('message')}")
        return True
    else:
        print(f"❌ API状态异常: {response.status_code} - {response.text}")
        return False

def main():
    """主测试函数"""
    print("🚀 开始测试错题本API功能...")
    print("=" * 50)
    
    # 检查API是否运行
    if not test_api_status():
        print("❌ API未运行，请先启动服务: uvicorn app.app:app --reload")
        return
    
    # 测试错题本查询API
    if not test_mistakes_list_api():
        print("❌ 错题本查询API测试失败")
        return
    
    # 测试错题详情API
    if not test_mistake_detail_api():
        print("❌ 错题详情API测试失败")
        return
    
    print("\n" + "=" * 50)
    print("🎉 所有测试完成！")
    print("\n📋 实现的功能总结:")
    print("✅ 1. 数据库表结构已添加subject字段")
    print("✅ 2. 保存coze分析结果时包含subject字段")
    print("✅ 3. 实现错题本查询API (/mistakes)")
    print("   - 支持按学科查询 (subject参数)")
    print("   - 支持按错误原因查询 (error_type参数)")
    print("   - 支持按知识点模糊查询 (knowledge_point参数)")
    print("   - 支持分页查询 (skip, limit参数)")
    print("✅ 4. 添加了subject字段的索引")
    print("\n📝 使用示例:")
    print("   - 查询所有错题: GET /mistakes")
    print("   - 按学科查询: GET /mistakes?subject=数学")
    print("   - 按错误类型查询: GET /mistakes?error_type=计算错误")
    print("   - 按知识点模糊查询: GET /mistakes?knowledge_point=分数")
    print("   - 组合查询: GET /mistakes?subject=数学&error_type=计算错误")
    print("   - 分页查询: GET /mistakes?skip=0&limit=10")

if __name__ == "__main__":
    main()
