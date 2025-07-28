"use client"

import { useCacheCleaner } from '@/hooks/use-cache-cleaner';

export function CacheCleaner() {
  useCacheCleaner();
  return null; // Este componente no renderiza nada
} 