'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { translations, type Language, type TranslationDict } from '@/lib/i18n/translations'

interface LanguageContextType {
  lang: Language
  t: TranslationDict
  setLang: (lang: Language) => void
  toggleLang: () => void
}

const LanguageContext = createContext<LanguageContextType | null>(null)

const STORAGE_KEY = 'scholars-tea-lang'

function getInitialLang(): Language {
  if (typeof window === 'undefined') return 'zh'
  const stored = localStorage.getItem(STORAGE_KEY) as Language | null
  if (stored === 'zh' || stored === 'en') return stored
  // Detect browser language
  const browserLang = navigator.language.toLowerCase()
  if (browserLang.startsWith('zh')) return 'zh'
  if (browserLang.startsWith('en')) return 'en'
  return 'zh'
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('zh')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setLangState(getInitialLang())
    setMounted(true)
  }, [])

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newLang)
    }
  }, [])

  const toggleLang = useCallback(() => {
    const newLang = lang === 'zh' ? 'en' : 'zh'
    setLang(newLang)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newLang)
    }
  }, [lang])

  const t = translations[lang]

  // Prevent hydration mismatch: render with default lang on server
  const displayLang = mounted ? lang : 'zh'
  const displayT = translations[displayLang]

  return (
    <LanguageContext.Provider value={{ lang: displayLang, t: displayT, setLang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return ctx
}
