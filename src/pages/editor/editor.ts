/**
 * @title pages/editor/editor.ts
 * @descrption Server-side editor module that renders editor HTML and exposes load/save endpoints backed by data/base.xml.
 */
import type { Context } from 'hono'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { editorDataToXml, editorXmlToData, type EditorData } from '../../core/editor-data.js'
import { embed, transform } from '../../core/transform.js'

const isDev = fileURLToPath(import.meta.url).includes('/src/')
const BASE_DIR = join(process.cwd(), isDev ? 'src' : 'dist')
const DATA_PATH = join(process.cwd(), 'data/base.xml')

const editorPath = (file: string) => join(BASE_DIR, 'pages/editor', file)

export const loadEditorData = async () => {
  const xml = await readFile(DATA_PATH, 'utf-8')
  return editorXmlToData(xml)
}

export const saveEditorData = async (data: EditorData) => {
  const xml = editorDataToXml(data)
  await mkdir(join(process.cwd(), 'data'), { recursive: true })
  await writeFile(DATA_PATH, `${xml}\n`, 'utf-8')
}

const renderEditorPage = async () => {
  const [layout, sidebarHtml, editorHtml] = await Promise.all([
    readFile(editorPath('page.html'), 'utf-8'),
    transform(DATA_PATH, editorPath('components/sidebar.xsl')),
    transform(DATA_PATH, editorPath('components/editor.xsl'))
  ])

  return embed(embed(layout, 'sidebar', sidebarHtml), 'editor', editorHtml)
}

export async function editorEndpoint(c: Context) {
  return c.html(await renderEditorPage())
}

export async function editorDataEndpoint(c: Context) {
  try {
    return c.json(await loadEditorData())
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load editor data'
    return c.json({ ok: false, error: message }, 500)
  }
}

export async function editorSaveEndpoint(c: Context) {
  try {
    const payload = await c.req.json<EditorData>()
    if (!payload || typeof payload !== 'object') {
      return c.json({ ok: false, error: 'Invalid payload' }, 400)
    }
    await saveEditorData(payload)
    return c.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save editor data'
    return c.json({ ok: false, error: message }, 500)
  }
}
