/**
 * @title pages/editor/editor-client.ts
 * @descrption Browser client helpers for loading and saving editor data through server endpoints.
 */
import type { EditorData } from './lib/editor-data.js'

export const loadEditorData = async (): Promise<EditorData> => {
  const response = await fetch('/editor/data', { method: 'GET', cache: 'no-store' })
  if (!response.ok) throw new Error(`Unable to load editor data (${response.status})`)
  return response.json() as Promise<EditorData>
}

export const saveEditorData = async (data: EditorData) => {
  const response = await fetch('/editor/save', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string }
    throw new Error(body.error ?? `Failed to save (${response.status})`)
  }
}
