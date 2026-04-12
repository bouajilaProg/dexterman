/**
 * @title pages/editor/components/ui/core/modal.ts
 * @descrption Small modal core library for prompt and confirmation interactions in editor UI.
 */

type ModalBaseOptions = {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
}

type PromptTextOptions = ModalBaseOptions & {
  defaultValue?: string
  placeholder?: string
}

type ConfirmActionOptions = ModalBaseOptions & {
  tone?: 'default' | 'danger'
}

const FOCUSABLE_SELECTOR = 'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'

/**
 * @title createModalShell
 * @description Builds and mounts a modal shell with body and footer slots.
 */
const createModalShell = (title: string, description?: string) => {
  const previousOverflow = document.body.style.overflow

  const overlay = document.createElement('div')
  overlay.className = 'fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm'

  const panel = document.createElement('section')
  panel.className = 'w-full max-w-sm rounded-xl border border-border-strong bg-bg-panel shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200'
  panel.setAttribute('role', 'dialog')
  panel.setAttribute('aria-modal', 'true')

  const header = document.createElement('header')
  header.className = 'px-5 py-4 border-b border-border-strong bg-bg-elevated/50'

  const heading = document.createElement('h2')
  heading.className = 'text-sm font-bold text-text-bright'
  heading.textContent = title
  header.appendChild(heading)

  if (description) {
    const paragraph = document.createElement('p')
    paragraph.className = 'mt-1 text-xs text-text-dim leading-relaxed'
    paragraph.textContent = description
    header.appendChild(paragraph)
  }

  const body = document.createElement('div')
  body.className = 'px-5 py-4 space-y-4'

  const footer = document.createElement('footer')
  footer.className = 'px-5 py-4 border-t border-border-strong flex items-center justify-end gap-3 bg-bg-elevated/30'

  panel.append(header, body, footer)
  overlay.appendChild(panel)
  document.body.appendChild(overlay)
  document.body.style.overflow = 'hidden'

  const teardown = () => {
    overlay.classList.add('animate-out', 'fade-out', 'duration-200')
    panel.classList.add('animate-out', 'zoom-out', 'fade-out', 'duration-200')
    setTimeout(() => {
      overlay.remove()
      document.body.style.overflow = previousOverflow
    }, 200)
  }

  return { overlay, panel, body, footer, teardown }
}


/**
 * @title trapFocus
 * @description Keeps keyboard tab focus within the modal panel.
 */
const trapFocus = (panel: HTMLElement, event: KeyboardEvent) => {
  if (event.key !== 'Tab') {
    return
  }

  const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter((item) => !item.hasAttribute('disabled'))

  if (!focusable.length) {
    event.preventDefault()
    return
  }

  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  const active = document.activeElement

  if (event.shiftKey && active === first) {
    event.preventDefault()
    last.focus()
    return
  }

  if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus()
  }
}

/**
 * @title focusSoon
 * @description Focuses target element on next frame after modal mount.
 */
const focusSoon = (element: HTMLElement) => {
  window.requestAnimationFrame(() => {
    element.focus()
    if (element instanceof HTMLInputElement) {
      element.select()
    }
  })
}

/**
 * @title promptText
 * @description Opens text-input modal and resolves with trimmed text or null.
 */
export const promptText = (options: PromptTextOptions): Promise<string | null> => {
  return new Promise((resolve) => {
    const shell = createModalShell(options.title, options.description)
    const confirmLabel = options.confirmLabel ?? 'Save'
    const cancelLabel = options.cancelLabel ?? 'Cancel'

    const input = document.createElement('input')
    input.type = 'text'
    input.value = options.defaultValue ?? ''
    input.placeholder = options.placeholder ?? ''
    input.className = 'w-full rounded-lg border border-border-strong bg-bg-elevated px-4 py-2.5 text-sm text-text-bright outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary transition-all shadow-inner'
    shell.body.appendChild(input)

    const cancelButton = document.createElement('button')
    cancelButton.type = 'button'
    cancelButton.className = 'px-4 py-2 rounded-lg text-xs font-bold text-text-dim hover:text-text-bright hover:bg-bg-elevated transition-all'
    cancelButton.textContent = cancelLabel

    const confirmButton = document.createElement('button')
    confirmButton.type = 'button'
    confirmButton.className = 'px-5 py-2 rounded-lg text-xs font-bold text-bg-base bg-accent-primary hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-accent-primary/10'
    confirmButton.textContent = confirmLabel

    shell.footer.append(cancelButton, confirmButton)

    let settled = false

    const finalize = (value: string | null) => {
      if (settled) {
        return
      }
      settled = true
      document.removeEventListener('keydown', onKeyDown)
      shell.teardown()
      resolve(value)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        finalize(null)
        return
      }

      if (event.key === 'Enter') {
        event.preventDefault()
        finalize(input.value.trim())
        return
      }

      trapFocus(shell.panel, event)
    }

    cancelButton.addEventListener('click', () => finalize(null))
    confirmButton.addEventListener('click', () => finalize(input.value.trim()))
    shell.overlay.addEventListener('click', (event) => {
      if (event.target === shell.overlay) {
        finalize(null)
      }
    })

    document.addEventListener('keydown', onKeyDown)
    focusSoon(input)
  })
}

/**
 * @title confirmAction
 * @description Opens confirmation modal and resolves true on explicit confirm.
 */
export const confirmAction = (options: ConfirmActionOptions): Promise<boolean> => {
  return new Promise((resolve) => {
    const shell = createModalShell(options.title, options.description)
    const confirmLabel = options.confirmLabel ?? 'Confirm'
    const cancelLabel = options.cancelLabel ?? 'Cancel'

    const toneClass = options.tone === 'danger'
      ? 'px-5 py-2 rounded-lg text-xs font-bold text-bg-base bg-accent-danger hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-accent-danger/10'
      : 'px-5 py-2 rounded-lg text-xs font-bold text-bg-base bg-accent-primary hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-accent-primary/10'

    const cancelButton = document.createElement('button')
    cancelButton.type = 'button'
    cancelButton.className = 'px-4 py-2 rounded-lg text-xs font-bold text-text-dim hover:text-text-bright hover:bg-bg-elevated transition-all'
    cancelButton.textContent = cancelLabel

    const confirmButton = document.createElement('button')
    confirmButton.type = 'button'
    confirmButton.className = toneClass
    confirmButton.textContent = confirmLabel

    shell.footer.append(cancelButton, confirmButton)

    let settled = false

    const finalize = (value: boolean) => {
      if (settled) {
        return
      }
      settled = true
      document.removeEventListener('keydown', onKeyDown)
      shell.teardown()
      resolve(value)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        finalize(false)
        return
      }

      if (event.key === 'Enter') {
        event.preventDefault()
        finalize(true)
        return
      }

      trapFocus(shell.panel, event)
    }

    cancelButton.addEventListener('click', () => finalize(false))
    confirmButton.addEventListener('click', () => finalize(true))
    shell.overlay.addEventListener('click', (event) => {
      if (event.target === shell.overlay) {
        finalize(false)
      }
    })

    document.addEventListener('keydown', onKeyDown)
    focusSoon(confirmButton)
  })
}
