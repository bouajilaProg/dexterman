/**
 * @title pages/editor/editor.ts
 * @descrption Server-side editor module that renders editor HTML and exposes load/save endpoints backed by data/base.xml.
 */
import type { Context } from 'hono'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { editorDataToXml, editorXmlToData, type EditorData } from './lib/editor-data.js'
import { embed, transformXmlWithPath } from './lib/transform.js'

const isDev = fileURLToPath(import.meta.url).includes('/src/')
const BASE_DIR = join(process.cwd(), isDev ? 'src' : 'dist')
const DATA_PATH = join(process.cwd(), 'data/base.xml')

const editorPath = (file: string) => join(BASE_DIR, 'pages/editor', file)

type EditorSelection = {
  folder?: string
  api?: string
  path?: string
}

const normalizeSelection = (selection: EditorSelection): EditorSelection => ({
  folder: selection.folder?.trim() || undefined,
  api: selection.api?.trim() || undefined,
  path: selection.path?.trim() || undefined
})

const reorderForSelection = (data: EditorData, rawSelection: EditorSelection): EditorData => {
  const selection = normalizeSelection(rawSelection)
  const folders = [...(data.folders ?? [])].map((folder) => ({
    ...folder,
    apis: [...(folder.apis ?? [])]
  }))

  if (folders.length === 0) {
    return { ...data, folders }
  }

  const findApiIndex = (apis: NonNullable<(typeof folders)[number]['apis']>) => {
    if (selection.api && selection.path) {
      const exact = apis.findIndex((api) => api.name === selection.api && api.path === selection.path)
      if (exact >= 0) return exact
    }
    if (selection.api) {
      const byName = apis.findIndex((api) => api.name === selection.api)
      if (byName >= 0) return byName
    }
    if (selection.path) {
      const byPath = apis.findIndex((api) => api.path === selection.path)
      if (byPath >= 0) return byPath
    }
    return -1
  }

  let targetFolderIndex = selection.folder
    ? folders.findIndex((folder) => folder.name === selection.folder)
    : -1

  if (targetFolderIndex < 0) {
    targetFolderIndex = folders.findIndex((folder) => findApiIndex(folder.apis ?? []) >= 0)
  }

  if (targetFolderIndex < 0) {
    targetFolderIndex = 0
  }

  const targetFolder = folders[targetFolderIndex]
  const folderApis = targetFolder.apis ?? []
  const targetApiIndex = findApiIndex(folderApis)

  if (targetApiIndex > 0) {
    const [api] = folderApis.splice(targetApiIndex, 1)
    folderApis.unshift(api)
  }

  if (targetFolderIndex > 0) {
    const [folder] = folders.splice(targetFolderIndex, 1)
    folders.unshift(folder)
  }

  return {
    ...data,
    folders
  }
}

export const loadEditorData = async () => {
  const xml = await readFile(DATA_PATH, 'utf-8')
  return editorXmlToData(xml)
}

export const saveEditorData = async (data: EditorData) => {
  const xml = editorDataToXml(data)
  await mkdir(join(process.cwd(), 'data'), { recursive: true })
  await writeFile(DATA_PATH, `${xml}\n`, 'utf-8')
}

const renderEditorPage = async (selection: EditorSelection = {}) => {
  const [layout, xml] = await Promise.all([
    readFile(editorPath('page.html'), 'utf-8'),
    readFile(DATA_PATH, 'utf-8')
  ])

  const selectedXml = editorDataToXml(reorderForSelection(editorXmlToData(xml), selection))

  const [sidebarHtml, editorHtml] = await Promise.all([
    transformXmlWithPath(selectedXml, editorPath('components/sidebar.xsl')),
    transformXmlWithPath(selectedXml, editorPath('components/editor.xsl'))
  ])

  return embed(embed(layout, 'sidebar', sidebarHtml), 'editor', editorHtml)
}

export async function editorEndpoint(c: Context) {
  return c.html(await renderEditorPage({
    folder: c.req.query('folder'),
    api: c.req.query('api'),
    path: c.req.query('path')
  }))
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
