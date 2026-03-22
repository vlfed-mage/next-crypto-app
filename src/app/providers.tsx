'use client';

import { type ReactNode } from 'react';

import { QueryClient } from '@tanstack/react-query';
import { QueryClientAtomProvider } from 'jotai-tanstack-query/react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientAtomProvider client={queryClient}>
      {children}
    </QueryClientAtomProvider>
  );
}