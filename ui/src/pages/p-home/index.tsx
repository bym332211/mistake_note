

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './styles.module.css';
import { MobileNav } from '../../components/MobileNav';
import { API_BASE_URL, getMistakesList, getWeakPoints, MistakeRecord, WeakPointStat } from '../../lib/apiClient';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState<string>('');
  const [activeMenuItem, setActiveMenuItem] = useState<string>('home');
  const [recentMistakes, setRecentMistakes] = useState<MistakeRecord[]>([]);
  const [weakPoints, setWeakPoints] = useState<WeakPointStat[]>([]);

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

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const mistakesRes = await getMistakesList(undefined, undefined, undefined, 0, 5);
        setRecentMistakes(mistakesRes.mistakes || []);
      } catch (err) {
        console.error('加载最近错题失败:', err);
      }

      try {
        const weakRes = await getWeakPoints(5);
        setWeakPoints(weakRes.weak_points || []);
      } catch (err) {
        console.error('加载薄弱知识点失败:', err);
      }
    };
    void loadHomeData();
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

  const handleRecentErrorClick = (errorId: number) => {
    navigate(`/error-detail?errorId=${errorId}`);
  };

  const handleWeakPointClick = (knowledgeId: string) => {
    navigate(`/error-book?knowledgePoint=${knowledgeId}`);
  };

  const handlePracticeWeakClick = (e: React.MouseEvent, knowledgeId: string) => {
    e.stopPropagation();
    navigate(`/similar-practice?knowledgePoint=${knowledgeId}`);
  };

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
            <h1 className="text-lg md:text-xl font-bold text-text-primary">错题智析</h1>
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
      <main className="mt-16 p-4 md:p-6 min-h-screen pb-24 md:pb-6 md:ml-64">
        {/* 页面头部 */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">欢迎回来，鲍俊安同学！</h2>
              <nav className="text-sm text-text-secondary">
                <span>首页</span>
              </nav>
            </div>
            <div className="md:text-right">
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

                        {/* ?????? */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary">????</h3>
            <Link 
              to="/error-book" 
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              ????
            </Link>
          </div>
          <div className="bg-card-bg rounded-2xl border border-border-light overflow-hidden">
            <div className="divide-y divide-border-light">
              {recentMistakes.length === 0 ? (
                <div className="p-4 text-center text-text-secondary">??????</div>
              ) : (
                recentMistakes.map((item) => (
                  <div 
                    key={item.mistake_record_id}
                    onClick={() => handleRecentErrorClick(item.mistake_record_id)}
                    className="p-4 hover:bg-bg-light cursor-pointer"
                  >
                    <div className="flex items-center space-x-4">
                      {item.file_info?.file_url ? (
                        <img 
                          src={`${item.file_info.file_url.startsWith('http') ? '' : API_BASE_URL}${item.file_info.file_url}`} 
                          alt="????" 
                          className="w-14 h-14 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-bg-light border border-border-light flex items-center justify-center text-text-secondary text-xs">
                          ??
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium text-text-primary">
                          {item.analysis.subject || '????'}{item.analysis.section ? ` ? ${item.analysis.section}` : ''}
                        </h4>
                        <p className="text-text-secondary text-sm line-clamp-1">{item.analysis.question || '?????'}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                            {item.analysis.error_type || '???'}
                          </span>
                          <span className="text-text-secondary text-xs">
                            {item.file_info.upload_time ? new Date(item.file_info.upload_time).toLocaleDateString('zh-CN') : '????'}
                          </span>
                        </div>
                      </div>
                      <i className="fas fa-chevron-right text-text-secondary"></i>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
        {/* ??????? */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary">?????</h3>
            <Link 
              to="/report" 
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              ????
            </Link>
          </div>
          <div className="bg-card-bg rounded-2xl border border-border-light p-6">
            <div className="space-y-4">
              {weakPoints.length === 0 ? (
                <div className="text-center text-text-secondary">????</div>
              ) : (
                weakPoints.map((kp) => (
                  <div 
                    key={kp.knowledge_point}
                    onClick={() => handleWeakPointClick(kp.knowledge_point)}
                    className="flex items-center justify-between p-4 bg-bg-light/80 rounded-xl border border-border-light cursor-pointer"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <i className="fas fa-lightbulb text-primary"></i>
                      </div>
                      <div>
                        <h4 className="font-medium text-text-primary">{kp.knowledge_point}</h4>
                        <p className="text-text-secondary text-sm">
                          {kp.subject || '????'} ? ??? {kp.error_rate}%
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => handlePracticeWeakClick(e, kp.knowledge_point)}
                      className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90"
                    >
                      ????
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      <MobileNav />
    </div>
  );
};

export default HomePage;
