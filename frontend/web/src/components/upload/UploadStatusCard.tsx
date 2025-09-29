import clsx from "clsx";
import type { UploadImageResponse, UploadStatus } from "../../types/upload";
import styles from "./UploadStatusCard.module.css";

interface UploadStatusCardProps {
  file?: File | null;
  status: UploadStatus;
  progress: number;
  error?: string | null;
  response?: UploadImageResponse | null;
  onRetry?: () => void;
}

const STATUS_COPY: Record<UploadStatus, { title: string; description: string }> = {
  idle: {
    title: "等待上传",
    description: "支持拖拽或点击选择清晰的题目图片。",
  },
  uploading: {
    title: "正在上传题目",
    description: "正在上传图片，请保持浏览器窗口不要关闭。",
  },
  processing: {
    title: "解析中",
    description: "文件已上传，正在调用OCR与AI服务解析内容。",
  },
  success: {
    title: "解析成功",
    description: "题目已经完成识别与分析，结果已生成。",
  },
  error: {
    title: "上传失败",
    description: "上传未成功，请检查网络后重试。",
  },
};

const formatFileSize = (size?: number) => {
  if (!size && size !== 0) {
    return "未知大小";
  }
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }
  if (size >= 1024) {
    return `${Math.round(size / 1024)} KB`;
  }
  return `${size} B`;
};

export const UploadStatusCard = ({
  file,
  status,
  progress,
  error,
  response,
  onRetry,
}: UploadStatusCardProps) => {
  const copy = STATUS_COPY[status];

  const showProgressBar = status === "uploading" || status === "processing";
  const determinateProgress = status === "uploading";
  const progressValue = determinateProgress ? Math.max(0, Math.min(progress, 100)) : 100;

  return (
    <aside className={styles.card} aria-live="polite">
      <header className={styles.header}>
        <div>
          <p className={styles.statusTitle}>{copy.title}</p>
          <p className={styles.statusDescription}>{copy.description}</p>
        </div>
        <span className={clsx(styles.badge, styles[`badge_${status}`])}>{status.toUpperCase()}</span>
      </header>

      <div className={styles.body}>
        {file && (
          <div className={styles.fileMeta}>
            <div className={styles.fileIcon} aria-hidden="true">
              🗂
            </div>
            <div className={styles.fileInfo}>
              <p className={styles.fileName}>{file.name}</p>
              <p className={styles.fileDetail}>
                {file.type || "未知类型"} · {formatFileSize(file.size)}
              </p>
            </div>
          </div>
        )}

        {showProgressBar && (
          <div className={styles.progressSection}>
            <div className={styles.progressTrack} aria-hidden="true">
              <div
                className={clsx(
                  styles.progressBar,
                  determinateProgress ? styles.progressDeterminate : styles.progressIndeterminate,
                )}
                style={determinateProgress ? { width: `${progressValue}%` } : undefined}
              />
            </div>
            {determinateProgress && <p className={styles.progressText}>{progressValue}%</p>}
          </div>
        )}

        {status === "success" && response && (
          <dl className={styles.summaryList}>
            <div>
              <dt>文件编号</dt>
              <dd>{response.file_id}</dd>
            </div>
            <div>
              <dt>上传时间</dt>
              <dd>{new Date(response.upload_time).toLocaleString()}</dd>
            </div>
            <div>
              <dt>解析条目数</dt>
              <dd>
                {Array.isArray(response.coze_analysis)
                  ? response.coze_analysis.length
                  : response.coze_analysis
                  ? "1+"
                  : 0}
              </dd>
            </div>
          </dl>
        )}

        {status === "error" && error && (
          <div className={styles.errorBox}>
            <p className={styles.errorTitle}>问题详情</p>
            <p className={styles.errorMessage}>{error}</p>
            {onRetry && (
              <button type="button" className={styles.retryButton} onClick={onRetry}>
                重试上传
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
