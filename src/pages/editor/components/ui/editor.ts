/**
 * @title pages/editor/components/ui/editor.ts
 * @descrption Main UI composer that binds editor click/input handlers and delegates to specialized UI modules.
 */
import { getLucide, setSaveDirty } from './dirty-state.js'
import { attachDragDrop } from './drag-drop.js'
import { initEmptyRows } from './empty-row.js'
import { addRow, deleteRow, moveRow, toggleRequired } from './row-actions.js'
import { attachSaveHandler } from './save-handler.js'

type AttachEditorOptions = {
  onSave?: () => Promise<void> | void
}

export const attachEditor = (options: AttachEditorOptions = {}) => {
  const isDirtyRef = { value: false }

  const markDirty = () => {
    if (isDirtyRef.value) return
    isDirtyRef.value = true
    setSaveDirty(true)
  }

  const actions: Record<string, (trigger: Element) => void> = {
    'new-folder': markDirty,
    'new-api': markDirty,
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

    const action = trigger.getAttribute('data-handler') ?? ''
    actions[action]?.(trigger)
    getLucide()?.createIcons()
  })

  document.addEventListener('input', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
      markDirty()
    }
  })

  attachDragDrop(markDirty)
  attachSaveHandler(isDirtyRef, options.onSave)
}
