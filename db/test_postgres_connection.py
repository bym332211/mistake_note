import os
from sqlalchemy import create_engine, text
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 数据库配置
DATABASE_CONFIG = {
    'host': 'localhost',
    'port': '5432',
    'database': 'mistake_note',
    'user': 'mistake_user',
    'password': 'mistake_password'
}

# 构建数据库URL
DATABASE_URL = f"postgresql://{DATABASE_CONFIG['user']}:{DATABASE_CONFIG['password']}@{DATABASE_CONFIG['host']}:{DATABASE_CONFIG['port']}/{DATABASE_CONFIG['database']}"

def test_connection():
    """测试数据库连接"""
    try:
        # 创建数据库引擎
        engine = create_engine(DATABASE_URL)
        
        # 测试连接
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version()"))
            version = result.fetchone()
            logger.info(f"数据库连接成功: {version[0]}")
            
            # 测试查询数据
            result = conn.execute(text("SELECT COUNT(*) FROM mistake_records"))
            count = result.fetchone()[0]
            logger.info(f"错题记录数量: {count}")
            
            result = conn.execute(text("SELECT COUNT(*) FROM mistake_analysis"))
            analysis_count = result.fetchone()[0]
            logger.info(f"错题分析数量: {analysis_count}")
            
            return True
            
    except Exception as e:
        logger.error(f"数据库连接失败: {e}")
        return False

def test_data_operations():
    """测试数据操作"""
    try:
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as conn:
            # 插入测试数据
            test_file_data = {
                "file_id": "test-file-001",
                "filename": "test_problem.png",
                "file_url": "/media/uploads/test_problem.png",
                "file_size": 51200,
                "file_type": "image/png"
            }
            
            # 插入错题记录
            insert_record = text("""
                INSERT INTO mistake_records (file_id, filename, file_url, file_size, file_type)
                VALUES (:file_id, :filename, :file_url, :file_size, :file_type)
                RETURNING id
            """)
            
            result = conn.execute(insert_record, test_file_data)
            record_id = result.fetchone()[0]
            conn.commit()
            
            logger.info(f"插入错题记录成功，ID: {record_id}")
            
            # 插入分析数据
            test_analysis = {
                "mistake_record_id": record_id,
                "section": "测试题",
                "question": "测试题目：1 + 1 = ?",
                "answer": "3",
                "is_question": True,
                "is_correct": False,
                "correct_answer": "2",
                "comment": "基础加法错误",
                "error_type": "计算错误",
                "knowledge_point": "基础运算"
            }
            
            insert_analysis = text("""
                INSERT INTO mistake_analysis 
                (mistake_record_id, section, question, answer, is_question, is_correct, 
                 correct_answer, comment, error_type, knowledge_point)
                VALUES 
                (:mistake_record_id, :section, :question, :answer, :is_question, :is_correct,
                 :correct_answer, :comment, :error_type, :knowledge_point)
            """)
            
            conn.execute(insert_analysis, test_analysis)
            conn.commit()
            
            logger.info("插入错题分析成功")
            
            # 查询测试数据
            query = text("""
                SELECT mr.filename, ma.question, ma.correct_answer, ma.error_type
                FROM mistake_records mr
                JOIN mistake_analysis ma ON mr.id = ma.mistake_record_id
                WHERE mr.file_id = :file_id
            """)
            
            result = conn.execute(query, {"file_id": "test-file-001"})
            test_data = result.fetchone()
            
            if test_data:
                logger.info(f"查询测试数据成功: {test_data}")
            
            # 清理测试数据
            delete_analysis = text("DELETE FROM mistake_analysis WHERE mistake_record_id = :record_id")
            delete_record = text("DELETE FROM mistake_records WHERE id = :record_id")
            
            conn.execute(delete_analysis, {"record_id": record_id})
            conn.execute(delete_record, {"record_id": record_id})
            conn.commit()
            
            logger.info("测试数据清理完成")
            
            return True
            
    except Exception as e:
        logger.error(f"数据操作测试失败: {e}")
        return False

if __name__ == "__main__":
    print("开始测试PostgreSQL数据库连接...")
    
    if test_connection():
        print("✅ 数据库连接测试通过")
        
        if test_data_operations():
            print("✅ 数据操作测试通过")
            print("\n🎉 PostgreSQL数据库配置成功！")
        else:
            print("❌ 数据操作测试失败")
    else:
        print("❌ 数据库连接测试失败")
