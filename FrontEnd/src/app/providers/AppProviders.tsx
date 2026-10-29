import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type PropsWithChildren } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from '../../components/ui/toaster';
import { AuthSessionInitializer } from '../../features/auth/AuthSessionInitializer';

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthSessionInitializer>{children}</AuthSessionInitializer>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
