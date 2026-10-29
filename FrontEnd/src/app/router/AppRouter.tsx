import { Route, Routes } from 'react-router-dom';
import { AdminLayout } from '../../layouts/AdminLayout';
import { AuthLayout } from '../../layouts/AuthLayout';
import { StorefrontLayout } from '../../layouts/StorefrontLayout';
import { NotFoundPage } from '../../pages/NotFoundPage';
import { PlaceholderPage } from '../../pages/PlaceholderPage';
import { ProtectedRoute } from './ProtectedRoute';

export function AppRouter() {
  return (
    <Routes>
      <Route element={<StorefrontLayout />}>
        <Route index element={<PlaceholderPage />} />
        <Route path='search' element={<PlaceholderPage title='Search' />} />
      </Route>
      <Route element={<AuthLayout />}>
        <Route
          path='auth/*'
          element={<PlaceholderPage title='Authentication' />}
        />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route
            path='admin'
            element={<PlaceholderPage title='Administration' />}
          />
        </Route>
      </Route>
      <Route path='*' element={<NotFoundPage />} />
    </Routes>
  );
}
