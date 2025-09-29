import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';

import P_home from '../pages/p-home';
import P_upload from '../pages/p-upload';
import P_error_book from '../pages/p-error_book';
import P_error_detail from '../pages/p-error_detail';
import P_similar_practice from '../pages/p-similar_practice';
import NotFoundPage from './NotFoundPage';
import ErrorPage from './ErrorPage';

function Listener() {
  const location = useLocation();
  useEffect(() => {
    const pageId = 'P-' + location.pathname.replace('/', '').toUpperCase();
    console.log('当前pageId:', pageId, ', pathname:', location.pathname, ', search:', location.search);
    if (typeof window === 'object' && window.parent && window.parent.postMessage) {
      window.parent.postMessage({
        type: 'chux-path-change',
        pageId: pageId,
        pathname: location.pathname,
        search: location.search,
      }, '*');
    }
  }, [location]);

  return <Outlet />;
}

// 使用 createBrowserRouter 创建路由实例
const router = createBrowserRouter([
  {
    path: '/',
    element: <Listener />,
    children: [
      {
    path: '/',
    element: <Navigate to='/home' replace={true} />,
  },
      {
    path: '/home',
    element: (
      <ErrorBoundary>
        <P_home />
      </ErrorBoundary>
    ),
    errorElement: <ErrorPage />,
  },
      {
    path: '/upload',
    element: (
      <ErrorBoundary>
        <P_upload />
      </ErrorBoundary>
    ),
    errorElement: <ErrorPage />,
  },
      {
    path: '/error-book',
    element: (
      <ErrorBoundary>
        <P_error_book />
      </ErrorBoundary>
    ),
    errorElement: <ErrorPage />,
  },
      {
    path: '/error-detail',
    element: (
      <ErrorBoundary>
        <P_error_detail />
      </ErrorBoundary>
    ),
    errorElement: <ErrorPage />,
  },
      {
    path: '/similar-practice',
    element: (
      <ErrorBoundary>
        <P_similar_practice />
      </ErrorBoundary>
    ),
    errorElement: <ErrorPage />,
  },
      {
    path: '*',
    element: <NotFoundPage />,
  },
    ]
  }
]);

export default router;