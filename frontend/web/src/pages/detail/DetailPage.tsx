import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { fetchMistakeDetail, mockMistakeDetail } from "../../lib/detail";
import type { MistakeDetail } from "../../types/detail";
import styles from "./DetailPage.module.css";

const STATUS_COPY: Record<
  NonNullable<MistakeDetail["aiJudgement"]>,
  { label: string; tone: "positive" | "neutral" | "negative" }
> = {
  correct: { label: "AI 判定：正确", tone: "positive" },
  partial: { label: "AI 判定：部分正确", tone: "neutral" },
  incorrect: { label: "AI 判定：待纠正", tone: "negative" },
};

const KNOWLEDGE_MASTERY_COPY = {
  strong: "掌握良好",
  medium: "基本掌握",
  weak: "待加强",
  unknown: "待标注",
} as const;

type RouteParams = {
  id?: string;
};

type DetailRouteState = {
  detail?: MistakeDetail;
  fromUpload?: boolean;
} | null;

const ensureDetail = (detail?: MistakeDetail | null): MistakeDetail | null => {
  if (!detail) return null;
  return {
    ...detail,
    analysis: {
      summary: detail.analysis.summary,
      highlights: [...detail.analysis.highlights],
      steps: [...detail.analysis.steps],
      suggestions: [...detail.analysis.suggestions],
    },
    knowledgePoints: detail.knowledgePoints.map((kp) => ({ ...kp })),
    tags: [...detail.tags],
    errorReasons: [...detail.errorReasons],
    meta: { ...detail.meta },
  };
};

/** ============== 新增：过滤规则（避免题干重复/过长） ============== */
const MAX_KP_LEN = 20;   // 单个知识点名最长展示
const MAX_TAG_LEN = 16;  // 单个标签名最长展示

const isLikeStem = (text: string, stem: string) => {
  if (!text || !stem) return false;
  const a = text.replace(/\s+/g, "");
  const b = stem.replace(/\s+/g, "");
  // 完全相同，或明显过长（大概率是把题干当标签/知识点了）
  return a === b || text.length > Math.max(MAX_KP_LEN * 2, Math.floor(stem.length * 0.8));
};
/** ============================================================ */

export const DetailPage = () => {
  const params = useParams<RouteParams>();
  const location = useLocation();
  const routeState = location.state as DetailRouteState;
  const seedDetail = routeState?.detail ? ensureDetail(routeState.detail) : null;
  const detailId = params.id ?? routeState?.detail?.id ?? mockMistakeDetail.id;

  const [detail, setDetail] = useState<MistakeDetail | null>(seedDetail);
  const [loading, setLoading] = useState<boolean>(!seedDetail);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (routeState?.detail) {
      setDetail(ensureDetail(routeState.detail));
      setLoading(false);
      setError(null);
    }
  }, [routeState?.detail]);

  useEffect(() => {
    let active = true;

    if (!detailId || routeState?.detail) {
      return () => {
        active = false;
      };
    }

    setLoading(true);
    setError(null);

    fetchMistakeDetail(detailId)
      .then((data) => {
        if (!active) return;
        setDetail(ensureDetail(data));
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "加载错题详情失败");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [detailId, routeState?.detail]);

  const statusInfo = useMemo(() => {
    if (!detail?.aiJudgement) return null;
    return STATUS_COPY[detail.aiJudgement];
  }, [detail?.aiJudgement]);

  /** ========== 新增：清洗后的知识点/标签，避免题干重复 ========== */
  const knowledgePointsClean = useMemo(() => {
    if (!detail) return [];
    return detail.knowledgePoints
      .filter((kp) => kp.name && !isLikeStem(kp.name, detail.stem))
      .map((kp) => ({ ...kp, name: kp.name.slice(0, MAX_KP_LEN) }));
  }, [detail]);

  const tagsClean = useMemo(() => {
    if (!detail) return [];
    return detail.tags
      .filter((tag) => tag && !isLikeStem(tag, detail.stem))
      .map((tag) => tag.slice(0, MAX_TAG_LEN));
  }, [detail]);
  /** ========================================================== */

  if (loading && !detail) {
    return <div className={styles.stateBox}>正在加载错题详情…</div>;
  }

  if (error) {
    return <div className={clsx(styles.stateBox, styles.stateError)}>加载失败：{error}</div>;
  }

  if (!detail) {
    return <div className={styles.stateBox}>暂无详情数据。</div>;
  }

  const hasErrorReasons = detail.errorReasons.length > 0;

  return (
    <section className={styles.page}>
      {/* 摘要卡片 */}
      <article className={styles.summaryCard}>
        <header className={styles.summaryHeader}>
          <div className={styles.summaryHeaderRight}>
            {detail.aiScore !== undefined && (
              <span className={styles.scoreBadge}>AI 评分 · {detail.aiScore}</span>
            )}
            {statusInfo && (
              <span
                className={clsx(
                  styles.statusBadge,
                  statusInfo.tone === "positive"
                    ? styles.statusBadgePositive
                    : statusInfo.tone === "neutral"
                    ? styles.statusBadgeNeutral
                    : styles.statusBadgeNegative
                )}
              >
                {statusInfo.label}
              </span>
            )}
          </div>
        </header>

        {/* 题干标题 */}
        <h2 className={styles.questionTitle}>{detail.stem}</h2>

        {/* 知识点掌握：标题 + 图例 */}
        <div className={styles.subSectionRow}>
          <h4 className={styles.subSectionTitle}>知识点掌握</h4>
          <ul className={styles.legend}>
            <li><span className={clsx(styles.dot, styles.dotStrong)} />掌握良好</li>
            <li><span className={clsx(styles.dot, styles.dotMedium)} />基本掌握</li>
            <li><span className={clsx(styles.dot, styles.dotWeak)} />待加强</li>
            <li><span className={clsx(styles.dot, styles.dotUnknown)} />待标注</li>
          </ul>
        </div>

        {/* 知识点 chips（已清洗，不再显示题干） */}
        {knowledgePointsClean.length > 0 ? (
          <div className={styles.knowledgeChips}>
            {knowledgePointsClean.map((kp) => (
              <span
                key={kp.id}
                className={clsx(
                  styles.knowledgeChip,
                  kp.mastery ? styles[`knowledgeChip_${kp.mastery}`] : styles.knowledgeChip_unknown
                )}
                title={`掌握程度：${kp.mastery ? KNOWLEDGE_MASTERY_COPY[kp.mastery] : "待标注"}`}
                aria-label={`知识点：${kp.name}，掌握程度：${
                  kp.mastery ? KNOWLEDGE_MASTERY_COPY[kp.mastery] : "待标注"
                }`}
              >
                <span className={styles.knowledgeChipDot} aria-hidden="true" />
                <span className={styles.knowledgeChipName}>{kp.name}</span>
                {kp.mastery && (
                  <span className={styles.knowledgeChipMeta}>
                    {KNOWLEDGE_MASTERY_COPY[kp.mastery]}
                  </span>
                )}
              </span>
            ))}
          </div>
        ) : (
          <p className={styles.emptyPlaceholder}>未标注知识点。</p>
        )}

        {/* 标签 */}
        {tagsClean.length > 0 && (
          <>
            <h4 className={styles.subSectionTitle}>标签</h4>
            <div className={styles.tagPills}>
              {tagsClean.map((tag) => (
                <span
                  key={tag}
                  className={styles.tagPill}
                  title="用于检索与归档"
                  aria-label={`标签：${tag}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </>
        )}
      </article>

      {/* 内容区：两列网格 */}
      <div className={styles.contentGrid}>
        {/* 左卡：答案对比 */}
        <article className={styles.card}>
          <header className={styles.cardHeader}>
            <h3>答案对比</h3>
          </header>
          <div className={styles.answerGrid}>
            <div className={styles.answerBlock}>
              <p className={styles.answerLabel}>学生作答</p>
              <p className={styles.answerValue}>{detail.studentAnswer ?? "未作答"}</p>
            </div>
            <div className={styles.answerBlock}>
              <p className={styles.answerLabel}>标准答案</p>
              <p className={styles.answerValue}>{detail.correctAnswer ?? "待补充"}</p>
            </div>
          </div>
          {hasErrorReasons && (
            <div className={styles.reasonBox}>
              <p className={styles.reasonTitle}>错误原因</p>
              <ul className={styles.reasonList}>
                {detail.errorReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
          )}
        </article>

        {/* 右卡：AI 解析 */}
        <article className={styles.card}>
          <header className={styles.cardHeader}>
            <h3>AI 解析</h3>
          </header>
          <p className={styles.analysisSummary}>{detail.analysis.summary}</p>

          {detail.analysis.highlights.length > 0 && (
            <section className={styles.analysisSection}>
              <h4 className={styles.analysisHeading}>重点提醒</h4>
              <ul className={styles.analysisList}>
                {detail.analysis.highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          )}

          {detail.analysis.steps.length > 0 && (
            <section className={styles.analysisSection}>
              <h4 className={styles.analysisHeading}>标准解题步骤</h4>
              <ol className={clsx(styles.analysisList, styles.analysisListOrdered)}>
                {detail.analysis.steps.map((item, index) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ol>
            </section>
          )}

          {detail.analysis.suggestions.length > 0 && (
            <section className={styles.analysisSection}>
              <h4 className={styles.analysisHeading}>巩固建议</h4>
              <ul className={styles.analysisList}>
                {detail.analysis.suggestions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          )}
        </article>
      </div>
    </section>
  );  
};
