'use client'

import { createContext, useContext } from 'react'

const OrgContext = createContext<string>('')

export const OrgProvider = OrgContext.Provider

export function useOrgId() {
  return useContext(OrgContext)
}
