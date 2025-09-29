import type {
  KnowledgePointTag,
  MasteryLevel,
  MistakeDetail,
  MistakeDetailAnalysis,
} from "../types/detail";
import { apiClient } from "./apiClient";

type AnyRecord = Record<string, unknown>;

const createDefaultDetail = (): MistakeDetail => ({
  id: "unknown",
  stem: "题干待补充",
  studentAnswer: undefined,
  correctAnswer: undefined,
  isCorrect: undefined,
  aiScore: undefined,
  aiJudgement: undefined,
  imageUrl: undefined,
  tags: [],
  errorReasons: [],
  knowledgePoints: [],
  analysis: {
    summary: "AI 解析待补充。",
    highlights: [],
    steps: [],
    suggestions: [],
  },
  meta: {},
});

const ensureString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const ensureOptionalString = (value: unknown): string | undefined => {
  const normalized = ensureString(value);
  return normalized ? normalized : undefined;
};

const ensureNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const ensureBoolean = (value: unknown): boolean | undefined =>
  typeof value === "boolean" ? value : undefined;

const toMasteryLevel = (value: unknown): MasteryLevel | undefined => {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return undefined;
    }
    if (["strong", "good", "掌握", "熟练", "high"].includes(normalized)) {
      return "strong";
    }
    if (["medium", "一般", "中等", "normal"].includes(normalized)) {
      return "medium";
    }
    if (["weak", "薄弱", "low", "待加强", "poor"].includes(normalized)) {
      return "weak";
    }
    if (["unknown", "未掌握", "未知"].includes(normalized)) {
      return "unknown";
    }
  }
  if (typeof value === "number") {
    if (value >= 80) {
      return "strong";
    }
    if (value >= 60) {
      return "medium";
    }
    if (value > 0) {
      return "weak";
    }
  }
  return undefined;
};

const toStringArray = (value: unknown): string[] => {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => {
        if (typeof item === "string") {
          const normalized = item.trim();
          return normalized ? [normalized] : [];
        }
        if (item && typeof item === "object") {
          const record = item as AnyRecord;
          const textCandidate =
            ensureString(record.text ?? record.title ?? record.label ?? record.content);
          return textCandidate ? [textCandidate] : [];
        }
        return [];
      })
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/\r?\n|[\u2022\u2023\u25E6\u2043\u2219]/g)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
};

const toJudgement = (value: unknown, fallback?: boolean): MistakeDetail["aiJudgement"] | undefined => {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return undefined;
    }
    if (["correct", "right", "pass", "优秀", "正确", "ok"].includes(normalized)) {
      return "correct";
    }
    if (["partial", "partially_correct", "半对", "部分正确", "partial_correct"].includes(normalized)) {
      return "partial";
    }
    if (["incorrect", "wrong", "fail", "错误", "不通过"].includes(normalized)) {
      return "incorrect";
    }
  }
  if (typeof value === "boolean") {
    return value ? "correct" : "incorrect";
  }
  if (typeof fallback === "boolean") {
    return fallback ? "correct" : "incorrect";
  }
  return undefined;
};

const toKnowledgePoints = (value: unknown): KnowledgePointTag[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item, index) => {
      if (typeof item === "string") {
        const name = item.trim();
        if (!name) {
          return null;
        }
        return {
          id: `kp-${index}`,
          name,
          mastery: undefined,
        } satisfies KnowledgePointTag;
      }
      if (item && typeof item === "object") {
        const record = item as AnyRecord;
        const name = ensureString(
          record.name ?? record.label ?? record.title ?? record.point ?? record.text,
        );
        if (!name) {
          return null;
        }
        const id = ensureString(record.id ?? record.code ?? record.slug);
        const mastery = toMasteryLevel(record.mastery ?? record.level ?? record.status);
        return {
          id: id || `kp-${index}`,
          name,
          mastery,
        } satisfies KnowledgePointTag;
      }
      return null;
    })
    .filter((entry): entry is KnowledgePointTag => Boolean(entry));
};

const buildAnalysis = (value: unknown): MistakeDetailAnalysis => {
  if (!value) {
    return {
      summary: "AI 解析待补充。",
      highlights: [],
      steps: [],
      suggestions: [],
    };
  }

  if (typeof value === "string") {
    const summary = ensureString(value) || "AI 解析待补充。";
    return {
      summary,
      highlights: [],
      steps: [],
      suggestions: [],
    };
  }

  if (typeof value !== "object") {
    return {
      summary: "AI 解析待补充。",
      highlights: [],
      steps: [],
      suggestions: [],
    };
  }

  const record = value as AnyRecord;
  const summary =
    ensureString(record.summary ?? record.overview ?? record.comment ?? record.analysis) ||
    "AI 解析待补充。";

  const highlightsSource = record.highlights ?? record.key_points ?? record.focus;
  const stepsSource = record.steps ?? record.solution ?? record.solution_hint ?? record.process;
  const suggestionsSource =
    record.suggestions ?? record.next_steps ?? record.improvement ?? record.recommendations;

  return {
    summary,
    highlights: toStringArray(highlightsSource),
    steps: toStringArray(stepsSource),
    suggestions: toStringArray(suggestionsSource),
  };
};

const cloneDetail = (detail: MistakeDetail): MistakeDetail => ({
  ...detail,
  tags: [...detail.tags],
  errorReasons: [...detail.errorReasons],
  knowledgePoints: detail.knowledgePoints.map((kp) => ({ ...kp })),
  analysis: {
    summary: detail.analysis.summary,
    highlights: [...detail.analysis.highlights],
    steps: [...detail.analysis.steps],
    suggestions: [...detail.analysis.suggestions],
  },
  meta: { ...detail.meta },
});

export const mockMistakeDetail: MistakeDetail = {
  id: "mock-detail",
  stem: "计算：1/2 + 1/3 = ?",
  studentAnswer: "1/5",
  correctAnswer: "5/6",
  isCorrect: false,
  aiScore: 40,
  aiJudgement: "incorrect",
  imageUrl: undefined,
  tags: ["基础运算", "易错题"],
  errorReasons: ["通分步骤错误", "忽略最小公倍数"],
  knowledgePoints: [
    { id: "kp-1", name: "分数加减", mastery: "weak" },
    { id: "kp-2", name: "最小公倍数", mastery: "medium" },
  ],
  analysis: {
    summary: "学生在通分步骤出现错误，导致最终结果偏差。",
    highlights: [
      "未求出 2 与 3 的最小公倍数",
      "通分后未正确相加分子",
    ],
    steps: [
      "确定 2 与 3 的最小公倍数为 6",
      "将 1/2 转换为 3/6，将 1/3 转换为 2/6",
      "相加得到 (3 + 2) / 6 = 5/6",
    ],
    suggestions: [
      "复习分数加减法的通分方法",
      "完成 3 道与分数通分相关的巩固练习",
    ],
  },
  meta: {
    subject: "数学",
    difficulty: "中等",
    section: "分数计算",
    uploadTime: new Date().toISOString(),
    source: "课堂测验",
  },
};

export const normalizeMistakeDetail = (payload: unknown): MistakeDetail => {
  const detail = createDefaultDetail();

  if (!payload || typeof payload !== "object") {
    return detail;
  }

  const record = payload as AnyRecord;
  const metaRecord =
    (record.meta && typeof record.meta === "object" ? (record.meta as AnyRecord) : {}) ?? {};

  const id = ensureString(record.id ?? record.mistake_id ?? record.file_id ?? metaRecord.id);
  const stem = ensureString(
    record.stem ?? record.question_text ?? record.question ?? metaRecord.question_text,
  );
  const studentAnswer = ensureOptionalString(
    record.student_answer ?? record.answer ?? metaRecord.student_answer,
  );
  const correctAnswer = ensureOptionalString(
    record.correct_answer ?? record.standard_answer ?? record.ai_answer ?? metaRecord.correct_answer,
  );
  const isCorrect = ensureBoolean(record.is_correct ?? record.correct ?? metaRecord.is_correct);
  const aiScore = ensureNumber(record.ai_score ?? record.score ?? metaRecord.ai_score);
  const aiJudgement = toJudgement(
    record.ai_judgement ?? record.judgement ?? record.ai_result ?? record.result ?? record.status,
    isCorrect,
  );
  const imageUrl = ensureOptionalString(
    record.image_url ?? record.preview_url ?? record.file_url ?? metaRecord.image_url,
  );

  const tags = toStringArray(record.tags ?? record.labels ?? metaRecord.tags);
  const errorReasons = toStringArray(
    record.error_reasons ?? record.error_reason ?? metaRecord.error_reasons,
  );
  const knowledgePoints = toKnowledgePoints(
    record.knowledge_points ?? record.knowledge_point ?? metaRecord.knowledge_points,
  );

  const analysisSource =
    record.analysis ?? record.ai_analysis ?? record.comment ?? record.ai_comment ?? metaRecord.analysis;
  const analysis = buildAnalysis(analysisSource);

  const subject = ensureOptionalString(record.subject ?? metaRecord.subject);
  const difficulty = ensureOptionalString(record.difficulty ?? metaRecord.difficulty);
  const grade = ensureOptionalString(record.grade ?? metaRecord.grade);
  const section = ensureOptionalString(record.section ?? record.chapter ?? metaRecord.section);
  const uploadTime = ensureOptionalString(
    record.upload_time ?? record.created_at ?? record.timestamp ?? metaRecord.upload_time,
  );
  const source = ensureOptionalString(record.source ?? record.origin ?? metaRecord.source);

  detail.id = id || detail.id;
  detail.stem = stem || detail.stem;
  detail.studentAnswer = studentAnswer;
  detail.correctAnswer = correctAnswer;
  detail.isCorrect = isCorrect;
  detail.aiScore = aiScore;
  detail.aiJudgement = aiJudgement;
  detail.imageUrl = imageUrl;
  detail.tags = tags;
  detail.errorReasons = errorReasons;
  detail.knowledgePoints = knowledgePoints;
  detail.analysis = analysis;
  detail.meta = {
    subject,
    difficulty,
    grade,
    section,
    uploadTime,
    source,
  };

  return detail;
};

export const fetchMistakeDetail = async (id: string): Promise<MistakeDetail> => {
  try {
    const response = await apiClient.get(`/mistakes/${id}`);
    const normalized = normalizeMistakeDetail(response.data);
    if (!normalized.id || normalized.id === "unknown") {
      normalized.id = id;
    }
    return normalized;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn(`[detail] 无法获取错题详情 ${id}，使用示例数据`, error);
    }
    const fallback = cloneDetail(mockMistakeDetail);
    fallback.id = id || fallback.id;
    return fallback;
  }
};
