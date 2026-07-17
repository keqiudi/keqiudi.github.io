/* Desktop navigation: explicit click-to-open menus that survive the homepage layers. */
(() => {
  const desktopQuery = window.matchMedia('(min-width: 769px)');
  const itemSelector = '#page-header #nav #menus .menus_item';

  const closeMenus = (except) => {
    document.querySelectorAll(`${itemSelector}.cyber-menu-open`).forEach((item) => {
      if (item === except) return;
      item.classList.remove('cyber-menu-open');
      item.querySelector(':scope > a')?.setAttribute('aria-expanded', 'false');
    });
  };

  const bindMenus = () => {
    if (!desktopQuery.matches) {
      closeMenus();
      return;
    }

    document.querySelectorAll(`${itemSelector} > a`).forEach((trigger) => {
      if (trigger.dataset.cyberMenuBound === 'true') return;

      const item = trigger.closest('.menus_item');
      const childMenu = item?.querySelector(':scope > .menus_item_child');
      if (!item || !childMenu) return;

      trigger.dataset.cyberMenuBound = 'true';
      trigger.setAttribute('aria-haspopup', 'true');
      trigger.setAttribute('aria-expanded', 'false');

      trigger.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();

        const shouldOpen = !item.classList.contains('cyber-menu-open');
        closeMenus(item);
        item.classList.toggle('cyber-menu-open', shouldOpen);
        trigger.setAttribute('aria-expanded', String(shouldOpen));
      });
    });
  };

  document.addEventListener('click', (event) => {
    if (!event.target.closest('#page-header #nav #menus')) closeMenus();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenus();
  });

  document.addEventListener('DOMContentLoaded', bindMenus, { once: true });
  document.addEventListener('pjax:complete', bindMenus);
  desktopQuery.addEventListener('change', bindMenus);

  // The script is injected after the header markup, so bind now as well as
  // after DOMContentLoaded. This avoids a delayed first click on slow pages.
  bindMenus();
})();
