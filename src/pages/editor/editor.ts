/**
 * @title pages/editor/editor.ts
 * @descrption Server-side editor module that renders editor HTML and exposes load/save endpoints backed by data/base.xml.
 */
import type { Context } from 'hono'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  editorDataToXml,
  editorXmlToData,
  type EditorApi,
  type EditorData,
  type EditorFolder,
  type EditorUiState
} from './lib/editor-data.js'
import { embed, transformXmlWithPath } from '../../lib/transform.js'

const isDev = fileURLToPath(import.meta.url).includes('/src/')
const BASE_DIR = join(process.cwd(), isDev ? 'src' : 'dist')
const DATA_PATH = join(process.cwd(), 'data/base.xml')

const editorPath = (file: string) => join(BASE_DIR, 'pages/editor', file)

type EditorSelection = {
  folder?: string
  api?: string
  path?: string
}

type ParsedSelection =
  | { scope: 'none' }
  | { scope: 'root'; api: string }
  | { scope: 'folder'; folder: string; api: string }

/**
 * @title normalizeSelection
 * @description Trims and normalizes incoming selection query values.
 */
const normalizeSelection = (selection: EditorSelection): EditorSelection => ({
  folder: selection.folder?.trim() || undefined,
  api: selection.api?.trim() || undefined,
  path: selection.path?.trim() || undefined
})

/**
 * @title parseSelectionPath
 * @description Parses path query into root or folder selection forms.
 */
const parseSelectionPath = (value?: string): ParsedSelection => {
  const raw = value?.trim()
  if (!raw) {
    return { scope: 'none' }
  }

  const slashIndex = raw.indexOf('/')
  if (slashIndex < 0) {
    return { scope: 'root', api: raw }
  }

  if (slashIndex === 0 || slashIndex >= raw.length - 1) {
    return { scope: 'none' }
  }

  return {
    scope: 'folder',
    folder: raw.slice(0, slashIndex).trim(),
    api: raw.slice(slashIndex + 1).trim()
  }
}

/**
 * @title cloneApi
 * @description Deep-clones API data for safe, non-mutating selection tagging.
 */
const cloneApi = (api: EditorApi): EditorApi => ({
  ...api,
  requestBody: (api.requestBody ?? []).map((field) => ({ ...field })),
  responseBody: (api.responseBody ?? []).map((field) => ({ ...field }))
})

/**
 * @title cloneFolder
 * @description Deep-clones folder data with nested API arrays.
 */
const cloneFolder = (folder: EditorFolder): EditorFolder => ({
  ...folder,
  apis: (folder.apis ?? []).map(cloneApi)
})

/**
 * @title cloneEditorData
 * @description Clones editor data before applying UI selection markers.
 */
const cloneEditorData = (data: EditorData): EditorData => ({
  env: data.env
    ? {
      vars: (data.env.vars ?? []).map((item) => ({ ...item }))
    }
    : undefined,
  apis: (data.apis ?? []).map(cloneApi),
  folders: (data.folders ?? []).map(cloneFolder)
})

/**
 * @title pickDefaultSelection
 * @description Chooses first selectable API without reordering folders.
 */
const pickDefaultSelection = (data: EditorData): ParsedSelection => {
  const firstRootApi = (data.apis ?? [])[0]
  if (firstRootApi?.name) {
    return { scope: 'root', api: firstRootApi.name }
  }

  for (const folder of data.folders ?? []) {
    const folderName = folder.name?.trim()
    if (!folderName) continue

    const api = (folder.apis ?? [])[0]
    if (api?.name) {
      return { scope: 'folder', folder: folderName, api: api.name }
    }
  }

  return { scope: 'none' }
}

/**
 * @title resolveSelection
 * @description Resolves query selection into explicit root/folder target or none.
 */
const resolveSelection = (data: EditorData, rawSelection: EditorSelection): ParsedSelection => {
  const selection = normalizeSelection(rawSelection)

  if (selection.path) {
    const fromPath = parseSelectionPath(selection.path)
    if (fromPath.scope !== 'none') {
      return fromPath
    }
  }

  if (selection.folder && selection.api) {
    return { scope: 'folder', folder: selection.folder, api: selection.api }
  }

  if (selection.api && !selection.folder) {
    return { scope: 'root', api: selection.api }
  }

  return pickDefaultSelection(data)
}

/**
 * @title applySelectionState
 * @description Marks selected API/folder in cloned data and sets UI not-found state.
 */
const applySelectionState = (source: EditorData, rawSelection: EditorSelection): EditorData => {
  const data = cloneEditorData(source)
  const selection = resolveSelection(data, rawSelection)
  const hasExplicitSelection = Boolean(
    rawSelection.path?.trim()
    || rawSelection.folder?.trim()
    || rawSelection.api?.trim()
  )
  const parsedRawPath = parseSelectionPath(rawSelection.path)
  const hasInvalidPath = Boolean(rawSelection.path?.trim()) && parsedRawPath.scope === 'none'

  let found = false
  let ui: EditorUiState = { notFound: false }

  if (selection.scope === 'root') {
    for (const api of data.apis ?? []) {
      const isMatch = api.name === selection.api
      api.selected = isMatch
      if (isMatch) {
        found = true
      }
    }

    ui = found
      ? { selectedScope: 'root', selectedApi: selection.api, notFound: false }
      : { notFound: true, message: `Root API '${selection.api}' was not found.` }
  } else if (selection.scope === 'folder') {
    for (const folder of data.folders ?? []) {
      const isFolder = folder.name === selection.folder
      folder.selected = isFolder

      for (const api of folder.apis ?? []) {
        const isApi = isFolder && api.name === selection.api
        api.selected = isApi
        if (isApi) {
          found = true
        }
      }
    }

    ui = found
      ? {
        selectedScope: 'folder',
        selectedFolder: selection.folder,
        selectedApi: selection.api,
        notFound: false
      }
      : {
        notFound: true,
        message: `API '${selection.api}' was not found in folder '${selection.folder}'.`
      }
  }

  if (hasInvalidPath) {
    ui = { notFound: true, message: 'Selected API path is invalid.' }
  } else if (!found && !hasExplicitSelection && selection.scope !== 'none') {
    ui.notFound = false
  }

  data.ui = ui
  return data
}

/**
 * @title escapeHtml
 * @description Escapes HTML entities for safe error page output.
 */
const escapeHtml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;')

/**
 * @title renderEditorErrorPage
 * @description Renders full-page fallback for infra-level editor failures.
 */
const renderEditorErrorPage = (title: string, message: string) => {
  const safeTitle = escapeHtml(title)
  const safeMessage = escapeHtml(message)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body class="min-h-screen bg-[#1a1b26] text-[#c0caf5] flex items-center justify-center p-6">
  <main class="w-full max-w-xl border border-[#292e42] rounded-lg bg-[#16161e] p-6 space-y-3">
    <h1 class="text-lg font-bold text-[#f7768e]">${safeTitle}</h1>
    <p class="text-sm text-[#a9b1d6]">${safeMessage}</p>
    <a class="inline-flex items-center px-3 py-2 rounded bg-[#7aa2f7] text-[#1a1b26] text-sm font-semibold" href="/">
      Back to editor
    </a>
  </main>
</body>
</html>`
}

/**
 * @title isErrnoException
 * @description Type guard for Node errno-style errors.
 */
const isErrnoException = (error: unknown): error is NodeJS.ErrnoException => {
  return typeof error === 'object' && error !== null && 'code' in error
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

/**
 * @title renderEditorPage
 * @description Renders sidebar and editor HTML from XML without reordering folders.
 */
const renderEditorPage = async (selection: EditorSelection = {}) => {
  const [layout, xml] = await Promise.all([
    readFile(editorPath('page.html'), 'utf-8'),
    readFile(DATA_PATH, 'utf-8')
  ])

  const data = editorXmlToData(xml)
  const selectedXml = editorDataToXml(applySelectionState(data, selection))

  const [sidebarHtml, editorHtml] = await Promise.all([
    transformXmlWithPath(selectedXml, editorPath('components/sidebar.xsl')),
    transformXmlWithPath(selectedXml, editorPath('components/editor.xsl'))
  ])

  return embed(embed(layout, 'sidebar', sidebarHtml), 'editor', editorHtml)
}

export async function editorEndpoint(c: Context) {
  try {
    return c.html(await renderEditorPage({
      folder: c.req.query('folder'),
      api: c.req.query('api'),
      path: c.req.query('path')
    }))
  } catch (error) {
    if (isErrnoException(error) && error.code === 'ENOENT') {
      return c.html(
        renderEditorErrorPage('Data File Missing', `Unable to read editor data at ${DATA_PATH}.`),
        404
      )
    }

    const message = error instanceof Error ? error.message : 'Unexpected editor rendering error'
    return c.html(renderEditorErrorPage('Editor Error', message), 500)
  }
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
