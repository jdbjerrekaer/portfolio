/*
 * YADL live demo — a fake "Figma sandbox" that answers the real plugin UI.
 *
 * The real plugin UI (plugin.html, built unchanged from src/ui) runs in an
 * iframe and talks to its backend with parent.postMessage({ pluginMessage }).
 * This file plays the backend role: it receives those messages in the host
 * page and replies with iframe.contentWindow.postMessage({ pluginMessage }),
 * using the same message names and payload shapes as src/backend.
 */
(function () {
  'use strict';

  var D = window.YADL_DEMO_DATA;

  var DEFAULT_SETTINGS = {
    'default-name': true, 'absolute-position': true, 'gap': true,
    'padding-left': true, 'padding-right': true, 'padding-top': true, 'padding-bottom': true,
    'padding-horizontal': true, 'padding-vertical': true,
    'border-radius': true, 'border-radius-top-left': true, 'border-radius-top-right': true,
    'border-radius-bottom-left': true, 'border-radius-bottom-right': true,
    'fill-color': true, 'stroke-color': true, 'stroke-width': true, 'effects': true,
    'text-style': true, 'font-family': true, 'font-weight': true, 'font-size': true,
    'line-height': true, 'letter-spacing': true,
    'deleted-variable': true, 'missing-description': true,
    'auto-detach-deleted-variables': false, 'lint-nested-components': false,
    'lint-inside-slots': true, 'lint-hidden': false, 'lint-locked': false, 'strict-linting': false
  };

  // Mirrors ISSUE_TYPES_WITH_SUGGESTIONS in src/backend/linting/constants
  var SUGGESTION_TYPES = ['gap', 'padding-horizontal', 'padding-vertical', 'padding-left', 'padding-right',
    'padding-top', 'padding-bottom', 'effects', 'border-radius', 'border-radius-top-left',
    'border-radius-top-right', 'border-radius-bottom-left', 'border-radius-bottom-right', 'stroke-width',
    'fill-color', 'stroke-color', 'typography', 'text-style', 'font-family', 'font-weight', 'font-size',
    'line-height', 'letter-spacing', 'deleted-variable'];
  var TYPO_KEYS = ['text-style', 'font-family', 'font-weight', 'font-size', 'line-height', 'letter-spacing'];

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function FakeFigmaBackend(opts) {
    this.iframe = opts.iframe;
    this.hooks = opts.hooks || {};
    this.reset();
  }

  FakeFigmaBackend.prototype.reset = function () {
    // Live document state: one record per issue, keyed `${nodeId}::${type}`
    this.nodes = clone(D.NODES);
    this.nodeById = {};
    var self = this;
    this.nodes.forEach(function (n) {
      self.nodeById[n.id] = n;
      n.issues.forEach(function (i) { i.fixed = false; });
      n.appliedTextStyle = n.textStyle || null;
    });
    this.settings = clone(DEFAULT_SETTINGS);
    this.ignored = [];          // ignored group keys
    this.dismissed = {};        // `${nodeId}::${property}` -> true (cleared on next lint)
    this.undoBatches = [];      // [[issueKey, ...], ...]
    this.lastMutationAt = 0;
    this.session = 0;
    this.hasLinted = false;
    this.selection = [D.rootId];
    this.collectionEnabled = {};
    this.libraryEnabled = true;
    this.introSent = false;
    D.COLLECTIONS.forEach(function (c) {
      if (!c._defaultModeId) c._defaultModeId = c.currentModeId;
      c.currentModeId = c._defaultModeId;
    });
  };

  // ---------------------------------------------------------------------------
  // Transport
  // ---------------------------------------------------------------------------
  FakeFigmaBackend.prototype.send = function (msg) {
    var win = this.iframe && this.iframe.contentWindow;
    if (!win) return;
    win.postMessage({ pluginMessage: msg }, '*');
  };

  FakeFigmaBackend.prototype.handle = function (msg) {
    if (!msg || typeof msg.type !== 'string') return;
    var fn = this.routes[msg.type];
    if (fn) {
      try {
        Promise.resolve(fn.call(this, msg)).catch(function (e) { console.warn('[demo backend] handler failed', msg.type, e); });
      } catch (e) { console.warn('[demo backend] handler failed', msg.type, e); }
    } else {
      console.debug('[demo backend] unhandled message', msg.type);
    }
  };

  // ---------------------------------------------------------------------------
  // Lint model
  // ---------------------------------------------------------------------------
  FakeFigmaBackend.prototype.isTypeEnabled = function (type) {
    var s = this.settings;
    if (type === 'typography') return TYPO_KEYS.some(function (k) { return s[k] !== false; });
    return s[type] !== false;
  };

  FakeFigmaBackend.prototype.openIssues = function () {
    var out = [];
    var self = this;
    this.nodes.forEach(function (n) {
      n.issues.forEach(function (i) {
        if (!i.fixed && self.isTypeEnabled(i.type)) out.push({ node: n, issue: i });
      });
    });
    return out;
  };

  FakeFigmaBackend.prototype.groupKeyFor = function (issue) {
    return issue.type === 'default-name' ? 'default-name:' : issue.type + ':' + (issue.value || '');
  };

  FakeFigmaBackend.prototype.computeGroups = function () {
    var self = this;
    var groups = {};
    var order = [];
    this.openIssues().forEach(function (it) {
      var key = self.groupKeyFor(it.issue);
      if (self.ignored.indexOf(key) !== -1) return;
      if (!groups[key]) {
        groups[key] = {
          type: it.issue.type,
          value: it.issue.type === 'default-name' ? undefined : it.issue.value,
          nodes: [],
          groupKey: key
        };
        order.push(key);
      }
      if (groups[key].nodes.indexOf(it.node.id) === -1) groups[key].nodes.push(it.node.id);
    });
    var list = order.map(function (k) { return groups[k]; });
    // Same priority sort as lintSelectionAsync: suggestion-capable types first, then by size
    list.sort(function (a, b) {
      var as = SUGGESTION_TYPES.indexOf(a.type) !== -1, bs = SUGGESTION_TYPES.indexOf(b.type) !== -1;
      if (as && !bs) return -1;
      if (!as && bs) return 1;
      return b.nodes.length - a.nodes.length;
    });
    return list;
  };

  FakeFigmaBackend.prototype.computeSuggestions = function () {
    var self = this;
    var groups = this.computeGroups();
    var visibleKeys = {};
    groups.forEach(function (g) { g.nodes.forEach(function (id) { visibleKeys[id + '::' + g.type] = true; }); });
    var out = [];
    this.openIssues().forEach(function (it) {
      var i = it.issue;
      if (!i.varId) return;
      var key = it.node.id + '::' + i.type;
      if (!visibleKeys[key] || self.dismissed[key]) return;
      if (!self.isTokenEnabled(i.varId)) return;
      out.push({
        nodeId: it.node.id,
        property: i.type,
        currentValue: i.value || it.node.name,
        bestMatchVarId: i.varId,
        bestMatchVarName: i.varName,
        bestMatchVarMode: i.varMode || null
      });
    });
    return out;
  };

  // A suggestion is only offered if its variable's collection is enabled
  FakeFigmaBackend.prototype.isTokenEnabled = function (varId) {
    if (varId.indexOf('VariableID:') !== 0) return true; // styles
    var v = D.VARIABLES.find(function (x) { return x.id === varId; });
    if (!v) return true;
    var col = D.COLLECTIONS[v.c];
    return this.collectionEnabled[col.id] !== false;
  };

  FakeFigmaBackend.prototype.selectionNodes = function () {
    // Everything under the selected root (the demo always lints the checkout frame)
    var ids = [];
    var self = this;
    (function walk(id) {
      ids.push(id);
      self.nodes.forEach(function (n) { if (n.parentId === id) walk(n.id); });
    })(D.rootId);
    return ids.map(function (id) { return self.nodeById[id]; });
  };

  FakeFigmaBackend.prototype.findIssue = function (nodeId, property) {
    var n = this.nodeById[nodeId];
    if (!n) return null;
    return n.issues.find(function (i) { return i.type === property; }) || null;
  };

  // ---------------------------------------------------------------------------
  // Messages to the UI
  // ---------------------------------------------------------------------------
  FakeFigmaBackend.prototype.sendSelectionState = function () {
    var ids = this.selection.slice();
    this.send({
      type: 'selection-state',
      hasSelection: ids.length > 0,
      topLevelSelectionCount: ids.length,
      topLevelSelectionIds: ids
    });
  };

  FakeFigmaBackend.prototype.cacheStats = function () {
    var styleCount = D.STYLE_GROUPS.reduce(function (s, g) { return s + g.styles.length; }, 0) +
      (this.libraryEnabled ? D.SAVED_LIBRARY.totalStyles : 0);
    return {
      type: 'cache-stats-response',
      variableCount: D.VARIABLES.length,
      styleCount: styleCount,
      smartSuggestions: {
        exists: true,
        indexSize: D.VARIABLES.length + styleCount,
        styleGroupsSize: D.STYLE_GROUPS.length,
        lastUpdated: new Date().toISOString(),
        isBuilding: false
      }
    };
  };

  FakeFigmaBackend.prototype.buildSuggestions = async function (session) {
    var steps = [
      { label: 'Indexing variables from collections', sub: 'Processing indexing for "Acme DS / Semantic"', p: 20 },
      { label: 'Indexing variables from collections', sub: 'Completed indexing for "Acme DS / Dimensions"', p: 45 },
      { label: 'Finalizing: Hashing and cataloging variables', sub: 'Hashing variable', p: 70 },
      { label: 'Matching issues to tokens', sub: 'Scoring nearest variables and styles', p: 90 }
    ];
    for (var k = 0; k < steps.length; k++) {
      if (session !== this.session) return;
      this.send({
        type: 'smart-suggestions-progress', phase: 'building', progress: steps[k].p,
        label: steps[k].label, total: steps.length, current: k + 1,
        subTaskLabel: steps[k].sub, session: session
      });
      await wait(220);
    }
    if (session !== this.session) return;
    this.send({ type: 'smart-suggestions-progress', phase: 'ready', progress: 100, label: 'Smart suggestions ready', total: 1, current: 1, session: session });
    this.send({ type: 'suggestions-complete', suggestions: this.computeSuggestions(), session: session });
  };

  FakeFigmaBackend.prototype.lint = async function (session) {
    this.session = session;
    this.hasLinted = true;
    this.dismissed = {};
    this.undoBatches = [];
    // The demo always lints the checkout frame: put the canvas selection back on it
    this.selection = [D.rootId];
    if (this.hooks.onSelect) this.hooks.onSelect(this.selection);
    this.sendSelectionState();

    this.send({ type: 'lint-loading', session: session });

    var all = this.selectionNodes();
    for (var i = 1; i <= all.length; i++) {
      if (session !== this.session) return;
      this.send({ type: 'progress', label: 'Linting nodes', current: i, total: all.length, scope: 'global', session: session });
      await wait(28);
    }
    var issues = this.openIssues();
    for (var j = 1; j <= issues.length; j += 3) {
      if (session !== this.session) return;
      this.send({ type: 'progress', label: 'Grouping raw issues', current: Math.min(j + 2, issues.length), total: issues.length, scope: 'global', session: session });
      await wait(18);
    }
    var groups = this.computeGroups();
    this.send({ type: 'progress', label: 'Sorting issue groups', current: groups.length, total: groups.length, scope: 'global', session: session });
    await wait(60);
    if (session !== this.session) return;

    var self = this;
    var issueNodeIds = {};
    issues.forEach(function (it) { issueNodeIds[it.node.id] = true; });
    var nodeInfo = all.map(function (n) {
      return { id: n.id, name: n.name, type: n.type, parentId: n.parentId, visible: true, locked: false };
    });
    var fineIds = all.filter(function (n) { return !issueNodeIds[n.id]; }).map(function (n) { return n.id; });

    // Text nodes that already use a text style
    var styleHits = {};
    all.forEach(function (n) {
      if (n.type === 'TEXT' && n.appliedTextStyle) {
        (styleHits[n.appliedTextStyle] = styleHits[n.appliedTextStyle] || []).push(n.id);
      }
    });
    var textStyles = D.STYLE_GROUPS[0].styles;
    var appliedTextStyles = Object.keys(styleHits).map(function (sid) {
      var st = textStyles.find(function (s) { return s.id === sid; });
      return { styleId: sid, name: st ? st.name : sid, isRemote: false, nodeIds: styleHits[sid] };
    });

    this.send({
      type: 'lint-result',
      groups: groups,
      fineIds: fineIds,
      nodeInfo: nodeInfo,
      suggestions: [],
      session: session,
      skippedCounts: { hidden: 0, locked: 0, nestedComponents: 0, slots: 0 },
      appliedTextStyles: appliedTextStyles
    });
    this.send({ type: 'lint-ready', session: session });
    this.send({ type: 'suggestions-loading', session: session });
    if (this.hooks.onLintDone) this.hooks.onLintDone(groups);
    await wait(120);
    await self.buildSuggestions(session);
  };

  // Apply bookkeeping: consecutive applies form one undo step (like one Figma undo)
  FakeFigmaBackend.prototype.recordApply = function (key, forceNewBatch) {
    var now = Date.now();
    if (forceNewBatch || !this.undoBatches.length || now - this.lastMutationAt > 1500) {
      this.undoBatches.push([]);
    }
    this.undoBatches[this.undoBatches.length - 1].push(key);
    this.lastMutationAt = now;
  };

  FakeFigmaBackend.prototype.applyOne = function (s) {
    var issue = this.findIssue(s.nodeId, s.property);
    if (!issue || !issue.varId) return { ok: false, error: 'Layer no longer has this issue' };
    if (!issue.fixed) {
      issue.fixed = true;
      var node = this.nodeById[s.nodeId];
      if (s.property === 'typography' && node) node.appliedTextStyle = issue.varId;
      if (this.hooks.onApply) this.hooks.onApply(s.nodeId, issue);
    }
    return { ok: true };
  };

  // ---------------------------------------------------------------------------
  // Routes (one per message type the UI sends)
  // ---------------------------------------------------------------------------
  FakeFigmaBackend.prototype.routes = {
    'get-selection-state': function () {
      if (!this.introSent) {
        this.introSent = true;
        this.send({ type: 'init-settings', settings: clone(this.settings) });
        this.send({
          type: 'initial-content-detected', hasCollections: true, hasStyles: true,
          details: { localCollections: D.COLLECTIONS.length, remoteCollections: 'none', localStyles: 'detected', savedLibraries: 'detected' }
        });
        this.send({ type: 'plugin-ready', hasCollections: true, hasStyles: true, message: 'Plugin initialized - cache will be built when needed' });
      }
      this.sendSelectionState();
      if (this.hooks.onSelect) this.hooks.onSelect(this.selection);
    },

    'resize': function (msg) {
      if (this.hooks.onResize && msg.size) {
        this.hooks.onResize(Math.max(360, msg.size.width), Math.max(480, msg.size.height));
      }
    },

    'settings-update': function (msg) {
      this.settings = Object.assign({}, this.settings, msg.settings || {});
      this.send({ type: 'settings-saved' });
    },

    'lint-request': function (msg) { this.lint(typeof msg.session === 'number' ? msg.session : Date.now()); },
    'refresh': function (msg) { this.lint(typeof msg.session === 'number' ? msg.session : Date.now()); },

    'select-nodes': function (msg) {
      var ids = (msg.nodeIds || []).filter(Boolean);
      // Demo keeps the checkout frame selected instead of an empty canvas selection
      this.selection = ids.length ? ids : [D.rootId];
      if (this.hooks.onSelect) this.hooks.onSelect(this.selection);
      var self = this;
      setTimeout(function () { self.sendSelectionState(); }, 10);
    },

    'apply-suggestion': function (msg) {
      var s = msg.suggestion;
      var self = this;
      setTimeout(function () {
        var r = self.applyOne(s);
        if (r.ok) {
          self.recordApply(s.nodeId + '::' + s.property, false);
          self.send({ type: 'suggestion-applied', suggestion: s, message: 'Applied ' + s.bestMatchVarName });
        } else {
          self.send({ type: 'suggestion-error', suggestion: s, error: r.error });
        }
      }, 90);
    },

    'apply-all-suggestions': async function (msg) {
      var list = Array.isArray(msg.suggestions) && msg.suggestions.length ? msg.suggestions : this.computeSuggestions();
      var applied = [];
      this.undoBatches.push([]);
      for (var i = 0; i < list.length; i++) {
        var s = list[i];
        if (this.applyOne(s).ok) {
          applied.push({ nodeId: s.nodeId, property: s.property });
          this.undoBatches[this.undoBatches.length - 1].push(s.nodeId + '::' + s.property);
        }
        if (i % 3 === 2 || i === list.length - 1) {
          this.send({ type: 'bulk-apply-progress', current: i + 1, total: list.length });
          await wait(60);
        }
      }
      this.lastMutationAt = Date.now();
      this.send({ type: 'suggestions-all-applied', count: applied.length, applied: applied, message: 'Successfully applied all ' + applied.length + ' suggestions!' });
      this.send({ type: 'select-nodes', nodeIds: [] });
    },

    'undo-last-apply': function () {
      var batch = this.undoBatches.pop();
      if (!batch) return;
      var self = this;
      batch.forEach(function (key) {
        var parts = key.split('::');
        var issue = self.findIssue(parts[0], parts[1]);
        if (issue) {
          issue.fixed = false;
          var node = self.nodeById[parts[0]];
          if (parts[1] === 'typography' && node) node.appliedTextStyle = node.textStyle || null;
          if (self.hooks.onUndo) self.hooks.onUndo(parts[0], issue);
        }
      });
    },

    'relint-flagged-nodes': function (msg) {
      var self = this;
      var resolved = (msg.flagged || []).filter(function (f) {
        var issue = self.findIssue(f.nodeId, f.property);
        return !issue || issue.fixed;
      });
      this.send({ type: 'relint-result', resolved: resolved });
    },

    'dismiss-suggestion': function (msg) {
      var s = msg.suggestion;
      this.dismissed[s.nodeId + '::' + s.property] = true;
      this.send({ type: 'suggestion-dismissed', suggestion: s });
    },
    'dismiss-all-suggestions': function () {
      var self = this;
      this.computeSuggestions().forEach(function (s) { self.dismissed[s.nodeId + '::' + s.property] = true; });
      this.send({ type: 'suggestions-all-dismissed' });
    },

    'suggestions-request': function () {
      if (!this.hasLinted) {
        this.send({ type: 'error', message: 'No lint data available. Please run a lint check first to generate suggestions.', error: 'No lint data available' });
        return;
      }
      var session = Date.now();
      this.session = session;
      this.send({ type: 'suggestions-loading', session: session, echo: true });
      this.buildSuggestions(session);
    },

    'ignore-error': function (msg) {
      if (msg.groupKey && this.ignored.indexOf(msg.groupKey) === -1) this.ignored.push(msg.groupKey);
      this.send({ type: 'error-ignored', groupKey: msg.groupKey });
    },
    'unignore-error': function (msg) {
      this.ignored = this.ignored.filter(function (k) { return k !== msg.groupKey; });
      this.send({ type: 'error-unignored', groupKey: msg.groupKey });
    },
    'get-ignored-errors': function () {
      this.send({
        type: 'ignored-errors-list',
        ignored: this.ignored.map(function (key) {
          var parts = key.split(':');
          var type = parts.shift();
          return { type: type, value: parts.join(':') || undefined, groupKey: key };
        })
      });
    },

    'cancel': function () { this.session = 0; },

    // ---- cache / index ----
    'get-cache-stats': function () { this.send(this.cacheStats()); },
    'clear-all-cache': function () {
      this.send({ type: 'cache-cleared' });
    },
    'clear-variables-cache': function () { this.send({ type: 'cache-cleared' }); },
    'cache-variables-data': function () { this.send(this.cacheStats()); },
    'request-variables-cache-for-index': function () {},
    'manual-style-validation': function () {},
    'style-validation-status': function () {},

    // ---- variables tab ----
    'variables-loading': async function (msg) {
      var session = msg.session || Date.now();
      this.send({ type: 'variables-loading', session: session, echo: true });
      // The real backend streams 'progress' tagged with this variables session; the UI
      // drops those as stale (lint session guard), so they are omitted here.
      await wait(60);
      this.sendCollections();
      await wait(60);
      this.send({ type: 'style-groups', groups: clone(D.STYLE_GROUPS) });
      await wait(60);
      this.sendSavedLibraryStyles();
      this.send({ type: 'progress-complete', session: session });
    },
    'variables-ready': function () {
      // The real UI hides its overlay when it hears variables-ready back.
      this.send({ type: 'variables-ready' });
    },
    'variables-ui-progress': function () {},
    'variables-ui-complete': function () {},
    'get-variable-collections': function () { this.sendCollections(); },
    'get-variables-for-collection': function (msg) {
      this.send({ type: 'collection-variables', collectionId: msg.collectionId, variables: D.variablesForCollection(msg.collectionId, msg.modeId) });
    },
    'toggle-collection': function (msg) {
      this.collectionEnabled[msg.collectionId] = !!msg.enabled;
      this.send(this.cacheStats());
      if (this.hasLinted) {
        var session = Date.now();
        this.session = session;
        this.send({ type: 'suggestions-loading', session: session, echo: true });
        this.buildSuggestions(session);
      }
    },
    'set-collection-mode': function (msg) {
      var col = D.COLLECTIONS.find(function (c) { return c.id === msg.collectionId; });
      if (col) col.currentModeId = msg.modeId;
      this.send({ type: 'collection-variables', collectionId: msg.collectionId, variables: D.variablesForCollection(msg.collectionId, msg.modeId) });
      this.send({ type: 'collection-mode-updated', collectionId: msg.collectionId, modeId: msg.modeId });
    },
    'request-index-data-for-variables-cache': function () {
      var self = this;
      var previewItems = [];
      D.COLLECTIONS.forEach(function (c) {
        if (self.collectionEnabled[c.id] === false) return;
        D.variablesForCollection(c.id).forEach(function (v) {
          previewItems.push(Object.assign({}, v, { itemType: 'variable', isRemote: false }));
        });
      });
      D.STYLE_GROUPS.forEach(function (g) {
        g.styles.forEach(function (s) { previewItems.push(Object.assign(clone(s), { itemType: 'style', isRemote: false })); });
      });
      if (this.libraryEnabled) {
        D.SAVED_LIBRARY_GROUPS.forEach(function (g) {
          g.styles.forEach(function (s) { previewItems.push(Object.assign(clone(s), { itemType: 'style', isRemote: true })); });
        });
      }
      this.send({
        type: 'index-data-for-variables-cache-response',
        collections: D.collectionsForUI(this.collectionEnabled),
        previewItems: previewItems,
        styleGroups: clone(D.STYLE_GROUPS),
        collectionModes: {}
      });
    },
    'get-style-groups': function () { this.send({ type: 'style-groups', groups: clone(D.STYLE_GROUPS) }); },
    'get-styles-for-type': function (msg) {
      var g = D.STYLE_GROUPS.find(function (x) { return x.type === msg.styleType; });
      this.send({ type: 'styles-for-type', styleType: msg.styleType, styles: g ? clone(g.styles) : [] });
    },
    'refresh-styles': function () {},
    'refresh-styles-and-variables': function () { this.send({ type: 'ack-refresh' }); },
    'create-variable-collection': function () {},

    // ---- saved libraries ----
    'get-saved-libraries': function () {
      this.send({ type: 'saved-libraries', libraries: [Object.assign({}, D.SAVED_LIBRARY, { enabled: this.libraryEnabled })] });
    },
    'get-saved-library-styles': function () { this.sendSavedLibraryStyles(); },
    'get-current-file-library': function () { this.send({ type: 'current-file-library', library: null }); },
    'get-current-file-id': function () { this.send({ type: 'current-file-id', fileId: 'demo-checkout-file' }); },
    'check-library-updates': function (msg) {
      this.send({ type: 'library-update-info', libraryId: msg.libraryId, updateInfo: { hasUpdates: false, newStyles: [], modifiedStyles: [], deletedStyles: [], totalChanges: 0 } });
    },
    'toggle-library': function (msg) {
      this.libraryEnabled = !!msg.enabled;
      this.send({ type: 'library-toggled', libraryId: msg.libraryId, enabled: this.libraryEnabled });
    },
    'save-library': function () {
      this.send({ type: 'error', message: 'Saving libraries is disabled in this demo' });
      this.send({ type: 'library-saved', library: null });
    },
    'update-library': function (msg) {
      this.send({ type: 'library-updated', library: Object.assign({}, D.SAVED_LIBRARY, { id: msg.libraryId }) });
    },
    'delete-library': function () {
      this.send({ type: 'error', message: 'Deleting libraries is disabled in this demo' });
      this.send({ type: 'library-deleted', libraryId: '__none__' });
    }
  };

  FakeFigmaBackend.prototype.sendCollections = function () {
    this.send({ type: 'variable-collections', localCollections: D.collectionsForUI(this.collectionEnabled), remoteCollections: [] });
  };

  FakeFigmaBackend.prototype.sendSavedLibraryStyles = function () {
    this.send({ type: 'saved-library-styles', groups: this.libraryEnabled ? clone(D.SAVED_LIBRARY_GROUPS) : [] });
  };

  window.FakeFigmaBackend = FakeFigmaBackend;
})();
