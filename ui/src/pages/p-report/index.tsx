import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './styles.module.css';
import { MobileNav } from '../../components/MobileNav';

const summaryStats = [
  { title: '学习时长', value: '12h 30m', delta: '+12%' },
  { title: '完成题量', value: '184', delta: '+9%' },
  { title: '正确率', value: '83%', delta: '+5%' },
  { title: '复习完成率', value: '68%', delta: '+14%' },
];

const trendData = [
  { label: '周一', value: 60 },
  { label: '周二', value: 75 },
  { label: '周三', value: 70 },
  { label: '周四', value: 85 },
  { label: '周五', value: 80 },
  { label: '周六', value: 90 },
  { label: '周日', value: 65 },
];

const masteryData = [
  { topic: '分数加减法', level: '薄弱', progress: 45 },
  { topic: '方程求解', level: '待巩固', progress: 62 },
  { topic: '几何面积', level: '良好', progress: 78 },
  { topic: '函数图像', level: '优秀', progress: 90 },
];

const wrongReasons = [
  { reason: '计算错误', count: 12 },
  { reason: '概念不清', count: 8 },
  { reason: '审题不清', count: 6 },
  { reason: '步骤遗漏', count: 5 },
];

const actionList = [
  { title: '优先复习薄弱知识点', detail: '分数加减法、方程求解各做 5 题' },
  { title: '巩固高频错因', detail: '做题后复核计算与单位' },
  { title: '提升时间管理', detail: '每题控制在 90 秒内，超时及时标记' },
  { title: '安排复习节奏', detail: '采用 2-2-7 间隔复习错题本' },
];

const ReportPage: React.FC = () => {
  useEffect(() => {
    const originalTitle = document.title;
    document.title = 'AI错题本 - 学习报告';
    return () => {
      document.title = originalTitle;
    };
  }, []);

  return (
    <div className={styles.pageWrapper}>
      {/* 顶部导航 */}
      <header className="fixed top-0 left-0 right-0 bg-card-bg border-b border-border-light h-16 z-50">
        <div className="flex items-center justify-between h-full px-3 sm:px-4 md:px-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <i className="fas fa-brain text-white text-lg"></i>
            </div>
            <h1 className="text-lg md:text-xl font-bold text-text-primary">AI错题本</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-text-secondary hover:text-primary">
              <i className="fas fa-bell text-lg"></i>
            </button>
            <div className="flex items-center space-x-2 cursor-pointer">
              <img
                src="https://s.coze.cn/image/3lXIbiqV7BU/"
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
              <Link to="/home" className={`${styles.menuItem} flex items-center space-x-3 px-4 py-3 rounded-lg text-text-secondary`}>
                <i className="fas fa-home text-lg"></i>
                <span className="font-medium">首页</span>
              </Link>
            </li>
            <li>
              <Link to="/upload" className={`${styles.menuItem} flex items-center space-x-3 px-4 py-3 rounded-lg text-text-secondary`}>
                <i className="fas fa-camera text-lg"></i>
                <span className="font-medium">错题上传</span>
              </Link>
            </li>
            <li>
              <Link to="/error-book" className={`${styles.menuItem} flex items-center space-x-3 px-4 py-3 rounded-lg text-text-secondary`}>
                <i className="fas fa-book text-lg"></i>
                <span className="font-medium">错题本</span>
              </Link>
            </li>
            <li>
              <Link to="/report" className={`${styles.menuItem} ${styles.menuItemActive} flex items-center space-x-3 px-4 py-3 rounded-lg`}>
                <i className="fas fa-chart-line text-lg"></i>
                <span className="font-medium">学习报告</span>
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* 主内容 */}
      <main className="mt-16 p-4 md:p-6 min-h-screen pb-24 md:pb-6 md:ml-64">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">学习报告（Mock）</h2>
              <p className="text-sm text-text-secondary">本周学习概况与建议示意</p>
            </div>
            <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
              <i className="fas fa-download mr-2"></i>导出 PDF
            </button>
          </div>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {summaryStats.map((item) => (
            <div key={item.title} className={`${styles.statCard} rounded-2xl p-5 text-white`}>
              <p className="text-white/80 text-sm">{item.title}</p>
              <p className="text-3xl font-bold mt-2">{item.value}</p>
              <p className="text-sm mt-3 bg-white/15 inline-flex items-center px-2 py-1 rounded-lg">
                <i className="fas fa-arrow-up mr-1 text-white"></i>{item.delta} 较上周
              </p>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-card-bg border border-border-light rounded-2xl p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">学习趋势</h3>
              <span className="text-text-secondary text-sm">近 7 天</span>
            </div>
            <div className="space-y-3">
              {trendData.map((d) => (
                <div key={d.label}>
                  <div className="flex justify-between text-sm text-text-secondary mb-1">
                    <span>{d.label}</span>
                    <span>{d.value} 分</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`${styles.trendBar} h-2 rounded-full`} style={{ width: `${d.value}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card-bg border border-border-light rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">知识点掌握度</h3>
            <div className="space-y-4">
              {masteryData.map((item) => (
                <div key={item.topic}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-text-primary">{item.topic}</span>
                    <span className={styles.levelPill}>{item.level}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`${styles.masteryBar} h-2 rounded-full`} style={{ width: `${item.progress}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-card-bg border border-border-light rounded-2xl p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">错题分析</h3>
              <span className="text-text-secondary text-sm">按原因</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wrongReasons.map((item) => (
                <div key={item.reason} className="p-4 border border-border-light rounded-xl bg-bg-light">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-text-primary">{item.reason}</span>
                    <span className="text-sm text-text-secondary">{item.count} 次</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`${styles.errorBar} h-2 rounded-full`} style={{ width: `${Math.min(item.count * 8, 100)}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card-bg border border-border-light rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">时间分布</h3>
            <div className="space-y-3 text-sm text-text-secondary">
              <div className={`${styles.timeSlot} p-3 rounded-xl`}>
                <div className="flex justify-between mb-1">
                  <span>早晨 6:00-9:00</span>
                  <span className="text-success">效率高</span>
                </div>
                <p>平均每题 78 秒，适合做新题</p>
              </div>
              <div className={`${styles.timeSlot} p-3 rounded-xl`}>
                <div className="flex justify-between mb-1">
                  <span>晚间 20:00-22:00</span>
                  <span className="text-warning">中等</span>
                </div>
                <p>适合复盘错题与总结</p>
              </div>
              <div className={`${styles.timeSlot} p-3 rounded-xl`}>
                <div className="flex justify-between mb-1">
                  <span>午后 14:00-16:00</span>
                  <span className="text-danger">偏低</span>
                </div>
                <p>易出现计算错误，建议短时练习</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-card-bg border border-border-light rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary">行动建议</h3>
            <span className="text-text-secondary text-sm">系统自动生成</span>
          </div>
          <div className="space-y-3">
            {actionList.map((item, idx) => (
              <div key={item.title} className="p-4 rounded-xl border border-border-light bg-bg-light flex items-start space-x-3">
                <div className={`${styles.stepBadge} w-8 h-8 rounded-full flex items-center justify-center text-white font-bold`}>{idx + 1}</div>
                <div>
                  <p className="font-medium text-text-primary">{item.title}</p>
                  <p className="text-sm text-text-secondary mt-1">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <MobileNav />
    </div>
  );
};

export default ReportPage;
