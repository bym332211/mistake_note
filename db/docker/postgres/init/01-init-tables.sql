-- 数据表初始化
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

CREATE TABLE IF NOT EXISTS mistake_analysis (
    id SERIAL PRIMARY KEY,
    mistake_record_id INTEGER REFERENCES mistake_records(id) ON DELETE CASCADE,
    subject VARCHAR(100),
    section VARCHAR(200),
    question TEXT,
    answer TEXT,
    is_question BOOLEAN DEFAULT TRUE,
    is_correct BOOLEAN DEFAULT FALSE,
    correct_answer TEXT,
    comment TEXT,
    error_type VARCHAR(100),
    knowledge_point VARCHAR(200),
    analysis_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mistake_practices (
    id SERIAL PRIMARY KEY,
    mistake_record_id INTEGER REFERENCES mistake_records(id) ON DELETE CASCADE,
    question TEXT,
    correct_answer TEXT,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS review_plans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    plan_name VARCHAR(200),
    plan_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    scheduled_date DATE
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_mistake_records_file_id ON mistake_records(file_id);
CREATE INDEX IF NOT EXISTS idx_mistake_records_upload_time ON mistake_records(upload_time);
CREATE INDEX IF NOT EXISTS idx_mistake_analysis_mistake_record_id ON mistake_analysis(mistake_record_id);
CREATE INDEX IF NOT EXISTS idx_mistake_analysis_subject ON mistake_analysis(subject);
CREATE INDEX IF NOT EXISTS idx_mistake_analysis_error_type ON mistake_analysis(error_type);
CREATE INDEX IF NOT EXISTS idx_mistake_analysis_knowledge_point ON mistake_analysis(knowledge_point);
CREATE INDEX IF NOT EXISTS idx_mistake_practices_record_id ON mistake_practices(mistake_record_id);
CREATE INDEX IF NOT EXISTS idx_review_plans_user_id ON review_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_review_plans_scheduled_date ON review_plans(scheduled_date);

-- 触发器：更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_mistake_records_updated_at
    BEFORE UPDATE ON mistake_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
