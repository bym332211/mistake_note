// API客户端配置
export const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000';

export interface MistakeRecord {
  mistake_record_id: number;
  file_info: {
    file_id: string;
    filename: string;
    file_url: string;
    file_size: number;
    file_type: string;
    upload_time: string;
    created_at: string;
  };
  analysis: {
    id: number;
    subject: string;
    section: string;
    question: string;
    answer: string;
    is_question: boolean;
    is_correct: boolean;
    correct_answer: string;
    comment: string;
    error_type: string | null;
    knowledge_point: string | null;
    created_at: string;
  };
}

export interface MistakesListResponse {
  total_count: number;
  skip: number;
  limit: number;
  mistakes: MistakeRecord[];
}

export interface ApiError {
  detail: string;
}

export interface WeakPointStat {
  knowledge_point: string;
  subject: string;
  total_count: number;
  incorrect_count: number;
  error_rate: number;
}

// 获取错题列表
export const getMistakesList = async (
  subject?: string,
  error_type?: string,
  knowledge_point?: string,
  skip: number = 0,
  limit: number = 100
): Promise<MistakesListResponse> => {
  const params = new URLSearchParams();
  
  if (subject) params.append('subject', subject);
  if (error_type) params.append('error_type', error_type);
  if (knowledge_point) params.append('knowledge_point', knowledge_point);
  params.append('skip', skip.toString());
  params.append('limit', limit.toString());

  const response = await fetch(`${API_BASE_URL}/mistakes?${params}`);
  
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.detail || '获取错题列表失败');
  }

  return response.json();
};

// 获取薄弱知识点统计
export const getWeakPoints = async (top_n: number = 5, subject?: string) => {
  const params = new URLSearchParams();
  params.append('top_n', top_n.toString());
  if (subject) params.append('subject', subject);

  const response = await fetch(`${API_BASE_URL}/stats/weak_points?${params}`);
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.detail || '获取薄弱知识点失败');
  }
  return response.json() as Promise<{ weak_points: WeakPointStat[] }>;
};

// 获取错题详情
export const getMistakeDetail = async (mistakeId: number): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/mistake/${mistakeId}`);
  
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.detail || '获取错题详情失败');
  }

  return response.json();
};

// 删除错题
export const deleteMistake = async (mistakeId: number): Promise<void> => {
  // 注意：后端目前没有删除API，这里只是占位符
  // 在实际应用中，这里会调用DELETE /mistake/{mistake_id}
  console.log('删除错题:', mistakeId);
  throw new Error('删除功能暂未实现');
};

// 批量删除错题
export const batchDeleteMistakes = async (mistakeIds: number[]): Promise<void> => {
  // 注意：后端目前没有批量删除API，这里只是占位符
  console.log('批量删除错题:', mistakeIds);
  throw new Error('批量删除功能暂未实现');
};

// 导出错题
export const exportMistakes = async (mistakeIds: number[]): Promise<void> => {
  // 注意：后端目前没有导出API，这里只是占位符
  console.log('导出错题:', mistakeIds);
  throw new Error('导出功能暂未实现');
};

// 更新错题的错误原因
export const updateMistakeErrorType = async (payload: {
  mistake_record_id: number;
  error_type: string;
  analysis_id?: number;
}) => {
  const response = await fetch(`${API_BASE_URL}/mistake/error_type`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    try {
      const error: ApiError = await response.json();
      throw new Error(error.detail || '保存错误原因失败');
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : '保存错误原因失败');
    }
  }

  return response.json();
};
