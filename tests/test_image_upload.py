import pytest
import os
import sys
import tempfile
from fastapi.testclient import TestClient

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.app import app

client = TestClient(app)

class TestImageUpload:
    """图片上传功能测试"""
    
    def test_upload_valid_image(self):
        """测试上传有效的图片文件"""
        # 创建一个临时的测试图片文件
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp_file:
            tmp_file.write(b'test image content')
            tmp_file_path = tmp_file.name
        
        try:
            with open(tmp_file_path, 'rb') as f:
                files = {'image': ('test.jpg', f, 'image/jpeg')}
                response = client.post('/upload/image', files=files)
            
            assert response.status_code == 200
            data = response.json()
            assert data['status'] == 'success'
            assert 'file_id' in data
            assert 'filename' in data
            assert 'file_url' in data
            assert data['file_size'] == len(b'test image content')
            
            # 验证文件是否实际保存
            file_path = os.path.join('media', 'uploads', data['filename'])
            assert os.path.exists(file_path)
            
        finally:
            # 清理临时文件
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)
    
    def test_upload_invalid_format(self):
        """测试上传不支持的文件格式"""
        with tempfile.NamedTemporaryFile(suffix='.txt', delete=False) as tmp_file:
            tmp_file.write(b'test content')
            tmp_file_path = tmp_file.name
        
        try:
            with open(tmp_file_path, 'rb') as f:
                files = {'image': ('test.txt', f, 'text/plain')}
                response = client.post('/upload/image', files=files)
            
            assert response.status_code == 400
            data = response.json()
            assert '不支持的文件格式' in data['detail']
            
        finally:
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)
    
    def test_upload_large_file(self):
        """测试上传超过大小限制的文件"""
        # 创建一个大文件（超过10MB）
        large_content = b'x' * (11 * 1024 * 1024)  # 11MB
        
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp_file:
            tmp_file.write(large_content)
            tmp_file_path = tmp_file.name
        
        try:
            with open(tmp_file_path, 'rb') as f:
                files = {'image': ('large.jpg', f, 'image/jpeg')}
                response = client.post('/upload/image', files=files)
            
            assert response.status_code == 400
            data = response.json()
            assert '文件大小超过限制' in data['detail']
            
        finally:
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)
    
    def test_upload_no_file(self):
        """测试没有上传文件的情况"""
        response = client.post('/upload/image')
        assert response.status_code == 422  # 验证失败
    
    def test_health_check(self):
        """测试健康检查接口"""
        response = client.get('/health')
        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'healthy'
        assert 'timestamp' in data
        assert 'version' in data
    
    def test_root_endpoint(self):
        """测试根端点"""
        response = client.get('/')
        assert response.status_code == 200
        data = response.json()
        assert 'status' in data
        # 根据环境变量状态，可能返回'message'或'missing_keys'
        if data['status'] == 'ok':
            assert 'message' in data
        else:
            assert 'missing_keys' in data

if __name__ == '__main__':
    pytest.main([__file__])
