-- 创建错题表
CREATE TABLE IF NOT EXISTS mistake_records (
    id SERIAL PRIMARY KEY,
    file_id VARCHAR(255) UNIQUE NOT NULL,
    filename VARCHAR(500) NOT NULL,
    file_url VARCHAR(1000),
    file_size INTEGER,
    file_type VARCHAR(100),
    upload_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建错题分析表
CREATE TABLE IF NOT EXISTS mistake_analysis (
    id SERIAL PRIMARY KEY,
    mistake_record_id INTEGER REFERENCES mistake_records(id) ON DELETE CASCADE,
    section VARCHAR(200),
    question TEXT,
    answer TEXT,
    is_question BOOLEAN DEFAULT TRUE,
    is_correct BOOLEAN DEFAULT FALSE,
    correct_answer TEXT,
    comment TEXT,
    error_type VARCHAR(100), -- 错因类型：概念不清/审题疏漏/计算错误/步骤跳跃/单位格式/作图标注/粗心
    knowledge_point VARCHAR(200), -- 知识点
    analysis_data JSONB, -- 存储完整的分析数据
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建用户表（可选，用于未来扩展）
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建复习计划表
CREATE TABLE IF NOT EXISTS review_plans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    plan_name VARCHAR(200),
    plan_data JSONB, -- 存储复习计划详情
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    scheduled_date DATE
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_mistake_records_file_id ON mistake_records(file_id);
CREATE INDEX IF NOT EXISTS idx_mistake_records_upload_time ON mistake_records(upload_time);
CREATE INDEX IF NOT EXISTS idx_mistake_analysis_mistake_record_id ON mistake_analysis(mistake_record_id);
CREATE INDEX IF NOT EXISTS idx_mistake_analysis_error_type ON mistake_analysis(error_type);
CREATE INDEX IF NOT EXISTS idx_mistake_analysis_knowledge_point ON mistake_analysis(knowledge_point);
CREATE INDEX IF NOT EXISTS idx_review_plans_user_id ON review_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_review_plans_scheduled_date ON review_plans(scheduled_date);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为mistake_records表添加更新时间触发器
CREATE TRIGGER update_mistake_records_updated_at 
    BEFORE UPDATE ON mistake_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入示例数据（可选）
INSERT INTO mistake_records (file_id, filename, file_url, file_size, file_type) VALUES
('example-1', 'math_problem_1.png', '/media/uploads/example-1.png', 102400, 'image/png'),
('example-2', 'math_problem_2.jpg', '/media/uploads/example-2.jpg', 204800, 'image/jpeg')
ON CONFLICT (file_id) DO NOTHING;

INSERT INTO mistake_analysis (mistake_record_id, section, question, answer, is_question, is_correct, correct_answer, comment, error_type, knowledge_point) VALUES
(1, '计算题', '计算：1/2 + 1/3 = ?', '', TRUE, FALSE, '5/6', '需要先找到公分母：2和3的最小公倍数是6，将分数转换为同分母：1/2 = 3/6，1/3 = 2/6，然后相加：3/6 + 2/6 = 5/6', '计算错误', '分数运算'),
(2, '几何题', '求三角形的面积', '10平方厘米', TRUE, FALSE, '12平方厘米', '底边为6cm，高为4cm，面积应为(6×4)/2=12平方厘米', '公式应用错误', '三角形面积')
ON CONFLICT DO NOTHING;
