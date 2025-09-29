import type { KeyboardEvent } from "react";
import clsx from "clsx";
import type { CozeOutputSection, CozeQuestionResult } from "../../types/upload";
import styles from "./AnalysisViewer.module.css";

export interface AnalysisQuestionSelectEvent {
  section: CozeOutputSection;
  sectionIndex: number;
  question: CozeQuestionResult;
  questionIndex: number;
}

interface AnalysisViewerProps {
  sections: CozeOutputSection[];
  onSelectQuestion?: (payload: AnalysisQuestionSelectEvent) => void;
}

const getQuestionStatus = (question: CozeQuestionResult) => {
  if (typeof question.is_correct === "boolean") {
    return question.is_correct ? "correct" : "incorrect";
  }
  if (question.answer && question.correct_answer) {
    return question.answer.trim() === question.correct_answer.trim() ? "correct" : "incorrect";
  }
  return "unknown";
};

const statusLabel: Record<ReturnType<typeof getQuestionStatus>, string> = {
  correct: "正确",
  incorrect: "待纠正",
  unknown: "待评估",
};

export const AnalysisViewer = ({ sections, onSelectQuestion }: AnalysisViewerProps) => {
  if (!sections.length) {
    return null;
  }

  const allQuestions = sections.flatMap((section) => section.questions);
  const summary = allQuestions.reduce(
    (acc, question) => {
      const status = getQuestionStatus(question);
      acc.total += 1;
      if (status === "correct") {
        acc.correct += 1;
      } else if (status === "incorrect") {
        acc.incorrect += 1;
      } else {
        acc.unknown += 1;
      }
      return acc;
    },
    { total: 0, correct: 0, incorrect: 0, unknown: 0 },
  );

  const isInteractive = Boolean(onSelectQuestion);

  const handleKeyActivate = (
    event: KeyboardEvent<HTMLLIElement>,
    payload: AnalysisQuestionSelectEvent,
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelectQuestion?.(payload);
    }
  };

  const handleClick = (payload: AnalysisQuestionSelectEvent) => {
    onSelectQuestion?.(payload);
  };

  return (
    <section className={styles.viewer}>
      <header className={styles.summary}>
        <div>
          <p className={styles.summaryTitle}>AI 解析概览</p>
          <p className={styles.summarySubtitle}>共 {summary.total} 道题，准确 {summary.correct}，待纠错 {summary.incorrect}。</p>
        </div>
        <div className={styles.summaryBadges}>
          <span className={clsx(styles.summaryBadge, styles.summaryBadgeCorrect)}>正确 {summary.correct}</span>
          <span className={clsx(styles.summaryBadge, styles.summaryBadgeIncorrect)}>待纠错 {summary.incorrect}</span>
          {summary.unknown > 0 && (
            <span className={clsx(styles.summaryBadge, styles.summaryBadgeUnknown)}>待评估 {summary.unknown}</span>
          )}
        </div>
      </header>

      <div className={styles.sections}>
        {sections.map((section, sectionIndex) => (
          <article key={`${section.section}-${section.id ?? "anon"}`} className={styles.sectionCard}>
            <header className={styles.sectionHeader}>
              <h3>{section.section}</h3>
              <span className={styles.sectionBadge}>{section.questions.length} 题</span>
            </header>

            <ol className={styles.questionList}>
              {section.questions.map((question, questionIndex) => {
                const status = getQuestionStatus(question);
                const payload: AnalysisQuestionSelectEvent = {
                  section,
                  sectionIndex,
                  question,
                  questionIndex,
                };
                const itemClassName = clsx(
                  styles.questionItem,
                  isInteractive && styles.questionItemInteractive,
                );

                return (
                  <li
                    key={`${question.id ?? question.question}-${questionIndex}`}
                    className={itemClassName}
                    role={isInteractive ? "button" : undefined}
                    tabIndex={isInteractive ? 0 : undefined}
                    onClick={isInteractive ? () => handleClick(payload) : undefined}
                    onKeyDown={isInteractive ? (event) => handleKeyActivate(event, payload) : undefined}
                    aria-label={isInteractive ? `查看错题详情：${question.question}` : undefined}
                  >
                    <div className={styles.questionHeader}>
                      <span className={clsx(styles.statusDot, styles[`statusDot_${status}`])} aria-hidden="true" />
                      <p className={styles.questionText}>{question.question}</p>
                      <span className={clsx(styles.statusBadge, styles[`statusBadge_${status}`])}>{statusLabel[status]}</span>
                    </div>

                    <div className={styles.answerGrid}>
                      {question.answer && (
                        <div>
                          <p className={styles.answerLabel}>学生作答</p>
                          <p className={styles.answerValue}>{question.answer}</p>
                        </div>
                      )}
                      {question.correct_answer && (
                        <div>
                          <p className={styles.answerLabel}>正确答案</p>
                          <p className={styles.answerValue}>{question.correct_answer}</p>
                        </div>
                      )}
                    </div>

                    {question.comment && <p className={styles.comment}>{question.comment}</p>}
                  </li>
                );
              })}
            </ol>
          </article>
        ))}
      </div>
    </section>
  );
};

