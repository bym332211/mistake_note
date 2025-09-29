import os
from sqlalchemy import create_engine, Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.sql import func
from datetime import datetime
import logging

# 配置日志
logger = logging.getLogger(__name__)

# 数据库配置
DATABASE_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432'),
    'database': os.getenv('DB_NAME', 'mistake_note'),
    'user': os.getenv('DB_USER', 'mistake_user'),
    'password': os.getenv('DB_PASSWORD', 'mistake_password')
}

# 构建数据库URL
DATABASE_URL = f"postgresql://{DATABASE_CONFIG['user']}:{DATABASE_CONFIG['password']}@{DATABASE_CONFIG['host']}:{DATABASE_CONFIG['port']}/{DATABASE_CONFIG['database']}"

# 创建数据库引擎
engine = create_engine(DATABASE_URL, echo=False)

# 创建基类
Base = declarative_base()

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 数据库模型定义
class MistakeRecord(Base):
    """错题记录表"""
    __tablename__ = "mistake_records"

    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(String(255), unique=True, index=True, nullable=False)
    filename = Column(String(500), nullable=False)
    file_url = Column(String(1000))
    file_size = Column(Integer)
    file_type = Column(String(100))
    upload_time = Column(DateTime(timezone=True), default=func.now())
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())

    # 关系
    analyses = relationship("MistakeAnalysis", back_populates="mistake_record", cascade="all, delete-orphan")

class MistakeAnalysis(Base):
    """错题分析表"""
    __tablename__ = "mistake_analysis"

    id = Column(Integer, primary_key=True, index=True)
    mistake_record_id = Column(Integer, ForeignKey("mistake_records.id", ondelete="CASCADE"))
    section = Column(String(200))
    question = Column(Text)
    answer = Column(Text)
    is_question = Column(Boolean, default=True)
    is_correct = Column(Boolean, default=False)
    correct_answer = Column(Text)
    comment = Column(Text)
    error_type = Column(String(100))  # 错因类型
    knowledge_point = Column(String(200))  # 知识点
    analysis_data = Column(JSON)  # 完整的分析数据
    created_at = Column(DateTime(timezone=True), default=func.now())

    # 关系
    mistake_record = relationship("MistakeRecord", back_populates="analyses")

class User(Base):
    """用户表（用于未来扩展）"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True)
    email = Column(String(255), unique=True, index=True)
    created_at = Column(DateTime(timezone=True), default=func.now())

class ReviewPlan(Base):
    """复习计划表"""
    __tablename__ = "review_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    plan_name = Column(String(200))
    plan_data = Column(JSON)  # 复习计划详情
    created_at = Column(DateTime(timezone=True), default=func.now())
    scheduled_date = Column(DateTime)

# 数据库工具函数
def get_db():
    """获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """初始化数据库表"""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("数据库表创建成功")
    except Exception as e:
        logger.error(f"数据库表创建失败: {e}")
        raise

def save_mistake_record(db, file_data, analysis_data=None):
    """保存错题记录和分析结果"""
    try:
        logger.info(f"📝 开始保存错题记录到数据库...")
        logger.info(f"📁 文件信息: file_id={file_data.get('file_id')}, filename={file_data.get('filename')}, size={file_data.get('file_size')}")
        
        # 创建错题记录
        mistake_record = MistakeRecord(
            file_id=file_data.get("file_id"),
            filename=file_data.get("filename"),
            file_url=file_data.get("file_url"),
            file_size=file_data.get("file_size"),
            file_type=file_data.get("file_type"),
            upload_time=datetime.fromisoformat(file_data.get("upload_time")) if file_data.get("upload_time") else None
        )
        
        db.add(mistake_record)
        db.flush()  # 获取生成的ID
        logger.info(f"✅ 错题记录创建成功，记录ID: {mistake_record.id}")
        
        # 保存分析结果
        analysis_count = 0
        if analysis_data:
            logger.info(f"📊 开始保存分析数据，共 {len(analysis_data)} 条记录")
            for i, analysis in enumerate(analysis_data):
                mistake_analysis = MistakeAnalysis(
                    mistake_record_id=mistake_record.id,
                    section=analysis.get("section"),
                    question=analysis.get("question"),
                    answer=analysis.get("answer"),
                    is_question=analysis.get("is_question", True),
                    is_correct=analysis.get("is_correct", False),
                    correct_answer=analysis.get("correct_answer"),
                    comment=analysis.get("comment"),
                    error_type=analysis.get("error_type"),
                    knowledge_point=analysis.get("knowledge_point"),
                    analysis_data=analysis
                )
                db.add(mistake_analysis)
                analysis_count += 1
                logger.info(f"📋 分析记录 {i+1}: section={analysis.get('section')}, question={analysis.get('question')[:50]}...")
        
        db.commit()
        logger.info(f"🎉 数据库保存完成！错题记录ID: {mistake_record.id}, 分析记录数: {analysis_count}")
        return mistake_record.id
        
    except Exception as e:
        db.rollback()
        logger.error(f"❌ 保存错题记录失败: {e}")
        logger.error(f"❌ 错误详情: {str(e)}")
        raise

def get_mistake_records(db, skip: int = 0, limit: int = 100):
    """获取错题记录列表"""
    return db.query(MistakeRecord).offset(skip).limit(limit).all()

def get_mistake_analysis_by_file_id(db, file_id: str):
    """根据文件ID获取错题分析"""
    mistake_record = db.query(MistakeRecord).filter(MistakeRecord.file_id == file_id).first()
    if mistake_record:
        return db.query(MistakeAnalysis).filter(MistakeAnalysis.mistake_record_id == mistake_record.id).all()
    return []

def get_similar_mistakes(db, error_type: str = None, knowledge_point: str = None):
    """获取相似错题"""
    query = db.query(MistakeAnalysis)
    
    if error_type:
        query = query.filter(MistakeAnalysis.error_type == error_type)
    if knowledge_point:
        query = query.filter(MistakeAnalysis.knowledge_point == knowledge_point)
    
    return query.all()

# 测试数据库连接
def test_connection():
    """测试数据库连接"""
    try:
        with engine.connect() as conn:
            result = conn.execute("SELECT version();")
            version = result.fetchone()
            logger.info(f"数据库连接成功: {version[0]}")
            return True
    except Exception as e:
        logger.error(f"数据库连接失败: {e}")
        return False

if __name__ == "__main__":
    # 测试数据库连接和初始化
    if test_connection():
        init_db()
        print("数据库初始化完成")
    else:
        print("数据库连接失败，请检查配置")
