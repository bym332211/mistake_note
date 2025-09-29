import { Navigate, useRoutes } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { DetailPage } from './pages/detail/DetailPage';
import { UploadPage } from './pages/upload/UploadPage';

export default function App() {
  return useRoutes([
    {
      path: '/',
      element: <AppLayout />,
      children: [
        { index: true, element: <UploadPage /> },
        { path: 'upload', element: <UploadPage /> },
        { path: 'detail', element: <DetailPage /> },
        { path: 'detail/:id', element: <DetailPage /> },
      ],
    },
    { path: '*', element: <Navigate to="/upload" replace /> },
  ]);
}
