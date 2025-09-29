

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './styles.module.css';

interface ErrorQuestion {
  id: string;
  image: string;
  question: string;
  subject: string;
  knowledgePoint: string;
  errorReason: string;
  uploadDate: string;
  isCollected: boolean;
}

interface FilterState {
  searchTerm: string;
  selectedSubjects: string[];
  selectedReasons: string[];
  timeFilter: string;
}

const ErrorBookPage: React.FC = () => {
  const navigate = useNavigate();
  
  // 模拟错题数据
  const [mockErrors] = useState<ErrorQuestion[]>([
    {
      id: 'error_001',
      image: 'https://s.coze.cn/image/Fuum29CQDQM/',
      question: '计算：1/2 + 1/3 = ?',
      subject: '数学',
      knowledgePoint: '分数加减法',
      errorReason: '计算错误',
      uploadDate: '2024-01-15',
      isCollected: false
    },
    {
      id: 'error_002',
      image: 'https://s.coze.cn/image/0jfoZmBykEA/',
      question: '《春天来了》段落分析',
      subject: '语文',
      knowledgePoint: '阅读理解',
      errorReason: '概念不清',
      uploadDate: '2024-01-14',
      isCollected: true
    },
    {
      id: 'error_003',
      image: 'https://s.coze.cn/image/_00-buUTrFE/',
      question: '选择正确的动词时态',
      subject: '英语',
      knowledgePoint: '动词时态',
      errorReason: '知识点遗忘',
      uploadDate: '2024-01-13',
      isCollected: false
    },
    {
      id: 'error_004',
      image: 'https://s.coze.cn/image/AOzpcVlhLBM/',
      question: '力的合成与分解',
      subject: '物理',
      knowledgePoint: '力学基础',
      errorReason: '概念不清',
      uploadDate: '2024-01-12',
      isCollected: false
    },
    {
      id: 'error_005',
      image: 'https://s.coze.cn/image/0KNiyHNcsN8/',
      question: '二次函数图像分析',
      subject: '数学',
      knowledgePoint: '函数图像',
      errorReason: '粗心大意',
      uploadDate: '2024-01-11',
      isCollected: true
    },
    {
      id: 'error_006',
      image: 'https://s.coze.cn/image/ehX3kZvMgiA/',
      question: '文言文翻译',
      subject: '语文',
      knowledgePoint: '文言文',
      errorReason: '知识点遗忘',
      uploadDate: '2024-01-10',
      isCollected: false
    },
    {
      id: 'error_007',
      image: 'https://s.coze.cn/image/nITwgR2Gaf8/',
      question: '化学方程式配平',
      subject: '化学',
      knowledgePoint: '化学反应',
      errorReason: '计算错误',
      uploadDate: '2024-01-09',
      isCollected: false
    },
    {
      id: 'error_008',
      image: 'https://s.coze.cn/image/Fap56tYfxxc/',
      question: '生物细胞结构',
      subject: '生物',
      knowledgePoint: '细胞生物学',
      errorReason: '概念不清',
      uploadDate: '2024-01-08',
      isCollected: false
    }
  ]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filteredErrors, setFilteredErrors] = useState<ErrorQuestion[]>([]);
  const [selectedErrors, setSelectedErrors] = useState<Set<string>>(new Set());
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [showReasonDropdown, setShowReasonDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    selectedSubjects: [],
    selectedReasons: [],
    timeFilter: 'all'
  });

  // 设置页面标题
  useEffect(() => {
    const originalTitle = document.title;
    document.title = '错题智析 - 错题本';
    return () => { document.title = originalTitle; };
  }, []);

  // 初始化和筛选数据
  useEffect(() => {
    filterErrors();
  }, [filters, sortField, sortDirection]);

  const filterErrors = () => {
    let filtered = [...mockErrors];

    // 搜索过滤
    if (filters.searchTerm) {
      filtered = filtered.filter(error => 
        error.question.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    // 学科过滤
    if (filters.selectedSubjects.length > 0) {
      filtered = filtered.filter(error => 
        filters.selectedSubjects.includes(error.subject.toLowerCase())
      );
    }

    // 错误原因过滤
    if (filters.selectedReasons.length > 0) {
      filtered = filtered.filter(error => 
        filters.selectedReasons.includes(error.errorReason.toLowerCase())
      );
    }

    // 时间过滤
    if (filters.timeFilter !== 'all') {
      filtered = filtered.filter(error => 
        checkTimeFilter(error.uploadDate, filters.timeFilter)
      );
    }

    // 排序
    if (sortField) {
      filtered.sort((a, b) => {
        const valueA = a[sortField as keyof ErrorQuestion] as string;
        const valueB = b[sortField as keyof ErrorQuestion] as string;
        if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
        if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredErrors(filtered);
    setCurrentPage(1);
    setSelectedErrors(new Set());
  };

  const checkTimeFilter = (dateString: string, filter: string): boolean => {
    const errorDate = new Date(dateString);
    const now = new Date();
    
    switch(filter) {
      case 'today':
        return errorDate.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return errorDate >= weekAgo;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return errorDate >= monthAgo;
      case 'quarter':
        const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        return errorDate >= quarterAgo;
      default:
        return true;
    }
  };

  const handleSort = (field: string) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, searchTerm: e.target.value }));
  };

  const handleSubjectFilterChange = (value: string, checked: boolean) => {
    if (value === 'all') {
      setFilters(prev => ({ ...prev, selectedSubjects: checked ? [] : [] }));
    } else {
      setFilters(prev => ({
        ...prev,
        selectedSubjects: checked 
          ? [...prev.selectedSubjects, value]
          : prev.selectedSubjects.filter(subject => subject !== value)
      }));
    }
  };

  const handleReasonFilterChange = (value: string, checked: boolean) => {
    if (value === 'all') {
      setFilters(prev => ({ ...prev, selectedReasons: checked ? [] : [] }));
    } else {
      setFilters(prev => ({
        ...prev,
        selectedReasons: checked 
          ? [...prev.selectedReasons, value]
          : prev.selectedReasons.filter(reason => reason !== value)
      }));
    }
  };

  const handleTimeFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, timeFilter: e.target.value }));
  };

  const handleSelectAll = (checked: boolean) => {
    const currentPageErrors = getCurrentPageErrors();
    if (checked) {
      setSelectedErrors(new Set(currentPageErrors.map(error => error.id)));
    } else {
      setSelectedErrors(new Set());
    }
  };

  const handleSelectError = (errorId: string, checked: boolean) => {
    const newSelected = new Set(selectedErrors);
    if (checked) {
      newSelected.add(errorId);
    } else {
      newSelected.delete(errorId);
    }
    setSelectedErrors(newSelected);
  };

  const getCurrentPageErrors = (): ErrorQuestion[] => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredErrors.slice(startIndex, endIndex);
  };

  const getTotalPages = (): number => {
    return Math.ceil(filteredErrors.length / pageSize);
  };

  const isAllSelected = (): boolean => {
    const currentPageErrors = getCurrentPageErrors();
    return currentPageErrors.length > 0 && 
           currentPageErrors.every(error => selectedErrors.has(error.id));
  };

  const isIndeterminate = (): boolean => {
    const currentPageErrors = getCurrentPageErrors();
    const selectedCount = currentPageErrors.filter(error => selectedErrors.has(error.id)).length;
    return selectedCount > 0 && selectedCount < currentPageErrors.length;
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

  const handleDeleteError = (errorId: string) => {
    if (confirm('确定要删除这道错题吗？')) {
      // 在实际应用中，这里会调用API删除
      console.log('删除错题:', errorId);
      // 由于我们使用的是模拟数据，这里只是更新状态
      const updatedErrors = mockErrors.filter(error => error.id !== errorId);
      // 注意：在实际应用中，你需要更新你的数据源
      setSelectedErrors(prev => {
        const newSet = new Set(prev);
        newSet.delete(errorId);
        return newSet;
      });
    }
  };

  const handleBatchDelete = () => {
    if (selectedErrors.size > 0) {
      setShowDeleteModal(true);
    }
  };

  const confirmBatchDelete = () => {
    // 在实际应用中，这里会调用API批量删除
    console.log('批量删除错题:', Array.from(selectedErrors));
    setSelectedErrors(new Set());
    setShowDeleteModal(false);
  };

  const handleBatchExport = () => {
    if (selectedErrors.size > 0) {
      console.log('导出错题功能需要后端支持');
      alert('导出功能开发中...');
    }
  };

  const handleToggleCollect = (errorId: string) => {
    // 在实际应用中，这里会调用API更新收藏状态
    console.log('切换收藏状态:', errorId);
  };

  const handleViewDetail = (errorId: string) => {
    navigate(`/error-detail?errorId=${errorId}`);
  };

  const handleEditError = (errorId: string) => {
    navigate(`/error-detail?errorId=${errorId}&mode=edit`);
  };

  const renderPageNumbers = () => {
    const totalPages = getTotalPages();
    const pageNumbers = [];

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        pageNumbers.push(
          <button
            key={i}
            className={`px-3 py-1 border rounded ${
              i === currentPage 
                ? 'border-primary bg-primary text-white' 
                : 'border-border-light hover:border-primary hover:text-primary'
            }`}
            onClick={() => setCurrentPage(i)}
          >
            {i}
          </button>
        );
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        pageNumbers.push(
          <span key={`ellipsis-${i}`} className="px-2 text-text-secondary">
            ...
          </span>
        );
      }
    }

    return pageNumbers;
  };

  const currentPageErrors = getCurrentPageErrors();

  return (
    <div className={styles.pageWrapper}>
      {/* 顶部导航栏 */}
      <header className="fixed top-0 left-0 right-0 bg-card-bg border-b border-border-light h-16 z-50">
        <div className="flex items-center justify-between h-full px-6">
          {/* Logo和产品名称 */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <i className="fas fa-brain text-white text-lg"></i>
            </div>
            <h1 className="text-xl font-bold text-text-primary">错题智析</h1>
          </div>
          
          {/* 用户操作区 */}
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
              <span className="text-text-primary font-medium">小明同学</span>
              <i className="fas fa-chevron-down text-text-secondary text-sm"></i>
            </div>
          </div>
        </div>
      </header>

      {/* 左侧菜单 */}
      <aside className={`fixed left-0 top-16 bottom-0 w-64 bg-card-bg border-r border-border-light z-40 ${styles.sidebarTransition}`}>
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
      <main className="ml-64 mt-16 p-6 min-h-screen">
        {/* 页面头部 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">错题本</h2>
              <nav className="text-sm text-text-secondary">
                <span>错题本</span>
              </nav>
            </div>
            <div className="text-right">
              <p className="text-text-secondary">
                共 <span className="font-semibold text-text-primary">{filteredErrors.length}</span> 道错题
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
                  placeholder="搜索题目内容..." 
                  value={filters.searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-3 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary"></i>
              </div>
            </div>

            {/* 筛选条件 */}
            <div className="flex flex-wrap items-center space-x-4">
              {/* 学科筛选 */}
              <div className="relative">
                <button 
                  onClick={() => setShowSubjectDropdown(!showSubjectDropdown)}
                  className="flex items-center space-x-2 px-4 py-3 border border-border-light rounded-lg hover:border-primary hover:text-primary"
                >
                  <i className="fas fa-filter"></i>
                  <span>学科</span>
                  <i className="fas fa-chevron-down text-sm"></i>
                </button>
                <div className={`${styles.filterDropdown} ${showSubjectDropdown ? styles.show : ''} absolute top-full left-0 mt-2 w-48 bg-card-bg border border-border-light rounded-lg shadow-lg z-10`}>
                  <div className="p-2">
                    <label className="flex items-center p-2 hover:bg-bg-light rounded cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="mr-2" 
                        checked={filters.selectedSubjects.length === 0}
                        onChange={(e) => handleSubjectFilterChange('all', e.target.checked)}
                      />
                      <span>全部学科</span>
                    </label>
                    <label className="flex items-center p-2 hover:bg-bg-light rounded cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="mr-2" 
                        checked={filters.selectedSubjects.includes('math')}
                        onChange={(e) => handleSubjectFilterChange('math', e.target.checked)}
                      />
                      <span>数学</span>
                    </label>
                    <label className="flex items-center p-2 hover:bg-bg-light rounded cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="mr-2" 
                        checked={filters.selectedSubjects.includes('chinese')}
                        onChange={(e) => handleSubjectFilterChange('chinese', e.target.checked)}
                      />
                      <span>语文</span>
                    </label>
                    <label className="flex items-center p-2 hover:bg-bg-light rounded cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="mr-2" 
                        checked={filters.selectedSubjects.includes('english')}
                        onChange={(e) => handleSubjectFilterChange('english', e.target.checked)}
                      />
                      <span>英语</span>
                    </label>
                    <label className="flex items-center p-2 hover:bg-bg-light rounded cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="mr-2" 
                        checked={filters.selectedSubjects.includes('physics')}
                        onChange={(e) => handleSubjectFilterChange('physics', e.target.checked)}
                      />
                      <span>物理</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 错误原因筛选 */}
              <div className="relative">
                <button 
                  onClick={() => setShowReasonDropdown(!showReasonDropdown)}
                  className="flex items-center space-x-2 px-4 py-3 border border-border-light rounded-lg hover:border-primary hover:text-primary"
                >
                  <i className="fas fa-tags"></i>
                  <span>错误原因</span>
                  <i className="fas fa-chevron-down text-sm"></i>
                </button>
                <div className={`${styles.filterDropdown} ${showReasonDropdown ? styles.show : ''} absolute top-full left-0 mt-2 w-48 bg-card-bg border border-border-light rounded-lg shadow-lg z-10`}>
                  <div className="p-2">
                    <label className="flex items-center p-2 hover:bg-bg-light rounded cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="mr-2" 
                        checked={filters.selectedReasons.length === 0}
                        onChange={(e) => handleReasonFilterChange('all', e.target.checked)}
                      />
                      <span>全部原因</span>
                    </label>
                    <label className="flex items-center p-2 hover:bg-bg-light rounded cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="mr-2" 
                        checked={filters.selectedReasons.includes('concept')}
                        onChange={(e) => handleReasonFilterChange('concept', e.target.checked)}
                      />
                      <span>概念不清</span>
                    </label>
                    <label className="flex items-center p-2 hover:bg-bg-light rounded cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="mr-2" 
                        checked={filters.selectedReasons.includes('calculation')}
                        onChange={(e) => handleReasonFilterChange('calculation', e.target.checked)}
                      />
                      <span>计算错误</span>
                    </label>
                    <label className="flex items-center p-2 hover:bg-bg-light rounded cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="mr-2" 
                        checked={filters.selectedReasons.includes('careless')}
                        onChange={(e) => handleReasonFilterChange('careless', e.target.checked)}
                      />
                      <span>粗心大意</span>
                    </label>
                    <label className="flex items-center p-2 hover:bg-bg-light rounded cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="mr-2" 
                        checked={filters.selectedReasons.includes('forgot')}
                        onChange={(e) => handleReasonFilterChange('forgot', e.target.checked)}
                      />
                      <span>知识点遗忘</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 时间范围筛选 */}
              <select 
                value={filters.timeFilter}
                onChange={handleTimeFilterChange}
                className="px-4 py-3 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="all">全部时间</option>
                <option value="today">今天</option>
                <option value="week">本周</option>
                <option value="month">本月</option>
                <option value="quarter">本季度</option>
              </select>
            </div>

            {/* 批量操作 */}
            <div className="flex items-center space-x-3">
              <button 
                onClick={handleBatchDelete}
                disabled={selectedErrors.size === 0}
                className="px-4 py-3 bg-danger/10 text-danger rounded-lg hover:bg-danger/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-trash mr-2"></i>
                批量删除
              </button>
              <button 
                onClick={handleBatchExport}
                disabled={selectedErrors.size === 0}
                className="px-4 py-3 bg-info/10 text-info rounded-lg hover:bg-info/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-download mr-2"></i>
                批量导出
              </button>
            </div>
          </div>
        </div>

        {/* 错题列表 */}
        <div className="bg-card-bg rounded-2xl border border-border-light overflow-hidden">
          {/* 表格头部 */}
          <div className="bg-bg-light px-6 py-4 border-b border-border-light">
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
              <div className="flex-1 grid grid-cols-12 gap-4 text-sm font-medium text-text-secondary">
                <div className="col-span-1">图片</div>
                <div className="col-span-3">题目内容</div>
                <div 
                  className="col-span-1 cursor-pointer hover:text-primary" 
                  onClick={() => handleSort('subject')}
                >
                  学科 <i className={`fas fa-sort ${styles.sortIcon} ml-1 ${sortField === 'subject' ? styles.sortActive : ''}`}></i>
                </div>
                <div 
                  className="col-span-1 cursor-pointer hover:text-primary" 
                  onClick={() => handleSort('knowledgePoint')}
                >
                  知识点 <i className={`fas fa-sort ${styles.sortIcon} ml-1 ${sortField === 'knowledgePoint' ? styles.sortActive : ''}`}></i>
                </div>
                <div 
                  className="col-span-1 cursor-pointer hover:text-primary" 
                  onClick={() => handleSort('errorReason')}
                >
                  错误原因 <i className={`fas fa-sort ${styles.sortIcon} ml-1 ${sortField === 'errorReason' ? styles.sortActive : ''}`}></i>
                </div>
                <div 
                  className="col-span-1 cursor-pointer hover:text-primary" 
                  onClick={() => handleSort('uploadDate')}
                >
                  上传日期 <i className={`fas fa-sort ${styles.sortIcon} ml-1 ${sortField === 'uploadDate' ? styles.sortActive : ''}`}></i>
                </div>
                <div className="col-span-2">操作</div>
              </div>
            </div>
          </div>

          {/* 表格内容 */}
          <div className="divide-y divide-border-light">
            {currentPageErrors.map(error => (
              <div key={error.id} className={`${styles.tableRow} px-6 py-4 flex items-center`}>
                <input 
                  type="checkbox" 
                  checked={selectedErrors.has(error.id)}
                  onChange={(e) => handleSelectError(error.id, e.target.checked)}
                  className="w-4 h-4 text-primary border-border-light rounded focus:ring-primary/20 mr-4"
                />
                <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-1">
                    <img 
                      src={error.image} 
                      alt="题目图片" 
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  </div>
                  <div className="col-span-3">
                    <p className="text-text-primary font-medium text-sm line-clamp-2">{error.question}</p>
                  </div>
                  <div className="col-span-1">
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">{error.subject}</span>
                  </div>
                  <div className="col-span-1">
                    <span className="text-text-secondary text-sm">{error.knowledgePoint}</span>
                  </div>
                  <div className="col-span-1">
                    <span className={`px-2 py-1 ${getReasonColor(error.errorReason)} text-xs rounded-full`}>
                      {error.errorReason}
                    </span>
                  </div>
                  <div className="col-span-1">
                    <span className="text-text-secondary text-sm">{error.uploadDate}</span>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleViewDetail(error.id)}
                        className="p-1 text-primary hover:text-primary/80" 
                        title="查看详情"
                      >
                        <i className="fas fa-eye text-sm"></i>
                      </button>
                      <button 
                        onClick={() => handleEditError(error.id)}
                        className="p-1 text-warning hover:text-warning/80" 
                        title="编辑"
                      >
                        <i className="fas fa-edit text-sm"></i>
                      </button>
                      <button 
                        onClick={() => handleDeleteError(error.id)}
                        className="p-1 text-danger hover:text-danger/80" 
                        title="删除"
                      >
                        <i className="fas fa-trash text-sm"></i>
                      </button>
                      <button 
                        onClick={() => handleToggleCollect(error.id)}
                        className={`p-1 ${error.isCollected ? 'text-danger' : 'text-text-secondary'} hover:text-danger`} 
                        title={error.isCollected ? '取消收藏' : '收藏'}
                      >
                        <i className="fas fa-star text-sm"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 分页区域 */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center space-x-4">
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
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-border-light rounded hover:border-primary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <div className="flex items-center space-x-1">
              {renderPageNumbers()}
            </div>
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

      {/* 删除确认对话框 */}
      {showDeleteModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteModal(false);
            }
          }}
        >
          <div className="bg-card-bg rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-exclamation-triangle text-danger text-2xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">确认删除</h3>
              <p className="text-text-secondary mb-6">确定要删除选中的错题吗？此操作无法撤销。</p>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-border-light rounded-lg hover:border-primary hover:text-primary"
                >
                  取消
                </button>
                <button 
                  onClick={confirmBatchDelete}
                  className="flex-1 px-4 py-2 bg-danger text-white rounded-lg hover:bg-danger/90"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ErrorBookPage;

