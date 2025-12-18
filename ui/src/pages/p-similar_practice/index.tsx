

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import styles from './styles.module.css';
import { SimilarQuestion } from './types';
import { MobileNav } from '../../components/MobileNav';

const SimilarPracticePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // URL参数
  const originalQuestionId = searchParams.get('questionId') || 'default';

  // 状态管理
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showResultFeedback, setShowResultFeedback] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [answerInput, setAnswerInput] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [timeUsed, setTimeUsed] = useState('00:00');
  const [totalTime, setTotalTime] = useState(0);

  // Refs
  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  // 模拟相似题目数据
  const similarQuestions: SimilarQuestion[] = [
    {
      id: 1,
      type: 'multiple-choice',
      question: '计算：3/4 + 1/6 = ?',
      options: [
        { label: 'A', value: '11/12', correct: true },
        { label: 'B', value: '5/6', correct: false },
        { label: 'C', value: '7/12', correct: false },
        { label: 'D', value: '2/3', correct: false }
      ],
      correctAnswer: '11/12',
      explanation: '解题步骤：\n1. 找到两个分数的最小公分母：4和6的最小公倍数是12\n2. 将分数转换为同分母：3/4 = 9/12，1/6 = 2/12\n3. 相加：9/12 + 2/12 = 11/12\n\n知识点：分数加减法、最小公倍数'
    },
    {
      id: 2,
      type: 'fill-blank',
      question: '计算：2/3 - 1/4 = ?',
      correctAnswer: '5/12',
      explanation: '解题步骤：\n1. 找到两个分数的最小公分母：3和4的最小公倍数是12\n2. 将分数转换为同分母：2/3 = 8/12，1/4 = 3/12\n3. 相减：8/12 - 3/12 = 5/12\n\n知识点：分数减法、最小公倍数'
    },
    {
      id: 3,
      type: 'multiple-choice',
      question: '计算：1/2 + 2/5 = ?',
      options: [
        { label: 'A', value: '9/10', correct: true },
        { label: 'B', value: '3/7', correct: false },
        { label: 'C', value: '1/5', correct: false },
        { label: 'D', value: '3/10', correct: false }
      ],
      correctAnswer: '9/10',
      explanation: '解题步骤：\n1. 找到两个分数的最小公分母：2和5的最小公倍数是10\n2. 将分数转换为同分母：1/2 = 5/10，2/5 = 4/10\n3. 相加：5/10 + 4/10 = 9/10\n\n知识点：分数加法、最小公倍数'
    },
    {
      id: 4,
      type: 'fill-blank',
      question: '计算：5/6 - 1/3 = ?',
      correctAnswer: '1/2',
      explanation: '解题步骤：\n1. 找到两个分数的最小公分母：6和3的最小公倍数是6\n2. 将分数转换为同分母：5/6 = 5/6，1/3 = 2/6\n3. 相减：5/6 - 2/6 = 3/6 = 1/2\n\n知识点：分数减法、约分'
    },
    {
      id: 5,
      type: 'multiple-choice',
      question: '计算：3/8 + 1/4 = ?',
      options: [
        { label: 'A', value: '5/8', correct: true },
        { label: 'B', value: '1/2', correct: false },
        { label: 'C', value: '7/8', correct: false },
        { label: 'D', value: '1/8', correct: false }
      ],
      correctAnswer: '5/8',
      explanation: '解题步骤：\n1. 找到两个分数的最小公分母：8和4的最小公倍数是8\n2. 将分数转换为同分母：3/8 = 3/8，1/4 = 2/8\n3. 相加：3/8 + 2/8 = 5/8\n\n知识点：分数加法、最小公倍数'
    }
  ];

  // 设置页面标题
  useEffect(() => {
    const originalTitle = document.title;
    document.title = '错题智析 - 相似题练习';
    return () => {
      document.title = originalTitle;
    };
  }, []);

  // 初始化练习
  useEffect(() => {
    startTimeRef.current = new Date().getTime();
    startTimer();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // 开始计时器
  const startTimer = () => {
    timerRef.current = window.setInterval(() => {
      if (startTimeRef.current) {
        const currentTime = new Date().getTime();
        const elapsed = Math.floor((currentTime - startTimeRef.current) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        setTimeUsed(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);
  };

  // 加载题目
  const loadQuestion = (index: number) => {
    const question = similarQuestions[index];
    if (!question) return;

    // 重置状态
    setSelectedAnswer(null);
    setIsAnswered(false);
    setAnswerInput('');
    setShowResultFeedback(false);
  };

  // 选择题选项点击
  const handleOptionClick = (value: string) => {
    if (isAnswered) return;
    setSelectedAnswer(value);
  };

  // 提交答案
  const handleSubmitAnswer = () => {
    if (isAnswered) return;

    const question = similarQuestions[currentQuestionIndex];
    let userAnswer: string | null = null;

    if (question.type === 'multiple-choice') {
      userAnswer = selectedAnswer;
    } else {
      userAnswer = answerInput.trim();
    }

    if (!userAnswer) {
      alert('请选择或输入答案');
      return;
    }

    setIsAnswered(true);
    const isCorrect = userAnswer === question.correctAnswer;

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    }

    // 显示结果
    setShowResultFeedback(true);
  };

  // 上一题
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      const newIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(newIndex);
      loadQuestion(newIndex);
    }
  };

  // 下一题
  const handleNextQuestion = () => {
    if (currentQuestionIndex < similarQuestions.length - 1) {
      const newIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(newIndex);
      loadQuestion(newIndex);
    } else {
      // 完成练习
      completePractice();
    }
  };

  // 完成练习
  const completePractice = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // 计算总用时
    if (startTimeRef.current) {
      const endTime = new Date().getTime();
      const totalTimeSeconds = Math.floor((endTime - startTimeRef.current) / 1000);
      setTotalTime(totalTimeSeconds);
    }

    // 显示完成弹窗
    setShowCompletionModal(true);
  };

  // 返回上一页
  const handleBackClick = () => {
    navigate(-1);
  };

  // 继续练习
  const handleContinuePractice = () => {
    navigate('/error-book');
  };

  // 返回详情
  const handleBackToDetail = () => {
    navigate(`/error-detail?questionId=${originalQuestionId}`);
  };

  // 查看解析
  const handleShowExplanation = () => {
    const explanationSection = document.querySelector('#explanation-section');
    if (explanationSection) {
      explanationSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 当前题目
  const currentQuestion = similarQuestions[currentQuestionIndex];
  if (!currentQuestion) return null;

  // 计算进度和正确率
  const progress = ((currentQuestionIndex + 1) / similarQuestions.length) * 100;
  const accuracy = currentQuestionIndex > 0 ? Math.round((correctCount / (currentQuestionIndex + 1)) * 100) : 0;

  // 格式化总用时
  const totalMinutes = Math.floor(totalTime / 60);
  const totalSeconds = totalTime % 60;
  const formattedTotalTime = `${totalMinutes.toString().padStart(2, '0')}:${totalSeconds.toString().padStart(2, '0')}`;

  // 解析解释文本
  const explanationParts = currentQuestion.explanation.split('\n\n');
  const steps = explanationParts[0].split('\n').slice(1);

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
            <button className="p-2 text-text-secondary hover:text-primary">
              <i className="fas fa-bell text-lg"></i>
            </button>
            <div className="flex items-center space-x-2 cursor-pointer">
              <img 
                src="https://s.coze.cn/image/3lXIbiqV7BU/" 
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
              <Link to="/error-book" className={`${styles.menuItem} ${styles.menuItemActive} flex items-center space-x-3 px-4 py-3 rounded-lg`}>
                <i className="fas fa-book text-lg"></i>
                <span className="font-medium">错题本</span>
              </Link>
            </li>
            <li>
              <Link to="/review-plan" className={`${styles.menuItem} flex items-center space-x-3 px-4 py-3 rounded-lg text-text-secondary`}>
                <i className="fas fa-redo text-lg"></i>
                <span className="font-medium">错题复习</span>
              </Link>
            </li>
            <li>
              <Link to="/report" className={`${styles.menuItem} flex items-center space-x-3 px-4 py-3 rounded-lg text-text-secondary`}>
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">相似题练习</h2>
              <nav className="text-sm text-text-secondary">
                <Link to="/error-book" className="hover:text-primary">错题本</Link>
                <span className="mx-2">/</span>
                <Link to={`/error-detail?questionId=${originalQuestionId}`} className="hover:text-primary">错题详情</Link>
                <span className="mx-2">/</span>
                <span>相似题练习</span>
              </nav>
            </div>
            <button 
              onClick={handleBackClick}
              className="w-full sm:w-auto px-4 py-2 bg-gray-100 text-text-primary rounded-lg hover:bg-gray-200"
            >
              <i className="fas fa-arrow-left mr-2"></i>返回
            </button>
          </div>
        </div>

        {/* 练习进度 */}
        <section className="mb-6">
          <div className="bg-card-bg rounded-2xl border border-border-light p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <h3 className="text-lg font-semibold text-text-primary">练习进度</h3>
              <span className="text-text-secondary">第 {currentQuestionIndex + 1} 题 / 共 {similarQuestions.length} 题</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`bg-primary h-3 rounded-full ${styles.progressBar}`} 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-2 text-sm text-text-secondary">
              <span>正确率: <span>{accuracy}%</span></span>
              <span>已用时: <span>{timeUsed}</span></span>
            </div>
          </div>
        </section>

        {/* 题目展示区 */}
        <section className="mb-6">
          <div className="bg-card-bg rounded-2xl border border-border-light p-8">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-text-primary mb-2">题目</h3>
              <div className="text-text-primary text-lg leading-relaxed">
                {currentQuestion.question}
              </div>
            </div>

            {/* 选择题选项 */}
            {currentQuestion.type === 'multiple-choice' && (
              <div className="mb-6">
                <h4 className="text-md font-medium text-text-primary mb-4">请选择正确答案：</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentQuestion.options?.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleOptionClick(option.value)}
                      className={`p-4 border-2 rounded-lg text-left hover:border-primary transition-colors ${
                        isAnswered
                          ? option.correct
                            ? styles.optionCorrect
                            : selectedAnswer === option.value
                            ? styles.optionIncorrect
                            : 'border-border-light'
                          : selectedAnswer === option.value
                          ? styles.optionSelected
                          : 'border-border-light'
                      }`}
                    >
                      <span className="font-medium">{option.label}. </span>{option.value}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 填空题输入框 */}
            {currentQuestion.type === 'fill-blank' && (
              <div className="mb-6">
                <h4 className="text-md font-medium text-text-primary mb-4">请填写答案：</h4>
                <div className="flex items-center space-x-4">
                  <input
                    type="text"
                    value={answerInput}
                    onChange={(e) => setAnswerInput(e.target.value)}
                    className="flex-1 px-4 py-3 border-2 border-border-light rounded-lg focus:border-primary focus:outline-none"
                    placeholder="请输入答案..."
                    disabled={isAnswered}
                  />
                  <button
                    onClick={handleSubmitAnswer}
                    className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90"
                    disabled={isAnswered}
                  >
                    提交答案
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 练习结果反馈区 */}
        {showResultFeedback && (
          <section className="mb-6">
            <div className={`bg-card-bg rounded-2xl border border-border-light p-8 ${styles.fadeIn}`}>
              {/* 对错判断 */}
              <div className="text-center mb-6">
                <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  isAnswered && selectedAnswer === currentQuestion.correctAnswer
                    ? 'bg-success/10'
                    : 'bg-danger/10'
                }`}>
                  <i className={`text-3xl ${
                    isAnswered && selectedAnswer === currentQuestion.correctAnswer
                      ? 'fas fa-check text-success'
                      : 'fas fa-times text-danger'
                  }`}></i>
                </div>
                <h3 className={`text-2xl font-bold mb-2 ${
                  isAnswered && selectedAnswer === currentQuestion.correctAnswer
                    ? 'text-success'
                    : 'text-danger'
                }`}>
                  {isAnswered && selectedAnswer === currentQuestion.correctAnswer
                    ? '回答正确！'
                    : '回答错误'
                  }
                </h3>
                <p className="text-text-secondary">
                  {isAnswered && selectedAnswer === currentQuestion.correctAnswer
                    ? '恭喜你，答对了这道题！'
                    : '没关系，继续努力，你一定可以的！'
                  }
                </p>
              </div>

              {/* 正确答案 */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-text-primary mb-3">正确答案：</h4>
                <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                  <span className="text-success font-medium">{currentQuestion.correctAnswer}</span>
                </div>
              </div>

              {/* 详细解析 */}
              <div id="explanation-section" className="mb-6">
                <h4 className="text-lg font-semibold text-text-primary mb-3">详细解析：</h4>
                <div className="p-4 bg-info/10 border border-info/20 rounded-lg">
                  <p className="text-text-primary mb-3"><strong>解题步骤：</strong></p>
                  <ol className="list-decimal list-inside space-y-2 text-text-primary mb-4">
                    {steps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                  <p className="text-text-secondary"><strong>{explanationParts[1]}</strong></p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 操作按钮区 */}
        <section className="flex justify-between">
          <button
            onClick={handlePrevQuestion}
            className={`px-6 py-3 bg-gray-100 text-text-primary rounded-lg hover:bg-gray-200 ${
              currentQuestionIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={currentQuestionIndex === 0}
          >
            <i className="fas fa-chevron-left mr-2"></i>上一题
          </button>
          
          <div className="flex space-x-4">
            {showResultFeedback && (
              <button
                onClick={handleShowExplanation}
                className="px-6 py-3 bg-warning text-white rounded-lg hover:bg-warning/90"
              >
                <i className="fas fa-lightbulb mr-2"></i>查看解析
              </button>
            )}
            {!showResultFeedback && (
              <button
                onClick={handleSubmitAnswer}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                <i className="fas fa-check mr-2"></i>提交答案
              </button>
            )}
          </div>
          
          <button
            onClick={handleNextQuestion}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            {currentQuestionIndex === similarQuestions.length - 1
              ? (
                  <>完成练习<i className="fas fa-check ml-2"></i></>
                )
              : (
                  <>下一题<i className="fas fa-chevron-right ml-2"></i></>
                )
            }
          </button>
        </section>
      </main>

      {/* 完成练习弹窗 */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card-bg rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-trophy text-success text-2xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-text-primary mb-2">练习完成！</h3>
              <p className="text-text-secondary mb-6">恭喜你完成了本次相似题练习</p>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-text-secondary">总题数：</span>
                  <span className="font-medium text-text-primary">{similarQuestions.length}题</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">答对题数：</span>
                  <span className="font-medium text-success">{correctCount}题</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">正确率：</span>
                  <span className="font-medium text-success">{Math.round((correctCount / similarQuestions.length) * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">用时：</span>
                  <span className="font-medium text-text-primary">{formattedTotalTime}</span>
                </div>
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={handleContinuePractice}
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  继续练习
                </button>
                <button
                  onClick={handleBackToDetail}
                  className="flex-1 px-4 py-3 bg-gray-100 text-text-primary rounded-lg hover:bg-gray-200"
                >
                  返回详情
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <MobileNav />
    </div>
  );
};

export default SimilarPracticePage;
