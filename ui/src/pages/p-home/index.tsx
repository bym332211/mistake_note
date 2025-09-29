

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './styles.module.css';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState<string>('');
  const [activeMenuItem, setActiveMenuItem] = useState<string>('home');

  useEffect(() => {
    const originalTitle = document.title;
    document.title = '错题智析 - 首页';
    return () => { document.title = originalTitle; };
  }, []);

  useEffect(() => {
    const date = new Date().toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
    setCurrentDate(date);
  }, []);

  const handleUserProfileClick = () => {
    console.log('个人中心功能待实现');
  };

  const handleNotificationClick = () => {
    console.log('通知功能待实现');
  };

  const handleMenuItemClick = (menuId: string) => {
    setActiveMenuItem(menuId);
  };

  const handleQuickUploadClick = () => {
    navigate('/upload');
  };

  const handleQuickReviewClick = () => {
    navigate('/review-plan');
  };

  const handleQuickReportClick = () => {
    navigate('/report');
  };

  const handleRecentErrorClick = (errorId: string) => {
    navigate(`/error-detail?errorId=${errorId}`);
  };

  const handleWeakPointClick = (knowledgeId: string) => {
    navigate(`/error-book?knowledgeId=${knowledgeId}`);
  };

  const handlePracticeWeakClick = (e: React.MouseEvent, knowledgeId: string) => {
    e.stopPropagation();
    navigate(`/similar-practice?knowledgeId=${knowledgeId}`);
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
            <button 
              onClick={handleNotificationClick}
              className="p-2 text-text-secondary hover:text-primary"
            >
              <i className="fas fa-bell text-lg"></i>
            </button>
            <div 
              onClick={handleUserProfileClick}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <img 
                src="https://s.coze.cn/image/cjvqgZxtLJc/" 
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
                onClick={() => handleMenuItemClick('home')}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${
                  activeMenuItem === 'home' 
                    ? `${styles.menuItem} ${styles.menuItemActive}` 
                    : `${styles.menuItem} text-text-secondary`
                }`}
              >
                <i className="fas fa-home text-lg"></i>
                <span className="font-medium">首页</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/upload" 
                onClick={() => handleMenuItemClick('upload')}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${
                  activeMenuItem === 'upload' 
                    ? `${styles.menuItem} ${styles.menuItemActive}` 
                    : `${styles.menuItem} text-text-secondary`
                }`}
              >
                <i className="fas fa-camera text-lg"></i>
                <span className="font-medium">错题上传</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/error-book" 
                onClick={() => handleMenuItemClick('error-book')}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${
                  activeMenuItem === 'error-book' 
                    ? `${styles.menuItem} ${styles.menuItemActive}` 
                    : `${styles.menuItem} text-text-secondary`
                }`}
              >
                <i className="fas fa-book text-lg"></i>
                <span className="font-medium">错题本</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/review-plan" 
                onClick={() => handleMenuItemClick('review')}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${
                  activeMenuItem === 'review' 
                    ? `${styles.menuItem} ${styles.menuItemActive}` 
                    : `${styles.menuItem} text-text-secondary`
                }`}
              >
                <i className="fas fa-redo text-lg"></i>
                <span className="font-medium">错题复习</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/report" 
                onClick={() => handleMenuItemClick('report')}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${
                  activeMenuItem === 'report' 
                    ? `${styles.menuItem} ${styles.menuItemActive}` 
                    : `${styles.menuItem} text-text-secondary`
                }`}
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
              <h2 className="text-2xl font-bold text-text-primary mb-2">欢迎回来，小明同学！</h2>
              <nav className="text-sm text-text-secondary">
                <span>首页</span>
              </nav>
            </div>
            <div className="text-right">
              <p className="text-text-secondary">今天是</p>
              <p className="text-lg font-semibold text-text-primary">{currentDate}</p>
            </div>
          </div>
        </div>

        {/* 学习概览区 */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-text-primary mb-4">学习概览</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className={`${styles.statCard} rounded-2xl p-6 text-white ${styles.cardHover}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">总错题数</p>
                  <p className="text-3xl font-bold mt-1">127</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <i className="fas fa-exclamation-triangle text-xl"></i>
                </div>
              </div>
            </div>
            
            <div className={`${styles.statCard} rounded-2xl p-6 text-white ${styles.cardHover}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">待复习错题</p>
                  <p className="text-3xl font-bold mt-1">15</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <i className="fas fa-clock text-xl"></i>
                </div>
              </div>
            </div>
            
            <div className={`${styles.statCard} rounded-2xl p-6 text-white ${styles.cardHover}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">本周新增</p>
                  <p className="text-3xl font-bold mt-1">8</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <i className="fas fa-plus text-xl"></i>
                </div>
              </div>
            </div>
            
            <div className={`${styles.statCard} rounded-2xl p-6 text-white ${styles.cardHover}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">正确率</p>
                  <p className="text-3xl font-bold mt-1">85.2%</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <i className="fas fa-check-circle text-xl"></i>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 快速入口区 */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-text-primary mb-4">快速入口</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={handleQuickUploadClick}
              className={`bg-card-bg rounded-2xl p-6 border border-border-light text-left ${styles.cardHover}`}
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <i className="fas fa-camera text-primary text-xl"></i>
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary">上传错题</h4>
                  <p className="text-text-secondary text-sm">拍照上传新的错题</p>
                </div>
              </div>
            </button>
            
            <button 
              onClick={handleQuickReviewClick}
              className={`bg-card-bg rounded-2xl p-6 border border-border-light text-left ${styles.cardHover}`}
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center">
                  <i className="fas fa-redo text-warning text-xl"></i>
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary">开始复习</h4>
                  <p className="text-text-secondary text-sm">复习待巩固的错题</p>
                </div>
              </div>
            </button>
            
            <button 
              onClick={handleQuickReportClick}
              className={`bg-card-bg rounded-2xl p-6 border border-border-light text-left ${styles.cardHover}`}
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-info/10 rounded-xl flex items-center justify-center">
                  <i className="fas fa-chart-line text-info text-xl"></i>
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary">查看报告</h4>
                  <p className="text-text-secondary text-sm">查看学习分析报告</p>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* 最近错题列表 */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary">最近错题</h3>
            <Link 
              to="/error-book" 
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              查看全部
            </Link>
          </div>
          <div className="bg-card-bg rounded-2xl border border-border-light overflow-hidden">
            <div className="divide-y divide-border-light">
              <div 
                onClick={() => handleRecentErrorClick('error-001')}
                className="p-4 hover:bg-bg-light cursor-pointer"
              >
                <div className="flex items-center space-x-4">
                  <img 
                    src="https://s.coze.cn/image/Qq-uCmSQlAU/" 
                    alt="数学题目图片" 
                    className="w-14 h-14 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-text-primary">数学 - 分数加减法</h4>
                    <p className="text-text-secondary text-sm">{'计算：1/2 + 1/3 = ?'}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="px-2 py-1 bg-danger/10 text-danger text-xs rounded-full">计算错误</span>
                      <span className="text-text-secondary text-xs">2024-01-15</span>
                    </div>
                  </div>
                  <i className="fas fa-chevron-right text-text-secondary"></i>
                </div>
              </div>
              
              <div 
                onClick={() => handleRecentErrorClick('error-002')}
                className="p-4 hover:bg-bg-light cursor-pointer"
              >
                <div className="flex items-center space-x-4">
                  <img 
                    src="https://s.coze.cn/image/cCrVCIZvb2U/" 
                    alt="语文题目图片" 
                    className="w-14 h-14 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-text-primary">语文 - 阅读理解</h4>
                    <p className="text-text-secondary text-sm">《春天来了》段落分析</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="px-2 py-1 bg-warning/10 text-warning text-xs rounded-full">概念不清</span>
                      <span className="text-text-secondary text-xs">2024-01-14</span>
                    </div>
                  </div>
                  <i className="fas fa-chevron-right text-text-secondary"></i>
                </div>
              </div>
              
              <div 
                onClick={() => handleRecentErrorClick('error-003')}
                className="p-4 hover:bg-bg-light cursor-pointer"
              >
                <div className="flex items-center space-x-4">
                  <img 
                    src="https://s.coze.cn/image/QlFuuB9-vUU/" 
                    alt="英语题目图片" 
                    className="w-14 h-14 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-text-primary">英语 - 时态填空</h4>
                    <p className="text-text-secondary text-sm">选择正确的动词时态</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="px-2 py-1 bg-info/10 text-info text-xs rounded-full">知识点遗忘</span>
                      <span className="text-text-secondary text-xs">2024-01-13</span>
                    </div>
                  </div>
                  <i className="fas fa-chevron-right text-text-secondary"></i>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 薄弱知识点推荐 */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary">薄弱知识点</h3>
            <Link 
              to="/report" 
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              查看详情
            </Link>
          </div>
          <div className="bg-card-bg rounded-2xl border border-border-light p-6">
            <div className="space-y-4">
              <div 
                onClick={() => handleWeakPointClick('kp-fraction')}
                className="flex items-center justify-between p-4 bg-danger/5 rounded-xl border border-danger/20 cursor-pointer"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-danger/10 rounded-lg flex items-center justify-center">
                    <i className="fas fa-exclamation text-danger"></i>
                  </div>
                  <div>
                    <h4 className="font-medium text-text-primary">分数加减法</h4>
                    <p className="text-text-secondary text-sm">数学 · 错误率 45%</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => handlePracticeWeakClick(e, 'kp-fraction')}
                  className="px-4 py-2 bg-danger text-white rounded-lg text-sm hover:bg-danger/90"
                >
                  专项练习
                </button>
              </div>
              
              <div 
                onClick={() => handleWeakPointClick('kp-tense')}
                className="flex items-center justify-between p-4 bg-warning/5 rounded-xl border border-warning/20 cursor-pointer"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                    <i className="fas fa-clock text-warning"></i>
                  </div>
                  <div>
                    <h4 className="font-medium text-text-primary">英语时态</h4>
                    <p className="text-text-secondary text-sm">英语 · 错误率 38%</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => handlePracticeWeakClick(e, 'kp-tense')}
                  className="px-4 py-2 bg-warning text-white rounded-lg text-sm hover:bg-warning/90"
                >
                  专项练习
                </button>
              </div>
              
              <div 
                onClick={() => handleWeakPointClick('kp-reading')}
                className="flex items-center justify-between p-4 bg-info/5 rounded-xl border border-info/20 cursor-pointer"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-info/10 rounded-lg flex items-center justify-center">
                    <i className="fas fa-lightbulb text-info"></i>
                  </div>
                  <div>
                    <h4 className="font-medium text-text-primary">阅读理解</h4>
                    <p className="text-text-secondary text-sm">语文 · 错误率 32%</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => handlePracticeWeakClick(e, 'kp-reading')}
                  className="px-4 py-2 bg-info text-white rounded-lg text-sm hover:bg-info/90"
                >
                  专项练习
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;

