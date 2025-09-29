import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AnalysisViewer } from "../../components/analysis/AnalysisViewer";
import type { AnalysisQuestionSelectEvent } from "../../components/analysis/AnalysisViewer";
import { UploadDropzone } from "../../components/upload/UploadDropzone";
import { UploadStatusCard } from "../../components/upload/UploadStatusCard";
import { normalizeCozeAnalysis, type NormalizationResult } from "../../lib/analysis";
import { normalizeMistakeDetail } from "../../lib/detail";
import { apiClient } from "../../lib/apiClient";
import type { UploadImageResponse, UploadStatus } from "../../types/upload";
import styles from "./UploadPage.module.css";

export const UploadPage = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [analysis, setAnalysis] = useState<UploadImageResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setStatus("idle");
    setProgress(0);
    setAnalysis(null);
    setError(null);
    setSelectedFile(null);
  }, []);

  const startUpload = useCallback(async (file: File) => {
    setSelectedFile(file);
    setStatus("uploading");
    setProgress(0);
    setAnalysis(null);
    setError(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await apiClient.post<UploadImageResponse>("/upload/image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (event) => {
          if (!event.total) {
            return;
          }
          const percent = Math.round((event.loaded / event.total) * 100);
          setProgress(percent);
          if (percent >= 100) {
            setStatus("processing");
          }
        },
      });

      setAnalysis(response.data);
      setStatus("success");
      setProgress(100);
      toast.success("上传成功，解析完成。");
    } catch (err) {
      const message = err instanceof Error ? err.message : "上传失败，请稍后再试。";
      setError(message);
      setStatus("error");
      toast.error(message);
    }
  }, []);

  const handleFileAccepted = useCallback(
    (file: File) => {
      if (status === "uploading" || status === "processing") {
        toast("正在处理上一张图片，请稍候。");
        return;
      }
      startUpload(file);
    },
    [startUpload, status],
  );

  const handleRetry = useCallback(() => {
    if (selectedFile) {
      startUpload(selectedFile);
    } else {
      resetState();
    }
  }, [resetState, selectedFile, startUpload]);

  const disableDropzone = status === "uploading" || status === "processing";

  const normalizedAnalysis = useMemo<NormalizationResult>(() => {
    if (!analysis) {
      return { sections: [], rawItems: [] };
    }
    return normalizeCozeAnalysis(analysis.coze_analysis);
  }, [analysis]);

  const handleQuestionSelect = useCallback(
    ({ question, section, questionIndex, sectionIndex }: AnalysisQuestionSelectEvent) => {
      if (!analysis) {
        return;
      }

      const fallbackId = `${analysis.file_id ?? "preview"}-${sectionIndex + 1}-${questionIndex + 1}`;
      const rawItem = normalizedAnalysis.rawItems.find((item) => {
        if (question.id && item.id === question.id) {
          return true;
        }
        if (item.question && item.question === question.question) {
          return true;
        }
        return false;
      });

      const subject = rawItem?.subject ?? section.subject;
      const knowledgePointNames = rawItem?.knowledge_points?.length
        ? rawItem.knowledge_points
        : section.knowledge_points ?? [];

      const mastery = question.is_correct === false ? "weak" : question.is_correct === true ? "strong" : "unknown";

      const detailCandidate: Record<string, unknown> = {
        id: question.id ?? rawItem?.id ?? fallbackId,
        subject,
        question: question.question,
        answer: question.answer,
        correct_answer: question.correct_answer,
        is_correct: question.is_correct,
        comment: rawItem?.comment ?? question.comment,
        section: section.section,
        image_url: analysis.file_url,
        knowledge_points: knowledgePointNames,
        analysis: rawItem?.comment ?? question.comment ?? section.section,
        tags: knowledgePointNames,
        meta: {
          section: section.section,
          subject,
          upload_time: analysis.upload_time,
          source: analysis.filename,
        },
      };

      const normalizedDetail = normalizeMistakeDetail(detailCandidate);

      if (normalizedDetail.knowledgePoints.length === 0 && knowledgePointNames.length) {
        normalizedDetail.knowledgePoints = knowledgePointNames.map((name, index) => ({
          id: `kp-${index + 1}`,
          name,
          mastery,
        }));
      } else if (normalizedDetail.knowledgePoints.length) {
        normalizedDetail.knowledgePoints = normalizedDetail.knowledgePoints.map((kp, index) => ({
          ...kp,
          mastery: kp.mastery ?? mastery,
          id: kp.id ?? `kp-${index + 1}`,
        }));
      }

      if (!normalizedDetail.tags.length && knowledgePointNames.length) {
        normalizedDetail.tags = [...knowledgePointNames];
      }

      if (!normalizedDetail.meta.subject && subject) {
        normalizedDetail.meta.subject = subject;
      }

      navigate(`/detail/${normalizedDetail.id}`, {
        state: {
          detail: normalizedDetail,
          fromUpload: true,
        },
      });
    },
    [analysis, navigate, normalizedAnalysis],
  );

  const analysisPreview = useMemo(() => {
    if (!analysis) {
      return "";
    }
    try {
      const payload = analysis.coze_analysis ?? analysis;
      return JSON.stringify(payload, null, 2);
    } catch (err) {
      console.error(err);
      return "";
    }
  }, [analysis]);

  const hasStructuredAnalysis = normalizedAnalysis.sections.length > 0;

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <span className={styles.heroTag}>STEP 1 · 题目上传</span>
        <h2>上传题目图片，自动生成错题解析</h2>
        <p>
          请确保图片光线充足、题面完整无遮挡。系统将调用 OCR + AI 能力识别题干，并输出解析、错因和练习建议。
        </p>
        <ul className={styles.heroChecklist}>
          <li>支持手写/打印试题照片、拍照或扫描件</li>
          <li>推荐尺寸 ≥ 1080px，避免倾斜、模糊</li>
          <li>上传将自动触发错题解析和后续练习生成</li>
        </ul>
      </header>

      <div className={styles.grid}>
        <UploadDropzone disabled={disableDropzone} onFileAccepted={handleFileAccepted} />
        <UploadStatusCard
          file={selectedFile}
          status={status}
          progress={progress}
          error={error}
          response={analysis}
          onRetry={status === "error" ? handleRetry : undefined}
        />
      </div>

      {analysis && (
        <section className={styles.resultCard}>
          <div className={styles.resultHeader}>
            <div>
              <h3>解析结果</h3>
              <p>AI 解析已完成，可查看结构化结果与原始 JSON 数据。</p>
            </div>
            <div className={styles.resultActions}>
              <button type="button" onClick={resetState} className={styles.clearButton}>
                清空结果
              </button>
            </div>
          </div>

          {hasStructuredAnalysis ? (
            <AnalysisViewer sections={normalizedAnalysis.sections} onSelectQuestion={handleQuestionSelect} />
          ) : (
            <div className={styles.emptyNotice}>暂未解析出结构化题目，请检查返回数据。</div>
          )}

          {analysisPreview && (
            <details className={styles.jsonPanel}>
              <summary>查看原始 JSON</summary>
              <pre className={styles.jsonPreview}>{analysisPreview}</pre>
            </details>
          )}
        </section>
      )}
    </section>
  );
};
