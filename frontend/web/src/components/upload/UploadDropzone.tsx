import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import toast from "react-hot-toast";
import styles from "./UploadDropzone.module.css";

const ACCEPTED_TYPES = ["image/jpeg", "image/png"];
const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png"];
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

interface UploadDropzoneProps {
  disabled?: boolean;
  onFileAccepted: (file: File) => void;
}

const isSupportedType = (file: File) => {
  if (!file.type) {
    return ACCEPTED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));
  }
  return ACCEPTED_TYPES.includes(file.type);
};

const formatBytes = (size: number) => {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (size >= 1024) {
    return `${Math.round(size / 1024)} KB`;
  }
  return `${size} B`;
};

export const UploadDropzone = ({ disabled = false, onFileAccepted }: UploadDropzoneProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];

    if (!isSupportedType(file)) {
      toast.error("仅支持 JPG / PNG 图片，请重新选择。");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`文件体积超出限制（≤ ${MAX_FILE_SIZE_MB}MB），当前 ${formatBytes(file.size)}。`);
      return;
    }

    onFileAccepted(file);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) {
      return;
    }
    setIsDragActive(false);
    handleFiles(event.dataTransfer.files);
  };

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) {
      return;
    }
    if (!isDragActive) {
      setIsDragActive(true);
    }
  };

  const onDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) {
      return;
    }
    if (event.currentTarget === event.target) {
      setIsDragActive(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div
        className={`${styles.dropzone} ${isDragActive ? styles.active : ""} ${disabled ? styles.disabled : ""}`.trim()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        aria-disabled={disabled}
      >
        <div className={styles.content}>
          <div className={styles.icon} aria-hidden="true">
            ⬆
          </div>
          <p className={styles.title}>拖拽题目图片到此处</p>
          <p className={styles.subtitle}>支持清晰的手写或打印试题照片，JPG / PNG 格式，≤ {MAX_FILE_SIZE_MB}MB</p>
          <button
            type="button"
            className={styles.selectButton}
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
          >
            选择文件上传
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
          className="visually-hidden"
          onChange={onInputChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
};
