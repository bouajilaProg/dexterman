/**
 * @title pages/editor/components/ui/empty-row.ts
 * @descrption Table placeholder row utilities used when request/response field lists are empty.
 */
export const removeEmptyRow = (tbody: HTMLElement) => {
    tbody.querySelectorAll(':scope > tr[data-empty-row]').forEach((row) => row.remove())
}

export const ensureEmptyRow = (tbody: HTMLElement) => {
    const rows = Array.from(tbody.querySelectorAll(':scope > tr'))
    const hasDataRows = rows.some((row) => !row.hasAttribute('data-empty-row'))

    if (hasDataRows) {
        removeEmptyRow(tbody)
        return
    }

    if (rows.some((row) => row.hasAttribute('data-empty-row'))) return

    const colspan = Number(tbody.getAttribute('data-empty-colspan') || '1')
    const message = tbody.getAttribute('data-empty-message') || 'No item here.'

    const row = document.createElement('tr')
    row.setAttribute('data-empty-row', 'true')
    row.className = 'border-t border-[#292e42]'

    const cell = document.createElement('td')
    cell.colSpan = colspan
    cell.className = 'p-3 text-xs italic text-center text-[#565f89]'
    cell.textContent = message

    row.appendChild(cell)
    tbody.appendChild(row)
}

export const initEmptyRows = () => {
    document.querySelectorAll('tbody[data-empty-colspan]').forEach((tbody) => {
        if (tbody instanceof HTMLElement) ensureEmptyRow(tbody)
    })
}
