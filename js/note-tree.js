(function () {
  const ROOT_ID = '__note_mindmap_root__';
  const ROOT_TITLE = '个人知识树';
  const accents = ['#2f6df6', '#18a058', '#f97316', '#8b5cf6', '#0ea5e9', '#f04f88', '#14b8a6', '#eab308'];
  let activeViewport = null;
  let contextGuardInstalled = false;
  let resizeGuardInstalled = false;

  const state = {
    data: [],
    expanded: new Set(),
    selected: '',
    query: '',
    hovered: '',
    zoom: 1,
    centered: false,
    dragging: false
  };

  function getRoot() {
    if (window.GLOBAL_CONFIG && typeof window.GLOBAL_CONFIG.root === 'string') {
      return window.GLOBAL_CONFIG.root.endsWith('/') ? window.GLOBAL_CONFIG.root : `${window.GLOBAL_CONFIG.root}/`;
    }
    return '/';
  }

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function treeUrl(container) {
    const src = container.dataset.treeSrc || '/notes-tree.json';
    if (/^https?:\/\//.test(src)) return src;
    return `${getRoot()}${src.replace(/^\/+/, '')}`;
  }

  function pageUrl(href) {
    if (!href) return '';
    if (/^https?:\/\//.test(href)) return href;
    return `${getRoot()}${href.replace(/^\/+/, '')}`;
  }

  function nodeId(pathParts) {
    return pathParts.join('/');
  }

  function itemText(node, pathParts) {
    return normalize([node.name, node.type, node.modifiedTime, node.fileType, node.linkedTitle, pathParts.join('/')].join(' '));
  }

  function isFolder(node) {
    return node && node.type === 'folder';
  }

  function hasChildren(node) {
    return isFolder(node) && Array.isArray(node.children) && node.children.length > 0;
  }

  function matchesSelf(node, pathParts) {
    const query = normalize(state.query);
    return !query || itemText(node, pathParts).includes(query);
  }

  function hasMatchedDescendant(node, pathParts) {
    if (!hasChildren(node)) return false;
    return node.children.some((child) => {
      const childPath = pathParts.concat(child.name);
      return matchesSelf(child, childPath) || hasMatchedDescendant(child, childPath);
    });
  }

  function isVisible(node, pathParts) {
    if (!normalize(state.query)) return true;
    return matchesSelf(node, pathParts) || hasMatchedDescendant(node, pathParts);
  }

  function shouldShowChildren(node, id) {
    if (!hasChildren(node)) return false;
    if (normalize(state.query)) return true;
    return state.expanded.has(id);
  }

  function collectFolderIds(nodes, pathParts, target) {
    nodes.forEach((node) => {
      const current = pathParts.concat(node.name);
      if (hasChildren(node)) {
        target.add(nodeId(current));
        collectFolderIds(node.children, current, target);
      }
    });
  }

  function clampZoom(value) {
    return Math.min(1.6, Math.max(0.45, value));
  }

  function zoomLabel() {
    return `${Math.round(state.zoom * 100)}%`;
  }

  function branchAccent(pathParts) {
    const first = pathParts[0] || ROOT_TITLE;
    let hash = 0;
    for (let i = 0; i < first.length; i += 1) hash = (hash + first.charCodeAt(i)) % accents.length;
    return accents[hash];
  }

  function nodeIcon(node, depth) {
    if (depth < 0) return '▣';
    if (isFolder(node)) return depth === 0 ? '▤' : '◇';
    return node.path ? '↗' : '·';
  }

  function nodeMeta(node) {
    if (isFolder(node)) return `${node.publishedCount || 0}/${node.noteCount || 0}`;
    return node.path ? '文章' : '本地';
  }

  function renderToolbar(stats) {
    return `
      <div class="note-mindmap-top">
        <div class="note-mindmap-brand">
          <span class="note-mindmap-logo" aria-hidden="true">▣</span>
          <div>
            <h2>个人知识树 · 笔记导航</h2>
            <p>系统化学习 · 知识可视化 · 静态生成</p>
          </div>
        </div>
        <div class="note-mindmap-actions">
          <label class="note-mindmap-search" for="noteExplorerSearch">
            <span aria-hidden="true">⌕</span>
            <input id="noteExplorerSearch" type="search" placeholder="搜索笔记..." value="${escapeHtml(state.query)}">
          </label>
          <div class="note-mindmap-zoom" aria-label="知识树缩放">
            <button type="button" data-note-action="zoom-out" title="缩小">−</button>
            <button type="button" data-note-action="zoom-reset" title="恢复默认比例">${zoomLabel()}</button>
            <button type="button" data-note-action="zoom-in" title="放大">+</button>
          </div>
          <button type="button" data-note-action="expand">全部展开</button>
          <button type="button" data-note-action="collapse">全部折叠</button>
        </div>
      </div>
      <div class="note-mindmap-stats">
        <span><strong>${stats.totalNotes || 0}</strong> 篇笔记</span>
        <span><strong>${stats.publishedNotes || 0}</strong> 篇可跳转</span>
        <span><strong>${stats.topLevelCount || 0}</strong> 个一级分类</span>
      </div>
    `;
  }

  function renderNodeCard(node, pathParts, depth) {
    const id = depth < 0 ? ROOT_ID : nodeId(pathParts);
    const folder = depth < 0 || isFolder(node);
    const expanded = depth < 0 || shouldShowChildren(node, id);
    const matched = depth >= 0 && normalize(state.query) && matchesSelf(node, pathParts);
    const selected = state.selected === id;
    const className = [
      'mind-node',
      depth < 0 ? 'is-root' : '',
      folder ? 'is-category' : 'is-article',
      !folder && node.path ? 'is-linked' : '',
      !folder && !node.path ? 'is-local' : '',
      expanded ? 'is-open' : '',
      matched ? 'is-match' : '',
      selected ? 'is-selected' : ''
    ].filter(Boolean).join(' ');
    const title = depth < 0 ? ROOT_TITLE : node.name;
    const meta = depth < 0 ? `${state.data.length} 类` : nodeMeta(node);
    const attrs = [
      `class="${className}"`,
      `data-node-id="${escapeHtml(id)}"`,
      `data-node-type="${folder ? 'folder' : 'file'}"`,
      node && node.path ? `data-href="${escapeHtml(node.path)}"` : ''
    ].filter(Boolean).join(' ');

    return `
      <button type="button" ${attrs} title="${escapeHtml(title)}">
        <span class="mind-icon" aria-hidden="true">${escapeHtml(nodeIcon(node || {}, depth))}</span>
        <span class="mind-title">${escapeHtml(title)}</span>
        <span class="mind-meta">${escapeHtml(meta)}</span>
        ${folder && depth >= 0 ? `<span class="mind-toggle" aria-hidden="true">${expanded ? '−' : '+'}</span>` : ''}
      </button>
    `;
  }

  function renderBranches(nodes, pathParts, depth, side) {
    const visibleNodes = nodes.filter((node) => isVisible(node, pathParts.concat(node.name)));
    if (visibleNodes.length === 0) return '';

    return `
      <div class="mind-children is-${side} depth-${depth}">
        ${visibleNodes.map((node) => {
          const current = pathParts.concat(node.name);
          const id = nodeId(current);
          const parentId = pathParts.length > 0 ? nodeId(pathParts) : ROOT_ID;
          const showChildren = shouldShowChildren(node, id);
          const accent = branchAccent(current);
          const branchClass = [
            'mind-branch',
            `is-${side}`,
            `depth-${depth}`,
            state.hovered === id ? 'is-hovered' : ''
          ].join(' ');
          return `
            <div class="${branchClass}" data-node-id="${escapeHtml(id)}" data-parent-id="${escapeHtml(parentId)}" data-side="${side}" style="--mind-accent:${accent}">
              ${renderNodeCard(node, current, depth)}
              ${showChildren ? renderBranches(node.children || [], current, depth + 1, side) : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function splitTopLevel(tree) {
    const visibleTree = tree.filter((node) => isVisible(node, [node.name]));
    const left = [];
    const right = [];
    visibleTree.forEach((node, index) => {
      if (index % 2 === 0) left.push(node);
      else right.push(node);
    });
    return { left, right };
  }

  function render(container, payload) {
    const tree = Array.isArray(payload.tree) ? payload.tree : [];
    if (tree.length === 0) {
      container.innerHTML = '<div class="note-explorer-state">暂无笔记</div>';
      return;
    }

    const groups = splitTopLevel(tree);
    const leftHtml = renderBranches(groups.left, [], 0, 'left');
    const rightHtml = renderBranches(groups.right, [], 0, 'right');
    container.innerHTML = `
      ${renderToolbar(payload.stats || {})}
      <div class="note-mindmap-viewport" aria-label="知识树导航">
        <div class="note-mindmap-canvas" style="--mind-scale:${state.zoom}">
          <svg class="mind-links" aria-hidden="true"></svg>
          <div class="mind-root-wrap" style="--mind-accent:#ef4444">
            <div class="mind-side is-left">${leftHtml}</div>
            <div class="mind-center">${renderNodeCard(null, [], -1)}</div>
            <div class="mind-side is-right">${rightHtml}</div>
            ${leftHtml || rightHtml ? '' : '<div class="note-explorer-state">没有匹配的笔记</div>'}
          </div>
        </div>
      </div>
    `;
  }

  function focusSearch(container, selectionStart, selectionEnd) {
    const input = container.querySelector('#noteExplorerSearch');
    if (!input) return;
    input.focus({ preventScroll: true });
    if (typeof input.setSelectionRange === 'function' && selectionStart !== null && selectionStart !== undefined) {
      input.setSelectionRange(selectionStart, selectionEnd ?? selectionStart);
    }
  }

  function rerender(container, payload, options) {
    render(container, payload);
    bind(container, payload);
    scheduleDrawLinks(container);
    if (options && options.focusSearch) {
      focusSearch(container, options.selectionStart, options.selectionEnd);
    }
    if (options && options.centerRoot) {
      requestAnimationFrame(() => centerRoot(container));
    }
  }

  function scheduleDrawLinks(container) {
    requestAnimationFrame(() => {
      drawLinks(container);
      requestAnimationFrame(() => drawLinks(container));
    });
  }

  function nodeSelector(id) {
    if (window.CSS && typeof window.CSS.escape === 'function') return `[data-node-id="${CSS.escape(id)}"]`;
    return `[data-node-id="${String(id).replace(/"/g, '\\"')}"]`;
  }

  function getNodePoint(node, canvas, side, edge) {
    const nodeRect = node.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const zoom = state.zoom || 1;
    const x = edge === 'left' ? nodeRect.left : edge === 'right' ? nodeRect.right : nodeRect.left + nodeRect.width / 2;
    return {
      x: (x - canvasRect.left) / zoom,
      y: (nodeRect.top + nodeRect.height / 2 - canvasRect.top) / zoom,
      side
    };
  }

  function drawLinks(container) {
    const canvas = container.querySelector('.note-mindmap-canvas');
    const svg = container.querySelector('.mind-links');
    if (!canvas || !svg) return;

    const width = Math.max(canvas.offsetWidth, canvas.scrollWidth);
    const height = Math.max(canvas.offsetHeight, canvas.scrollHeight);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.innerHTML = '';

    const branches = Array.from(container.querySelectorAll('.mind-branch[data-parent-id]'));
    const paths = [];
    branches.forEach((branch) => {
      const child = branch.querySelector(':scope > .mind-node');
      if (!child) return;

      const parentId = branch.dataset.parentId;
      const side = branch.dataset.side === 'left' ? 'left' : 'right';
      const parent = parentId === ROOT_ID
        ? container.querySelector('.mind-node.is-root')
        : container.querySelector(`${nodeSelector(parentId)} > .mind-node, .mind-node${nodeSelector(parentId)}`);
      if (!parent) return;

      const fromEdge = side === 'left' ? 'left' : 'right';
      const toEdge = side === 'left' ? 'right' : 'left';
      const from = getNodePoint(parent, canvas, side, fromEdge);
      const to = getNodePoint(child, canvas, side, toEdge);
      const distance = Math.max(44, Math.abs(to.x - from.x));
      const curve = Math.min(120, distance * 0.52);
      const c1x = side === 'left' ? from.x - curve : from.x + curve;
      const c2x = side === 'left' ? to.x + curve : to.x - curve;
      const accent = branch.style.getPropertyValue('--mind-accent') || '#2f6df6';
      paths.push(`<path d="M ${from.x.toFixed(1)} ${from.y.toFixed(1)} C ${c1x.toFixed(1)} ${from.y.toFixed(1)}, ${c2x.toFixed(1)} ${to.y.toFixed(1)}, ${to.x.toFixed(1)} ${to.y.toFixed(1)}" stroke="${escapeHtml(accent.trim())}" />`);
    });

    svg.innerHTML = paths.join('');
  }

  function centerRoot(container) {
    const viewport = container.querySelector('.note-mindmap-viewport');
    const root = container.querySelector('.mind-node.is-root');
    if (!viewport || !root) return;
    const viewportRect = viewport.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    const rootCenterX = rootRect.left - viewportRect.left + viewport.scrollLeft + rootRect.width / 2;
    const rootCenterY = rootRect.top - viewportRect.top + viewport.scrollTop + rootRect.height / 2;
    viewport.scrollLeft = rootCenterX - viewportRect.width / 2;
    viewport.scrollTop = rootCenterY - viewportRect.height / 2;
  }

  function applyZoom(container) {
    const canvas = container.querySelector('.note-mindmap-canvas');
    const resetButton = container.querySelector('[data-note-action="zoom-reset"]');
    if (canvas) canvas.style.setProperty('--mind-scale', state.zoom);
    if (resetButton) resetButton.textContent = zoomLabel();
  }

  function setZoom(container, nextZoom, anchor) {
    const viewport = container.querySelector('.note-mindmap-viewport');
    const oldZoom = state.zoom;
    const next = clampZoom(nextZoom);
    if (Math.abs(next - oldZoom) < 0.001) return;

    let worldX = null;
    let worldY = null;
    if (viewport) {
      const rect = viewport.getBoundingClientRect();
      const anchorX = anchor ? anchor.x : rect.width / 2;
      const anchorY = anchor ? anchor.y : rect.height / 2;
      worldX = (viewport.scrollLeft + anchorX) / oldZoom;
      worldY = (viewport.scrollTop + anchorY) / oldZoom;
    }

    state.zoom = next;
    applyZoom(container);

    if (viewport && worldX !== null && worldY !== null) {
      const rect = viewport.getBoundingClientRect();
      const anchorX = anchor ? anchor.x : rect.width / 2;
      const anchorY = anchor ? anchor.y : rect.height / 2;
      viewport.scrollLeft = worldX * next - anchorX;
      viewport.scrollTop = worldY * next - anchorY;
    }
    scheduleDrawLinks(container);
  }

  function bind(container, payload) {
    const input = container.querySelector('#noteExplorerSearch');
    if (input) {
      let isComposing = false;
      const updateSearch = () => {
        const selectionStart = input.selectionStart;
        const selectionEnd = input.selectionEnd;
        state.query = input.value;
        rerender(container, payload, { focusSearch: true, selectionStart, selectionEnd });
      };
      input.addEventListener('compositionstart', () => {
        isComposing = true;
      });
      input.addEventListener('compositionend', () => {
        isComposing = false;
        updateSearch();
      });
      input.addEventListener('input', () => {
        if (!isComposing) updateSearch();
      });
    }

    container.querySelectorAll('[data-note-action]').forEach((button) => {
      button.addEventListener('click', () => {
        const action = button.dataset.noteAction;
        if (action === 'expand') {
          const ids = new Set();
          collectFolderIds(state.data, [], ids);
          state.expanded = ids;
        }
        if (action === 'collapse') state.expanded = new Set();
        if (action === 'zoom-in') {
          setZoom(container, state.zoom + 0.1);
          return;
        }
        if (action === 'zoom-out') {
          setZoom(container, state.zoom - 0.1);
          return;
        }
        if (action === 'zoom-reset') {
          setZoom(container, 1);
          return;
        }
        rerender(container, payload);
      });
    });

    const viewport = container.querySelector('.note-mindmap-viewport');
    if (viewport) {
      activeViewport = viewport;
      if (!contextGuardInstalled) {
        document.addEventListener('contextmenu', (event) => {
          if (activeViewport && activeViewport.contains(event.target)) {
            event.preventDefault();
            event.stopPropagation();
          }
        }, true);
        contextGuardInstalled = true;
      }

      viewport.addEventListener('wheel', (event) => {
        event.preventDefault();
        const rect = viewport.getBoundingClientRect();
        const anchor = { x: event.clientX - rect.left, y: event.clientY - rect.top };
        const step = event.deltaY > 0 ? -0.08 : 0.08;
        setZoom(container, state.zoom + step, anchor);
      }, { passive: false });

      viewport.addEventListener('scroll', () => {
        drawLinks(container);
      }, { passive: true });

      viewport.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        event.stopPropagation();
      }, true);

      viewport.addEventListener('mousedown', (event) => {
        if (event.button !== 2) return;
        event.preventDefault();
        event.stopPropagation();
        state.dragging = true;
        viewport.classList.add('is-panning');

        const startX = event.clientX;
        const startY = event.clientY;
        const scrollLeft = viewport.scrollLeft;
        const scrollTop = viewport.scrollTop;
        const stopPanning = () => {
          state.dragging = false;
          viewport.classList.remove('is-panning');
          document.removeEventListener('mousemove', moveCanvas);
          document.removeEventListener('mouseup', stopPanning);
          document.removeEventListener('mouseleave', stopPanning);
        };

        const moveCanvas = (moveEvent) => {
          if (!state.dragging) return;
          if ((moveEvent.buttons & 2) !== 2) {
            stopPanning();
            return;
          }
          moveEvent.preventDefault();
          viewport.scrollLeft = scrollLeft - (moveEvent.clientX - startX);
          viewport.scrollTop = scrollTop - (moveEvent.clientY - startY);
        };

        const suppressContextMenu = (menuEvent) => {
          menuEvent.preventDefault();
          menuEvent.stopPropagation();
        };

        document.addEventListener('mousemove', moveCanvas);
        document.addEventListener('mouseup', stopPanning);
        document.addEventListener('mouseleave', stopPanning);
        document.addEventListener('contextmenu', suppressContextMenu, { once: true, capture: true });
      });
    }

    container.querySelectorAll('.mind-node').forEach((nodeEl) => {
      nodeEl.addEventListener('mouseenter', () => {
        state.hovered = nodeEl.dataset.nodeId || '';
        nodeEl.closest('.mind-branch')?.classList.add('is-hovered');
      });
      nodeEl.addEventListener('mouseleave', () => {
        state.hovered = '';
        nodeEl.closest('.mind-branch')?.classList.remove('is-hovered');
      });
      nodeEl.addEventListener('click', () => {
        const id = nodeEl.dataset.nodeId;
        const type = nodeEl.dataset.nodeType;
        state.selected = id;
        if (id === ROOT_ID) {
          if (state.expanded.size > 0) state.expanded = new Set();
          else {
            const ids = new Set();
            collectFolderIds(state.data, [], ids);
            state.expanded = ids;
          }
          rerender(container, payload);
          return;
        }
        if (type === 'folder') {
          if (state.expanded.has(id)) state.expanded.delete(id);
          else state.expanded.add(id);
          rerender(container, payload);
          return;
        }
        if (nodeEl.dataset.href) window.location.href = pageUrl(nodeEl.dataset.href);
      });
    });

    if (!resizeGuardInstalled) {
      window.addEventListener('resize', () => {
        const current = document.getElementById('noteExplorer');
        if (current) scheduleDrawLinks(current);
      });
      resizeGuardInstalled = true;
    }
  }

  async function initNoteExplorer() {
    const container = document.getElementById('noteExplorer');
    if (!container || container.dataset.initialized === 'true') return;
    container.dataset.initialized = 'true';

    try {
      const response = await fetch(treeUrl(container), { cache: 'no-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      state.data = Array.isArray(payload.tree) ? payload.tree : [];
      state.expanded = new Set();
      state.selected = '';
      state.hovered = '';
      state.zoom = state.zoom || 1;
      rerender(container, payload, { centerRoot: !state.centered });
      state.centered = true;
    } catch (error) {
      container.innerHTML = '<div class="note-explorer-state">笔记目录加载失败，请先生成 notes-tree.json。</div>';
      console.error('[NoteMindMap]', error);
    }
  }

  document.addEventListener('DOMContentLoaded', initNoteExplorer);
  document.addEventListener('pjax:complete', () => {
    const container = document.getElementById('noteExplorer');
    if (container) container.dataset.initialized = 'false';
    initNoteExplorer();
  });
})();
