import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { addDays, format as formatDate, isSameDay, type Locale } from 'date-fns'
import { enGB } from 'date-fns/locale/en-GB'
import { pl as plLocale } from 'date-fns/locale/pl'
import { en, type Messages } from './en'
import { pl } from './pl'
import { HOUR, MINUTE, periodRange, type Period } from '../lib/time'
import type { Language } from '../types'

export type { Messages }

export const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'pl', label: 'Polski' },
]

const DICTIONARIES: Record<Language, Messages> = { en, pl }
// en-GB rather than en-US: 24-hour clock and "20 Oct" day-first dates, like Polish.
const DATE_LOCALES: Record<Language, Locale> = { en: enGB, pl: plLocale }

export interface I18n {
  lang: Language
  t: Messages
  /** date-fns `format` in the current language. */
  date: (value: number | Date, pattern: string) => string
  /** "1h 25m" / "1 h 25 min". */
  duration: (ms: number) => string
  /** Compact chart-axis label: "30m", "1.5h" / "30 min", "1,5 h". */
  axisDuration: (ms: number) => string
  number: (n: number) => string
  /** Upper-cases the first letter: Polish dates are lower-case ("wtorek") but headings shouldn't be. */
  cap: (text: string) => string
  periodLabel: (period: Period, anchor: Date) => string
}

export function createI18n(lang: Language): I18n {
  const t = DICTIONARIES[lang]
  const locale = DATE_LOCALES[lang]
  const numbers = new Intl.NumberFormat(lang, { maximumFractionDigits: 1 })
  const date = (value: number | Date, pattern: string) => formatDate(value, pattern, { locale })
  const cap = (text: string) => text.charAt(0).toLocaleUpperCase(lang) + text.slice(1)

  return {
    lang,
    t,
    date,
    duration: (ms) => {
      const totalMin = Math.floor(Math.max(0, ms) / MINUTE)
      return t.units.duration(Math.floor(totalMin / 60), totalMin % 60)
    },
    axisDuration: (ms) => {
      if (ms === 0) return '0'
      return ms < HOUR ? t.units.minutes(numbers.format(ms / MINUTE)) : t.units.hours(numbers.format(ms / HOUR))
    },
    number: (n) => numbers.format(n),
    cap,
    periodLabel: (period, anchor) => {
      const now = new Date()
      switch (period) {
        case 'day':
          if (isSameDay(anchor, now)) return t.common.today
          if (isSameDay(anchor, addDays(now, -1))) return t.common.yesterday
          return cap(date(anchor, 'EEE, d MMM yyyy'))
        case 'week': {
          const { start, end } = periodRange('week', anchor)
          return `${date(start, 'd MMM')} – ${date(end - 1, 'd MMM yyyy')}`
        }
        // LLLL is the standalone month name ("październik", not "października").
        case 'month': return cap(date(anchor, 'LLLL yyyy'))
        case 'year': return date(anchor, 'yyyy')
      }
    },
  }
}

const I18nContext = createContext<I18n>(createI18n('en'))

export function I18nProvider({ lang, children }: { lang: Language; children: ReactNode }) {
  const value = useMemo(() => createI18n(lang), [lang])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18n {
  return useContext(I18nContext)
}
