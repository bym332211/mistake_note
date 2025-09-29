import type {
  CozeAnalysisItem,
  CozeOutputSection,
  CozeQuestionResult,
} from "../types/upload";

type AnyRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is AnyRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const coerceBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") {
      return true;
    }
    if (value.toLowerCase() === "false") {
      return false;
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
          const name =
            typeof record.name === "string"
              ? record.name.trim()
              : typeof record.label === "string"
              ? record.label.trim()
              : typeof record.title === "string"
              ? record.title.trim()
              : undefined;
          return name ? [name] : [];
        }
        return [];
      })
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[,;\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const toQuestion = (value: unknown): CozeQuestionResult | null => {
  if (!isRecord(value)) {
    return null;
  }

  const questionText = typeof value.question === "string" ? value.question.trim() : "";
  if (!questionText) {
    return null;
  }

  return {
    id: typeof value.id === "string" ? value.id : undefined,
    question: questionText,
    answer: typeof value.answer === "string" ? value.answer : undefined,
    correct_answer: typeof value.correct_answer === "string" ? value.correct_answer : undefined,
    is_correct: coerceBoolean(value.is_correct),
    comment: typeof value.comment === "string" ? value.comment : undefined,
  };
};

const toOutputSection = (value: unknown): CozeOutputSection | null => {
  if (!isRecord(value)) {
    return null;
  }

  const sectionTitle = typeof value.section === "string" ? value.section.trim() : "";
  if (!sectionTitle) {
    return null;
  }

  const questionsValue = Array.isArray(value.questions) ? value.questions : [];
  const questions = questionsValue
    .map(toQuestion)
    .filter((question): question is CozeQuestionResult => Boolean(question));

  if (!questions.length) {
    return null;
  }

  const knowledgePoints = toStringArray(value.knowledge_points ?? value.knowledgeTags ?? value.tags);
  const subject = typeof value.subject === "string" ? value.subject.trim() : undefined;

  return {
    id: typeof value.id === "string" ? value.id : undefined,
    section: sectionTitle,
    subject: subject || undefined,
    knowledge_points: knowledgePoints.length ? knowledgePoints : undefined,
    questions,
  };
};

const mergeSections = (
  target: CozeOutputSection[],
  incoming: CozeOutputSection,
  seenKeys: Map<string, CozeOutputSection>,
) => {
  const key = `${incoming.section}::${incoming.id ?? "_"}`;
  const existing = seenKeys.get(key);

  if (existing) {
    existing.questions.push(...incoming.questions);
    if (!existing.subject && incoming.subject) {
      existing.subject = incoming.subject;
    }
    if (!existing.knowledge_points?.length && incoming.knowledge_points?.length) {
      existing.knowledge_points = [...incoming.knowledge_points];
    }
    return;
  }

  target.push(incoming);
  seenKeys.set(key, incoming);
};

export type NormalizationResult = {
  sections: CozeOutputSection[];
  rawItems: CozeAnalysisItem[];
};

export const normalizeCozeAnalysis = (raw: unknown): NormalizationResult => {
  const sections: CozeOutputSection[] = [];
  const items: CozeAnalysisItem[] = [];
  const seenKeys = new Map<string, CozeOutputSection>();

  if (!Array.isArray(raw)) {
    return { sections, rawItems: items };
  }

  raw.forEach((entry) => {
    if (!isRecord(entry)) {
      return;
    }

    const item: CozeAnalysisItem = {
      id: typeof entry.id === "string" ? entry.id : undefined,
      section: typeof entry.section === "string" ? entry.section : undefined,
      question: typeof entry.question === "string" ? entry.question : undefined,
      answer: typeof entry.answer === "string" ? entry.answer : undefined,
      is_question: coerceBoolean(entry.is_question),
      is_correct: coerceBoolean(entry.is_correct),
      correct_answer: typeof entry.correct_answer === "string" ? entry.correct_answer : undefined,
      comment: typeof entry.comment === "string" ? entry.comment : undefined,
      subject: typeof entry.subject === "string" ? entry.subject.trim() : undefined,
      knowledge_points: toStringArray(entry.knowledge_points),
      isSuccess: coerceBoolean(entry.isSuccess),
      output: undefined,
    };

    const outputList = Array.isArray(entry.output)
      ? entry.output.map(toOutputSection).filter((section): section is CozeOutputSection => Boolean(section))
      : [];
    if (outputList.length) {
      item.output = outputList;
      outputList.forEach((output) => mergeSections(sections, output, seenKeys));
    } else {
      const fallbackQuestion = toQuestion(entry);
      if (fallbackQuestion) {
        const sectionTitle = item.section ?? "未分组结果";
        mergeSections(
          sections,
          {
            id: item.id,
            section: sectionTitle,
            subject: item.subject,
            knowledge_points: item.knowledge_points,
            questions: [fallbackQuestion],
          },
          seenKeys,
        );
      }
    }

    items.push(item);
  });

  return { sections, rawItems: items };
};
