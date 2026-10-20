import { describe, expect, it } from 'vitest'
import { parseCsv, parseForestCsv, parseForestDate } from './forestCsv'

describe('parseCsv', () => {
  it('handles quotes, escaped quotes, commas and CRLF', () => {
    expect(parseCsv('a,b\r\n"x, y","say ""hi"""\r\n')).toEqual([['a', 'b'], ['x, y', 'say "hi"']])
  })

  it('skips blank lines and a BOM', () => {
    expect(parseCsv('﻿a\n\nb\n')).toEqual([['a'], ['b']])
  })
})

describe('parseForestDate', () => {
  it('parses "YYYY-MM-DD HH:mm:ss" as local time (Safari can’t)', () => {
    expect(parseForestDate('2023-03-05 15:04:05')).toBe(+new Date(2023, 2, 5, 15, 4, 5))
  })

  it('respects explicit offsets', () => {
    expect(parseForestDate('2023-03-05T15:00:00+01:00')).toBe(Date.UTC(2023, 2, 5, 14))
    expect(parseForestDate('Sun Mar 05 15:00:00 GMT+01:00 2023')).toBe(Date.UTC(2023, 2, 5, 14))
  })

  it('parses Java toString with a named zone as local time', () => {
    expect(parseForestDate('Sun Mar 05 15:00:00 CET 2023')).toBe(+new Date(2023, 2, 5, 15))
  })

  it('parses JS Date.toString output', () => {
    expect(parseForestDate('Sun Mar 05 2023 15:00:00 GMT+0100 (Central European Standard Time)')).toBe(Date.UTC(2023, 2, 5, 14))
  })

  it('parses slash and dot dates with AM/PM', () => {
    expect(parseForestDate('3/5/2023 3:00 PM', 'mdy')).toBe(+new Date(2023, 2, 5, 15))
    expect(parseForestDate('05/03/2023 15:00', 'dmy')).toBe(+new Date(2023, 2, 5, 15))
    expect(parseForestDate('05.03.2023 12:30 AM')).toBe(+new Date(2023, 2, 5, 0, 30))
  })

  it('returns NaN for garbage', () => {
    expect(parseForestDate('not a date')).toBeNaN()
  })
})

describe('parseForestCsv', () => {
  const csv = [
    'Start Time,End Time,Tag,Note,Tree Type,Is Success',
    '2023-03-05 15:00:00,2023-03-05 15:25:00,Study,"Ch. 1, part 2",Cedar,True',
    '2023-03-05 16:00:00,2023-03-05 16:10:00,,,,False',
    'garbage,2023-03-05 16:10:00,,,,True',
  ].join('\n')

  it('reads rows by header name', () => {
    const { rows, errors } = parseForestCsv(csv)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toEqual({
      start: +new Date(2023, 2, 5, 15),
      end: +new Date(2023, 2, 5, 15, 25),
      tag: 'Study',
      note: 'Ch. 1, part 2',
      treeType: 'Cedar',
      success: true,
    })
    expect(rows[1]).toMatchObject({ tag: null, success: false })
    expect(errors).toEqual([{ line: 4, reason: 'Unreadable date "garbage"' }])
  })

  it('detects day-first slash dates from the file', () => {
    const { rows } = parseForestCsv('start,end\n25/03/2023 10:00,25/03/2023 11:00\n01/04/2023 10:00,01/04/2023 10:30')
    expect(rows[1].start).toBe(+new Date(2023, 3, 1, 10))
  })

  it('accepts a duration column instead of an end time', () => {
    const { rows } = parseForestCsv('Start Time,Duration\n2023-03-05 15:00,45')
    expect(rows[0].end - rows[0].start).toBe(45 * 60_000)
  })

  it('reports a missing start column', () => {
    const { rows, errors } = parseForestCsv('foo,bar\n1,2')
    expect(rows).toEqual([])
    expect(errors[0].reason).toMatch(/start\/end/)
  })
})
