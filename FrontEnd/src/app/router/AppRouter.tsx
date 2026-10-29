import { Route, Routes } from 'react-router-dom';
import { AdminLayout } from '../../layouts/AdminLayout';
import { AuthLayout } from '../../layouts/AuthLayout';
import { StorefrontLayout } from '../../layouts/StorefrontLayout';
import { NotFoundPage } from '../../pages/NotFoundPage';
import { PlaceholderPage } from '../../pages/PlaceholderPage';
import { ProtectedRoute } from './ProtectedRoute';
import { OAuthCallbackPage } from '../../pages/auth/OAuthCallbackPage';
import { SignInPage } from '../../pages/auth/SignInPage';
import { SignUpPage } from '../../pages/auth/SignUpPage';
import { VerifyEmailPage } from '../../pages/auth/VerifyEmailPage';

export function AppRouter() {
  return (
    <Routes>
      <Route element={<StorefrontLayout />}>
        <Route index element={<PlaceholderPage />} />
        <Route path='search' element={<PlaceholderPage title='Search' />} />
      </Route>
      <Route element={<AuthLayout />}>
        <Route path='auth/sign-in' element={<SignInPage />} />
        <Route path='auth/sign-up' element={<SignUpPage />} />
        <Route path='auth/verify-email' element={<VerifyEmailPage />} />
        <Route path='auth/callback' element={<OAuthCallbackPage />} />
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
