export type UploadStatus = "idle" | "uploading" | "processing" | "success" | "error";

export interface UploadImageResponse {
  status: string;
  message: string;
  file_id: string;
  filename: string;
  file_url: string;
  upload_time: string;
  file_size: number;
  file_type: string;
  coze_analysis: unknown;
}

export interface CozeQuestionResult {
  id?: string;
  question: string;
  answer?: string;
  correct_answer?: string;
  is_correct?: boolean;
  comment?: string;
}

export interface CozeOutputSection {
  id?: string;
  section: string;
  subject?: string;
  knowledge_points?: string[];
  questions: CozeQuestionResult[];
}

export interface CozeAnalysisItem {
  id?: string;
  section?: string;
  question?: string;
  answer?: string;
  is_question?: boolean;
  is_correct?: boolean;
  correct_answer?: string;
  comment?: string;
  subject?: string;
  knowledge_points?: string[];
  isSuccess?: boolean;
  output?: CozeOutputSection[];
}
