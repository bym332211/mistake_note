

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE_URL, getMistakeDetail, updateMistakeErrorType } from '../../lib/apiClient';
import styles from './styles.module.css';
import { MobileNav } from '../../components/MobileNav';

interface MistakeDetailData {
  file_info: {
    id: number;
    file_id: string;
    filename: string;
    file_url: string;
    file_size: number;
    file_type: string;
    upload_time: string;
    created_at: string;
  };
  analysis: Array<{
    id: string | number;
    section: string;
    question: string;
    answer: string;
    is_question: boolean;
    is_correct: boolean;
    correct_answer: string;
    comment: string;
    error_type: string | null;
    knowledge_point: string | null;
    created_at?: string;
  }>;
  practices: Array<{
    id?: number;
    question: string;
    correct_answer: string;
    comment: string;
    created_at?: string;
  }>;
}

const ErrorDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [mistakeData, setMistakeData] = useState<MistakeDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedErrorType, setSelectedErrorType] = useState<string>('');
  const errorTypeOptions = [
    '未分类',
    '粗心',
    '审题不清',
    '概念不清',
    '计算错误',
    '步骤遗漏',
    '知识点不会',
    '其他',
  ];

  // 设置页面标题
  useEffect(() => {
    const originalTitle = document.title;
    document.title = 'AI错题本 - 错题详情';
    return () => { document.title = originalTitle; };
  }, []);

  // 获取错题详情数据
  useEffect(() => {
    const errorId = searchParams.get('errorId');
    if (errorId) {
      const mistakeId = parseInt(errorId, 10);
      if (!isNaN(mistakeId)) {
        fetchMistakeDetail(mistakeId);
      } else {
        setError('无效的错题ID');
      }
    } else {
      setError('未提供错题ID');
    }
  }, [searchParams]);

  // 获取错题详情
  const fetchMistakeDetail = async (mistakeId: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMistakeDetail(mistakeId);
      setMistakeData(data);
      console.log('获取错题详情成功:', data);
    } catch (err) {
      console.error('获取错题详情失败:', err);
      setError(err instanceof Error ? err.message : '获取错题详情失败');
    } finally {
      setLoading(false);
    }
  };

  // 编辑模式切换
  const handleEditToggle = async () => {
    // 进入编辑模式
    if (!isEditMode) {
      setIsEditMode(true);
      return;
    }

    // 保存编辑内容
    const recordId = mistakeData?.file_info?.id;
    if (!recordId) {
      alert('无法保存：缺少错题ID');
      setIsEditMode(false);
      return;
    }

    const analysisId = mainAnalysis?.id ? Number(mainAnalysis.id) : undefined;
    const errorTypeToSave = selectedErrorType || mainAnalysis?.error_type || '未分类';

    try {
      await updateMistakeErrorType({
        mistake_record_id: recordId,
        analysis_id: analysisId,
        error_type: errorTypeToSave,
      });

      // 同步更新本地展示
      setMistakeData(prev => {
        if (!prev) return prev;
        const updatedAnalysis = prev.analysis.map((item, index) =>
          index === 0 ? { ...item, error_type: errorTypeToSave } : item
        );
        return { ...prev, analysis: updatedAnalysis };
      });
      setIsEditMode(false);
    } catch (error) {
      console.error('保存错误原因失败:', error);
      alert(error instanceof Error ? error.message : '保存错误原因失败，请稍后重试');
    }
  };

  // 删除错题
  const handleDelete = () => {
    if (confirm('确定要删除这道错题吗？删除后无法恢复。')) {
      console.log('删除错题');
      // 在实际应用中，这里会调用API删除错题
      // 删除成功后跳转到错题本页面
      navigate('/error-book');
    }
  };

  // 收藏切换
  const handleFavoriteToggle = () => {
    setIsFavorited(!isFavorited);
    console.log('收藏状态:', !isFavorited);
    // 在实际应用中，这里会调用API更新收藏状态
  };

  // 知识点链接点击
  const handleKnowledgePointClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // 跳转到错题本页面，并筛选该知识点的错题
    navigate('/error-book?knowledgePoint=分数加减法');
  };

  // 相似题点击
  const handleSimilarQuestionClick = (questionId: string) => {
    const errorId = searchParams.get('errorId') || 'error-1';
    navigate(`/similar-practice?questionId=${questionId}&sourceErrorId=${errorId}`);
  };

  // 开始练习所有相似题
  const handlePracticeAll = () => {
    const errorId = searchParams.get('errorId') || 'error-1';
    navigate(`/similar-practice?sourceErrorId=${errorId}`);
  };

  // 获取主要分析数据（第一条分析记录）
  const mainAnalysis = mistakeData?.analysis?.[0];
  useEffect(() => {
    if (!mistakeData?.analysis) {
      setSelectedErrorType('');
      return;
    }
    const firstWithErrorType = mistakeData.analysis.find((a) => a.error_type);
    setSelectedErrorType(firstWithErrorType?.error_type || mainAnalysis?.error_type || '');
  }, [mistakeData, mainAnalysis?.error_type]);

  // 渲染加载状态
  if (loading) {
    return (
      <div className={styles.pageWrapper}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-text-primary">正在加载错题详情...</p>
          </div>
        </div>
      </div>
    );
  }

  // 渲染错误状态
  if (error) {
    return (
      <div className={styles.pageWrapper}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-exclamation-triangle text-danger text-2xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">加载失败</h3>
            <p className="text-text-secondary mb-4">{error}</p>
            <button 
              onClick={() => navigate('/error-book')}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              返回错题本
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      {/* 顶部导航栏 */}
      <header className="fixed top-0 left-0 right-0 bg-card-bg border-b border-border-light h-16 z-50">
        <div className="flex items-center justify-between h-full px-3 sm:px-4 md:px-6">
          {/* Logo和产品名称 */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <i className="fas fa-brain text-white text-lg"></i>
            </div>
            <h1 className="text-lg md:text-xl font-bold text-text-primary">AI错题本</h1>
          </div>
          
          {/* 用户操作区 */}
          <div className="flex items-center space-x-4">
            <button className="p-2 text-text-secondary hover:text-primary">
              <i className="fas fa-bell text-lg"></i>
            </button>
            <div className="flex items-center space-x-2 cursor-pointer">
              <img 
                src="https://s.coze.cn/image/FmziPPHSy5Y/" 
                alt="用户头像" 
                className="w-8 h-8 rounded-full" 
              />
              <span className="hidden sm:inline text-text-primary font-medium">鲍俊安同学</span>
              <i className="hidden sm:inline fas fa-chevron-down text-text-secondary text-sm"></i>
            </div>
          </div>
        </div>
      </header>

      {/* 左侧菜单 */}
      <aside className={`hidden md:block fixed left-0 top-16 bottom-0 w-64 bg-card-bg border-r border-border-light z-40 ${styles.sidebarTransition}`}>
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <Link 
                to="/home" 
                className={`${styles.menuItem} flex items-center space-x-3 px-4 py-3 rounded-lg text-text-secondary`}
              >
                <i className="fas fa-home text-lg"></i>
                <span className="font-medium">首页</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/upload" 
                className={`${styles.menuItem} flex items-center space-x-3 px-4 py-3 rounded-lg text-text-secondary`}
              >
                <i className="fas fa-camera text-lg"></i>
                <span className="font-medium">错题上传</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/error-book" 
                className={`${styles.menuItem} ${styles.menuItemActive} flex items-center space-x-3 px-4 py-3 rounded-lg`}
              >
                <i className="fas fa-book text-lg"></i>
                <span className="font-medium">错题本</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/review-plan" 
                className={`${styles.menuItem} flex items-center space-x-3 px-4 py-3 rounded-lg text-text-secondary`}
              >
                <i className="fas fa-redo text-lg"></i>
                <span className="font-medium">错题复习</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/report" 
                className={`${styles.menuItem} flex items-center space-x-3 px-4 py-3 rounded-lg text-text-secondary`}
              >
                <i className="fas fa-chart-line text-lg"></i>
                <span className="font-medium">学习报告</span>
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* 主内容区 */}
      <main className={`mt-16 p-4 md:p-6 min-h-screen pb-24 md:pb-6 md:ml-64 ${isEditMode ? styles.editMode : ''}`}>
        {/* 页面头部 */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">错题详情</h2>
              <nav className="text-sm text-text-secondary">
                <Link to="/error-book" className="hover:text-primary">错题本</Link>
                <span className="mx-2">/</span>
                <span>错题详情</span>
              </nav>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={handleEditToggle}
                className={`px-4 py-2 text-white rounded-lg hover:bg-opacity-90 ${
                  isEditMode ? 'bg-success' : 'bg-primary'
                }`}
              >
                <i className={`${isEditMode ? 'fas fa-save' : 'fas fa-edit'} mr-2`}></i>
                {isEditMode ? '保存' : '编辑'}
              </button>
              <button 
                onClick={handleDelete}
                className="px-4 py-2 bg-danger text-white rounded-lg hover:bg-danger/90"
              >
                <i className="fas fa-trash mr-2"></i>删除
              </button>
              <button 
                onClick={handleFavoriteToggle}
                className={`px-4 py-2 text-white rounded-lg hover:bg-opacity-90 ${
                  isFavorited ? 'bg-danger' : 'bg-warning'
                }`}
              >
                <i className={`${isFavorited ? 'fas fa-star' : 'far fa-star'} mr-2`}></i>
                {isFavorited ? '已收藏' : '收藏'}
              </button>
            </div>
          </div>
        </div>

        {/* 错题信息区 */}
        <section className="mb-8">
          <div className="bg-card-bg rounded-2xl border border-border-light p-6">
            {/* 题目图片 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-text-primary mb-3">题目图片</h3>
              {mistakeData?.file_info?.file_url ? (
                <img 
                  src={`${API_BASE_URL}${mistakeData.file_info.file_url}`} 
                  alt="错题图片" 
                  className="w-full max-w-md rounded-lg border border-border-light" 
                />
              ) : (
                <div className="w-full max-w-md h-48 bg-bg-light rounded-lg border border-border-light flex items-center justify-center">
                  <p className="text-text-secondary">暂无图片</p>
                </div>
              )}
            </div>

            {/* 题目内容 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-text-primary mb-3">题目内容</h3>
              <div className={`${styles.editable} bg-bg-light rounded-lg p-4 text-text-primary`}>
                <p className="font-medium mb-2">{mainAnalysis?.section || '题目'}</p>
                <p className="text-lg">{mainAnalysis?.question || '暂无题目内容'}</p>
                {mainAnalysis?.comment && (
                  <p className="text-sm text-text-secondary mt-2">{mainAnalysis.comment}</p>
                )}
              </div>
            </div>

            {/* 答案对比 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* 用户答案 */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-3">你的答案</h3>
                <div className={`${styles.editable} bg-danger/5 border border-danger/20 rounded-lg p-4`}>
                  <p className="text-text-primary">{mainAnalysis?.answer || '未提供答案'}</p>
                  <p className="text-sm text-danger mt-2">
                    <i className="fas fa-times-circle mr-1"></i>
                    {mainAnalysis?.is_correct ? '答案正确' : '答案错误'}
                  </p>
                </div>
              </div>

              {/* 正确答案 */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-3">正确答案</h3>
                <div className="bg-success/5 border border-success/20 rounded-lg p-4">
                  <p className="text-text-primary font-medium">{mainAnalysis?.correct_answer || '暂无正确答案'}</p>
                  {mainAnalysis?.comment && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm text-text-secondary">解题思路：</p>
                      <p className="text-sm text-text-primary">{mainAnalysis.comment}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 知识点和错误原因 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* 知识点 */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-3">知识点</h3>
                <div className={`${styles.editable} bg-info/5 border border-info/20 rounded-lg p-4`}>
                  {mainAnalysis?.knowledge_point ? (
                    <a 
                      href="#" 
                      onClick={handleKnowledgePointClick}
                      className="text-info hover:text-info/80 font-medium"
                    >
                      <i className="fas fa-tag mr-2"></i>{mainAnalysis.knowledge_point}
                    </a>
                  ) : (
                    <span className="text-info font-medium">
                      <i className="fas fa-tag mr-2"></i>暂无知识点信息
                    </span>
                  )}
                  <p className="text-sm text-text-secondary mt-2">数学 · 错题分析</p>
                </div>
              </div>

              {/* 错误原因 */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-3">错误原因</h3>
                <div className={`${styles.editable} bg-warning/5 border border-warning/20 rounded-lg p-4`}>
                  <div className="flex items-center space-x-3">
                    <select
                      value={selectedErrorType}
                      onChange={(e) => setSelectedErrorType(e.target.value)}
                      className="px-3 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="">未分类</option>
                      {errorTypeOptions
                        .filter((opt) => opt !== '未分类')
                        .map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      {/* 已存在但不在预设列表的历史值也要展示 */}
                      {selectedErrorType &&
                        !errorTypeOptions.includes(selectedErrorType) && (
                          <option value={selectedErrorType}>{selectedErrorType}</option>
                        )}
                    </select>
                    {selectedErrorType && (
                      <span className="px-3 py-1 bg-danger text-white text-xs rounded-full">{selectedErrorType}</span>
                    )}
                  </div>
                  {mainAnalysis?.comment && (
                    <p className="text-sm text-text-secondary mt-2">{mainAnalysis.comment}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 解题思路 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-text-primary mb-3">解题思路</h3>
              <div className={`${styles.editable} bg-secondary/5 border border-secondary/20 rounded-lg p-4`}>
                {mainAnalysis?.comment ? (
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                      <div>
                        <p className="font-medium text-text-primary">理解题目要求</p>
                        <p className="text-sm text-text-secondary">仔细阅读题目，明确需要解决的问题</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                      <div>
                        <p className="font-medium text-text-primary">分析解题思路</p>
                        <p className="text-sm text-text-secondary">{mainAnalysis.comment}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                      <div>
                        <p className="font-medium text-text-primary">验证答案</p>
                        <p className="text-sm text-text-secondary">检查计算过程和最终结果是否正确</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-text-secondary">暂无详细的解题思路</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 相似题推荐区 */}
        <section className="mb-8">
          <div className="bg-card-bg rounded-2xl border border-border-light p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-text-primary">相似题推荐</h3>
              {mistakeData?.practices && mistakeData.practices.length > 0 && (
                <button 
                  onClick={handlePracticeAll}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  <i className="fas fa-play mr-2"></i>开始练习
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              {mistakeData?.practices && mistakeData.practices.length > 0 ? (
                mistakeData.practices.map((practice, index) => (
                  <div 
                    key={practice.id || index}
                    className={`${styles.similarQuestion} p-4 border border-border-light rounded-lg cursor-pointer transition-all duration-200`}
                    onClick={() => handleSimilarQuestionClick(`practice-${practice.id || index}`)}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="text-primary font-bold text-sm">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-text-primary mb-2">相似练习</h4>
                        <p className="text-text-secondary text-sm mb-2">{practice.question}</p>
                        <div className="flex items-center space-x-4">
                          <span className="px-2 py-1 bg-success/10 text-success text-xs rounded-full">基础</span>
                          <span className="text-text-secondary text-xs">预计用时：3分钟</span>
                        </div>
                      </div>
                      <i className="fas fa-chevron-right text-text-secondary"></i>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-bg-light rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-book text-text-secondary text-xl"></i>
                  </div>
                  <p className="text-text-secondary">暂无相似题推荐</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <MobileNav />
    </div>
  );
};

export default ErrorDetailPage;
