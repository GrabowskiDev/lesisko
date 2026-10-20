// Parser for the CSV that the Forest app exports (Settings → Export data).
// The exact format has varied between Forest versions and platforms, so columns are
// found by header name and dates are parsed leniently.

export interface ForestRow {
  start: number
  end: number
  tag: string | null
  note: string | null
  treeType: string | null
  success: boolean
}

export interface ForestParseResult {
  rows: ForestRow[]
  errors: { line: number; reason: string }[]
}

/** Minimal RFC 4180 CSV parser: quoted fields, escaped quotes, CRLF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  const src = text.replace(/^﻿/, '')

  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"'
        i++
      } else if (c === '"') {
        quoted = false
      } else {
        field += c
      }
    } else if (c === '"') {
      quoted = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += c
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => r.some((f) => f.trim() !== ''))
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

function to24h(hour: number, ampm: string | undefined): number {
  if (!ampm) return hour
  const pm = ampm.toLowerCase() === 'pm'
  if (hour === 12) return pm ? 12 : 0
  return pm ? hour + 12 : hour
}

/** "+01:00", "+0100", "GMT+1" → offset in minutes, or null for named zones like "CET". */
function parseOffset(zone: string): number | null {
  const m = zone.match(/^(?:GMT|UTC)?([+-])(\d{1,2}):?(\d{2})?$/i)
  if (!m) return /^(?:GMT|UTC|Z)$/i.test(zone) ? 0 : null
  const mins = Number(m[2]) * 60 + Number(m[3] ?? 0)
  return m[1] === '-' ? -mins : mins
}

function build(y: number, mo: number, d: number, h: number, mi: number, s: number, offset: number | null): number {
  if (offset == null) return +new Date(y, mo, d, h, mi, s)
  return Date.UTC(y, mo, d, h, mi, s) - offset * 60_000
}

export type SlashOrder = 'dmy' | 'mdy'

/**
 * Parses the date formats Forest is known to emit, in local time unless the value
 * carries an explicit offset. Returns NaN when nothing matches.
 */
export function parseForestDate(raw: string, slashOrder: SlashOrder = 'mdy'): number {
  const v = raw.trim()
  if (!v) return NaN

  // 2023-03-05 15:00(:00)(.000)( +01:00) — Safari can't Date.parse the space form.
  let m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?\s*(Z|[+-]\d{2}:?\d{2})?$/i)
  if (m) {
    return build(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] ?? 0), m[7] ? parseOffset(m[7]) : null)
  }

  // 05/03/2023 3:00 PM, 05.03.2023 15:00, 3/5/2023, 15:00
  m = v.match(/^(\d{1,2})([/.-])(\d{1,2})\2(\d{2,4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap]m)?$/i)
  if (m) {
    const a = +m[1]
    const b = +m[3]
    const dotted = m[2] === '.'
    const [d, mo] = dotted || slashOrder === 'dmy' ? [a, b] : [b, a]
    const y = m[4].length === 2 ? 2000 + +m[4] : +m[4]
    return build(y, mo - 1, d, to24h(+m[5], m[8]), +m[6], +(m[7] ?? 0), null)
  }

  // Java Date.toString(): "Sun Mar 05 15:00:00 GMT+01:00 2023" / "Sun Mar 05 15:00:00 CET 2023"
  m = v.match(/^\w{3},?\s+(\w{3})\s+(\d{1,2})\s+(\d{1,2}):(\d{2}):(\d{2})\s+(\S+)\s+(\d{4})$/)
  if (m) {
    const mo = MONTHS.indexOf(m[1].toLowerCase())
    if (mo >= 0) return build(+m[7], mo, +m[2], +m[3], +m[4], +m[5], parseOffset(m[6]))
  }

  // Everything else: ISO 8601, JS Date.toString(), RFC 2822 …
  return Date.parse(v)
}

const norm = (h: string) => h.toLowerCase().replace(/[^a-z]/g, '')

function findColumn(header: string[], names: string[]): number {
  const normalized = header.map(norm)
  for (const name of names) {
    const i = normalized.indexOf(name)
    if (i >= 0) return i
  }
  return -1
}

function parseSuccess(raw: string | undefined): boolean {
  if (raw == null || raw.trim() === '') return true
  return !/^(false|0|no|n|fail(ed|ure)?|withered|dead|killed)$/i.test(raw.trim())
}

/** Decide day/month order for slash dates by looking for a first component above 12. */
function detectSlashOrder(values: string[]): SlashOrder {
  for (const v of values) {
    const m = v.trim().match(/^(\d{1,2})\/(\d{1,2})\//)
    if (!m) continue
    if (+m[1] > 12) return 'dmy'
    if (+m[2] > 12) return 'mdy'
  }
  return 'mdy'
}

export function parseForestCsv(text: string): ForestParseResult {
  const table = parseCsv(text)
  const errors: ForestParseResult['errors'] = []
  if (table.length === 0) return { rows: [], errors: [{ line: 1, reason: 'The file is empty.' }] }

  const header = table[0]
  const col = {
    start: findColumn(header, ['starttime', 'start', 'startdate', 'begin', 'from']),
    end: findColumn(header, ['endtime', 'end', 'enddate', 'finish', 'to']),
    duration: findColumn(header, ['duration', 'durationminutes', 'minutes', 'length']),
    tag: findColumn(header, ['tag', 'tags', 'label', 'category']),
    note: findColumn(header, ['note', 'notes', 'comment', 'description']),
    tree: findColumn(header, ['treetype', 'tree', 'species', 'treespecies']),
    success: findColumn(header, ['issuccess', 'success', 'succeeded', 'status', 'result']),
  }
  if (col.start < 0 || (col.end < 0 && col.duration < 0)) {
    return {
      rows: [],
      errors: [{ line: 1, reason: `Couldn't find start/end columns. Header was: ${header.join(', ')}` }],
    }
  }

  const body = table.slice(1)
  const order = detectSlashOrder(body.flatMap((r) => [r[col.start] ?? '', r[col.end] ?? '']))
  const rows: ForestRow[] = []
  const cell = (r: string[], i: number) => (i >= 0 ? (r[i] ?? '').trim() : '')

  body.forEach((r, i) => {
    const line = i + 2
    const start = parseForestDate(cell(r, col.start), order)
    let end = col.end >= 0 ? parseForestDate(cell(r, col.end), order) : NaN
    if (Number.isNaN(end) && col.duration >= 0) {
      const minutes = Number(cell(r, col.duration))
      if (Number.isFinite(minutes)) end = start + minutes * 60_000
    }
    if (Number.isNaN(start) || Number.isNaN(end)) {
      errors.push({ line, reason: `Unreadable date "${cell(r, col.start)}"` })
      return
    }
    if (end <= start) {
      errors.push({ line, reason: 'End time is not after start time' })
      return
    }
    rows.push({
      start,
      end,
      tag: cell(r, col.tag) || null,
      note: cell(r, col.note) || null,
      treeType: cell(r, col.tree) || null,
      success: parseSuccess(col.success >= 0 ? r[col.success] : undefined),
    })
  })

  return { rows, errors }
}
