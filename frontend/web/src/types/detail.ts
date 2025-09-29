export type MasteryLevel = "strong" | "medium" | "weak" | "unknown";

export interface KnowledgePointTag {
  id: string;
  name: string;
  mastery?: MasteryLevel;
}

export interface MistakeDetailAnalysis {
  summary: string;
  highlights: string[];
  steps: string[];
  suggestions: string[];
}

export interface MistakeDetailMeta {
  subject?: string;
  difficulty?: string;
  grade?: string;
  section?: string;
  uploadTime?: string;
  source?: string;
}

export interface MistakeDetail {
  id: string;
  stem: string;
  studentAnswer?: string;
  correctAnswer?: string;
  isCorrect?: boolean;
  aiScore?: number;
  aiJudgement?: "correct" | "partial" | "incorrect";
  imageUrl?: string;
  tags: string[];
  errorReasons: string[];
  knowledgePoints: KnowledgePointTag[];
  analysis: MistakeDetailAnalysis;
  meta: MistakeDetailMeta;
}
