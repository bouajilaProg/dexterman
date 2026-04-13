/**
 * @title pages/editor/components/ui/row-actions.ts
 * @descrption Row-level actions for add, delete, move, and required-toggle interactions in editor tables.
 */
import { removeEmptyRow, ensureEmptyRow } from './empty-row.js'

export const addRow = (trigger: Element): boolean => {
    const targetId = trigger.getAttribute('data-target')
    const tbody = targetId ? document.getElementById(targetId) : null
    const tplId = trigger.getAttribute('data-tpl')
    const tplNode = tplId ? document.getElementById(tplId) : null

    if (!tbody || !(tplNode instanceof HTMLTemplateElement)) return false

    removeEmptyRow(tbody)

    const clone = tplNode.content.cloneNode(true) as DocumentFragment
    clone.querySelectorAll('tr').forEach((row) => row.setAttribute('draggable', 'true'))
    tbody.appendChild(clone)
    return true
}

export const deleteRow = (trigger: Element): boolean => {
    const row = trigger.closest('tr')
    if (!(row instanceof HTMLTableRowElement) || row.hasAttribute('data-empty-row')) return false

    const tbody = row.parentElement
    row.remove()
    if (tbody instanceof HTMLElement) ensureEmptyRow(tbody)
    return true
}

export const moveRow = (trigger: Element, direction: 'up' | 'down'): boolean => {
    const row = trigger.closest('tr')
    if (!(row instanceof HTMLTableRowElement) || row.hasAttribute('data-empty-row')) return false

    const sibling = direction === 'up' ? row.previousElementSibling : row.nextElementSibling
    if (!(sibling instanceof HTMLTableRowElement)) return false

    const parent = row.parentElement
    if (!parent) return false

    if (direction === 'up') {
        parent.insertBefore(row, sibling)
    } else {
        parent.insertBefore(sibling, row)
    }
    return true
}

export const toggleRequired = (trigger: Element) => {
    const isYes = trigger.textContent?.trim() === 'YES'
    const nextIsYes = !isYes
    trigger.textContent = nextIsYes ? 'YES' : 'NO'

    trigger.classList.remove('bg-accent-success/20', 'bg-accent-primary/20', 'bg-accent-warning/20', 'bg-accent-danger/20', 'text-accent-success', 'text-accent-primary', 'text-accent-warning', 'text-accent-danger')

    if (nextIsYes) {
        trigger.classList.remove('bg-bg-elevated', 'text-text-dim')
    } else {
        trigger.classList.add('bg-bg-elevated', 'text-text-dim')
    }
}
