import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './styles.module.css';
import { getMistakesList, MistakeRecord } from '../../lib/apiClient';
import { MobileNav } from '../../components/MobileNav';

const ErrorBookPage: React.FC = () => {
  const navigate = useNavigate();
  
  // 真实数据状态
  const [mistakes, setMistakes] = useState<MistakeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedErrors, setSelectedErrors] = useState<Set<number>>(new Set());

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedReason, setSelectedReason] = useState('');

  // 设置页面标题
  useEffect(() => {
    const originalTitle = document.title;
    document.title = '错题智析 - 错题本';
    return () => { document.title = originalTitle; };
  }, []);

  // 加载数据
  useEffect(() => {
    loadMistakes();
  }, [searchTerm, selectedSubject, selectedReason, currentPage, pageSize]);

  const loadMistakes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const skip = (currentPage - 1) * pageSize;
      
      const response = await getMistakesList(
        selectedSubject || undefined,
        selectedReason || undefined,
        searchTerm || undefined,
        skip,
        pageSize
      );
      
      setMistakes(response.mistakes);
      setTotalCount(response.total_count);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载错题列表失败');
      console.error('加载错题列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSubject(e.target.value);
    setCurrentPage(1);
  };

  const handleReasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedReason(e.target.value);
    setCurrentPage(1);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedErrors(new Set(mistakes.map(mistake => mistake.mistake_record_id)));
    } else {
      setSelectedErrors(new Set());
    }
  };

  const handleSelectError = (mistakeId: number, checked: boolean) => {
    const newSelected = new Set(selectedErrors);
    if (checked) {
      newSelected.add(mistakeId);
    } else {
      newSelected.delete(mistakeId);
    }
    setSelectedErrors(newSelected);
  };

  const getTotalPages = (): number => {
    return Math.ceil(totalCount / pageSize);
  };

  const isAllSelected = (): boolean => {
    return mistakes.length > 0 && mistakes.every(mistake => selectedErrors.has(mistake.mistake_record_id));
  };

  const isIndeterminate = (): boolean => {
    const selectedCount = mistakes.filter(mistake => selectedErrors.has(mistake.mistake_record_id)).length;
    return selectedCount > 0 && selectedCount < mistakes.length;
  };

  const getReasonColor = (reason: string): string => {
    const colors: { [key: string]: string } = {
      '概念不清': 'bg-warning/10 text-warning',
      '计算错误': 'bg-danger/10 text-danger',
      '粗心大意': 'bg-info/10 text-info',
      '知识点遗忘': 'bg-secondary/10 text-secondary'
    };
    return colors[reason] || 'bg-text-secondary/10 text-text-secondary';
  };

  const handleViewDetail = (mistakeId: number) => {
    navigate(`/error-detail?errorId=${mistakeId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className={styles.pageWrapper}>
      {/* 顶部导航栏 */}
      <header className="fixed top-0 left-0 right-0 bg-card-bg border-b border-border-light h-16 z-50">
        <div className="flex items-center justify-between h-full px-3 sm:px-4 md:px-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <i className="fas fa-brain text-white text-lg"></i>
            </div>
            <h1 className="text-lg md:text-xl font-bold text-text-primary">错题智析</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="p-2 text-text-secondary hover:text-primary">
              <i className="fas fa-bell text-lg"></i>
            </button>
            <div className="flex items-center space-x-2 cursor-pointer">
              <img 
                src="https://s.coze.cn/image/8Vof2KwQlvM/" 
                alt="用户头像" 
                className="w-8 h-8 rounded-full" 
              />
              <span className="hidden sm:inline text-text-primary font-medium">小明同学</span>
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
      <main className="mt-16 p-4 md:p-6 min-h-screen pb-24 md:pb-6 md:ml-64">
        {/* 页面头部 */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">错题本</h2>
              <nav className="text-sm text-text-secondary">
                <span>错题本</span>
              </nav>
            </div>
            <div className="text-right">
              <p className="text-text-secondary">
                共 <span className="font-semibold text-text-primary">{totalCount}</span> 道错题
              </p>
            </div>
          </div>
        </div>

        {/* 工具栏区域 */}
        <div className="bg-card-bg rounded-2xl border border-border-light p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* 搜索框 */}
            <div className="flex-1 lg:max-w-md">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="搜索知识点..." 
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-3 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary"></i>
              </div>
            </div>

            {/* 筛选条件 */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
              {/* 学科筛选 */}
              <select 
                value={selectedSubject}
                onChange={handleSubjectChange}
                className="w-full sm:w-auto px-4 py-3 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">全部学科</option>
                <option value="数学">数学</option>
                <option value="语文">语文</option>
                <option value="英语">英语</option>
                <option value="物理">物理</option>
              </select>

              {/* 错误原因筛选 */}
              <select 
                value={selectedReason}
                onChange={handleReasonChange}
                className="w-full sm:w-auto px-4 py-3 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">全部原因</option>
                <option value="概念不清">概念不清</option>
                <option value="计算错误">计算错误</option>
                <option value="粗心大意">粗心大意</option>
                <option value="知识点遗忘">知识点遗忘</option>
              </select>
            </div>
          </div>
        </div>

        {/* 错题列表 */}
        <div className="bg-card-bg rounded-2xl border border-border-light overflow-hidden">
          {/* 表格头部 */}
          <div className="bg-bg-light px-4 md:px-6 py-4 border-b border-border-light">
            <div className="flex items-center">
              <input 
                type="checkbox" 
                checked={isAllSelected()}
                ref={(input) => {
                  if (input) input.indeterminate = isIndeterminate();
                }}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-4 h-4 text-primary border-border-light rounded focus:ring-primary/20 mr-4"
              />
              <div className="hidden md:grid flex-1 grid-cols-12 gap-4 text-sm font-medium text-text-secondary">
                <div className="col-span-1">图片</div>
                <div className="col-span-3">题目内容</div>
                <div className="col-span-1">学科</div>
                <div className="col-span-1">知识点</div>
                <div className="col-span-1">错误原因</div>
                <div className="col-span-1">上传日期</div>
                <div className="col-span-2">操作</div>
              </div>
            </div>
          </div>

          {/* 表格内容 */}
          <div className="divide-y divide-border-light">
            {loading ? (
              <div className="px-6 py-8 text-center text-text-secondary">
                <i className="fas fa-spinner fa-spin text-2xl mb-2"></i>
                <p>加载中...</p>
              </div>
            ) : error ? (
              <div className="px-6 py-8 text-center text-danger">
                <i className="fas fa-exclamation-triangle text-2xl mb-2"></i>
                <p>{error}</p>
              </div>
            ) : mistakes.length === 0 ? (
              <div className="px-6 py-8 text-center text-text-secondary">
                <i className="fas fa-inbox text-2xl mb-2"></i>
                <p>暂无错题记录</p>
              </div>
            ) : (
              mistakes.map(mistake => (
                <div key={mistake.mistake_record_id} className={`${styles.tableRow} px-4 md:px-6 py-4 flex items-start md:items-center`}>
                  <input 
                    type="checkbox" 
                    checked={selectedErrors.has(mistake.mistake_record_id)}
                    onChange={(e) => handleSelectError(mistake.mistake_record_id, e.target.checked)}
                    className="w-4 h-4 text-primary border-border-light rounded focus:ring-primary/20 mr-4"
                  />
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-start md:items-center">
                    <div className="hidden md:block md:col-span-1">
                      <img 
                        src={mistake.file_info.file_url} 
                        alt="题目图片" 
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <p className="text-text-primary font-medium text-sm line-clamp-2">
                        {mistake.analysis.question || '无题目内容'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 md:col-span-1">
                      <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                        {mistake.analysis.subject || '未知'}
                      </span>
                    </div>
                    <div className="hidden md:block md:col-span-1">
                      <span className="text-text-secondary text-sm">
                        {mistake.analysis.knowledge_point || '未知'}
                      </span>
                    </div>
                    <div className="md:col-span-1">
                      <span className={`px-2 py-1 ${getReasonColor(mistake.analysis.error_type)} text-xs rounded-full`}>
                        {mistake.analysis.error_type || '未知'}
                      </span>
                    </div>
                    <div className="md:col-span-1">
                      <span className="text-text-secondary text-sm">
                        {formatDate(mistake.file_info.upload_time)}
                      </span>
                    </div>
                    <div className="md:col-span-2">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleViewDetail(mistake.mistake_record_id)}
                          className="p-1 text-primary hover:text-primary/80" 
                          title="查看详情"
                        >
                          <i className="fas fa-eye text-sm"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 分页区域 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <span className="text-sm text-text-secondary">每页显示</span>
            <select 
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-1 border border-border-light rounded focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
            <span className="text-sm text-text-secondary">
              条，共 <span>{getTotalPages()}</span> 页
            </span>
          </div>
          
          <div className="flex items-center justify-between sm:justify-end gap-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-border-light rounded hover:border-primary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <span className="text-sm text-text-primary">
              第 {currentPage} 页
            </span>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, getTotalPages()))}
              disabled={currentPage === getTotalPages()}
              className="px-3 py-1 border border-border-light rounded hover:border-primary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
};

export default ErrorBookPage;
