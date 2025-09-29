

export interface QuestionOption {
  label: string;
  value: string;
  correct: boolean;
}

export interface SimilarQuestion {
  id: number;
  type: 'multiple-choice' | 'fill-blank';
  question: string;
  options?: QuestionOption[];
  correctAnswer: string;
  explanation: string;
}

