import os
from sqlalchemy import create_engine, Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.sql import func
from datetime import datetime
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# SQLite数据库配置
DATABASE_URL = "sqlite:///./mistake_note.db"

# 创建数据库引擎
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

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
        logger.info("SQLite数据库表创建成功")
        
        # 插入示例数据
        db = SessionLocal()
        try:
            # 检查是否已有示例数据
            existing_records = db.query(MistakeRecord).count()
            if existing_records == 0:
                # 插入示例错题记录
                example_records = [
                    MistakeRecord(
                        file_id="example-1",
                        filename="math_problem_1.png",
                        file_url="/media/uploads/example-1.png",
                        file_size=102400,
                        file_type="image/png"
                    ),
                    MistakeRecord(
                        file_id="example-2", 
                        filename="math_problem_2.jpg",
                        file_url="/media/uploads/example-2.jpg",
                        file_size=204800,
                        file_type="image/jpeg"
                    )
                ]
                
                for record in example_records:
                    db.add(record)
                
                db.flush()  # 获取生成的ID
                
                # 插入示例分析数据
                example_analyses = [
                    MistakeAnalysis(
                        mistake_record_id=1,
                        section="计算题",
                        question="计算：1/2 + 1/3 = ?",
                        answer="",
                        is_question=True,
                        is_correct=False,
                        correct_answer="5/6",
                        comment="需要先找到公分母：2和3的最小公倍数是6，将分数转换为同分母：1/2 = 3/6，1/3 = 2/6，然后相加：3/6 + 2/6 = 5/6",
                        error_type="计算错误",
                        knowledge_point="分数运算"
                    ),
                    MistakeAnalysis(
                        mistake_record_id=2,
                        section="几何题", 
                        question="求三角形的面积",
                        answer="10平方厘米",
                        is_question=True,
                        is_correct=False,
                        correct_answer="12平方厘米",
                        comment="底边为6cm，高为4cm，面积应为(6×4)/2=12平方厘米",
                        error_type="公式应用错误",
                        knowledge_point="三角形面积"
                    )
                ]
                
                for analysis in example_analyses:
                    db.add(analysis)
                
                db.commit()
                logger.info("示例数据插入成功")
                
        except Exception as e:
            db.rollback()
            logger.error(f"插入示例数据失败: {e}")
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"数据库表创建失败: {e}")
        raise

def save_mistake_record(db, file_data, analysis_data=None):
    """保存错题记录和分析结果"""
    try:
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
        
        # 保存分析结果
        if analysis_data:
            for analysis in analysis_data:
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
        
        db.commit()
        logger.info(f"错题记录保存成功，文件ID: {file_data.get('file_id')}")
        return mistake_record
        
    except Exception as e:
        db.rollback()
        logger.error(f"保存错题记录失败: {e}")
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

def test_database():
    """测试数据库功能"""
    db = SessionLocal()
    try:
        # 测试查询
        records = get_mistake_records(db)
        print(f"找到 {len(records)} 条错题记录")
        
        for record in records:
            analyses = get_mistake_analysis_by_file_id(db, record.file_id)
            print(f"文件 {record.filename} 有 {len(analyses)} 条分析记录")
            
        # 测试相似错题查询
        similar = get_similar_mistakes(db, error_type="计算错误")
        print(f"找到 {len(similar)} 条计算错误类型的错题")
        
        return True
        
    except Exception as e:
        print(f"数据库测试失败: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    # 初始化数据库
    init_db()
    print("SQLite数据库初始化完成")
    
    # 测试数据库功能
    if test_database():
        print("数据库功能测试通过")
    else:
        print("数据库功能测试失败")
