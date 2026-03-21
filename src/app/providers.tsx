"use client"

import { type ReactNode } from "react"
import { Provider as JotaiProvider } from "jotai"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
})

interface ProvidersProps {
  readonly children: ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <JotaiProvider>{children}</JotaiProvider>
    </QueryClientProvider>
  )
}
