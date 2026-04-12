/**
 * @title pages/editor/ui.ts
 * @descrption Browser-only editor bootstrap that wires UI interactions to save payload building and server save calls.
 */
import { attachEditor } from './components/ui/editor.js'
import type { ApiDropPayload } from './components/ui/drag-drop.js'
import { confirmAction, promptText } from './components/ui/core/modal.js'
import { loadEditorData, saveEditorData } from './editor-client.js'
import type { EditorApi, EditorData, EditorField, EditorFolder } from './lib/editor-data.js'

let cachedData: EditorData | null = null

type EditorSelection = {
  folder?: string
  api?: string
}

type ActiveIdentity = {
  folder: string | null
  name: string
}

/**
 * @title getErrorMessage
 * @description Normalizes unknown errors to user-facing message strings.
 */
const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : 'Unexpected editor error'

/**
 * @title showError
 * @description Displays editor errors with a simple browser alert.
 */
const showError = (error: unknown) => {
  window.alert(getErrorMessage(error))
}

/**
 * @title getSelectionPath
 * @description Builds folder-scoped selection path format used in URL query.
 */
const getSelectionPath = (folder: string, api: string) => `${folder}/${api}`

/**
 * @title setUrlSelection
 * @description Updates current URL selection and reloads to render selected API.
 */
const setUrlSelection = (selection: EditorSelection | null) => {
  const next = new URL(window.location.href)
  next.searchParams.delete('folder')
  next.searchParams.delete('api')
  next.searchParams.delete('path')

  if (selection?.folder && selection.api) {
    next.searchParams.set('path', getSelectionPath(selection.folder, selection.api))
  } else if (selection?.api) {
    next.searchParams.set('path', selection.api)
  } else if (selection?.folder) {
    next.searchParams.set('folder', selection.folder)
  }

  window.location.href = next.toString()
}

/**
 * @title getActiveIdentity
 * @description Returns active API identity from sidebar, including root APIs.
 */
const getActiveIdentity = (): ActiveIdentity | null => {
  const activeCard = document.querySelector('[data-api-item][data-api-active="true"]')
  if (!(activeCard instanceof HTMLElement)) {
    return null
  }

  const folderAttr = activeCard.closest('[data-folder-dropzone]')?.getAttribute('data-folder-name')
  const folder = folderAttr && folderAttr.trim() ? folderAttr.trim() : null
  const name = activeCard.getAttribute('data-api-name') ?? ''

  if (!name) {
    return null
  }

  return { folder, name }
}

/**
 * @title init
 * @description Boots cached editor data for client-side actions.
 */
const init = async () => {
  try {
    cachedData = await loadEditorData()
  } catch {
    // Keep boot resilient even if initial load fails.
  }
}

/**
 * @title ensureCachedData
 * @description Loads editor data once and reuses it for UI-side mutations.
 */
const ensureCachedData = async () => {
  if (!cachedData) {
    cachedData = await loadEditorData()
  }
  return cachedData
}

/**
 * @title cloneFolderData
 * @description Deep-clones folder and nested APIs for safe updates.
 */
const cloneFolderData = (folder: EditorFolder): EditorFolder => ({
  ...folder,
  apis: (folder.apis ?? []).map((api) => ({
    ...api,
    requestBody: (api.requestBody ?? []).map((field) => ({ ...field })),
    responseBody: (api.responseBody ?? []).map((field) => ({ ...field }))
  }))
})

/**
 * @title cloneEditorData
 * @description Deep-clones editor dataset before applying mutations.
 */
const cloneEditorData = (data: EditorData): EditorData => ({
  env: data.env
    ? {
      vars: (data.env.vars ?? []).map((item) => ({ ...item }))
    }
    : undefined,
  apis: (data.apis ?? []).map((api) => ({
    ...api,
    requestBody: (api.requestBody ?? []).map((field) => ({ ...field })),
    responseBody: (api.responseBody ?? []).map((field) => ({ ...field }))
  })),
  folders: (data.folders ?? []).map(cloneFolderData)
})

/**
 * @title assertValidSelectionName
 * @description Validates folder/API names against selection path constraints.
 */
const assertValidSelectionName = (value: string, label: string) => {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error(`${label} name is required`)
  }
  if (trimmed.includes('/')) {
    throw new Error(`${label} name cannot include '/'`)
  }
}

/**
 * @title validateDataForSelectionPaths
 * @description Enforces unique and selection-safe names in root and folder scopes.
 */
const validateDataForSelectionPaths = (data: EditorData) => {
  const rootApiNames = new Set<string>()

  for (const api of data.apis ?? []) {
    const apiName = (api.name ?? '').trim()
    assertValidSelectionName(apiName, 'API')

    if (rootApiNames.has(apiName)) {
      throw new Error(`Root API '${apiName}' already exists`)
    }
    rootApiNames.add(apiName)
  }

  const folderNames = new Set<string>()

  for (const folder of data.folders ?? []) {
    const folderName = (folder.name ?? '').trim()
    assertValidSelectionName(folderName, 'Folder')

    if (folderNames.has(folderName)) {
      throw new Error(`Folder '${folderName}' already exists`)
    }
    folderNames.add(folderName)

    const apiNames = new Set<string>()
    for (const api of folder.apis ?? []) {
      const apiName = (api.name ?? '').trim()
      assertValidSelectionName(apiName, 'API')

      if (apiNames.has(apiName)) {
        throw new Error(`API '${apiName}' already exists in folder '${folderName}'`)
      }
      apiNames.add(apiName)
    }
  }
}

/**
 * @title getModalName
 * @description Opens modal text input and returns trimmed value or null.
 */
const getModalName = async (label: string, defaultValue: string) => {
  const raw = await promptText({
    title: label,
    defaultValue,
    confirmLabel: 'Save',
    cancelLabel: 'Cancel'
  })

  if (raw === null) {
    return null
  }

  return raw.trim()
}

/**
 * @title confirmWithModal
 * @description Opens confirmation modal and resolves explicit confirmation state.
 */
const confirmWithModal = (title: string, description: string) => {
  return confirmAction({
    title,
    description,
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    tone: 'danger'
  })
}

/**
 * @title buildUniqueName
 * @description Generates unique suffix-based names from existing values.
 */
const buildUniqueName = (existingNames: string[], baseName: string) => {
  const used = new Set(existingNames.map((name) => name.trim()).filter(Boolean))
  if (!used.has(baseName)) {
    return baseName
  }

  let index = 2
  while (used.has(`${baseName}-${index}`)) {
    index += 1
  }
  return `${baseName}-${index}`
}

/**
 * @title firstApiSelection
 * @description Picks first available API selection, preferring root APIs.
 */
const firstApiSelection = (data: EditorData): EditorSelection | null => {
  const rootApi = (data.apis ?? []).find((api) => api.name?.trim())
  if (rootApi?.name?.trim()) {
    return { api: rootApi.name.trim() }
  }

  for (const folder of data.folders ?? []) {
    const folderName = folder.name?.trim()
    if (!folderName) {
      continue
    }

    const api = (folder.apis ?? []).find((item) => item.name?.trim())
    if (api?.name?.trim()) {
      return { folder: folderName, api: api.name.trim() }
    }
  }

  const firstFolderName = data.folders?.[0]?.name?.trim()
  return firstFolderName ? { folder: firstFolderName } : null
}

/**
 * @title pickSelection
 * @description Resolves fallback navigation target after create/delete actions.
 */
const pickSelection = (data: EditorData, preferred?: EditorSelection): EditorSelection | null => {
  if (preferred?.api && !preferred.folder) {
    const rootApi = (data.apis ?? []).find((item) => item.name === preferred.api)
    if (rootApi) {
      return { api: rootApi.name }
    }
  }

  if (preferred?.folder) {
    const folder = (data.folders ?? []).find((item) => item.name === preferred.folder)
    if (folder) {
      if (preferred.api) {
        const api = (folder.apis ?? []).find((item) => item.name === preferred.api)
        if (api) {
          return { folder: folder.name, api: api.name }
        }
      } else {
        return { folder: folder.name }
      }
    }
  }

  return firstApiSelection(data)
}

/**
 * @title persistDataAndNavigate
 * @description Validates, saves, caches, then navigates to resolved selection.
 */
const persistDataAndNavigate = async (nextData: EditorData, preferred?: EditorSelection) => {
  validateDataForSelectionPaths(nextData)
  await saveEditorData(nextData)
  cachedData = nextData
  setUrlSelection(pickSelection(nextData, preferred))
}

/**
 * @title getTextValue
 * @description Reads trimmed input/select value or fallback.
 */
const getTextValue = (selector: string, fallback = '') => {
  const input = document.querySelector(selector)
  if (!(input instanceof HTMLInputElement || input instanceof HTMLSelectElement)) return fallback
  return input.value.trim() || fallback
}

/**
 * @title collectFields
 * @description Collects request/response field rows into editor payload fields.
 */
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

/**
 * @title buildPayload
 * @description Builds save payload from cached data and current active editor form.
 */
const buildPayload = (): EditorData => {
  const base = cachedData ?? { env: { vars: [] }, folders: [] }
  const rootApis = (base.apis ?? []).map((api) => ({
    ...api,
    requestBody: (api.requestBody ?? []).map((field) => ({ ...field })),
    responseBody: (api.responseBody ?? []).map((field) => ({ ...field }))
  }))
  const folders = (base.folders ?? []).map(cloneFolderData)

  const active = getActiveIdentity()

  if (!active) {
    const payload = { env: base.env, apis: rootApis, folders }
    validateDataForSelectionPaths(payload)
    return payload
  }

  if (active.folder === null) {
    if (!rootApis.length) {
      rootApis.push({ name: 'api', method: 'GET', path: '/', requestBody: [], responseBody: [] })
    }

    let api = rootApis[0] as EditorApi
    api = rootApis.find((item) => item.name === active.name) ?? api

    api.name = getTextValue('[data-editor-api-name]', api.name || 'api')
    api.method = getTextValue('[data-editor-api-method]', api.method || 'GET').toUpperCase()
    api.path = getTextValue('[data-editor-api-path]', api.path || '/')
    api.requestBody = collectFields('req-body', true)
    api.responseBody = collectFields('res-body', false)

    const payload = { env: base.env, apis: rootApis, folders }
    validateDataForSelectionPaths(payload)
    return payload
  }

  if (folders.length === 0) folders.push({ name: 'default', apis: [] })

  let activeFolder = folders[0]
  activeFolder = folders.find((folder) => folder.name === active.folder) ?? activeFolder

  if (!activeFolder.apis?.length) {
    activeFolder.apis = [{ name: 'api', method: 'GET', path: '/', requestBody: [], responseBody: [] }]
  }

  let api = activeFolder.apis[0] as EditorApi
  api = activeFolder.apis.find((item) => item.name === active.name) ?? api

  api.name = getTextValue('[data-editor-api-name]', api.name || 'api')
  api.method = getTextValue('[data-editor-api-method]', api.method || 'GET').toUpperCase()
  api.path = getTextValue('[data-editor-api-path]', api.path || '/')
  api.requestBody = collectFields('req-body', true)
  api.responseBody = collectFields('res-body', false)

  const payload = { env: base.env, apis: rootApis, folders }
  validateDataForSelectionPaths(payload)
  return payload
}

/**
 * @title saveCurrentEditor
 * @description Saves editor changes and reloads when active API name changes.
 */
const saveCurrentEditor = async () => {
  const activeBeforeSave = getActiveIdentity()
  const previousName = activeBeforeSave?.name ?? ''

  try {
    const payload = buildPayload()
    await saveEditorData(payload)
    cachedData = payload

    const nextName = getTextValue('[data-editor-api-name]', '').trim()
    if (activeBeforeSave && previousName && nextName && nextName !== previousName) {
      if (activeBeforeSave.folder) {
        setUrlSelection({ folder: activeBeforeSave.folder, api: nextName })
      } else {
        setUrlSelection({ api: nextName })
      }
      return
    }
  } catch (error) {
    showError(error)
    throw error
  }
}

/**
 * @title moveApiInCachedData
 * @description Moves an API between folders while preserving folder order.
 */
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

  return {
    env: cachedData.env,
    apis: cachedData.apis,
    folders,
    movedApi: moved
  }
}

/**
 * @title autosaveFolderMove
 * @description Persists folder-to-folder API moves and redirects to selected API.
 */
const autosaveFolderMove = async ({ sourceFolder, targetFolder, apiName, apiPath, isActive }: ApiDropPayload) => {
  const moved = moveApiInCachedData(sourceFolder, targetFolder, apiName, apiPath)
  if (!moved) {
    return
  }

  const nextData = { env: moved.env, apis: moved.apis, folders: moved.folders }
  validateDataForSelectionPaths(nextData)
  await saveEditorData(nextData)
  cachedData = nextData

  const next = new URL(window.location.href)
  const activeAfterMove = isActive
    ? { folder: targetFolder, name: moved.movedApi.name }
    : getActiveIdentity()

  if (activeAfterMove?.folder && activeAfterMove.name) {
    next.searchParams.delete('folder')
    next.searchParams.delete('api')
    next.searchParams.set('path', getSelectionPath(activeAfterMove.folder, activeAfterMove.name))
  } else {
    next.searchParams.delete('folder')
    next.searchParams.delete('api')
    next.searchParams.set('path', getSelectionPath(targetFolder, moved.movedApi.name))
  }

  window.location.href = next.toString()
}

/**
 * @title newFolder
 * @description Creates a folder and navigates to it.
 */
const newFolder = async () => {
  const data = await ensureCachedData()
  const currentFolders = data.folders ?? []
  const suggestedName = buildUniqueName(currentFolders.map((folder) => folder.name), 'folder')
  const nextName = await getModalName('Folder name', suggestedName)
  if (nextName === null) {
    return
  }

  assertValidSelectionName(nextName, 'Folder')

  if (currentFolders.some((folder) => folder.name === nextName)) {
    throw new Error(`Folder '${nextName}' already exists`)
  }

  const nextData = cloneEditorData(data)
  nextData.folders = nextData.folders ?? []
  nextData.folders.push({ name: nextName, apis: [] })
  await persistDataAndNavigate(nextData, { folder: nextName })
}

/**
 * @title renameFolder
 * @description Renames a folder and keeps active API selection aligned.
 */
const renameFolder = async (folderName: string) => {
  const trimmedFolderName = folderName.trim()
  if (!trimmedFolderName) {
    throw new Error('Folder name is missing')
  }

  const data = await ensureCachedData()
  const nextData = cloneEditorData(data)
  const target = (nextData.folders ?? []).find((folder) => folder.name === trimmedFolderName)
  if (!target) {
    throw new Error(`Folder '${trimmedFolderName}' was not found`)
  }

  const nextName = await getModalName('Rename folder', target.name)
  if (nextName === null || nextName === target.name) {
    return
  }

  assertValidSelectionName(nextName, 'Folder')

  if ((nextData.folders ?? []).some((folder) => folder.name === nextName)) {
    throw new Error(`Folder '${nextName}' already exists`)
  }

  const active = getActiveIdentity()
  target.name = nextName

  const preferred = active?.folder === trimmedFolderName
    ? { folder: nextName, api: active.name }
    : { folder: nextName }

  await persistDataAndNavigate(nextData, preferred)
}

/**
 * @title deleteFolder
 * @description Deletes a folder with its APIs and redirects to fallback selection.
 */
const deleteFolder = async (folderName: string) => {
  const trimmedFolderName = folderName.trim()
  if (!trimmedFolderName) {
    throw new Error('Folder name is missing')
  }

  if (!await confirmWithModal(
    'Delete folder',
    `Delete folder '${trimmedFolderName}' and all its APIs?`
  )) {
    return
  }

  const data = await ensureCachedData()
  const nextData = cloneEditorData(data)
  const folders = nextData.folders ?? []
  const folderIndex = folders.findIndex((folder) => folder.name === trimmedFolderName)
  if (folderIndex < 0) {
    throw new Error(`Folder '${trimmedFolderName}' was not found`)
  }

  const active = getActiveIdentity()
  folders.splice(folderIndex, 1)

  const fallbackFolder = folders[folderIndex] ?? folders[folderIndex - 1]
  let preferred: EditorSelection | undefined
  if (active && active.folder !== trimmedFolderName) {
    preferred = active.folder
      ? { folder: active.folder, api: active.name }
      : { api: active.name }
  } else if (fallbackFolder) {
    preferred = { folder: fallbackFolder.name }
  }

  await persistDataAndNavigate(nextData, preferred)
}

/**
 * @title createDefaultApi
 * @description Creates default API payload for new API actions.
 */
const createDefaultApi = (name: string): EditorApi => ({
  name,
  method: 'GET',
  path: `/${name}`,
  requestBody: [],
  responseBody: []
})

/**
 * @title newRootApi
 * @description Creates a new root-level API and navigates to it.
 */
const newRootApi = async () => {
  const data = await ensureCachedData()
  const nextData = cloneEditorData(data)
  nextData.apis = nextData.apis ?? []

  const suggestedName = buildUniqueName(nextData.apis.map((api) => api.name), 'api')
  const nextApiName = await getModalName('Root API name', suggestedName)
  if (nextApiName === null) {
    return
  }

  assertValidSelectionName(nextApiName, 'API')

  if (nextData.apis.some((api) => api.name === nextApiName)) {
    throw new Error(`Root API '${nextApiName}' already exists`)
  }

  nextData.apis.push(createDefaultApi(nextApiName))
  await persistDataAndNavigate(nextData, { api: nextApiName })
}

/**
 * @title deleteRootApi
 * @description Deletes a root-level API and navigates to fallback selection.
 */
const deleteRootApi = async (apiName: string) => {
  const trimmedApiName = apiName.trim()
  if (!trimmedApiName) {
    throw new Error('API name is missing')
  }

  if (!await confirmWithModal(
    'Delete root API',
    `Delete root API '${trimmedApiName}'?`
  )) {
    return
  }

  const data = await ensureCachedData()
  const nextData = cloneEditorData(data)
  nextData.apis = nextData.apis ?? []

  const index = nextData.apis.findIndex((api) => api.name === trimmedApiName)
  if (index < 0) {
    throw new Error(`Root API '${trimmedApiName}' was not found`)
  }

  const active = getActiveIdentity()
  nextData.apis.splice(index, 1)

  const fallbackRootApi = nextData.apis[index] ?? nextData.apis[index - 1]
  const preferred = active && !(active.folder === null && active.name === trimmedApiName)
    ? active.folder
      ? { folder: active.folder, api: active.name }
      : { api: active.name }
    : fallbackRootApi
      ? { api: fallbackRootApi.name }
      : undefined

  await persistDataAndNavigate(nextData, preferred)
}

/**
 * @title newApi
 * @description Creates a new API in a specific folder and navigates to it.
 */
const newApi = async (folderName: string) => {
  const trimmedFolderName = folderName.trim()
  if (!trimmedFolderName) {
    throw new Error('Folder name is missing')
  }

  const data = await ensureCachedData()
  const nextData = cloneEditorData(data)
  const targetFolder = (nextData.folders ?? []).find((folder) => folder.name === trimmedFolderName)
  if (!targetFolder) {
    throw new Error(`Folder '${trimmedFolderName}' was not found`)
  }

  targetFolder.apis = targetFolder.apis ?? []
  const suggestedName = buildUniqueName(targetFolder.apis.map((api) => api.name), 'api')
  const nextApiName = await getModalName(`API name for folder '${trimmedFolderName}'`, suggestedName)
  if (nextApiName === null) {
    return
  }

  assertValidSelectionName(nextApiName, 'API')

  if (targetFolder.apis.some((api) => api.name === nextApiName)) {
    throw new Error(`API '${nextApiName}' already exists in folder '${trimmedFolderName}'`)
  }

  targetFolder.apis.push(createDefaultApi(nextApiName))
  await persistDataAndNavigate(nextData, { folder: trimmedFolderName, api: nextApiName })
}

/**
 * @title deleteApi
 * @description Deletes a folder API and redirects to nearby fallback selection.
 */
const deleteApi = async (folderName: string, apiName: string) => {
  const trimmedFolderName = folderName.trim()
  const trimmedApiName = apiName.trim()
  if (!trimmedFolderName || !trimmedApiName) {
    throw new Error('Folder name or API name is missing')
  }

  if (!await confirmWithModal(
    'Delete API',
    `Delete API '${trimmedApiName}' from folder '${trimmedFolderName}'?`
  )) {
    return
  }

  const data = await ensureCachedData()
  const nextData = cloneEditorData(data)
  const targetFolder = (nextData.folders ?? []).find((folder) => folder.name === trimmedFolderName)
  if (!targetFolder) {
    throw new Error(`Folder '${trimmedFolderName}' was not found`)
  }

  targetFolder.apis = targetFolder.apis ?? []
  const apiIndex = targetFolder.apis.findIndex((api) => api.name === trimmedApiName)
  if (apiIndex < 0) {
    throw new Error(`API '${trimmedApiName}' was not found in folder '${trimmedFolderName}'`)
  }

  const active = getActiveIdentity()
  targetFolder.apis.splice(apiIndex, 1)

  const sameFolderFallback = targetFolder.apis[apiIndex] ?? targetFolder.apis[apiIndex - 1]
  let preferred: EditorSelection
  if (active && !(active.folder === trimmedFolderName && active.name === trimmedApiName)) {
    preferred = active.folder
      ? { folder: active.folder, api: active.name }
      : { api: active.name }
  } else if (sameFolderFallback) {
    preferred = { folder: trimmedFolderName, api: sameFolderFallback.name }
  } else {
    preferred = { folder: trimmedFolderName }
  }

  await persistDataAndNavigate(nextData, preferred)
}

void init()

document.addEventListener('click', (e) => {
  const target = e.target instanceof Element ? e.target : null
  const apiLink = target?.closest('[data-api-link]')
  if (!(apiLink instanceof HTMLAnchorElement)) {
    return
  }

  e.preventDefault()
  const selectionPath = apiLink.getAttribute('data-api-selection-path')?.trim()
  if (!selectionPath) {
    return
  }

  const [folderName, apiName] = selectionPath.split('/', 2)
  if (!folderName) {
    showError(new Error('Invalid API selection path'))
    return
  }

  if (!apiName) {
    setUrlSelection({ api: folderName })
    return
  }

  setUrlSelection({ folder: folderName, api: apiName })
})

attachEditor({
  onSave: saveCurrentEditor,
  onApiDrop: autosaveFolderMove,
  onNewRootApi: () => {
    void newRootApi().catch(showError)
  },
  onDeleteRootApi: (apiName) => {
    void deleteRootApi(apiName).catch(showError)
  },
  onNewFolder: () => {
    void newFolder().catch(showError)
  },
  onRenameFolder: (folderName) => {
    void renameFolder(folderName).catch(showError)
  },
  onDeleteFolder: (folderName) => {
    void deleteFolder(folderName).catch(showError)
  },
  onNewApi: (folderName) => {
    void newApi(folderName).catch(showError)
  },
  onDeleteApi: (folderName, apiName) => {
    void deleteApi(folderName, apiName).catch(showError)
  }
})
