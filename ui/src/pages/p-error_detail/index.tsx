

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import styles from './styles.module.css';

const ErrorDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  // 设置页面标题
  useEffect(() => {
    const originalTitle = document.title;
    document.title = '错题智析 - 错题详情';
    return () => { document.title = originalTitle; };
  }, []);

  // 获取错题ID参数
  useEffect(() => {
    const errorId = searchParams.get('errorId');
    if (errorId) {
      console.log('加载错题ID:', errorId);
      // 在实际应用中，这里会调用API获取具体的错题数据
    }
  }, [searchParams]);

  // 编辑模式切换
  const handleEditToggle = () => {
    if (isEditMode) {
      // 保存编辑内容
      console.log('保存编辑内容');
      // 这里可以发送API请求保存修改
    }
    setIsEditMode(!isEditMode);
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
                src="https://s.coze.cn/image/FmziPPHSy5Y/" 
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
      <main className={`ml-64 mt-16 p-6 min-h-screen ${isEditMode ? styles.editMode : ''}`}>
        {/* 页面头部 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">错题详情</h2>
              <nav className="text-sm text-text-secondary">
                <Link to="/error-book" className="hover:text-primary">错题本</Link>
                <span className="mx-2">/</span>
                <span>错题详情</span>
              </nav>
            </div>
            <div className="flex items-center space-x-3">
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
              <img 
                src="https://s.coze.cn/image/SOOON7MeITM/" 
                alt="数学分数加减法题目图片" 
                className="w-full max-w-md rounded-lg border border-border-light" 
              />
            </div>

            {/* 题目内容 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-text-primary mb-3">题目内容</h3>
              <div className={`${styles.editable} bg-bg-light rounded-lg p-4 text-text-primary`}>
                <p className="font-medium mb-2">计算题：</p>
                <p className="text-lg">1/2 + 1/3 = ?</p>
                <p className="text-sm text-text-secondary mt-2">请计算上述分数加法的结果，并写出详细的计算步骤。</p>
              </div>
            </div>

            {/* 答案对比 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* 用户答案 */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-3">你的答案</h3>
                <div className={`${styles.editable} bg-danger/5 border border-danger/20 rounded-lg p-4`}>
                  <p className="text-text-primary">1/2 + 1/3 = 2/5</p>
                  <p className="text-sm text-danger mt-2">
                    <i className="fas fa-times-circle mr-1"></i>
                    答案错误
                  </p>
                </div>
              </div>

              {/* 正确答案 */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-3">正确答案</h3>
                <div className="bg-success/5 border border-success/20 rounded-lg p-4">
                  <p className="text-text-primary font-medium">1/2 + 1/3 = 5/6</p>
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-text-secondary">解题步骤：</p>
                    <p className="text-sm text-text-primary">1. 找到公分母：2和3的最小公倍数是6</p>
                    <p className="text-sm text-text-primary">2. 通分：1/2 = 3/6，1/3 = 2/6</p>
                    <p className="text-sm text-text-primary">3. 相加：3/6 + 2/6 = 5/6</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 知识点和错误原因 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* 知识点 */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-3">知识点</h3>
                <div className={`${styles.editable} bg-info/5 border border-info/20 rounded-lg p-4`}>
                  <a 
                    href="#" 
                    onClick={handleKnowledgePointClick}
                    className="text-info hover:text-info/80 font-medium"
                  >
                    <i className="fas fa-tag mr-2"></i>分数加减法
                  </a>
                  <p className="text-sm text-text-secondary mt-2">数学 · 五年级上册</p>
                </div>
              </div>

              {/* 错误原因 */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-3">错误原因</h3>
                <div className={`${styles.editable} bg-warning/5 border border-warning/20 rounded-lg p-4`}>
                  <span className="px-3 py-1 bg-danger text-white text-sm rounded-full">计算错误</span>
                  <p className="text-sm text-text-secondary mt-2">未正确通分，直接将分子分母分别相加</p>
                </div>
              </div>
            </div>

            {/* 解题思路 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-text-primary mb-3">解题思路</h3>
              <div className={`${styles.editable} bg-secondary/5 border border-secondary/20 rounded-lg p-4`}>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                    <div>
                      <p className="font-medium text-text-primary">理解分数加法的基本规则</p>
                      <p className="text-sm text-text-secondary">分数相加时，必须先通分，使分母相同后才能将分子相加</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                    <div>
                      <p className="font-medium text-text-primary">找到最小公分母</p>
                      <p className="text-sm text-text-secondary">对于2和3，最小公分母是6，这是两个数的最小公倍数</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                    <div>
                      <p className="font-medium text-text-primary">正确通分并相加</p>
                      <p className="text-sm text-text-secondary">将两个分数都转换为分母为6的分数，然后相加分子</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 复习记录 */}
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-3">复习记录</h3>
              <div className="space-y-3">
                <div className={`${styles.reviewRecord} pl-4 py-3 bg-bg-light rounded-lg`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-text-primary">2024年1月14日 15:30</p>
                      <p className="text-sm text-text-secondary">复习了该错题，重做了3道相似题</p>
                    </div>
                    <span className="px-3 py-1 bg-success/10 text-success text-sm rounded-full">已掌握</span>
                  </div>
                </div>
                <div className={`${styles.reviewRecord} pl-4 py-3 bg-bg-light rounded-lg`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-text-primary">2024年1月10日 19:45</p>
                      <p className="text-sm text-text-secondary">首次复习，完成相似题练习</p>
                    </div>
                    <span className="px-3 py-1 bg-warning/10 text-warning text-sm rounded-full">一般</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 相似题推荐区 */}
        <section className="mb-8">
          <div className="bg-card-bg rounded-2xl border border-border-light p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-text-primary">相似题推荐</h3>
              <button 
                onClick={handlePracticeAll}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                <i className="fas fa-play mr-2"></i>开始练习
              </button>
            </div>
            
            <div className="space-y-4">
              <div 
                className={`${styles.similarQuestion} p-4 border border-border-light rounded-lg cursor-pointer transition-all duration-200`}
                onClick={() => handleSimilarQuestionClick('similar-1')}
              >
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-primary font-bold text-sm">1</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-text-primary mb-2">分数加法练习</h4>
                    <p className="text-text-secondary text-sm mb-2">计算：2/3 + 1/4 = ?</p>
                    <div className="flex items-center space-x-4">
                      <span className="px-2 py-1 bg-success/10 text-success text-xs rounded-full">基础</span>
                      <span className="text-text-secondary text-xs">预计用时：3分钟</span>
                    </div>
                  </div>
                  <i className="fas fa-chevron-right text-text-secondary"></i>
                </div>
              </div>
              
              <div 
                className={`${styles.similarQuestion} p-4 border border-border-light rounded-lg cursor-pointer transition-all duration-200`}
                onClick={() => handleSimilarQuestionClick('similar-2')}
              >
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-primary font-bold text-sm">2</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-text-primary mb-2">分数减法练习</h4>
                    <p className="text-text-secondary text-sm mb-2">计算：5/6 - 1/3 = ?</p>
                    <div className="flex items-center space-x-4">
                      <span className="px-2 py-1 bg-warning/10 text-warning text-xs rounded-full">中等</span>
                      <span className="text-text-secondary text-xs">预计用时：4分钟</span>
                    </div>
                  </div>
                  <i className="fas fa-chevron-right text-text-secondary"></i>
                </div>
              </div>
              
              <div 
                className={`${styles.similarQuestion} p-4 border border-border-light rounded-lg cursor-pointer transition-all duration-200`}
                onClick={() => handleSimilarQuestionClick('similar-3')}
              >
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-primary font-bold text-sm">3</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-text-primary mb-2">分数混合运算</h4>
                    <p className="text-text-secondary text-sm mb-2">计算：1/2 + 2/5 - 1/10 = ?</p>
                    <div className="flex items-center space-x-4">
                      <span className="px-2 py-1 bg-danger/10 text-danger text-xs rounded-full">困难</span>
                      <span className="text-text-secondary text-xs">预计用时：6分钟</span>
                    </div>
                  </div>
                  <i className="fas fa-chevron-right text-text-secondary"></i>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ErrorDetailPage;

