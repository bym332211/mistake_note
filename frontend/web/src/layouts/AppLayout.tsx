import { useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Breadcrumbs } from "../components/navigation/Breadcrumbs";
import type { BreadcrumbItem } from "../components/navigation/Breadcrumbs";
import styles from "./AppLayout.module.css";

type RouteMeta = {
  title: string;
  subtitle?: string;
  breadcrumbs: BreadcrumbItem[];
};

type RouteMetaConfig = {
  pattern: RegExp;
  meta: RouteMeta;
};

const ROUTE_META: RouteMetaConfig[] = [
  {
    pattern: /^\/upload$/,
    meta: {
      title: "题目上传",
      subtitle: "通过上传清晰照片或扫描件，自动识别并生成错题解析。",
      breadcrumbs: [
        { label: "首页", path: "/upload" },
        { label: "题目上传" },
      ],
    },
  },
  {
    pattern: /^\/detail(?:\/.*)?$/,
    meta: {
      title: "错题详情",
      subtitle: "查看题干、AI 解析与知识点标签，准备后续练习。",
      breadcrumbs: [
        { label: "题目上传", path: "/upload" },
        { label: "错题详情" },
      ],
    },
  },
];

const DEFAULT_META: RouteMeta = {
  title: "mistake_note",
  subtitle: "同步错题、分析原因、生成练习，一站式完成。",
  breadcrumbs: [],
};

export const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const normalizedPath = location.pathname === "/" ? "/upload" : location.pathname;
  const matched = ROUTE_META.find((entry) => entry.pattern.test(normalizedPath));
  const routeMeta = matched?.meta ?? DEFAULT_META;

  const breadcrumbItems = useMemo(() => routeMeta.breadcrumbs, [routeMeta]);

  const canGoBack = useMemo(() => {
    if (normalizedPath === "/upload") {
      return false;
    }
    if (typeof window === "undefined") {
      return false;
    }
    return window.history.length > 1;
  }, [normalizedPath]);

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => navigate(-1)}
          disabled={!canGoBack}
          aria-disabled={!canGoBack}
        >
          <span aria-hidden="true">←</span>
          <span className={styles.backText}>返回</span>
        </button>
        <div className={styles.heading}>
          <h1>{routeMeta.title}</h1>
          {routeMeta.subtitle && <p>{routeMeta.subtitle}</p>}
        </div>
        <div className={styles.headerPlaceholder} aria-hidden="true" />
      </header>
      <div className={styles.breadcrumbWrapper}>
        <Breadcrumbs items={breadcrumbItems} />
      </div>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
};
