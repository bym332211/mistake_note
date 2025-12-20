import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './styles.module.css';
import { API_BASE_URL, updateMistakeErrorType } from '../../lib/apiClient';
import { MobileNav } from '../../components/MobileNav';

interface UploadedFile {
  file: File;
  preview: string;
}

interface ErrorReason {
  id: string;
  icon: string;
  text: string;
}

// 后端API响应类型
interface ApiResponse {
  status: string;
  message: string;
  analysis: Array<{
    id: string;
    section: string;
    question: string;
    answer: string;
    is_question: boolean;
    is_correct: boolean;
    correct_answer: string;
    comment: string;
    knowledge_point?: string;
    error_type?: string;
  }>;
  analyze_time: string;
  mistake_record_id?: number;
}

const PUpload: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  // 状态管理
  const [selectedFiles, setSelectedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadedImages, setShowUploadedImages] = useState(false);
  const [showRecognitionResult, setShowRecognitionResult] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [showErrorReasonSection, setShowErrorReasonSection] = useState(false);
  const [showActionButtons, setShowActionButtons] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // 表单状态
  const [questionContent, setQuestionContent] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [knowledgePoint, setKnowledgePoint] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [solutionIdea, setSolutionIdea] = useState('AI正在分析解题思路...');
  void solutionIdea;
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null);

  // 错误原因选项
  const errorReasons: ErrorReason[] = [
    { id: 'concept', icon: 'fas fa-lightbulb', text: '概念不清' },
    { id: 'calculation', icon: 'fas fa-calculator', text: '计算错误' },
    { id: 'careless', icon: 'fas fa-exclamation-triangle', text: '粗心大意' },
    { id: 'forgot', icon: 'fas fa-brain', text: '知识点遗忘' },
    { id: 'method', icon: 'fas fa-tools', text: '方法错误' }
  ];

  // 设置页面标题
  useEffect(() => {
    const originalTitle = document.title;
    document.title = 'AI错题本 - 错题上传';
    return () => { document.title = originalTitle; };
  }, []);

  // 文件选择处理
  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 文件输入变化处理
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      handleFiles(Array.from(files));
    }
    event.target.value = '';
  };

  const handleCameraInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      handleFiles(Array.from(files));
    }
    event.target.value = '';
  };

  // 拖拽事件处理
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    const files = event.dataTransfer.files;
    if (files) {
      handleFiles(Array.from(files));
    }
  };

  // 处理文件上传
  const handleFiles = async (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      alert('请选择图片文件');
      return;
    }

    // 显示上传进度
    setIsUploading(true);
    setUploadProgress(0);

    // 模拟上传过程
    let progress = 0;
    const uploadInterval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(uploadInterval);
        setTimeout(() => {
          setIsUploading(false);
          displayUploadedImages(imageFiles);
          startRecognition(imageFiles[0]); // 只处理第一张图片
        }, 500);
      }
      setUploadProgress(progress);
    }, 200);
  };

  // 显示上传的图片
  const displayUploadedImages = (files: File[]) => {
    const uploadedFiles: UploadedFile[] = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setSelectedFiles(uploadedFiles);
    setShowUploadedImages(true);
  };

  // 移除图片
  const removeImage = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
    
    if (newFiles.length === 0) {
      setShowUploadedImages(false);
      setShowRecognitionResult(false);
      setShowErrorReasonSection(false);
      setShowActionButtons(false);
      setApiResponse(null);
    }
  };

  // 开始识别 - 调用真实API
  const startRecognition = async (file: File) => {
    setShowRecognitionResult(true);
    setIsRecognizing(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${API_BASE_URL}/analyze/image`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse = await response.json();
      setApiResponse(result);
      
      // 处理API响应数据
      if (result.analysis && result.analysis.length > 0) {
        populateRecognitionResult(result);
      } else {
        // 如果没有数据，显示默认信息
        setQuestionContent('未识别到题目内容');
        setCorrectAnswer('');
        setKnowledgePoint('');
        setSolutionIdea('AI未能识别出有效的题目信息，请尝试重新上传或检查图片质量。');
      }
      
    } catch (error) {
      console.error('API调用失败:', error);
      // 如果API调用失败，使用模拟数据
      populateRecognitionResult(null);
    } finally {
      setIsRecognizing(false);
      setShowErrorReasonSection(true);
      setShowActionButtons(true);
    }
  };

  // 填充识别结果
  const populateRecognitionResult = (result: ApiResponse | null) => {
    if (result && result.analysis && result.analysis.length > 0) {
      // 使用API返回的数据 - 新的扁平结构
      const firstAnalysisItem = result.analysis[0];
      
      // 构建完整的题目内容
      let fullQuestionContent = '';
      if (firstAnalysisItem.section) {
        fullQuestionContent += `<p class="font-medium text-text-primary mb-3">${firstAnalysisItem.section}</p>`;
      }
      
      if (firstAnalysisItem.question) {
        fullQuestionContent += `<p class="text-text-primary mb-2">${firstAnalysisItem.question}</p>`;
      }
      
      setQuestionContent(fullQuestionContent || '未识别到题目内容');
      
      // 设置正确答案
      setCorrectAnswer(firstAnalysisItem.correct_answer || '');
      
      // 设置知识点
      setKnowledgePoint(firstAnalysisItem.knowledge_point || '');
      
      // 构建解题思路
      const solutionText = firstAnalysisItem.comment ? 
        `<p class="text-text-primary text-sm mb-2"><strong>解题思路：</strong></p>
         <p class="text-text-secondary text-sm">${firstAnalysisItem.comment}</p>` :
        'AI正在分析解题思路...';
      setSolutionIdea(solutionText);
      
      // 保存完整的API响应数据用于显示知识点标签
      setApiResponse(result);
    } else {
      // 使用模拟数据
      setQuestionContent('计算：1/2 + 1/3 = ?');
      setCorrectAnswer('5/6');
      setKnowledgePoint('math-fraction');
      setSolutionIdea(`
        <p class="text-text-primary text-sm mb-2"><strong>解题步骤：</strong></p>
        <p class="text-text-secondary text-sm mb-2">1. 找到两个分数的最小公分母：2和3的最小公倍数是6</p>
        <p class="text-text-secondary text-sm mb-2">2. 将分数转换为同分母：1/2 = 3/6，1/3 = 2/6</p>
        <p class="text-text-secondary text-sm mb-2">3. 相加：3/6 + 2/6 = 5/6</p>
        <p class="text-text-secondary text-sm">4. 结果为5/6</p>
      `);
    }
  };

  // 重新识别
  const handleRefreshRecognition = () => {
    if (selectedFiles.length > 0) {
      setIsRecognizing(true);
      startRecognition(selectedFiles[0].file);
    }
  };

  // 错误原因选择
  const handleErrorReasonToggle = (reasonId: string) => {
    setSelectedReasons(prevReasons => {
      if (prevReasons.includes(reasonId)) {
        return prevReasons.filter(id => id !== reasonId);
      } else {
        return [...prevReasons, reasonId];
      }
    });
  };

  // 拍照上传
  const handleCameraUpload = () => {
    console.log('需要调用第三方接口实现相机拍照功能');
    // 注释：此功能需要调用设备相机API，在原型阶段仅做UI展示
    
    // 模拟拍照成功
    cameraInputRef.current?.click();
  };

  // 取消操作
  const handleCancel = () => {
    if (confirm('确定要取消吗？已填写的内容将丢失。')) {
      navigate('/home');
    }
  };

  // 保存错题
  const handleSaveError = async () => {
    if (!questionContent.trim() || !correctAnswer.trim() || !knowledgePoint) {
      alert('请填写完整的题目信息');
      return;
    }
    
    if (selectedReasons.length === 0 && !customReason.trim()) {
      alert('请至少选择一个错误原因或填写自定义原因');
      return;
    }

    const reasonTexts = selectedReasons
      .map(id => errorReasons.find(r => r.id === id)?.text)
      .filter((text): text is string => Boolean(text));
    const reasonToSave = [...reasonTexts, customReason.trim()].filter(Boolean).join(' / ');

    const mistakeId = apiResponse?.mistake_record_id;
    if (!mistakeId) {
      alert('后端未返回错题ID，无法保存错误原因');
      return;
    }

    setIsSaving(true);
    try {
      await updateMistakeErrorType({
        mistake_record_id: mistakeId,
        error_type: reasonToSave,
      });
      navigate(`/error-detail?errorId=${mistakeId}`);
    } catch (error) {
      console.error('保存错误原因失败:', error);
      alert(error instanceof Error ? error.message : '保存错误原因失败，请稍后重试');
    } finally {
      setIsSaving(false);
    }
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
            <h1 className="text-lg md:text-xl font-bold text-text-primary">AI错题本</h1>
          </div>
          
          {/* 用户操作区 */}
          <div className="flex items-center space-x-4">
            <button className="p-2 text-text-secondary hover:text-primary">
              <i className="fas fa-bell text-lg"></i>
            </button>
            <div className="flex items-center space-x-2 cursor-pointer">
              <img 
                src="https://s.coze.cn/image/umx84TjQ7D0/" 
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
                className={`${styles.menuItem} ${styles.menuItemActive} flex items-center space-x-3 px-4 py-3 rounded-lg`}
              >
                <i className="fas fa-camera text-lg"></i>
                <span className="font-medium">错题上传</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/error-book" 
                className={`${styles.menuItem} flex items-center space-x-3 px-4 py-3 rounded-lg text-text-secondary`}
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">错题上传</h2>
              <nav className="text-sm text-text-secondary">
                <span>错题上传</span>
              </nav>
            </div>
          </div>
        </div>

        {/* 上传区域 */}
        <section className="mb-8">
          <div className="bg-card-bg rounded-2xl border border-border-light p-4 sm:p-6 md:p-8">
            <h3 className="text-lg font-semibold text-text-primary mb-6">上传错题图片</h3>
            
            {/* 拖拽上传区域 */}
            <div 
              className={`${styles.uploadArea} ${isDragOver ? styles.uploadAreaDragover : ''} rounded-xl p-5 sm:p-6 md:p-8 text-center mb-6 cursor-pointer`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleFileSelect}
            >
              <i className="fas fa-cloud-upload-alt text-4xl text-text-secondary mb-4"></i>
              <p className="text-text-primary font-medium mb-2">拖拽图片到此处或点击选择文件</p>
              <p className="text-text-secondary text-sm mb-4">支持 JPG、PNG 格式，单张图片不超过 10MB</p>
              <button 
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition duration-300"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFileSelect();
                }}
              >
                <i className="fas fa-folder-open mr-2"></i>选择文件
              </button>
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                multiple 
                className="hidden"
                onChange={handleFileInputChange}
              />
            </div>
            
            {/* 拍照上传按钮 */}
            <div className="flex justify-center">
              <button 
                onClick={handleCameraUpload}
                className="w-full sm:w-auto px-6 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition duration-300"
              >
                <i className="fas fa-camera mr-2"></i>拍照上传
              </button>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleCameraInputChange}
              />
            </div>
            
            {/* 上传进度 */}
            {isUploading && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-secondary text-sm">上传中...</span>
                  <span className="text-text-secondary text-sm">{Math.round(uploadProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`bg-primary h-2 rounded-full ${styles.progressBar}`}
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {/* 已上传图片预览 */}
            {showUploadedImages && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {selectedFiles.map((uploadedFile, index) => (
                  <div key={index} className="relative">
                    <img 
                      src={uploadedFile.preview} 
                      alt="上传的图片" 
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button 
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 w-6 h-6 bg-danger text-white rounded-full flex items-center justify-center text-xs hover:bg-danger/90"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 识别结果展示区 - 列表形式 */}
        {showRecognitionResult && (
          <section className="mb-8">
            <div className="bg-card-bg rounded-2xl border border-border-light p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-text-primary">识别结果</h3>
                <div className="flex items-center space-x-2">
                  {isRecognizing && (
                    <div>
                      <i className={`fas fa-spinner ${styles.loadingSpinner} text-primary`}></i>
                      <span className="text-text-secondary text-sm ml-2">识别中...</span>
                    </div>
                  )}
                  <button 
                    onClick={handleRefreshRecognition}
                    className="text-primary hover:text-primary/80 text-sm"
                  >
                    <i className="fas fa-redo mr-1"></i>重新识别
                  </button>
                </div>
              </div>
              
              {/* 题目列表 */}
              <div className="space-y-4">
                {apiResponse?.analysis?.map((analysisItem, index) => (
                  <div 
                    key={analysisItem.id || index}
                    className={`border rounded-lg p-4 cursor-pointer transition duration-300 ${
                      selectedQuestionIndex === index 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border-light hover:border-primary hover:bg-bg-light'
                    }`}
                    onClick={() => setSelectedQuestionIndex(index)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* 题目内容 */}
                        <div className="mb-3">
                          <h4 className="font-medium text-text-primary mb-2">题目内容</h4>
                          {analysisItem.section && (
                            <p className="text-text-primary mb-2 font-medium">{analysisItem.section}</p>
                          )}
                          {analysisItem.question && (
                            <p className="text-text-primary text-sm">{analysisItem.question}</p>
                          )}
                        </div>
                        
                        {/* 学科和知识点 */}
                        <div className="flex flex-wrap items-center gap-4 mb-3">
                          {analysisItem.knowledge_point && (
                            <div>
                              <span className="text-sm font-medium text-text-primary mr-2">知识点：</span>
                              <div className="inline-flex flex-wrap gap-1">
                                <span 
                                  className="px-2 py-1 bg-secondary/10 text-secondary text-xs rounded-full border border-secondary/20"
                                >
                                  {analysisItem.knowledge_point}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* 解题思路预览 */}
                        {analysisItem.comment && (
                          <div className="text-text-secondary text-sm">
                            <span className="font-medium">解题思路：</span>
                            <span className="ml-1">
                              {analysisItem.comment.length > 100 
                                ? analysisItem.comment.substring(0, 100) + '...' 
                                : analysisItem.comment
                              }
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* 操作按钮 */}
                      <div className="flex items-center space-x-2 ml-4">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            // 使用错题记录ID进行导航
                            const mistakeId = apiResponse?.mistake_record_id || 'error_' + Date.now();
                            navigate(`/error-detail?errorId=${mistakeId}`);
                          }}
                          className="px-3 py-1 bg-primary text-white text-sm rounded hover:bg-primary/90"
                        >
                          查看详情
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* 选中题目的详细信息 */}
              {selectedQuestionIndex !== null && apiResponse?.analysis?.[selectedQuestionIndex] && (
                <div className="mt-6 p-4 border border-primary/20 bg-primary/5 rounded-lg">
                  <h4 className="font-semibold text-text-primary mb-4">题目详情</h4>
                  
                  {/* 正确答案 */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-text-primary mb-2">正确答案</label>
                    <div className="p-3 bg-bg-light border border-border-light rounded">
                      <p className="text-text-primary text-sm">
                        {apiResponse.analysis[selectedQuestionIndex].correct_answer}
                      </p>
                    </div>
                  </div>
                  
                  {/* 解题思路 */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">解题思路</label>
                    <div className="p-3 bg-bg-light border border-border-light rounded">
                      {apiResponse.analysis[selectedQuestionIndex].comment ? (
                        <p className="text-text-secondary text-sm">
                          {apiResponse.analysis[selectedQuestionIndex].comment}
                        </p>
                      ) : (
                        <p className="text-text-secondary text-sm">暂无解题思路</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 错题原因选择区 */}
        {showErrorReasonSection && (
          <section className="mb-8">
            <div className="bg-card-bg rounded-2xl border border-border-light p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-6">错题原因</h3>
              
              {/* 预设原因标签 */}
              <div className="mb-6">
                <p className="text-sm font-medium text-text-primary mb-3">选择错误原因（可多选）</p>
                <div className="flex flex-wrap gap-3">
                  {errorReasons.map((reason) => (
                    <button 
                      key={reason.id}
                      onClick={() => handleErrorReasonToggle(reason.id)}
                      className={`${styles.errorReasonTag} ${selectedReasons.includes(reason.id) ? styles.errorReasonTagSelected : ''} px-4 py-2 border border-border-light rounded-lg text-sm hover:border-primary transition duration-300`}
                    >
                      <i className={`${reason.icon} mr-2`}></i>{reason.text}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* 自定义原因 */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">自定义原因（可选）</label>
                <textarea 
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full h-20 p-4 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none" 
                  placeholder="请输入具体的错误原因..."
                />
              </div>
            </div>
          </section>
        )}

        {/* 操作按钮区 */}
        {showActionButtons && (
          <section className="mb-8">
            <div className="flex justify-end space-x-4">
              <button 
                onClick={handleCancel}
                className="px-6 py-3 border border-border-light text-text-secondary rounded-lg hover:bg-bg-light transition duration-300"
              >
                取消
              </button>
              <button 
                onClick={handleSaveError}
                disabled={isSaving}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition duration-300 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <i className={`fas fa-spinner ${styles.loadingSpinner} mr-2`}></i>保存中...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save mr-2"></i>保存错题
                  </>
                )}
              </button>
            </div>
          </section>
        )}
      </main>

      <MobileNav />
    </div>
  );
};

export default PUpload;
