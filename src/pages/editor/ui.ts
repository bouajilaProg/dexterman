/**
 * @title pages/editor/ui.ts
 * @descrption Browser-only editor bootstrap that wires UI interactions to save payload building and server save calls.
 */
import { attachEditor } from './components/ui/editor.js'
import type { ApiDropPayload } from './components/ui/drag-drop.js'
import { loadEditorData, saveEditorData } from './editor-client.js'
import type { EditorApi, EditorData, EditorField, EditorFolder } from './lib/editor-data.js'

let cachedData: EditorData | null = null

const getActiveIdentity = () => {
  const activeCard = document.querySelector('[data-api-item][data-api-active="true"]')
  if (!(activeCard instanceof HTMLElement)) {
    return null
  }

  const folder = activeCard.closest('[data-folder-dropzone]')?.getAttribute('data-folder-name') ?? ''
  const name = activeCard.getAttribute('data-api-name') ?? ''
  const path = activeCard.querySelector('.truncate')?.textContent?.trim() ?? ''

  if (!folder || !name) {
    return null
  }

  return { folder, name, path }
}

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
  const base = cachedData ?? { env: { vars: [] }, folders: [] }
  const folders = (base.folders ?? []).map((folder) => ({
    ...folder,
    apis: (folder.apis ?? []).map((api) => ({ ...api }))
  }))

  const active = getActiveIdentity()

  if (folders.length === 0) folders.push({ name: 'default', apis: [] })

  let activeFolder = folders[0]
  if (active?.folder) {
    activeFolder = folders.find((folder) => folder.name === active.folder) ?? activeFolder
  }

  if (!activeFolder.apis?.length) {
    activeFolder.apis = [{ name: 'api', method: 'GET', path: '/', requestBody: [], responseBody: [] }]
  }

  let api = activeFolder.apis[0] as EditorApi
  if (active?.name) {
    api = activeFolder.apis.find((item) => item.name === active.name && (!active.path || item.path === active.path)) ?? api
  }

  api.name = getTextValue('[data-editor-api-name]', api.name || 'api')
  api.method = getTextValue('[data-editor-api-method]', api.method || 'GET').toUpperCase()
  api.path = getTextValue('[data-editor-api-path]', api.path || '/')
  api.requestBody = collectFields('req-body', true)
  api.responseBody = collectFields('res-body', false)

  return { env: base.env, folders }
}

const saveCurrentEditor = async () => {
  const payload = buildPayload()
  await saveEditorData(payload)
  cachedData = payload
}

const extractFolderOrder = (): string[] => {
  const names: string[] = []

  document.querySelectorAll('[data-folder-dropzone]').forEach((zone) => {
    if (zone instanceof HTMLElement) {
      const name = zone.getAttribute('data-folder-name')
      if (name) {
        names.push(name)
      }
    }
  })

  return names
}

const cloneFolderData = (folder: EditorFolder): EditorFolder => ({
  ...folder,
  apis: (folder.apis ?? []).map((api) => ({
    ...api,
    requestBody: [...(api.requestBody ?? [])],
    responseBody: [...(api.responseBody ?? [])]
  }))
})

const moveApiInCachedData = (sourceFolder: string, targetFolder: string, apiName: string, apiPath: string | null) => {
  if (!cachedData?.folders?.length) {
    return null
  }

  const folders = cachedData.folders.map(cloneFolderData)
  const source = folders.find((folder) => folder.name === sourceFolder)
  const target = folders.find((folder) => folder.name === targetFolder)

  if (!source || !target || !source.apis?.length) {
    return null
  }

  const sourceIndex = source.apis.findIndex((api) => api.name === apiName && (!apiPath || api.path === apiPath))
  if (sourceIndex < 0) {
    return null
  }

  const [moved] = source.apis.splice(sourceIndex, 1)
  target.apis = target.apis ?? []
  target.apis.push(moved)

  const order = extractFolderOrder()
  const orderedFolders = order
    .map((name) => folders.find((folder) => folder.name === name))
    .filter((folder): folder is EditorFolder => Boolean(folder))

  return {
    env: cachedData.env,
    folders: orderedFolders.length ? orderedFolders : folders,
    movedApi: moved
  }
}

const autosaveFolderMove = async ({ sourceFolder, targetFolder, apiName, apiPath, isActive }: ApiDropPayload) => {
  const moved = moveApiInCachedData(sourceFolder, targetFolder, apiName, apiPath)
  if (!moved) {
    return
  }

  await saveEditorData({ env: moved.env, folders: moved.folders })
  cachedData = { env: moved.env, folders: moved.folders }

  const next = new URL(window.location.href)
  const activeAfterMove = isActive
    ? { folder: targetFolder, name: moved.movedApi.name, path: moved.movedApi.path }
    : getActiveIdentity()

  if (activeAfterMove?.folder && activeAfterMove.name) {
    next.searchParams.set('folder', activeAfterMove.folder)
    next.searchParams.set('api', activeAfterMove.name)
    next.searchParams.set('path', activeAfterMove.path || moved.movedApi.path)
  } else {
    next.searchParams.set('folder', targetFolder)
    next.searchParams.set('api', moved.movedApi.name)
    next.searchParams.set('path', moved.movedApi.path)
  }

  window.location.href = next.toString()
}

void init()
attachEditor({
  onSave: saveCurrentEditor,
  onApiDrop: autosaveFolderMove
})
