/**
 * @title pages/editor/components/ui/dirty-state.ts
 * @descrption Save button and icon-state helpers for dirty and busy UI feedback.
 */
type LucideGlobal = { createIcons: () => void }

export const getLucide = () =>
  (window as typeof window & { lucide?: LucideGlobal }).lucide

const getSaveButton = () => {
  const btn = document.querySelector('[data-save-button]')
  return btn instanceof HTMLElement ? btn : null
}

export const setSaveDirty = (isDirty: boolean) => {
  const btn = getSaveButton()
  if (!btn) return

  btn.dataset.dirty = String(isDirty)
  btn.classList.toggle('opacity-40', !isDirty)
  btn.classList.toggle('cursor-not-allowed', !isDirty)
  btn.classList.toggle('cursor-pointer', isDirty)
}

export const setSaveBusy = (isBusy: boolean) => {
  const btn = getSaveButton()
  if (!btn) return

  btn.dataset.saving = String(isBusy)
  btn.classList.toggle('opacity-70', isBusy)
  btn.classList.toggle('cursor-wait', isBusy)
  if (isBusy) btn.classList.remove('cursor-pointer')
}
