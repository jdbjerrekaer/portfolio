/*
 * YADL live demo — fake design file + fictional design system ("Acme DS").
 * Everything here is invented demo content. No real files, customers or people.
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function hexToRgb(hex) {
    var h = hex.replace('#', '');
    return {
      r: parseInt(h.slice(0, 2), 16) / 255,
      g: parseInt(h.slice(2, 4), 16) / 255,
      b: parseInt(h.slice(4, 6), 16) / 255,
      a: 1
    };
  }

  // ---------------------------------------------------------------------------
  // Variable collections (Acme DS)
  // ---------------------------------------------------------------------------
  var COLLECTIONS = [
    {
      id: 'VariableCollectionId:1:1',
      name: 'Acme DS / Primitives',
      modes: [{ id: '1:0', name: 'Default' }],
      currentModeId: '1:0',
      defaultModeName: 'Default'
    },
    {
      id: 'VariableCollectionId:2:1',
      name: 'Acme DS / Semantic',
      modes: [{ id: '2:0', name: 'Light' }, { id: '2:1', name: 'Dark' }],
      currentModeId: '2:0',
      defaultModeName: 'Light'
    },
    {
      id: 'VariableCollectionId:3:1',
      name: 'Acme DS / Dimensions',
      modes: [{ id: '3:0', name: 'Default' }],
      currentModeId: '3:0',
      defaultModeName: 'Default'
    }
  ];

  var COLOR_SCOPES = ['FRAME_FILL', 'SHAPE_FILL', 'TEXT_FILL', 'STROKE_COLOR'];

  // values: modeId -> raw value
  var VARIABLES = [
    // Primitives
    { id: 'VariableID:1:10', c: 0, name: 'blue/500', type: 'COLOR', scopes: ['ALL_SCOPES'], values: { '1:0': '#3B82F6' } },
    { id: 'VariableID:1:11', c: 0, name: 'blue/600', type: 'COLOR', scopes: ['ALL_SCOPES'], values: { '1:0': '#2563EB' } },
    { id: 'VariableID:1:12', c: 0, name: 'slate/50', type: 'COLOR', scopes: ['ALL_SCOPES'], values: { '1:0': '#F8FAFC' } },
    { id: 'VariableID:1:13', c: 0, name: 'slate/100', type: 'COLOR', scopes: ['ALL_SCOPES'], values: { '1:0': '#F1F5F9' } },
    { id: 'VariableID:1:14', c: 0, name: 'slate/200', type: 'COLOR', scopes: ['ALL_SCOPES'], values: { '1:0': '#E2E8F0' } },
    { id: 'VariableID:1:15', c: 0, name: 'slate/300', type: 'COLOR', scopes: ['ALL_SCOPES'], values: { '1:0': '#CBD5E1' } },
    { id: 'VariableID:1:16', c: 0, name: 'slate/400', type: 'COLOR', scopes: ['ALL_SCOPES'], values: { '1:0': '#94A3B8' } },
    { id: 'VariableID:1:17', c: 0, name: 'slate/900', type: 'COLOR', scopes: ['ALL_SCOPES'], values: { '1:0': '#0F172A' } },
    { id: 'VariableID:1:18', c: 0, name: 'pink/500', type: 'COLOR', scopes: ['ALL_SCOPES'], values: { '1:0': '#EC4899' } },
    // Semantic (Light / Dark)
    { id: 'VariableID:2:10', c: 1, name: 'color/primary/500', type: 'COLOR', scopes: COLOR_SCOPES, values: { '2:0': '#2563EB', '2:1': '#3B82F6' } },
    { id: 'VariableID:2:11', c: 1, name: 'color/text/primary', type: 'COLOR', scopes: ['TEXT_FILL'], values: { '2:0': '#0F172A', '2:1': '#F8FAFC' } },
    { id: 'VariableID:2:12', c: 1, name: 'color/text/muted', type: 'COLOR', scopes: ['TEXT_FILL'], values: { '2:0': '#94A3B8', '2:1': '#64748B' } },
    { id: 'VariableID:2:13', c: 1, name: 'color/border/default', type: 'COLOR', scopes: ['STROKE_COLOR'], values: { '2:0': '#E2E8F0', '2:1': '#334155' } },
    { id: 'VariableID:2:14', c: 1, name: 'color/border/strong', type: 'COLOR', scopes: ['STROKE_COLOR'], values: { '2:0': '#CBD5E1', '2:1': '#475569' } },
    { id: 'VariableID:2:15', c: 1, name: 'color/surface/card', type: 'COLOR', scopes: ['FRAME_FILL', 'SHAPE_FILL'], values: { '2:0': '#F8FAFC', '2:1': '#0F172A' } },
    { id: 'VariableID:2:16', c: 1, name: 'color/surface/muted', type: 'COLOR', scopes: ['FRAME_FILL', 'SHAPE_FILL'], values: { '2:0': '#F1F5F9', '2:1': '#1E293B' } },
    // Dimensions
    { id: 'VariableID:3:10', c: 2, name: 'spacing/4', type: 'FLOAT', scopes: ['GAP'], values: { '3:0': 4 } },
    { id: 'VariableID:3:11', c: 2, name: 'spacing/8', type: 'FLOAT', scopes: ['GAP'], values: { '3:0': 8 } },
    { id: 'VariableID:3:12', c: 2, name: 'spacing/12', type: 'FLOAT', scopes: ['GAP'], values: { '3:0': 12 } },
    { id: 'VariableID:3:13', c: 2, name: 'spacing/16', type: 'FLOAT', scopes: ['GAP'], values: { '3:0': 16 } },
    { id: 'VariableID:3:14', c: 2, name: 'spacing/24', type: 'FLOAT', scopes: ['GAP'], values: { '3:0': 24 } },
    { id: 'VariableID:3:15', c: 2, name: 'spacing/32', type: 'FLOAT', scopes: ['GAP'], values: { '3:0': 32 } },
    { id: 'VariableID:3:20', c: 2, name: 'radius/xs', type: 'FLOAT', scopes: ['CORNER_RADIUS'], values: { '3:0': 4 } },
    { id: 'VariableID:3:21', c: 2, name: 'radius/sm', type: 'FLOAT', scopes: ['CORNER_RADIUS'], values: { '3:0': 6 } },
    { id: 'VariableID:3:22', c: 2, name: 'radius/md', type: 'FLOAT', scopes: ['CORNER_RADIUS'], values: { '3:0': 8 } },
    { id: 'VariableID:3:23', c: 2, name: 'radius/lg', type: 'FLOAT', scopes: ['CORNER_RADIUS'], values: { '3:0': 12 } },
    { id: 'VariableID:3:24', c: 2, name: 'radius/full', type: 'FLOAT', scopes: ['CORNER_RADIUS'], values: { '3:0': 999 } },
    { id: 'VariableID:3:30', c: 2, name: 'border/width/1', type: 'FLOAT', scopes: ['STROKE_FLOAT'], values: { '3:0': 1 } },
    { id: 'VariableID:3:31', c: 2, name: 'border/width/2', type: 'FLOAT', scopes: ['STROKE_FLOAT'], values: { '3:0': 2 } },
    { id: 'VariableID:3:40', c: 2, name: 'opacity/disabled', type: 'FLOAT', scopes: ['OPACITY'], values: { '3:0': 0.4 } },
    { id: 'VariableID:3:41', c: 2, name: 'opacity/overlay', type: 'FLOAT', scopes: ['OPACITY'], values: { '3:0': 0.64 } },
    { id: 'VariableID:3:50', c: 2, name: 'font/size/14', type: 'FLOAT', scopes: ['FONT_SIZE'], values: { '3:0': 14 } },
    { id: 'VariableID:3:51', c: 2, name: 'font/size/16', type: 'FLOAT', scopes: ['FONT_SIZE'], values: { '3:0': 16 } },
    { id: 'VariableID:3:52', c: 2, name: 'font/size/20', type: 'FLOAT', scopes: ['FONT_SIZE'], values: { '3:0': 20 } }
  ];

  // ---------------------------------------------------------------------------
  // Local styles (text + effect) and one saved library
  // ---------------------------------------------------------------------------
  function textStyle(id, name, family, style, size, lh) {
    return {
      id: id, name: name, type: 'TEXT', description: '',
      styleData: {
        fontName: { family: family, style: style },
        fontSize: size,
        lineHeight: { value: lh, unit: 'PIXELS' },
        letterSpacing: { value: 0, unit: 'PIXELS' },
        textCase: 'ORIGINAL', textDecoration: 'NONE'
      }
    };
  }
  function shadowStyle(id, name, y, blur, alpha) {
    return {
      id: id, name: name, type: 'EFFECT', description: '',
      styleData: {
        effects: [{
          type: 'DROP_SHADOW', visible: true, blendMode: 'NORMAL',
          color: { r: 0.06, g: 0.09, b: 0.16, a: alpha },
          offset: { x: 0, y: y }, radius: blur, spread: 0
        }]
      }
    };
  }

  var STYLE_GROUPS = [
    {
      type: 'TEXT', name: 'Text Styles',
      styles: [
        textStyle('S:acme-heading-h3,1:100', 'Heading/H3', 'Inter', 'Semi Bold', 20, 28),
        textStyle('S:acme-body-md,1:101', 'Body/Medium', 'Inter', 'Regular', 16, 24),
        textStyle('S:acme-body-sm,1:102', 'Body/Small', 'Inter', 'Regular', 14, 20),
        textStyle('S:acme-label-btn,1:103', 'Label/Button', 'Inter', 'Semi Bold', 15, 20),
        textStyle('S:acme-label-strong,1:104', 'Label/Strong', 'Inter', 'Semi Bold', 16, 24)
      ]
    },
    {
      type: 'EFFECT', name: 'Effect Styles',
      styles: [
        shadowStyle('S:acme-shadow-sm,1:110', 'shadow/sm', 1, 3, 0.08),
        shadowStyle('S:acme-shadow-md,1:111', 'shadow/md', 4, 12, 0.12),
        shadowStyle('S:acme-shadow-lg,1:112', 'shadow/lg', 12, 32, 0.16)
      ]
    }
  ];

  var SAVED_LIBRARY = {
    id: 'lib-acme-brand',
    name: 'Acme DS / Brand',
    fileName: 'Acme DS / Brand',
    fileId: 'demo-brand-file',
    fileKey: 'demo-brand-file',
    savedAt: Date.UTC(2026, 6, 14),
    lastUpdated: Date.UTC(2026, 8, 2),
    totalStyles: 3,
    enabled: true
  };

  var SAVED_LIBRARY_GROUPS = [
    {
      type: 'PAINT', name: 'Paint Styles', isFromSavedLibrary: true, libraryFileName: SAVED_LIBRARY.fileName,
      styles: [
        { id: 'S:brand-ink,9:1', name: 'Brand/Ink', type: 'PAINT', isFromSavedLibrary: true, libraryFileName: SAVED_LIBRARY.fileName,
          styleData: { paints: [{ type: 'SOLID', color: { r: 0.07, g: 0.09, b: 0.15 }, opacity: 1 }] } },
        { id: 'S:brand-accent,9:2', name: 'Brand/Accent', type: 'PAINT', isFromSavedLibrary: true, libraryFileName: SAVED_LIBRARY.fileName,
          styleData: { paints: [{ type: 'SOLID', color: { r: 0.93, g: 0.28, b: 0.6 }, opacity: 1 }] } },
        { id: 'S:brand-sky,9:3', name: 'Brand/Sky', type: 'PAINT', isFromSavedLibrary: true, libraryFileName: SAVED_LIBRARY.fileName,
          styleData: { paints: [{ type: 'GRADIENT_LINEAR', opacity: 1, gradientStops: [
            { position: 0, color: { r: 0.39, g: 0.4, b: 0.95, a: 1 } },
            { position: 1, color: { r: 0.23, g: 0.51, b: 0.96, a: 1 } }] } ] } }
      ]
    }
  ];

  // ---------------------------------------------------------------------------
  // The fake design file: "Checkout — Mobile"
  //
  // Each node is rendered on the mock canvas. Each issue carries the CSS the
  // layer has while the issue is open (`off`) and once fixed (`fix`), so the
  // canvas visibly snaps to the token when a suggestion is applied.
  // ---------------------------------------------------------------------------
  var V = {
    space12: ['VariableID:3:12', 'spacing/12'],
    space16: ['VariableID:3:13', 'spacing/16'],
    radiusMd: ['VariableID:3:22', 'radius/md'],
    radiusLg: ['VariableID:3:23', 'radius/lg'],
    textPrimary: ['VariableID:2:11', 'color/text/primary', 'Light'],
    primary500: ['VariableID:2:10', 'color/primary/500', 'Light'],
    borderDefault: ['VariableID:2:13', 'color/border/default', 'Light'],
    borderStrong: ['VariableID:2:14', 'color/border/strong', 'Light'],
    h3: ['S:acme-heading-h3,1:100', 'Heading/H3'],
    bodyMd: ['S:acme-body-md,1:101', 'Body/Medium'],
    labelBtn: ['S:acme-label-btn,1:103', 'Label/Button'],
    shadowSm: ['S:acme-shadow-sm,1:110', 'shadow/sm'],
    shadowMd: ['S:acme-shadow-md,1:111', 'shadow/md']
  };

  function fix(type, value, token, off, on) {
    return { type: type, value: value, varId: token[0], varName: token[1], varMode: token[2] || null, off: off, fix: on };
  }
  function manual(type, value, off) {
    return { type: type, value: value, varId: null, off: off || null, fix: null };
  }

  var NODES = [
    { id: '10:1', name: 'Checkout — Mobile', type: 'FRAME', parentId: '0:1',
      base: { width: '320px', background: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px 16px 24px', position: 'relative', color: '#0F172A' },
      issues: [] },

    { id: '10:2', name: 'Header', type: 'FRAME', parentId: '10:1',
      base: { display: 'flex', alignItems: 'center' },
      issues: [fix('gap', '10px', V.space12, { gap: '10px' }, { gap: '12px' })] },
    { id: '10:3', name: 'Back button', type: 'INSTANCE', parentId: '10:2', icon: 'back',
      base: { width: '36px', height: '36px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' },
      issues: [fix('border-radius', '7px', V.radiusMd, { borderRadius: '7px' }, { borderRadius: '8px' })] },
    { id: '10:4', name: 'Title', type: 'TEXT', parentId: '10:2', text: 'Checkout',
      base: { lineHeight: '28px' },
      issues: [fix('typography', 'Typography', V.h3, { fontSize: '21px', fontWeight: '700', letterSpacing: '-0.3px' }, { fontSize: '20px', fontWeight: '600', letterSpacing: '0px' })] },

    { id: '10:5', name: 'Order summary', type: 'FRAME', parentId: '10:1',
      base: { background: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '16px', paddingBottom: '16px', paddingRight: '16px' },
      issues: [
        fix('border-radius', '11px', V.radiusLg, { borderRadius: '11px' }, { borderRadius: '12px' }),
        fix('padding-left', '15px', V.space16, { paddingLeft: '15px' }, { paddingLeft: '16px' }),
        fix('effects', 'Drop shadow', V.shadowSm, { boxShadow: '0 6px 16px rgba(15,23,42,0.20)' }, { boxShadow: '0 1px 3px rgba(15,23,42,0.08)' })
      ] },

    { id: '10:6', name: 'Item row', type: 'FRAME', parentId: '10:5',
      base: { display: 'flex', alignItems: 'center' },
      issues: [fix('gap', '11px', V.space12, { gap: '11px' }, { gap: '12px' })] },
    { id: '10:7', name: 'Rectangle 12', type: 'RECTANGLE', parentId: '10:6',
      base: { width: '44px', height: '44px', borderRadius: '6px', background: 'linear-gradient(135deg,#C7D2FE,#A5B4FC)', flex: '0 0 auto' },
      issues: [manual('default-name', undefined)] },
    { id: '10:8', name: 'Product name', type: 'TEXT', parentId: '10:6', text: 'Linen overshirt',
      base: { flex: '1 1 auto', lineHeight: '24px' },
      issues: [fix('typography', 'Typography', V.bodyMd, { fontSize: '15px', fontWeight: '500' }, { fontSize: '16px', fontWeight: '400' })] },
    { id: '10:9', name: 'Price', type: 'TEXT', parentId: '10:6', text: '€59.00',
      base: { fontWeight: '600', fontVariantNumeric: 'tabular-nums' },
      issues: [fix('fill-color', '#1E293B', V.textPrimary, { color: '#475569' }, { color: '#0F172A' })] },

    { id: '10:10', name: 'Item row', type: 'FRAME', parentId: '10:5',
      base: { display: 'flex', alignItems: 'center' },
      issues: [fix('gap', '11px', V.space12, { gap: '11px' }, { gap: '12px' })] },
    { id: '10:11', name: 'Rectangle 14', type: 'RECTANGLE', parentId: '10:10',
      base: { width: '44px', height: '44px', borderRadius: '6px', background: 'linear-gradient(135deg,#FBCFE8,#F9A8D4)', flex: '0 0 auto' },
      issues: [manual('default-name', undefined)] },
    { id: '10:12', name: 'Product name', type: 'TEXT', parentId: '10:10', text: 'Canvas tote',
      base: { flex: '1 1 auto', lineHeight: '24px' },
      issues: [fix('typography', 'Typography', V.bodyMd, { fontSize: '15px', fontWeight: '500' }, { fontSize: '16px', fontWeight: '400' })] },
    { id: '10:13', name: 'Price', type: 'TEXT', parentId: '10:10', text: '€24.00',
      base: { fontWeight: '600', fontVariantNumeric: 'tabular-nums' },
      issues: [fix('fill-color', '#1E293B', V.textPrimary, { color: '#475569' }, { color: '#0F172A' })] },

    { id: '10:14', name: 'Line 3', type: 'LINE', parentId: '10:5',
      base: { height: '0px', borderTopStyle: 'solid', borderTopWidth: '1px' },
      issues: [
        manual('default-name', undefined),
        fix('stroke-color', '#DFE5EC', V.borderDefault, { borderTopColor: '#E9C9D2' }, { borderTopColor: '#E2E8F0' })
      ] },
    { id: '10:15', name: 'Total row', type: 'COMPONENT', parentId: '10:5',
      base: { display: 'flex', justifyContent: 'space-between', fontWeight: '600', lineHeight: '24px' },
      issues: [manual('missing-description', undefined)] },
    { id: '10:16', name: 'Total label', type: 'TEXT', parentId: '10:15', text: 'Total', textStyle: 'S:acme-label-strong,1:104', base: {}, issues: [] },
    { id: '10:17', name: 'Total value', type: 'TEXT', parentId: '10:15', text: '€83.00', textStyle: 'S:acme-label-strong,1:104', base: { fontVariantNumeric: 'tabular-nums' }, issues: [] },

    { id: '10:18', name: 'Promo code', type: 'FRAME', parentId: '10:1',
      base: { height: '44px', display: 'flex', alignItems: 'center', borderStyle: 'solid', borderWidth: '1px', background: '#FFFFFF' },
      issues: [
        fix('stroke-color', '#CDD5DF', V.borderStrong, { borderColor: '#C4B5FD' }, { borderColor: '#CBD5E1' }),
        fix('border-radius', '7px', V.radiusMd, { borderRadius: '7px' }, { borderRadius: '8px' }),
        fix('padding-left', '11px', V.space12, { paddingLeft: '11px' }, { paddingLeft: '12px' })
      ] },
    { id: '10:19', name: 'Placeholder', type: 'TEXT', parentId: '10:18', text: 'Promo code', textStyle: 'S:acme-body-md,1:101', base: { color: '#94A3B8' }, issues: [] },

    { id: '10:20', name: 'Frame 48', type: 'FRAME', parentId: '10:1',
      base: { height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF' },
      issues: [
        manual('default-name', undefined),
        fix('fill-color', '#3366EE', V.primary500, { background: '#5B7CF5' }, { background: '#2563EB' }),
        fix('border-radius', '7px', V.radiusMd, { borderRadius: '7px' }, { borderRadius: '8px' }),
        fix('effects', 'Drop shadow', V.shadowMd, { boxShadow: '0 8px 20px rgba(51,102,238,0.45)' }, { boxShadow: '0 4px 12px rgba(15,23,42,0.12)' })
      ] },
    { id: '10:21', name: 'Label', type: 'TEXT', parentId: '10:20', text: 'Pay €83.00',
      base: { lineHeight: '20px' },
      issues: [fix('typography', 'Typography', V.labelBtn, { fontSize: '14px', fontWeight: '700', letterSpacing: '0.4px' }, { fontSize: '15px', fontWeight: '600', letterSpacing: '0px' })] },

    { id: '10:22', name: 'Sale badge', type: 'FRAME', parentId: '10:1',
      base: { position: 'absolute', top: '74px', right: '6px', padding: '3px 8px', borderRadius: '999px', color: '#FFFFFF', fontSize: '11px', fontWeight: '700', letterSpacing: '0.6px', transform: 'rotate(6deg)' },
      issues: [
        manual('absolute-position', undefined),
        manual('fill-color', '#FF2D87', { background: '#FF2D87' })
      ] },
    { id: '10:23', name: 'Badge label', type: 'TEXT', parentId: '10:22', text: 'SALE', base: {}, issues: [] }
  ];

  // ---------------------------------------------------------------------------
  // Build the preview items exactly as the plugin's Variables tab consumes them.
  // ---------------------------------------------------------------------------
  function collectionsForUI(enabledMap) {
    return COLLECTIONS.map(function (c, idx) {
      return {
        id: c.id, name: c.name,
        enabled: enabledMap[c.id] !== false,
        isRemote: false,
        variableCount: VARIABLES.filter(function (v) { return v.c === idx; }).length,
        defaultModeName: c.defaultModeName,
        modes: c.modes,
        currentModeId: c.currentModeId
      };
    });
  }

  function variablesForCollection(collectionId, modeId) {
    var idx = COLLECTIONS.findIndex(function (c) { return c.id === collectionId; });
    if (idx < 0) return [];
    var col = COLLECTIONS[idx];
    var mode = modeId || col.currentModeId;
    return VARIABLES.filter(function (v) { return v.c === idx; }).map(function (v) {
      var raw = v.values[mode] !== undefined ? v.values[mode] : v.values[Object.keys(v.values)[0]];
      return {
        id: v.id, name: v.name, type: v.type,
        rawValue: v.type === 'COLOR' ? hexToRgb(raw) : raw,
        scopes: v.scopes,
        variableCollectionId: col.id
      };
    });
  }

  window.YADL_DEMO_DATA = {
    fileName: 'Checkout flow (demo file)',
    pageId: '0:1',
    rootId: '10:1',
    COLLECTIONS: COLLECTIONS,
    VARIABLES: VARIABLES,
    STYLE_GROUPS: STYLE_GROUPS,
    SAVED_LIBRARY: SAVED_LIBRARY,
    SAVED_LIBRARY_GROUPS: SAVED_LIBRARY_GROUPS,
    NODES: NODES,
    collectionsForUI: collectionsForUI,
    variablesForCollection: variablesForCollection
  };
})();
