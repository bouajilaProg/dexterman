/**
 * @title pages/editor/components/ui/save-handler.ts
 * @descrption SAVE button click handler that runs async save logic and updates dirty/busy state.
 */
import { setSaveBusy, setSaveDirty } from './dirty-state.js'

export const attachSaveHandler = (
    isDirtyRef: { value: boolean },
    onSave?: () => Promise<void> | void
) => {
    document.addEventListener('click', async (e) => {
        const target = e.target instanceof Element ? e.target : null
        const saveButton = target?.closest('[data-save-button]')
        if (!(saveButton instanceof HTMLElement)) return
        if (saveButton.dataset.dirty !== 'true' || saveButton.dataset.saving === 'true') return

        try {
            setSaveBusy(true)
            await onSave?.()
            isDirtyRef.value = false
            setSaveDirty(false)
        } catch {
            isDirtyRef.value = true
            setSaveDirty(true)
        } finally {
            setSaveBusy(false)
        }
    })
}
