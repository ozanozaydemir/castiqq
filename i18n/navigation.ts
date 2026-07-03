import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

// Locale-aware versions of Next.js navigation APIs.
// Agents use these instead of next/navigation in Phase 2.
export const { Link, redirect, useRouter, usePathname, getPathname } =
  createNavigation(routing)
