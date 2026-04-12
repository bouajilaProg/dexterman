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
  overlay.className = 'fixed inset-0 z-[120] bg-[#0b0e14]/70 backdrop-blur-[1px] flex items-center justify-center p-4'

  const panel = document.createElement('section')
  panel.className = 'w-full max-w-md rounded-lg border border-[#292e42] bg-[#16161e] shadow-2xl'
  panel.setAttribute('role', 'dialog')
  panel.setAttribute('aria-modal', 'true')

  const header = document.createElement('header')
  header.className = 'px-4 py-3 border-b border-[#292e42]'

  const heading = document.createElement('h2')
  heading.className = 'text-sm font-bold text-[#c0caf5]'
  heading.textContent = title
  header.appendChild(heading)

  if (description) {
    const paragraph = document.createElement('p')
    paragraph.className = 'mt-1 text-xs text-[#9aa5ce]'
    paragraph.textContent = description
    header.appendChild(paragraph)
  }

  const body = document.createElement('div')
  body.className = 'px-4 py-3'

  const footer = document.createElement('footer')
  footer.className = 'px-4 py-3 border-t border-[#292e42] flex items-center justify-end gap-2'

  panel.append(header, body, footer)
  overlay.appendChild(panel)
  document.body.appendChild(overlay)
  document.body.style.overflow = 'hidden'

  const teardown = () => {
    overlay.remove()
    document.body.style.overflow = previousOverflow
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
    input.className = 'w-full rounded border border-[#3b4261] bg-[#1a1b26] px-3 py-2 text-sm text-[#c0caf5] outline-none focus:border-[#7aa2f7]'
    shell.body.appendChild(input)

    const cancelButton = document.createElement('button')
    cancelButton.type = 'button'
    cancelButton.className = 'px-3 py-1.5 rounded text-xs font-semibold text-[#9aa5ce] bg-[#1f2335] hover:bg-[#292e42] transition-colors'
    cancelButton.textContent = cancelLabel

    const confirmButton = document.createElement('button')
    confirmButton.type = 'button'
    confirmButton.className = 'px-3 py-1.5 rounded text-xs font-semibold text-[#1a1b26] bg-[#7aa2f7] hover:bg-[#89b4fa] transition-colors'
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
      ? 'px-3 py-1.5 rounded text-xs font-semibold text-[#1a1b26] bg-[#f7768e] hover:bg-[#ff8fa3] transition-colors'
      : 'px-3 py-1.5 rounded text-xs font-semibold text-[#1a1b26] bg-[#7aa2f7] hover:bg-[#89b4fa] transition-colors'

    const cancelButton = document.createElement('button')
    cancelButton.type = 'button'
    cancelButton.className = 'px-3 py-1.5 rounded text-xs font-semibold text-[#9aa5ce] bg-[#1f2335] hover:bg-[#292e42] transition-colors'
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
