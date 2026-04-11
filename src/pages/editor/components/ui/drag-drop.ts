/**
 * @title pages/editor/components/ui/drag-drop.ts
 * @descrption Drag-and-drop behavior for moving APIs between folders and reordering table rows.
 */
import { getLucide } from './dirty-state.js'

type DragState = {
    apiItem: HTMLElement | null
    row: HTMLTableRowElement | null
}

const clearFolderHighlights = () => {
    document.querySelectorAll('[data-folder-dropzone]').forEach((zone) => {
        zone.classList.remove('ring-1', 'ring-[#7aa2f7]', 'bg-[#7aa2f7]/10')
    })
}

const handleDragStart = (e: DragEvent, state: DragState) => {
    const target = e.target instanceof Element ? e.target : null

    const apiItem = target?.closest('[data-api-item]') as HTMLElement | null
    if (apiItem) {
        state.apiItem = apiItem
        apiItem.classList.add('opacity-50')
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move'
            e.dataTransfer.setData('text/plain', apiItem.getAttribute('data-api-name') || 'api')
        }
        return
    }

    const row = target?.closest('tr')
    if (!(row instanceof HTMLTableRowElement) || row.hasAttribute('data-empty-row')) return
    state.row = row
    row.classList.add('opacity-50')
    if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', 'row')
    }
}

const handleDragEnd = (state: DragState) => {
    state.apiItem?.classList.remove('opacity-50')
    state.apiItem = null
    state.row?.classList.remove('opacity-50')
    state.row = null
    clearFolderHighlights()
}

const handleDragOver = (e: DragEvent, state: DragState) => {
    const target = e.target instanceof Element ? e.target : null
    const dropzone = target?.closest('[data-folder-dropzone]')
    if (!dropzone || !state.apiItem) return

    e.preventDefault()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
    clearFolderHighlights()
    dropzone.classList.add('ring-1', 'ring-[#7aa2f7]', 'bg-[#7aa2f7]/10')
}

const handleDrop = (e: DragEvent, state: DragState, onDirty: () => void) => {
    const target = e.target instanceof Element ? e.target : null
    const dropzone = target?.closest('[data-folder-dropzone]')

    if (dropzone && state.apiItem) {
        e.preventDefault()
        const list = dropzone.querySelector('[data-folder-list]')
        if (!list) return

        list.appendChild(state.apiItem)
        clearFolderHighlights()
        state.apiItem.classList.remove('opacity-50')
        state.apiItem = null
        getLucide()?.createIcons()
        onDirty()
        return
    }

    if (!state.row) return

    const rowTarget = target?.closest('tr')
    if (!(rowTarget instanceof HTMLTableRowElement) || rowTarget.hasAttribute('data-empty-row')) return
    e.preventDefault()
    if (rowTarget === state.row) return

    const parent = rowTarget.parentElement
    if (!parent) return

    parent.insertBefore(state.row, rowTarget)
    state.row.classList.remove('opacity-50')
    state.row = null
    onDirty()
    getLucide()?.createIcons()
}

export const attachDragDrop = (onDirty: () => void) => {
    const state: DragState = { apiItem: null, row: null }

    document.addEventListener('dragstart', (e) => handleDragStart(e, state))
    document.addEventListener('dragend', () => handleDragEnd(state))
    document.addEventListener('dragover', (e) => handleDragOver(e, state))
    document.addEventListener('drop', (e) => handleDrop(e, state, onDirty))
}
