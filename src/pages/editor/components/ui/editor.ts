export const attachEditorScript = String.raw`(() => {
  let draggedApiItem = null;

  const clearFolderHighlights = () => {
    document.querySelectorAll('[data-folder-dropzone]').forEach((zone) => {
      zone.classList.remove('ring-1', 'ring-[#7aa2f7]', 'bg-[#7aa2f7]/10');
    });
  };

  const attachEditor = () => {
    document.addEventListener('click', (e) => {
      const target = e.target;
      const trigger = target && target.closest ? target.closest('[data-handler]') : null;
      if (!trigger) return;

      const action = trigger.getAttribute('data-handler');

      if (action === 'add') {
        const targetId = trigger.getAttribute('data-target');
        const tbody = targetId ? document.getElementById(targetId) : null;
        const tplId = trigger.getAttribute('data-tpl');
        const tpl = tplId ? document.getElementById(tplId) : null;

        if (!tbody || !tpl) return;

        const clone = tpl.content.cloneNode(true);
        tbody.appendChild(clone);
      }

      if (action === 'delete') {
        trigger.closest('tr')?.remove();
      }

      if (action === 'toggle') {
        const isYes = trigger.textContent.trim() === 'YES';
        trigger.textContent = isYes ? 'NO' : 'YES';
        if (isYes) {
          trigger.classList.remove('bg-[#7aa2f7]/20', 'text-[#7aa2f7]');
          trigger.classList.add('bg-[#292e42]', 'text-[#565f89]');
        } else {
          trigger.classList.add('bg-[#7aa2f7]/20', 'text-[#7aa2f7]');
          trigger.classList.remove('bg-[#292e42]', 'text-[#565f89]');
        }
      }

      if (window.lucide) window.lucide.createIcons();
    });

    document.addEventListener('dragstart', (e) => {
      const target = e.target;
      const apiItem = target && target.closest ? target.closest('[data-api-item]') : null;
      if (!apiItem) return;

      draggedApiItem = apiItem;
      apiItem.classList.add('opacity-50');

      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', apiItem.getAttribute('data-api-name') || 'api');
      }
    });

    document.addEventListener('dragend', () => {
      if (draggedApiItem) {
        draggedApiItem.classList.remove('opacity-50');
      }
      draggedApiItem = null;
      clearFolderHighlights();
    });

    document.addEventListener('dragover', (e) => {
      const target = e.target;
      const dropzone = target && target.closest ? target.closest('[data-folder-dropzone]') : null;
      if (!dropzone || !draggedApiItem) return;

      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'move';
      }

      clearFolderHighlights();
      dropzone.classList.add('ring-1', 'ring-[#7aa2f7]', 'bg-[#7aa2f7]/10');
    });

    document.addEventListener('drop', (e) => {
      const target = e.target;
      const dropzone = target && target.closest ? target.closest('[data-folder-dropzone]') : null;
      if (!dropzone || !draggedApiItem) return;

      e.preventDefault();

      const list = dropzone.querySelector('[data-folder-list]');
      if (!list) return;

      list.appendChild(draggedApiItem);
      clearFolderHighlights();
      draggedApiItem.classList.remove('opacity-50');
      draggedApiItem = null;
      if (window.lucide) window.lucide.createIcons();
    });
  };

  attachEditor();
  if (window.lucide) window.lucide.createIcons();
})();`;
