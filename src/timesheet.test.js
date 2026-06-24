// Test automatici della logica del cartellino mensile.
// Eseguiti in CI e con `npm test` (fuso orario Europe/Rome impostato dallo
// script, così le attribuzioni per giorno sono deterministiche).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildEmployeeTimesheet,
  hoursToHM,
  hoursDecimal,
  timesheetToCsv,
  combinedTimesheetToCsv,
} from './timesheet.js'

const C = (iso, kind) => ({ employeeId: 'emp-1', kind, punchedAt: new Date(iso).toISOString() })

test('giorno con pausa: 9h30 lavorate → 8 ordinarie + 1h30 straordinarie', () => {
  const clk = [
    C('2026-06-02T08:00:00+02:00', 'in'), C('2026-06-02T12:00:00+02:00', 'out'),
    C('2026-06-02T13:00:00+02:00', 'in'), C('2026-06-02T18:30:00+02:00', 'out'),
  ]
  const { rows } = buildEmployeeTimesheet(clk, 2026, 5, 8)
  const r = rows.find((x) => x.date === '2026-06-02')
  assert.equal(hoursToHM(r.workedHours), '9:30')
  assert.equal(hoursToHM(r.ordinaryHours), '8:00')
  assert.equal(hoursToHM(r.overtimeHours), '1:30')
  assert.equal(r.firstIn, '08:00')
  assert.equal(r.lastOut, '18:30')
})

test('straordinario non arrotondato (1h30 resta 1h30)', () => {
  const clk = [C('2026-06-03T08:00:00+02:00', 'in'), C('2026-06-03T17:25:00+02:00', 'out')]
  const { rows } = buildEmployeeTimesheet(clk, 2026, 5, 8)
  const r = rows.find((x) => x.date === '2026-06-03')
  // 9h25 lavorate → 1h25 di straordinario, esatto.
  assert.equal(hoursToHM(r.overtimeHours), '1:25')
})

test('turno a cavallo della mezzanotte ripartito sui due giorni', () => {
  const clk = [C('2026-06-05T22:00:00+02:00', 'in'), C('2026-06-06T02:00:00+02:00', 'out')]
  const { rows } = buildEmployeeTimesheet(clk, 2026, 5, 8)
  assert.equal(rows.find((x) => x.date === '2026-06-05').workedHours, 2)
  assert.equal(rows.find((x) => x.date === '2026-06-06').workedHours, 2)
})

test('entrata senza uscita: 0 ore e anomalia segnalata', () => {
  const clk = [C('2026-06-10T09:00:00+02:00', 'in')]
  const { rows } = buildEmployeeTimesheet(clk, 2026, 5, 8)
  const r = rows.find((x) => x.date === '2026-06-10')
  assert.equal(r.workedHours, 0)
  assert.ok(r.notes.includes('ancora in servizio'))
})

test('numero di righe = giorni del mese e totali coerenti', () => {
  const clk = [C('2026-06-02T08:00:00+02:00', 'in'), C('2026-06-02T18:30:00+02:00', 'out')]
  const { rows, totals } = buildEmployeeTimesheet(clk, 2026, 5, 8)
  assert.equal(rows.length, 30) // giugno
  assert.equal(hoursToHM(totals.worked), '10:30')
  assert.equal(hoursToHM(totals.ordinary), '8:00')
  assert.equal(hoursToHM(totals.overtime), '2:30')
})

test('soglia personalizzata (6 ore) sposta il confine ordinario/straordinario', () => {
  const clk = [C('2026-06-02T08:00:00+02:00', 'in'), C('2026-06-02T15:00:00+02:00', 'out')]
  const { rows } = buildEmployeeTimesheet(clk, 2026, 5, 6)
  const r = rows.find((x) => x.date === '2026-06-02')
  assert.equal(hoursToHM(r.ordinaryHours), '6:00')
  assert.equal(hoursToHM(r.overtimeHours), '1:00')
})

test('formattazione ore: HH:MM e decimale con virgola', () => {
  assert.equal(hoursToHM(1.5), '1:30')
  assert.equal(hoursToHM(8), '8:00')
  assert.equal(hoursToHM(0), '0:00')
  assert.equal(hoursDecimal(1.5), '1,50')
  assert.equal(hoursDecimal(0), '0,00')
})

test('CSV singolo: intestazione, riga giornaliera e totali', () => {
  const clk = [C('2026-06-02T08:00:00+02:00', 'in'), C('2026-06-02T18:30:00+02:00', 'out')]
  const ts = buildEmployeeTimesheet(clk, 2026, 5, 8)
  const csv = timesheetToCsv(ts, { employeeName: 'Giulia Rossi', monthLabel: 'Giugno 2026', thresholdHours: 8 })
  assert.ok(csv.includes('Ore straordinarie'))
  assert.ok(csv.includes('Giulia Rossi'))
  assert.ok(csv.includes('2026-06-02'))
  assert.ok(csv.includes('Totali'))
})

test('CSV combinato: colonna dipendente e totale generale', () => {
  const clk = [C('2026-06-02T08:00:00+02:00', 'in'), C('2026-06-02T18:30:00+02:00', 'out')]
  const perEmployee = [
    { name: 'Giulia Rossi', timesheet: buildEmployeeTimesheet(clk, 2026, 5, 8) },
    { name: 'Antonio Russo', timesheet: buildEmployeeTimesheet([], 2026, 5, 8) },
  ]
  const csv = combinedTimesheetToCsv(perEmployee, { monthLabel: 'Giugno 2026', thresholdHours: 8 })
  assert.ok(csv.includes('Antonio Russo'))
  assert.ok(csv.includes('TOTALE GENERALE'))
})
