/*
 * YADL live demo — mock Figma canvas.
 * Renders the fake design file as HTML, draws Figma-style selection boxes
 * and visibly snaps layers to their token value when a fix is applied.
 */
(function () {
  'use strict';

  var D = window.YADL_DEMO_DATA;

  var BACK_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F172A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>';

  function MockCanvas(root, overlay) {
    this.root = root;          // element the frame is rendered into
    this.overlay = overlay;    // absolutely positioned layer for selection boxes
    this.selLayer = document.createElement('div');
    this.fxLayer = document.createElement('div');
    this.selLayer.className = this.fxLayer.className = 'cv-layer';
    overlay.appendChild(this.selLayer);
    overlay.appendChild(this.fxLayer);
    this.els = {};
    this.selection = [];
    this.nodes = null;
    var self = this;
    this._reflow = function () { self.drawSelection(); };
    window.addEventListener('resize', this._reflow);
    if (window.ResizeObserver) new ResizeObserver(this._reflow).observe(root);
  }

  MockCanvas.prototype.render = function (nodes) {
    this.nodes = nodes;
    this.els = {};
    this.root.innerHTML = '';
    var self = this;
    var byParent = {};
    nodes.forEach(function (n) { (byParent[n.parentId] = byParent[n.parentId] || []).push(n); });

    function build(n) {
      var el = document.createElement('div');
      el.className = 'cv-node cv-' + n.type.toLowerCase();
      el.dataset.nodeId = n.id;
      el.dataset.name = n.name;
      if (n.icon === 'back') el.innerHTML = BACK_ICON;
      if (n.text) el.textContent = n.text;
      self.els[n.id] = el;
      (byParent[n.id] || []).forEach(function (c) { el.appendChild(build(c)); });
      return el;
    }
    var rootNode = nodes.find(function (n) { return n.id === D.rootId; });
    var frameLabel = document.createElement('div');
    frameLabel.className = 'cv-frame-label';
    frameLabel.textContent = rootNode.name;
    this.root.appendChild(frameLabel);
    this.root.appendChild(build(rootNode));
    nodes.forEach(function (n) { self.paint(n); });
    this.drawSelection();
  };

  // Apply base CSS + the current (open or fixed) CSS of every issue
  MockCanvas.prototype.paint = function (n) {
    var el = this.els[n.id];
    if (!el) return;
    el.removeAttribute('style');
    Object.assign(el.style, n.base || {});
    n.issues.forEach(function (i) {
      var css = i.fixed ? (i.fix || i.off) : i.off;
      if (css) Object.assign(el.style, css);
    });
  };

  MockCanvas.prototype.select = function (ids) {
    this.selection = (ids || []).slice();
    this.drawSelection();
  };

  MockCanvas.prototype.drawSelection = function () {
    var overlay = this.selLayer;
    overlay.innerHTML = '';
    if (!this.selection.length) return;
    var base = this.overlay.getBoundingClientRect();
    var self = this;
    var first = null;
    this.selection.forEach(function (id) {
      var el = self.els[id];
      if (!el) return;
      var r = el.getBoundingClientRect();
      var box = document.createElement('div');
      box.className = 'cv-select';
      box.style.left = (r.left - base.left) + 'px';
      box.style.top = (r.top - base.top) + 'px';
      box.style.width = r.width + 'px';
      box.style.height = r.height + 'px';
      overlay.appendChild(box);
      if (!first) first = { r: r, id: id, w: el.offsetWidth, h: el.offsetHeight };
    });
    if (first) {
      var tag = document.createElement('div');
      tag.className = 'cv-select-tag';
      var n = this.nodes.find(function (x) { return x.id === first.id; });
      var label = this.selection.length > 1 ? this.selection.length + ' layers' : (n ? n.name : '');
      tag.textContent = label + '  ' + first.w + ' × ' + first.h;
      tag.style.left = (first.r.left - base.left) + 'px';
      tag.style.top = (first.r.bottom - base.top + 6) + 'px';
      overlay.appendChild(tag);
    }
  };

  // A fix landed on this layer: repaint and show the token it snapped to
  MockCanvas.prototype.flash = function (nodeId, issue, undo) {
    var n = this.nodes.find(function (x) { return x.id === nodeId; });
    if (n) this.paint(n);
    var el = this.els[nodeId];
    if (!el) return;
    var overlay = this.fxLayer;
    var base = this.overlay.getBoundingClientRect();
    var r = el.getBoundingClientRect();
    var ring = document.createElement('div');
    ring.className = 'cv-flash' + (undo ? ' is-undo' : '');
    ring.style.left = (r.left - base.left) + 'px';
    ring.style.top = (r.top - base.top) + 'px';
    ring.style.width = r.width + 'px';
    ring.style.height = r.height + 'px';
    if (!undo) {
      var chip = document.createElement('span');
      chip.className = 'cv-token';
      chip.textContent = issue.varName;
      ring.appendChild(chip);
    }
    overlay.appendChild(ring);
    setTimeout(function () { ring.remove(); }, 1400);
    var self = this;
    requestAnimationFrame(function () { self.drawSelection(); });
  };

  window.MockCanvas = MockCanvas;
})();
