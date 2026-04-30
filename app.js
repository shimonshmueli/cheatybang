// SPDX-License-Identifier: MIT
// By Shimon Shmueli
// CheatyBang — Alpine component: filters, fuzzy search, modal, theme.

const ENV_HEX = {
  desktop: '#d97706', // amber-600
  cli:     '#059669', // emerald-600
  vscode:  '#0284c7', // sky-600
  cursor:  '#7c3aed', // violet-600
};

const LEVEL_HEX = {
  beginner: '#059669', // emerald-600
  mid:      '#d97706', // amber-600
  pro:      '#e11d48', // rose-600
};

const LEVEL_TIER = { beginner: 1, mid: 2, pro: 3 };

function cheatyBang() {
  return {
    // ---- state ----
    loaded: false,
    data: { envs: [], levels: [], categories: [], version: '0.1.0' },
    env: 'cli',
    level: 'mid',
    query: '',
    theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    schemeLight: 'indigo',  // scheme used when theme === 'light'
    schemeDark:  'indigo',  // scheme used when theme === 'dark'
    brightness: 1,          // dark-mode brightness multiplier (0.7–1.3)
    columns: 3,             // grid column count: 1, 2, or 3
    density: 'cozy',        // 'compact' | 'cozy' | 'comfortable'
    envFilter: 'dim',       // 'dim' | 'hide' — what to do with non-applicable items
    pinned: [],             // array of pinned item IDs (preserves order of pinning)
    tagFilter: null,        // when set, show only items with this tag (ephemeral)
    settingsOpen: false,
    glossary: { terms: [] },
    glossaryOpen: false,
    decisions: { trees: [] },
    decisionsOpen: false,
    decisionTreeId: null,    // active tree's id, or null = picker view
    decisionPath: [],        // stack of node ids visited (last = current)
    aboutOpen: false,
    categoryInfoItem: null,
    collapsed: {},
    modalItem: null,
    modalEnv: 'cli',
    _fuse: null,
    _allItems: [],

    schemes: [
      { id: 'indigo',  label: 'Indigo',  swatch: '#4f46e5', hint: 'Default — focused' },
      { id: 'claude',  label: 'Claude',  swatch: '#c4602f', hint: 'Warm coral on cream' },
      { id: 'slate',   label: 'Slate',   swatch: '#475569', hint: 'Quiet, no accent' },
      { id: 'emerald', label: 'Emerald', swatch: '#059669', hint: 'Calm green' },
    ],

    // ---- lifecycle ----
    async init() {
      this._loadPrefs();

      // Persist prefs whenever they change.
      this.$watch('theme',       () => this._savePrefs());
      this.$watch('schemeLight', () => this._savePrefs());
      this.$watch('schemeDark',  () => this._savePrefs());
      this.$watch('brightness',  () => this._savePrefs());
      this.$watch('columns',     () => this._savePrefs());
      this.$watch('density',     () => this._savePrefs());
      this.$watch('envFilter',   () => this._savePrefs());
      this.$watch('env',         () => this._savePrefs());
      this.$watch('level',       () => this._savePrefs());
      this.$watch('collapsed',   () => this._savePrefs(), { deep: true });
      this.$watch('pinned',      () => this._savePrefs(), { deep: true });

      try {
        const res = await fetch('content/cheatsheet.json', { cache: 'no-cache' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        this.data = await res.json();
      } catch (err) {
        console.error('Failed to load cheatsheet:', err);
        this.data = { envs: [], levels: [], categories: [], version: '0.0.0' };
      }

      try {
        const res = await fetch('content/glossary.json', { cache: 'no-cache' });
        if (res.ok) this.glossary = await res.json();
      } catch (err) {
        console.warn('Failed to load glossary:', err);
      }

      try {
        const res = await fetch('content/decisions.json', { cache: 'no-cache' });
        if (res.ok) this.decisions = await res.json();
      } catch (err) {
        console.warn('Failed to load decisions:', err);
      }

      // Flatten all items for Fuse, keeping a back-reference to the category.
      this._allItems = [];
      for (const cat of this.data.categories) {
        for (const item of cat.items) {
          this._allItems.push({ ...item, _categoryId: cat.id });
        }
      }

      // Wait for Fuse to be available (CDN script is `defer`-loaded in parallel).
      await this._waitForFuse();
      this._fuse = new Fuse(this._allItems, {
        keys: [
          { name: 'title',   weight: 0.45 },
          { name: 'summary', weight: 0.25 },
          { name: 'tags',    weight: 0.20 },
          { name: 'details', weight: 0.10 },
        ],
        threshold: 0.38,
        ignoreLocation: true,
        minMatchCharLength: 2,
      });

      this.modalEnv = this.env;
      this.loaded = true;

      // Deep-link support: open a specific item if URL has #item=<id>
      this._openFromHash();
      window.addEventListener('hashchange', () => this._openFromHash());

      // Re-syntax-highlight whenever the modal's item or env tab changes.
      this.$watch('modalItem', () => this._highlightCode());
      this.$watch('modalEnv',  () => this._highlightCode());
    },

    _highlightCode() {
      // Wait for Alpine to re-render x-text and class bindings, then run Prism
      // over every code block currently in the open modal.
      this.$nextTick(() => {
        if (!window.Prism || typeof Prism.highlightElement !== 'function') return;
        const blocks = document.querySelectorAll('.modal-code-block');
        blocks.forEach((el) => Prism.highlightElement(el));
      });
    },

    _openFromHash() {
      const hash = window.location.hash || '';

      if (hash === '#glossary') {
        if (this.modalItem)    this.closeModal({ skipHash: true });
        if (this.decisionsOpen) this.closeDecisions({ skipHash: true });
        if (!this.glossaryOpen) this.openGlossary({ skipHash: true });
        return;
      }

      if (hash === '#decide') {
        if (this.modalItem)    this.closeModal({ skipHash: true });
        if (this.glossaryOpen) this.closeGlossary({ skipHash: true });
        if (!this.decisionsOpen) this.openDecisions({ skipHash: true });
        return;
      }

      const m = hash.match(/^#item=([\w-]+)$/);
      if (m) {
        if (this.glossaryOpen)  this.closeGlossary({ skipHash: true });
        if (this.decisionsOpen) this.closeDecisions({ skipHash: true });
        const item = this._allItems.find((it) => it.id === m[1]);
        if (item && (!this.modalItem || this.modalItem.id !== item.id)) {
          this.openItem(item, { skipHash: true });
        }
        return;
      }

      if (this.modalItem)     this.closeModal({ skipHash: true });
      if (this.glossaryOpen)  this.closeGlossary({ skipHash: true });
      if (this.decisionsOpen) this.closeDecisions({ skipHash: true });
    },

    async _waitForFuse() {
      if (typeof Fuse !== 'undefined') return;
      await new Promise((resolve) => {
        const id = setInterval(() => {
          if (typeof Fuse !== 'undefined') { clearInterval(id); resolve(); }
        }, 20);
      });
    },

    // ---- helpers ----
    envColor(id)   { return ENV_HEX[id]   || '#64748b'; },
    levelColor(id) { return LEVEL_HEX[id] || '#64748b'; },
    envLabel(id)   { return (this.data.envs.find(e => e.id === id) || {}).label || id; },
    levelLabel(id) { return (this.data.levels.find(l => l.id === id) || {}).label || id; },

    /** Tier filter: beginner=1, mid=2, pro=3. Show all items <= selected tier. */
    matchesLevel(item) {
      return (LEVEL_TIER[item.level] || 99) <= (LEVEL_TIER[this.level] || 0);
    },

    /** True if the item applies to the currently selected env. Items without an envs[] apply everywhere. */
    appliesToEnv(item) {
      if (!item.envs || item.envs.length === 0) return true;
      return item.envs.includes(this.env);
    },

    isPinned(itemId) { return this.pinned.includes(itemId); },

    togglePin(itemId) {
      const idx = this.pinned.indexOf(itemId);
      if (idx >= 0) this.pinned.splice(idx, 1);
      else          this.pinned.push(itemId);
    },

    /** Apply a tag filter, close any open modal, and scroll back to the top so the user sees the filtered list. */
    filterByTag(tag) {
      this.tagFilter = tag;
      this.closeModal();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    /** Items currently visible on the page, deduped, in display order. Drives modal Prev/Next. */
    get flatVisibleItems() {
      const seen = new Set();
      const list = [];
      for (const cat of this.visibleCategories) {
        for (const it of cat._visibleItems) {
          if (seen.has(it.id)) continue;
          seen.add(it.id);
          list.push(it);
        }
      }
      return list;
    },

    modalPrev() { this._modalStep(-1); },
    modalNext() { this._modalStep(+1); },
    _modalStep(dir) {
      if (!this.modalItem) return;
      const list = this.flatVisibleItems;
      if (list.length === 0) return;
      const idx = list.findIndex((it) => it.id === this.modalItem.id);
      const ni = idx < 0 ? 0 : (idx + dir + list.length) % list.length;
      this.openItem(list[ni]);
    },

    /** Global keyboard shortcuts: Cmd/Ctrl+K and '/' focus search; ←/→ navigate modal. */
    handleGlobalKey(ev) {
      if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'k') {
        ev.preventDefault();
        this._focusSearch();
        return;
      }
      if (ev.key === '/' && !ev.metaKey && !ev.ctrlKey && !ev.altKey) {
        const t = ev.target;
        const tag = t && t.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || (t && t.isContentEditable)) return;
        ev.preventDefault();
        this._focusSearch();
        return;
      }
      if (this.modalItem && (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight')) {
        if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
        ev.preventDefault();
        if (ev.key === 'ArrowLeft') this.modalPrev();
        else                        this.modalNext();
        return;
      }

      // Grid navigation: when focus is on an item button, arrows move spatially.
      if (!this.modalItem && !this.settingsOpen) {
        const t = ev.target;
        if (!(t instanceof HTMLElement) || !t.classList.contains('item-button')) return;
        const dirs = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -this.columns, ArrowDown: this.columns };
        if (!(ev.key in dirs)) return;
        if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
        ev.preventDefault();
        const buttons = Array.from(document.querySelectorAll('.item-button'));
        const i = buttons.indexOf(t);
        if (i < 0) return;
        const next = i + dirs[ev.key];
        if (next >= 0 && next < buttons.length) {
          buttons[next].focus();
          buttons[next].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }
    },

    _focusSearch() {
      const el = this.$refs && this.$refs.search;
      if (!el) return;
      el.focus();
      el.select();
    },

    /** Which env tabs are *specifically* covered by this item (for the dot row on the tile). */
    itemEnvs(item) {
      if (item.envExamples && Object.keys(item.envExamples).length) {
        return Object.keys(item.envExamples);
      }
      // Has only a default — applies to all envs.
      return this.data.envs.map(e => e.id);
    },

    /**
     * Resolve which examples to show in the modal for the active env.
     * Supports both shapes — singleton `example` / `envExamples[env]`, and
     * arrays `examples` / `envExamples[env]: [...]`. Always returns an array
     * plus a `fallback` flag (true when the env has no specific override and
     * we're showing the default).
     */
    exampleFor(item, envId) {
      const hasEnvOverrides = item.envExamples && Object.keys(item.envExamples).length > 0;
      const override = item.envExamples && item.envExamples[envId];

      let examples;
      let fallback = false;

      if (override) {
        examples = Array.isArray(override) ? override : [override];
      } else {
        if (Array.isArray(item.examples) && item.examples.length > 0) {
          examples = item.examples;
        } else if (item.example) {
          examples = [item.example];
        } else {
          examples = [{ code: '(no example yet)', note: '', lang: 'text' }];
        }
        fallback = hasEnvOverrides;
      }

      return { examples, fallback };
    },

    // ---- derived ----
    get visibleCategories() {
      const q = this.query.trim();
      let pool = this._allItems.filter((it) => this.matchesLevel(it));

      // Strict env filtering: hide non-applicable items entirely.
      if (this.envFilter === 'hide') {
        pool = pool.filter((it) => this.appliesToEnv(it));
      }

      // Tag filter (composes with search).
      if (this.tagFilter) {
        pool = pool.filter((it) => Array.isArray(it.tags) && it.tags.includes(this.tagFilter));
      }

      if (q.length >= 2 && this._fuse) {
        const ids = new Set(this._fuse.search(q).map((r) => r.item.id));
        pool = pool.filter((it) => ids.has(it.id));
      }

      // Re-bucket by category, preserving the data file's order.
      const byCat = new Map(pool.map((it) => [it.id, it]));
      const result = [];
      for (const cat of this.data.categories) {
        const items = cat.items.filter((it) => byCat.has(it.id));
        if (items.length === 0) continue;
        result.push({ ...cat, _visibleItems: items });
      }

      // Prepend a synthetic "Pinned" pseudo-category if the user has pins
      // that survive the current filters.
      if (this.pinned.length > 0) {
        const visibleIds = new Set(pool.map((it) => it.id));
        const itemById   = new Map(this._allItems.map((it) => [it.id, it]));
        const pinnedItems = this.pinned
          .map((id) => itemById.get(id))
          .filter((it) => it && visibleIds.has(it.id));
        if (pinnedItems.length > 0) {
          result.unshift({
            id: '__pinned',
            title: 'Pinned',
            description: 'Your bookmarked items. Click the pin in the modal to pin or unpin.',
            _visibleItems: pinnedItems,
          });
        }
      }

      return result;
    },

    // ---- actions ----
    toggleCategory(id) {
      this.collapsed[id] = !this.collapsed[id];
    },

    openItem(item, opts = {}) {
      this.modalItem = item;
      this.modalEnv = this.env;
      document.body.style.overflow = 'hidden';
      if (!opts.skipHash) {
        const next = `#item=${item.id}`;
        if (window.location.hash !== next) {
          history.pushState(null, '', next);
        }
      }
    },

    closeModal(opts = {}) {
      this.modalItem = null;
      document.body.style.overflow = '';
      if (!opts.skipHash && window.location.hash.startsWith('#item=')) {
        history.pushState(null, '', window.location.pathname + window.location.search);
      }
    },

    openSettings()  { this.settingsOpen = true;  document.body.style.overflow = 'hidden'; },
    closeSettings() { this.settingsOpen = false; document.body.style.overflow = ''; },

    openGlossary(opts = {}) {
      // Mutually exclusive with the item modal.
      if (this.modalItem) this.closeModal({ skipHash: true });
      this.glossaryOpen = true;
      document.body.style.overflow = 'hidden';
      if (!opts.skipHash && window.location.hash !== '#glossary') {
        history.pushState(null, '', '#glossary');
      }
    },

    closeGlossary(opts = {}) {
      this.glossaryOpen = false;
      document.body.style.overflow = '';
      if (!opts.skipHash && window.location.hash === '#glossary') {
        history.pushState(null, '', window.location.pathname + window.location.search);
      }
    },

    // ---- decision trees ----
    openDecisions(opts = {}) {
      if (this.modalItem)    this.closeModal({ skipHash: true });
      if (this.glossaryOpen) this.closeGlossary({ skipHash: true });
      this.decisionsOpen = true;
      this.decisionTreeId = null;
      this.decisionPath = [];
      document.body.style.overflow = 'hidden';
      if (!opts.skipHash && window.location.hash !== '#decide') {
        history.pushState(null, '', '#decide');
      }
    },

    closeDecisions(opts = {}) {
      this.decisionsOpen = false;
      this.decisionTreeId = null;
      this.decisionPath = [];
      document.body.style.overflow = '';
      if (!opts.skipHash && window.location.hash === '#decide') {
        history.pushState(null, '', window.location.pathname + window.location.search);
      }
    },

    startTree(treeId) {
      const tree = (this.decisions.trees || []).find((t) => t.id === treeId);
      if (!tree) return;
      this.decisionTreeId = treeId;
      this.decisionPath = [tree.root];
    },

    pickOption(nextId) {
      if (!nextId) return;
      this.decisionPath.push(nextId);
    },

    decisionBack() {
      if (this.decisionPath.length > 1) {
        this.decisionPath.pop();
      } else {
        // Back from the root node returns to the picker.
        this.decisionTreeId = null;
        this.decisionPath = [];
      }
    },

    decisionRestart() {
      const tree = this.currentTree;
      if (tree) this.decisionPath = [tree.root];
    },

    /** The currently active tree object, or null when the picker is showing. */
    get currentTree() {
      if (!this.decisionTreeId) return null;
      return (this.decisions.trees || []).find((t) => t.id === this.decisionTreeId) || null;
    },

    /** The current node in the active tree (last in the path). */
    get currentNode() {
      const tree = this.currentTree;
      if (!tree) return null;
      const id = this.decisionPath[this.decisionPath.length - 1];
      return tree.nodes[id] || null;
    },

    /** Resolve a list of recommendation `links` (item ids) to actual items. */
    resolveLinks(ids) {
      if (!Array.isArray(ids) || ids.length === 0) return [];
      const byId = new Map(this._allItems.map((it) => [it.id, it]));
      return ids.map((id) => byId.get(id)).filter(Boolean);
    },

    /** Open an item from inside the decisions modal (closes decisions first). */
    openItemFromDecisions(item) {
      this.closeDecisions({ skipHash: true });
      this.openItem(item);
    },

    openAbout()  { this.aboutOpen = true;  document.body.style.overflow = 'hidden'; },
    closeAbout() { this.aboutOpen = false; document.body.style.overflow = ''; },

    openCategoryInfo(cat) {
      if (this.modalItem)     this.closeModal({ skipHash: true });
      if (this.glossaryOpen)  this.closeGlossary({ skipHash: true });
      if (this.decisionsOpen) this.closeDecisions({ skipHash: true });
      this.categoryInfoItem = cat;
      document.body.style.overflow = 'hidden';
    },
    closeCategoryInfo() {
      this.categoryInfoItem = null;
      document.body.style.overflow = '';
    },

    /** Render the glossary as a Markdown string. */
    glossaryAsMarkdown() {
      const lines = ['# CheatyBang — Glossary', ''];
      for (const t of (this.glossary.terms || [])) {
        lines.push(`**${t.term}** — ${t.definition}`);
        lines.push('');
      }
      return lines.join('\n');
    },

    async copyGlossary(ev) {
      try {
        await navigator.clipboard.writeText(this.glossaryAsMarkdown());
        const btn = ev?.currentTarget;
        if (!btn) return;
        const original = btn.dataset.label || btn.textContent.trim();
        btn.dataset.label = original;
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = original; }, 1100);
      } catch (err) {
        console.error('Copy failed:', err);
      }
    },

    async shareGlossary(ev) {
      const url   = location.origin + location.pathname + '#glossary';
      const title = 'CheatyBang — Glossary';
      const text  = 'Claude Code glossary — 20 terms.';
      try {
        if (navigator.share) {
          await navigator.share({ title, text, url });
          return;
        }
        // Fallback: copy URL.
        await navigator.clipboard.writeText(url);
        const btn = ev?.currentTarget;
        if (btn) {
          const original = btn.dataset.label || btn.textContent.trim();
          btn.dataset.label = original;
          btn.textContent = 'Link copied!';
          setTimeout(() => { btn.textContent = original; }, 1400);
        }
      } catch (err) {
        if (err && err.name !== 'AbortError') console.error('Share failed:', err);
      }
    },

    /** Currently-active scheme id, based on theme. */
    activeScheme() { return this.theme === 'dark' ? this.schemeDark : this.schemeLight; },

    /** Set scheme for the *current* theme only. */
    setScheme(id) {
      if (this.theme === 'dark') this.schemeDark = id;
      else                       this.schemeLight = id;
    },

    // ---- persistence ----
    _loadPrefs() {
      try {
        const raw = localStorage.getItem('cheatybang.prefs');
        if (!raw) return;
        const p = JSON.parse(raw);
        const isScheme = (id) => this.schemes.some(s => s.id === id);

        if (p.theme === 'light' || p.theme === 'dark') this.theme = p.theme;

        // Per-theme scheme; fall back to legacy single `scheme` field if present.
        const legacy = isScheme(p.scheme) ? p.scheme : null;
        if (isScheme(p.schemeLight))      this.schemeLight = p.schemeLight;
        else if (legacy)                  this.schemeLight = legacy;
        if (isScheme(p.schemeDark))       this.schemeDark = p.schemeDark;
        else if (legacy)                  this.schemeDark = legacy;

        if (typeof p.brightness === 'number' && p.brightness >= 0.7 && p.brightness <= 1.3) {
          this.brightness = p.brightness;
        }
        if ([1, 2, 3].includes(p.columns)) this.columns = p.columns;
        if (['compact', 'cozy', 'comfortable'].includes(p.density)) this.density = p.density;
        if (['dim', 'hide'].includes(p.envFilter)) this.envFilter = p.envFilter;
        if (['desktop', 'cli', 'vscode', 'cursor'].includes(p.env)) this.env = p.env;
        if (['beginner', 'mid', 'pro'].includes(p.level)) this.level = p.level;
        if (p.collapsed && typeof p.collapsed === 'object') this.collapsed = p.collapsed;
        if (Array.isArray(p.pinned)) this.pinned = p.pinned.filter(x => typeof x === 'string');
      } catch (err) {
        console.warn('Could not load prefs:', err);
      }
    },

    _savePrefs() {
      try {
        localStorage.setItem('cheatybang.prefs', JSON.stringify({
          theme: this.theme,
          schemeLight: this.schemeLight,
          schemeDark:  this.schemeDark,
          brightness:  this.brightness,
          columns:     this.columns,
          density:     this.density,
          envFilter:   this.envFilter,
          env:         this.env,
          level:       this.level,
          collapsed:   this.collapsed,
          pinned:      this.pinned,
        }));
      } catch (err) {
        // localStorage can fail (private mode, quota); non-fatal.
      }
    },

    async copyCode(code, ev) {
      try {
        await navigator.clipboard.writeText(code);
        const btn = ev?.currentTarget;
        if (!btn) return;
        const original = btn.textContent;
        btn.textContent = 'Copied!';
        btn.classList.add('copied-flash');
        setTimeout(() => {
          btn.textContent = original;
          btn.classList.remove('copied-flash');
        }, 1100);
      } catch (err) {
        console.error('Copy failed:', err);
      }
    },
  };
}

// Expose for Alpine's x-data="cheatyBang()"
window.cheatyBang = cheatyBang;
