import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeSearchText(value: string | null | undefined): string {
  return (value ?? "").toLowerCase()
}

export function matchesSearch(
  value: string | null | undefined,
  query: string
): boolean {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return true
  return normalizeSearchText(value).includes(normalizedQuery)
}

export function matchesAnySearch(
  values: Array<string | null | undefined>,
  query: string
): boolean {
  return values.some((value) => matchesSearch(value, query))
}
