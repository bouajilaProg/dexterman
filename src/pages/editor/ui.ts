/**
 * @title pages/editor/ui.ts
 * @descrption Browser-only editor bootstrap that wires UI interactions to save payload building and server save calls.
 */
import { attachEditor } from './components/ui/editor.js'
import { loadEditorData, saveEditorData } from './editor-client.js'
import type { EditorData, EditorField } from '../../core/editor-data.js'

let cachedData: EditorData | null = null

const init = async () => {
  try {
    cachedData = await loadEditorData()
  } catch {
    // Keep boot resilient even if initial load fails.
  }
}

const getTextValue = (selector: string, fallback = '') => {
  const input = document.querySelector(selector)
  if (!(input instanceof HTMLInputElement || input instanceof HTMLSelectElement)) return fallback
  return input.value.trim() || fallback
}

const collectFields = (tbodyId: string, includeRequired: boolean): EditorField[] => {
  const tbody = document.getElementById(tbodyId)
  if (!(tbody instanceof HTMLTableSectionElement)) return []

  return Array.from(tbody.querySelectorAll(':scope > tr'))
    .filter((row) => !row.hasAttribute('data-empty-row'))
    .map((row) => {
      const nameInput = row.querySelector('input')
      const typeSelect = row.querySelector('select')
      if (!(nameInput instanceof HTMLInputElement) || !(typeSelect instanceof HTMLSelectElement)) return null

      const name = nameInput.value.trim()
      if (!name) return null

      const field: EditorField = { name, type: typeSelect.value || 'string' }
      if (includeRequired) {
        const toggle = row.querySelector('[data-handler="toggle"]')
        field.required = toggle?.textContent?.trim() === 'YES'
      }
      return field
    })
    .filter((field): field is EditorField => field !== null)
}

const buildPayload = (): EditorData => {
  const base = cachedData ?? { env: { vars: [] }, groups: [] }
  const groups = (base.groups ?? []).map((g) => ({
    ...g,
    apis: (g.apis ?? []).map((a) => ({ ...a }))
  }))

  if (groups.length === 0) groups.push({ name: 'default', apis: [] })
  if (!groups[0].apis?.length) {
    groups[0].apis = [{ name: 'api', method: 'GET', path: '/', requestBody: [], responseBody: [] }]
  }

  const api = groups[0].apis![0]
  api.name = getTextValue('[data-editor-api-name]', api.name || 'api')
  api.method = getTextValue('[data-editor-api-method]', api.method || 'GET').toUpperCase()
  api.path = getTextValue('[data-editor-api-path]', api.path || '/')
  api.requestBody = collectFields('req-body', true)
  api.responseBody = collectFields('res-body', false)

  return { env: base.env, groups }
}

const saveCurrentEditor = async () => {
  const payload = buildPayload()
  await saveEditorData(payload)
  cachedData = payload
}

void init()
attachEditor({ onSave: saveCurrentEditor })
