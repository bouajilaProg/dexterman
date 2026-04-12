/**
 * @title pages/editor/components/ui/editor.ts
 * @descrption Main UI composer that binds editor click/input handlers and delegates to specialized UI modules.
 */
import { getLucide, setSaveDirty } from './dirty-state.js'
import { attachDragDrop, type ApiDropPayload } from './drag-drop.js'
import { initEmptyRows } from './empty-row.js'
import { addRow, deleteRow, moveRow, toggleRequired } from './row-actions.js'
import { attachSaveHandler } from './save-handler.js'

type AttachEditorOptions = {
  onSave?: () => Promise<void> | void
  onApiDrop?: (payload: ApiDropPayload) => Promise<void> | void
  onNewFolder?: () => Promise<void> | void
  onNewRootApi?: () => Promise<void> | void
  onDeleteRootApi?: (apiName: string) => Promise<void> | void
  onRenameFolder?: (folderName: string) => Promise<void> | void
  onDeleteFolder?: (folderName: string) => Promise<void> | void
  onNewApi?: (folderName: string) => Promise<void> | void
  onDeleteApi?: (folderName: string, apiName: string) => Promise<void> | void
}

export const attachEditor = (options: AttachEditorOptions = {}) => {
  const isDirtyRef = { value: false }

  const markDirty = () => {
    if (isDirtyRef.value) return
    isDirtyRef.value = true
    setSaveDirty(true)
  }

  const actions: Record<string, (trigger: Element) => void> = {
    'new-folder': () => {
      if (options.onNewFolder) {
        void options.onNewFolder()
        return
      }
      markDirty()
    },
    'new-root-api': () => {
      if (options.onNewRootApi) {
        void options.onNewRootApi()
        return
      }
      markDirty()
    },
    'delete-root-api': (t) => {
      const apiName = t.getAttribute('data-api-name')
        ?? t.closest('[data-api-item]')?.getAttribute('data-api-name')
        ?? ''
      if (options.onDeleteRootApi && apiName) {
        void options.onDeleteRootApi(apiName)
      }
    },
    'rename-folder': (t) => {
      const folderName = t.getAttribute('data-folder-name') ?? ''
      if (options.onRenameFolder && folderName) {
        void options.onRenameFolder(folderName)
      }
    },
    'delete-folder': (t) => {
      const folderName = t.getAttribute('data-folder-name') ?? ''
      if (options.onDeleteFolder && folderName) {
        void options.onDeleteFolder(folderName)
      }
    },
    'new-api': (t) => {
      const folderName = t.getAttribute('data-folder-name')
        ?? t.closest('[data-folder-dropzone]')?.getAttribute('data-folder-name')
        ?? ''
      if (options.onNewApi && folderName) {
        void options.onNewApi(folderName)
        return
      }
      markDirty()
    },
    'delete-api': (t) => {
      const folderName = t.getAttribute('data-folder-name')
        ?? t.closest('[data-folder-dropzone]')?.getAttribute('data-folder-name')
        ?? ''
      const apiName = t.getAttribute('data-api-name')
        ?? t.closest('[data-api-item]')?.getAttribute('data-api-name')
        ?? ''
      if (options.onDeleteApi && folderName && apiName) {
        void options.onDeleteApi(folderName, apiName)
      }
    },
    'env-page': markDirty,
    'add': (t) => { if (addRow(t)) markDirty() },
    'delete': (t) => { if (deleteRow(t)) markDirty() },
    'move-up': (t) => { if (moveRow(t, 'up')) markDirty() },
    'move-down': (t) => { if (moveRow(t, 'down')) markDirty() },
    'toggle': (t) => { toggleRequired(t); markDirty() },
  }

  setSaveDirty(false)
  initEmptyRows()

  document.addEventListener('click', (e) => {
    const target = e.target instanceof Element ? e.target : null
    const trigger = target?.closest('[data-handler]')
    if (!trigger) return

    e.preventDefault()
    e.stopPropagation()

    const action = trigger.getAttribute('data-handler') ?? ''
    actions[action]?.(trigger)
    getLucide()?.createIcons()
  })

  document.addEventListener('input', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
      markDirty()
    }
  })

  attachDragDrop(markDirty, {
    onApiDrop: options.onApiDrop
  })
  attachSaveHandler(isDirtyRef, options.onSave)
}
