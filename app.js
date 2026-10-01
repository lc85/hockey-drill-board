/**
 * Hockey Coach Whiteboard & Drill Studio
 * Recreating professional drill diagramming software
 */

(function () {
  'use strict';

  // --- STATE ---
  const state = {
    currentRink: 'half-dzone', // 'half-dzone', 'half-ozone', 'full', 'neutral'
    currentTool: 'select',     // 'select', 'path-arrow', 'wavy-line', 'line', 'text', 'eraser', etc.
    activePlayerToken: 'LW',
    currentColor: '#111111',
    strokeWidth: 3.5,
    strokeStyle: 'solid',      // 'solid', 'dashed', 'dotted', 'wavy'
    showGuidelines: true,
    showGoalieAngles: false,
    showHouse: true,
    showTrapezoid: true,
    
    // Canvas & Geometry
    canvasWidth: 1000,
    canvasHeight: 850,
    scale: 1,

    // Drill objects
    objects: [],
    selectedObjectId: null,
    hoveredObjectId: null,

    // Interaction
    isDragging: false,
    isResizing: false,
    activeResizeHandle: null,
    resizeInitial: null,
    dragStart: { x: 0, y: 0 },
    dragOffset: { x: 0, y: 0 },
    currentDrawingLine: null,
    guidelines: [],

    // Undo / Redo
    history: [],
    historyIndex: -1,

    // Animation
    isAnimating: false,
    animTime: 0,
    animDuration: 4.0,
    animInterval: null,

    // Drill Metadata
    drillTitle: 'D-Zone Coverage',
    duration: '10 Mins',
    coachingPoints: '• Protect the house (high-danger scoring area)\n• Strong-side winger covers the point\n• Center supports the defensemen down low\n• Stick on the ice, head on a swivel',
    notes: 'Standard 5-man collapse defensive zone coverage against an offensive umbrella.'
  };

  // --- DOM ELEMENTS ---
  const el = {
    canvas: document.getElementById('drillCanvas'),
    ctx: document.getElementById('drillCanvas').getContext('2d'),
    rinkSvg: document.getElementById('rinkSvg'),
    rinkMarkings: document.getElementById('rinkMarkingsGroup'),
    guidelineElements: document.getElementById('guidelineElements'),
    drillTitleInput: document.getElementById('drillTitleInput'),
    minsDropdownBtn: document.getElementById('minsDropdownBtn'),
    minsMenu: document.getElementById('minsMenu'),
    selectedMins: document.getElementById('selectedMins'),
    rinkDropdownBtn: document.getElementById('rinkDropdownBtn'),
    rinkMenu: document.getElementById('rinkMenu'),
    selectedRink: document.getElementById('selectedRink'),
    sidebarTools: document.getElementById('sidebarTools'),
    btnCollapseTools: document.getElementById('btnCollapseTools'),
    toolsGrid: document.querySelector('.tools-grid'),
    floatingBar: document.getElementById('floatingBar'),
    contextObjName: document.getElementById('contextObjName'),
    currentSwatchBtn: document.getElementById('currentSwatchBtn'),
    currentSwatchCircle: document.getElementById('currentSwatchCircle'),
    colorPalettePopover: document.getElementById('colorPalettePopover'),
    btnStrokeStyle: document.getElementById('btnStrokeStyle'),
    strokeMenuPopover: document.getElementById('strokeMenuPopover'),
    btnContextMore: document.getElementById('btnContextMore'),
    moreMenuPopover: document.getElementById('moreMenuPopover'),
    actDuplicate: document.getElementById('actDuplicate'),
    actBringForward: document.getElementById('actBringForward'),
    actSendBackward: document.getElementById('actSendBackward'),
    actDelete: document.getElementById('actDelete'),
    toastBanner: document.getElementById('toastBanner'),
    // Action buttons
    btnToggleLayers: document.getElementById('btnToggleLayers'),
    btnSaveDrill: document.getElementById('btnSaveDrill'),
    btnSaveAs: document.getElementById('btnSaveAs'),
    btnPrintDrill: document.getElementById('btnPrintDrill'),
    btnExportImage: document.getElementById('btnExportImage'),
    btnTopUndo: document.getElementById('btnTopUndo'),
    btnTopRedo: document.getElementById('btnTopRedo'),
    btnGridUndo: document.getElementById('btnGridUndo'),
    btnGridRedo: document.getElementById('btnGridRedo'),
    btnFolderLibrary: document.getElementById('btnFolderLibrary'),
    btnClearBoard: document.getElementById('btnClearBoard'),
    btnDrillNotes: document.getElementById('btnDrillNotes'),
    btnToolAnimate: document.getElementById('btnToolAnimate'),
    // Goalie accordion
    btnGoalieToggle: document.getElementById('btnGoalieToggle'),
    goalieAccordion: document.getElementById('goalieAccordion'),
    chkGoalieAngles: document.getElementById('chkGoalieAngles'),
    chkHouseCoverage: document.getElementById('chkHouseCoverage') || document.getElementById('chkGoalieCreaseBox'),
    chkTrapezoidRule: document.getElementById('chkTrapezoidRule'),
    // Drills drawer
    drillsDrawer: document.getElementById('drillsDrawer'),
    btnDrillsTabHandle: document.getElementById('btnDrillsTabHandle'),
    btnCloseDrillsDrawer: document.getElementById('btnCloseDrillsDrawer'),
    drillsList: document.getElementById('drillsList'),
    btnSaveCurrentToLibrary: document.getElementById('btnSaveCurrentToLibrary'),
    // Notes modal
    notesModal: document.getElementById('notesModal'),
    modalDrillName: document.getElementById('modalDrillName'),
    modalCoachingPoints: document.getElementById('modalCoachingPoints'),
    modalDescription: document.getElementById('modalDescription'),
    btnCloseNotesModal: document.getElementById('btnCloseNotesModal'),
    btnCancelNotes: document.getElementById('btnCancelNotes'),
    btnSaveNotes: document.getElementById('btnSaveNotes'),
    // Anim bar
    animControlBar: document.getElementById('animControlBar'),
    btnPlayPause: document.getElementById('btnPlayPause'),
    iconPlay: document.getElementById('iconPlay'),
    iconPause: document.getElementById('iconPause'),
    txtPlayPause: document.getElementById('txtPlayPause'),
    animScrubber: document.getElementById('animScrubber'),
    animTimeLabel: document.getElementById('animTimeLabel'),
    btnResetAnim: document.getElementById('btnResetAnim'),
    btnCloseAnim: document.getElementById('btnCloseAnim'),
    btnCoachAssistant: document.getElementById('btnCoachAssistant')
  };

  // --- HOCKEY DRILL PRESETS ---
  const PRESET_DRILLS = [
    {
      id: 'dzone-coverage',
      title: 'D-Zone Coverage',
      duration: '10 Mins',
      category: 'dzone',
      rink: 'half-dzone',
      description: 'Defensive house collapse coverage against offensive perimeter pressure.',
      objects: [
        // House Defensive Coverage Polygon / "Home Plate" (in background)
        {
          id: 'house_line1',
          type: 'line',
          isHouse: true,
          color: '#111111',
          width: 2.4,
          style: 'solid',
          points: [
            { x: 220, y: 455 },
            { x: 350, y: 290 },
            { x: 470, y: 290 },
            { x: 470, y: 560 },
            { x: 350, y: 560 },
            { x: 220, y: 395 }
          ]
        },
        // Goalie
        { id: 'g1', type: 'player', role: 'G', label: 'G', x: 235, y: 425, color: '#111111', radius: 18 },
        // Left Defense
        { id: 'ld1', type: 'player', role: 'LD', label: 'LD', x: 172, y: 395, color: '#111111', radius: 18 },
        // Right Defense
        { id: 'rd1', type: 'player', role: 'RD', label: 'RD', x: 282, y: 512, color: '#111111', radius: 18 },
        // Center
        { id: 'c1', type: 'player', role: 'C', label: 'C', x: 295, y: 275, color: '#111111', radius: 18 },
        // Left Wing (Active in screenshot)
        { id: 'lw1', type: 'player', role: 'LW', label: 'LW', x: 280, y: 165, color: '#111111', radius: 18 },
        // Right Wing
        { id: 'rw1', type: 'player', role: 'RW', label: 'RW', x: 520, y: 625, color: '#111111', radius: 18 },
        
        // 5 Opponents (Bold X)
        { id: 'x1', type: 'opponent', label: 'X', x: 182, y: 352, color: '#111111', size: 24 },
        { id: 'x2', type: 'opponent', label: 'X', x: 290, y: 228, color: '#111111', size: 24 },
        { id: 'x3', type: 'opponent', label: 'X', x: 308, y: 528, color: '#111111', size: 24 },
        { id: 'x4', type: 'opponent', label: 'X', x: 578, y: 176, color: '#111111', size: 24 },
        { id: 'x5', type: 'opponent', label: 'X', x: 608, y: 636, color: '#111111', size: 24 },

        // Puck
        { id: 'puck1', type: 'puck', x: 274, y: 155, color: '#111111', radius: 8 }
      ],
      selectedId: 'lw1',
      showGuidelinesOnLoad: true
    },
    {
      id: 'breakout-2on1',
      title: 'Breakout 2-on-1 Counter',
      duration: '15 Mins',
      category: 'offense',
      rink: 'half-ozone',
      description: 'Quick breakout up the wall with center swing and cross-ice 2-on-1 entry.',
      objects: [
        { id: 'b_g', type: 'player', role: 'G', label: 'G', x: 235, y: 425, color: '#111111', radius: 18 },
        { id: 'b_d1', type: 'player', role: 'LD', label: 'LD', x: 200, y: 600, color: '#111111', radius: 18 },
        { id: 'b_c', type: 'player', role: 'C', label: 'C', x: 340, y: 425, color: '#111111', radius: 18 },
        { id: 'b_rw', type: 'player', role: 'RW', label: 'RW', x: 420, y: 220, color: '#111111', radius: 18 },
        { id: 'b_x1', type: 'opponent', label: 'X', x: 500, y: 425, color: '#dc2626', size: 24 },
        {
          id: 'b_pass1',
          type: 'line',
          color: '#1d4ed8',
          width: 3,
          style: 'dashed',
          points: [{ x: 200, y: 600 }, { x: 340, y: 425 }]
        }
      ]
    },
    {
      id: 'umbrella-pp',
      title: 'Powerplay 1-3-1 Umbrella',
      duration: '12 Mins',
      category: 'special',
      rink: 'half-dzone',
      description: 'Special teams powerplay set up with high point distributor and bumper center.',
      objects: [
        { id: 'pp_g', type: 'player', role: 'G', label: 'G', x: 235, y: 425, color: '#111111', radius: 18 },
        { id: 'pp_d', type: 'player', role: 'D', label: 'D', x: 620, y: 425, color: '#1976d2', radius: 18 },
        { id: 'pp_lw', type: 'player', role: 'LW', label: 'LW', x: 450, y: 240, color: '#1976d2', radius: 18 },
        { id: 'pp_c', type: 'player', role: 'C', label: 'C', x: 360, y: 425, color: '#1976d2', radius: 18 },
        { id: 'pp_rw', type: 'player', role: 'RW', label: 'RW', x: 450, y: 610, color: '#1976d2', radius: 18 },
        { id: 'pp_f', type: 'player', role: 'F', label: 'F', x: 270, y: 425, color: '#1976d2', radius: 18 },
        { id: 'pk1', type: 'opponent', label: 'X', x: 380, y: 350, color: '#dc2626', size: 22 },
        { id: 'pk2', type: 'opponent', label: 'X', x: 380, y: 500, color: '#dc2626', size: 22 },
        { id: 'pk3', type: 'opponent', label: 'X', x: 310, y: 360, color: '#dc2626', size: 22 },
        { id: 'pk4', type: 'opponent', label: 'X', x: 310, y: 490, color: '#dc2626', size: 22 }
      ]
    }
  ];

  // --- INITIALIZATION ---
  function init() {
    setupCanvas();
    renderRinkSVG();
    loadPresetDrill('dzone-coverage');
    bindEvents();
    renderDrillsDrawerList();
    render();
    window.addEventListener('resize', onResize);
    onResize();

    // Register PWA Service Worker for offline rink access
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch((err) => {
          console.warn('Service worker registration failed:', err);
        });
      });
    }
  }

  // --- CANVAS SETUP ---
  function setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    el.canvas.width = state.canvasWidth * dpr;
    el.canvas.height = state.canvasHeight * dpr;
    el.ctx.scale(dpr, dpr);
  }

  function onResize() {
    const rect = el.canvas.getBoundingClientRect();
    state.scaleX = rect.width / state.canvasWidth;
    state.scaleY = rect.height / state.canvasHeight;
    state.scale = state.scaleX;
    updateFloatingBarPosition();
  }

  // --- SVG HOCKEY RINK DRAWING ENGINE ---
  function renderRinkSVG() {
    const g = el.rinkMarkings;
    g.innerHTML = '';

    if (state.currentRink === 'half-dzone' || state.currentRink === 'half-ozone') {
      renderHalfRinkSVG(g);
    } else if (state.currentRink === 'full') {
      renderFullRinkSVG(g);
    } else {
      renderNeutralZoneSVG(g);
    }
  }

  function renderHalfRinkSVG(g) {
    const isOZone = state.currentRink === 'half-ozone';
    // Geometry coordinates:
    // Left end: rounded boards corner radius 200px
    // Boards rect from x=160 to 920, y=90 to 760
    const boardsPath = `
      M 320 90
      L 920 90
      L 920 760
      L 320 760
      C 200 760, 150 710, 150 590
      L 150 260
      C 150 140, 200 90, 320 90
      Z
    `;

    // 1. Rink Board Border (Thick dark line like screenshot)
    g.appendChild(createSvgElement('path', {
      d: boardsPath,
      fill: '#ffffff',
      stroke: '#1e293b',
      'stroke-width': '4.5',
      'stroke-linejoin': 'round'
    }));

    // 2. Goal Line (Red line across ice at x = 220)
    g.appendChild(createSvgElement('line', {
      x1: '220', y1: '120',
      x2: '220', y2: '730',
      stroke: '#dc2626',
      'stroke-width': '2.8'
    }));

    // 3. Trapezoid (Restricted area behind goal line)
    if (state.showTrapezoid) {
      g.appendChild(createSvgElement('path', {
        d: 'M 220 330 L 152 280 M 220 520 L 152 570',
        stroke: '#dc2626',
        'stroke-width': '2.2'
      }));
    }

    // 4. Goal Crease (Blue shaded semi-circle / trapezoid in front of net)
    g.appendChild(createSvgElement('path', {
      d: 'M 220 395 L 245 395 C 275 410, 275 440, 245 455 L 220 455 Z',
      fill: 'url(#creaseGrad)',
      stroke: '#dc2626',
      'stroke-width': '2.4'
    }));

    // Crease L-ticks (Red goal line markers)
    g.appendChild(createSvgElement('line', {
      x1: '235', y1: '395', x2: '235', y2: '403',
      stroke: '#dc2626', 'stroke-width': '2'
    }));
    g.appendChild(createSvgElement('line', {
      x1: '235', y1: '455', x2: '235', y2: '447',
      stroke: '#dc2626', 'stroke-width': '2'
    }));

    // 5. Goal Net (Behind goal line with red frame and mesh)
    g.appendChild(createSvgElement('polygon', {
      points: '220,400 185,408 185,442 220,450',
      fill: '#ffffff',
      stroke: '#dc2626',
      'stroke-width': '3'
    }));
    g.appendChild(createSvgElement('polygon', {
      points: '220,400 185,408 185,442 220,450',
      fill: 'url(#netMesh)'
    }));

    // 6. Two End-Zone Face-Off Circles (Red circles with tick marks)
    renderFaceOffCircle(g, 350, 290); // Top circle
    renderFaceOffCircle(g, 350, 560); // Bottom circle

    // 7. Blue Line (Thick navy blue line at x = 700)
    g.appendChild(createSvgElement('line', {
      x1: '700', y1: '90',
      x2: '700', y2: '760',
      stroke: '#105991',
      'stroke-width': '8'
    }));

    // 8. Neutral Zone Face-Off Dots (Red dots outside blue line)
    g.appendChild(createSvgElement('circle', {
      cx: '750', cy: '290', r: '7',
      fill: '#dc2626'
    }));
    g.appendChild(createSvgElement('circle', {
      cx: '750', cy: '560', r: '7',
      fill: '#dc2626'
    }));

    // 9. Center Line & Half Center Circle
    g.appendChild(createSvgElement('line', {
      x1: '890', y1: '90',
      x2: '890', y2: '760',
      stroke: '#dc2626',
      'stroke-width': '7',
      'stroke-dasharray': '14 8'
    }));
    g.appendChild(createSvgElement('path', {
      d: 'M 890 325 A 100 100 0 0 0 890 525',
      fill: 'none',
      stroke: '#105991',
      'stroke-width': '3'
    }));
    g.appendChild(createSvgElement('circle', {
      cx: '890', cy: '425', r: '6.5',
      fill: '#105991'
    }));

    // Optional Goalie Angle Lines
    if (state.showGoalieAngles) {
      g.appendChild(createSvgElement('line', {
        x1: '220', y1: '400', x2: '600', y2: '200',
        stroke: '#0284c7', 'stroke-width': '1.5', 'stroke-dasharray': '4 4'
      }));
      g.appendChild(createSvgElement('line', {
        x1: '220', y1: '450', x2: '600', y2: '650',
        stroke: '#0284c7', 'stroke-width': '1.5', 'stroke-dasharray': '4 4'
      }));
    }
  }

  function renderFaceOffCircle(g, cx, cy) {
    const r = 115;
    // Outer Red Circle
    g.appendChild(createSvgElement('circle', {
      cx: cx, cy: cy, r: r,
      fill: 'none',
      stroke: '#dc2626',
      'stroke-width': '2.2'
    }));

    // Center Red Dot
    g.appendChild(createSvgElement('circle', {
      cx: cx, cy: cy, r: '6.5',
      fill: '#dc2626'
    }));

    // Hash marks on circle (4 player alignment marks)
    const hashDist = r + 14;
    // Top & bottom ticks
    g.appendChild(createSvgElement('line', { x1: cx - 18, y1: cy - r, x2: cx - 18, y2: cy - hashDist, stroke: '#dc2626', 'stroke-width': '2' }));
    g.appendChild(createSvgElement('line', { x1: cx + 18, y1: cy - r, x2: cx + 18, y2: cy - hashDist, stroke: '#dc2626', 'stroke-width': '2' }));
    g.appendChild(createSvgElement('line', { x1: cx - 18, y1: cy + r, x2: cx - 18, y2: cy + hashDist, stroke: '#dc2626', 'stroke-width': '2' }));
    g.appendChild(createSvgElement('line', { x1: cx + 18, y1: cy + r, x2: cx + 18, y2: cy + hashDist, stroke: '#dc2626', 'stroke-width': '2' }));

    // Referee Crosshairs / L-tick marks around dot
    const lOffset = 22;
    const lSize = 14;
    // Top-Left L
    g.appendChild(createSvgElement('path', {
      d: `M ${cx - lOffset} ${cy - lOffset + lSize} L ${cx - lOffset} ${cy - lOffset} L ${cx - lOffset + lSize} ${cy - lOffset}`,
      fill: 'none', stroke: '#dc2626', 'stroke-width': '2'
    }));
    // Top-Right L
    g.appendChild(createSvgElement('path', {
      d: `M ${cx + lOffset} ${cy - lOffset + lSize} L ${cx + lOffset} ${cy - lOffset} L ${cx + lOffset - lSize} ${cy - lOffset}`,
      fill: 'none', stroke: '#dc2626', 'stroke-width': '2'
    }));
    // Bottom-Left L
    g.appendChild(createSvgElement('path', {
      d: `M ${cx - lOffset} ${cy + lOffset - lSize} L ${cx - lOffset} ${cy + lOffset} L ${cx - lOffset + lSize} ${cy + lOffset}`,
      fill: 'none', stroke: '#dc2626', 'stroke-width': '2'
    }));
    // Bottom-Right L
    g.appendChild(createSvgElement('path', {
      d: `M ${cx + lOffset} ${cy + lOffset - lSize} L ${cx + lOffset} ${cy + lOffset} L ${cx + lOffset - lSize} ${cy + lOffset}`,
      fill: 'none', stroke: '#dc2626', 'stroke-width': '2'
    }));
  }

  function renderFullRinkSVG(g) {
    // Standard full rink outline
    g.appendChild(createSvgElement('rect', {
      x: '60', y: '100', width: '880', height: '650', rx: '130', ry: '130',
      fill: '#ffffff', stroke: '#1e293b', 'stroke-width': '4'
    }));

    // Center Red Line
    g.appendChild(createSvgElement('line', {
      x1: '500', y1: '100', x2: '500', y2: '750',
      stroke: '#dc2626', 'stroke-width': '6', 'stroke-dasharray': '14 8'
    }));

    // Center Circle
    g.appendChild(createSvgElement('circle', {
      cx: '500', cy: '425', r: '90',
      fill: 'none', stroke: '#105991', 'stroke-width': '2.5'
    }));
    g.appendChild(createSvgElement('circle', {
      cx: '500', cy: '425', r: '6',
      fill: '#105991'
    }));

    // Blue Lines
    g.appendChild(createSvgElement('line', { x1: '350', y1: '100', x2: '350', y2: '750', stroke: '#105991', 'stroke-width': '6' }));
    g.appendChild(createSvgElement('line', { x1: '650', y1: '100', x2: '650', y2: '750', stroke: '#105991', 'stroke-width': '6' }));

    // Left Goal Line & Crease
    g.appendChild(createSvgElement('line', { x1: '120', y1: '150', x2: '120', y2: '700', stroke: '#dc2626', 'stroke-width': '2.5' }));
    g.appendChild(createSvgElement('path', {
      d: 'M 120 405 L 140 405 C 160 415, 160 435, 140 445 L 120 445 Z',
      fill: 'url(#creaseGrad)', stroke: '#dc2626', 'stroke-width': '2'
    }));

    // Right Goal Line & Crease
    g.appendChild(createSvgElement('line', { x1: '880', y1: '150', x2: '880', y2: '700', stroke: '#dc2626', 'stroke-width': '2.5' }));
    g.appendChild(createSvgElement('path', {
      d: 'M 880 405 L 860 405 C 840 415, 840 435, 860 445 L 880 445 Z',
      fill: 'url(#creaseGrad)', stroke: '#dc2626', 'stroke-width': '2'
    }));

    // 4 Endzone circles (scaled)
    renderFaceOffCircle(g, 220, 260);
    renderFaceOffCircle(g, 220, 590);
    renderFaceOffCircle(g, 780, 260);
    renderFaceOffCircle(g, 780, 590);
  }

  function renderNeutralZoneSVG(g) {
    // Cross Ice / Neutral zone board
    g.appendChild(createSvgElement('rect', {
      x: '100', y: '100', width: '800', height: '650', rx: '40',
      fill: '#ffffff', stroke: '#1e293b', 'stroke-width': '4'
    }));
    // Center line
    g.appendChild(createSvgElement('line', {
      x1: '500', y1: '100', x2: '500', y2: '750',
      stroke: '#dc2626', 'stroke-width': '6', 'stroke-dasharray': '12 6'
    }));
    // Center circle
    g.appendChild(createSvgElement('circle', {
      cx: '500', cy: '425', r: '120',
      fill: 'none', stroke: '#105991', 'stroke-width': '2.5'
    }));
    g.appendChild(createSvgElement('circle', {
      cx: '500', cy: '425', r: '7',
      fill: '#105991'
    }));
  }

  function createSvgElement(tag, attrs) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [key, value] of Object.entries(attrs)) {
      el.setAttribute(key, value);
    }
    return el;
  }

  // --- DRAWING CANVAS RENDERING ---
  function render() {
    const ctx = el.ctx;
    ctx.clearRect(0, 0, state.canvasWidth, state.canvasHeight);

    // 1. Draw all lines first (background layer)
    state.objects.forEach(obj => {
      if (obj.type === 'line') {
        if ((obj.id === 'house_line1' || obj.isHouse) && !state.showHouse) {
          return;
        }
        drawObject(ctx, obj);
      }
    });

    // 2. Draw shapes, equipment, and text
    state.objects.forEach(obj => {
      if (obj.type !== 'line' && obj.type !== 'player' && obj.type !== 'opponent' && obj.type !== 'puck') {
        drawObject(ctx, obj);
      }
    });

    // 3. Draw players, opponents, and pucks on top
    state.objects.forEach(obj => {
      if (obj.type === 'player' || obj.type === 'opponent' || obj.type === 'puck') {
        drawObject(ctx, obj);
      }
    });

    // 3. Draw active drawing line
    if (state.currentDrawingLine) {
      drawLine(ctx, state.currentDrawingLine);
    }

    // 4. Draw selection highlight
    if (state.selectedObjectId) {
      const selected = getObjectById(state.selectedObjectId);
      if (selected) {
        drawSelectionBox(ctx, selected);
      }
    }

    // 5. Update Guidelines SVG
    renderGuidelines();
  }

  function drawObject(ctx, obj) {
    ctx.save();

    switch (obj.type) {
      case 'player':
        drawPlayerToken(ctx, obj);
        break;
      case 'opponent':
        drawOpponentMarker(ctx, obj);
        break;
      case 'puck':
        drawPuck(ctx, obj);
        break;
      case 'puck-cluster':
        drawPuckCluster(ctx, obj);
        break;
      case 'line':
        drawLine(ctx, obj);
        break;
      case 'shape':
        drawShape(ctx, obj);
        break;
      case 'text':
        drawTextLabel(ctx, obj);
        break;
      case 'cone':
        drawCone(ctx, obj);
        break;
      case 'net':
        drawMiniNet(ctx, obj);
        break;
      case 'tire':
        drawTire(ctx, obj);
        break;
      case 'stick':
        drawStick(ctx, obj);
        break;
      case 'barrier':
        drawBarrier(ctx, obj);
        break;
      default:
        break;
    }

    ctx.restore();
  }

  // --- OBJECT RENDERERS ---

  function drawPlayerToken(ctx, player) {
    const { x, y, radius = 18, label = 'LW', color = '#111111' } = player;

    // Outer subtle shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = Math.max(2, radius * 0.22);
    ctx.shadowOffsetY = Math.max(1, radius * 0.1);

    // Token Circle Body
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // White Ring Border
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = Math.max(1.2, radius * 0.1);
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Text Label inside token (LW, C, RW, etc.)
    ctx.fillStyle = '#ffffff';
    const fontSize = Math.max(8, Math.round(radius * (label.length > 2 ? 0.55 : 0.72)));
    ctx.font = `bold ${fontSize}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y + 0.5);
  }

  function drawOpponentMarker(ctx, opp) {
    const { x, y, size = 24, color = '#111111' } = opp;
    const half = size / 2;

    ctx.lineWidth = Math.max(2, size / 7);
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';

    // Bold 'X'
    ctx.beginPath();
    ctx.moveTo(x - half, y - half);
    ctx.lineTo(x + half, y + half);
    ctx.moveTo(x + half, y - half);
    ctx.lineTo(x - half, y + half);
    ctx.stroke();
  }

  function drawPuck(ctx, puck) {
    const { x, y, radius = 8, color = '#111111' } = puck;

    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = Math.max(2, radius * 0.35);
    ctx.shadowOffsetY = Math.max(1, radius * 0.18);

    ctx.beginPath();
    ctx.ellipse(x, y, radius, radius * 0.75, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.lineWidth = Math.max(0.8, radius * 0.12);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.stroke();
  }

  function drawPuckCluster(ctx, pucks) {
    const { x, y, color = '#111111', scale = 1 } = pucks;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    const offsets = [
      { dx: -6, dy: -4 },
      { dx: 6, dy: -3 },
      { dx: 0, dy: 5 },
      { dx: 7, dy: 6 }
    ];
    offsets.forEach(off => {
      ctx.beginPath();
      ctx.ellipse(off.dx, off.dy, 5, 4, 0, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });
    ctx.restore();
  }

  function drawLine(ctx, line) {
    const { points, color = '#111111', width = 3, style = 'solid', hasArrow = false, isWavy = false } = line;
    if (!points || points.length < 2) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (style === 'dashed') {
      ctx.setLineDash([8, 6]);
    } else if (style === 'dotted') {
      ctx.setLineDash([3, 5]);
    } else {
      ctx.setLineDash([]);
    }

    if (isWavy || style === 'wavy') {
      drawWavyLine(ctx, points);
    } else {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
    }

    ctx.setLineDash([]);

    // Draw Arrowhead at the end if applicable
    if (hasArrow && points.length >= 2) {
      const p1 = points[points.length - 2];
      const p2 = points[points.length - 1];
      drawArrowhead(ctx, p1.x, p1.y, p2.x, p2.y, width * 3, color);
    }
  }

  function drawWavyLine(ctx, points) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const waveLength = 14;
      const waveCount = Math.max(1, Math.floor(dist / waveLength));
      const step = dist / waveCount;
      const amp = 6;

      for (let j = 0; j < waveCount; j++) {
        const segStart = j * step;
        const segMid = segStart + step / 2;
        const segEnd = (j + 1) * step;

        const perpAngle = angle + Math.PI / 2;
        const side = j % 2 === 0 ? 1 : -1;

        const cpX = p1.x + Math.cos(angle) * segMid + Math.cos(perpAngle) * (amp * side);
        const cpY = p1.y + Math.sin(angle) * segMid + Math.sin(perpAngle) * (amp * side);

        const endX = p1.x + Math.cos(angle) * segEnd;
        const endY = p1.y + Math.sin(angle) * segEnd;

        ctx.quadraticCurveTo(cpX, cpY, endX, endY);
      }
    }
    ctx.stroke();
  }

  function drawArrowhead(ctx, fromX, fromY, toX, toY, size = 12, color = '#111111') {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.save();
    ctx.fillStyle = color;
    ctx.translate(toX, toY);
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-size, -size * 0.55);
    ctx.lineTo(-size * 0.7, 0);
    ctx.lineTo(-size, size * 0.55);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function drawShape(ctx, shape) {
    const { kind, x, y, width = 36, height = 36, color = '#111111', strokeWidth = 2.5 } = shape;
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;

    if (kind === 'triangle') {
      ctx.beginPath();
      ctx.moveTo(x, y - height / 2);
      ctx.lineTo(x - width / 2, y + height / 2);
      ctx.lineTo(x + width / 2, y + height / 2);
      ctx.closePath();
      ctx.stroke();
    } else if (kind === 'circle') {
      ctx.beginPath();
      ctx.ellipse(x, y, Math.abs(width) / 2, Math.abs(height) / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (kind === 'square') {
      ctx.beginPath();
      ctx.rect(x - width / 2, y - height / 2, width, height);
      ctx.stroke();
    }
  }

  function drawTextLabel(ctx, textObj) {
    const { x, y, text = 'Drill Note', color = '#111111', fontSize = 14 } = textObj;
    ctx.fillStyle = color;
    ctx.font = `600 ${fontSize}px Inter, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
  }

  function drawCone(ctx, cone) {
    const { x, y, color = '#ea580c', scale = 1 } = cone;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = color;
    // Orange cone
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(-9, 10);
    ctx.lineTo(9, 10);
    ctx.closePath();
    ctx.fill();

    // Cone base
    ctx.fillRect(-11, 10, 22, 3.5);

    // White reflective band
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-5, 0, 10, 3);
    ctx.restore();
  }

  function drawMiniNet(ctx, net) {
    const { x, y, color = '#dc2626', width = 48, height = 28 } = net;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1.8, width / 18);
    ctx.strokeRect(x - width / 2, y - height / 2, width, height);
    ctx.fillStyle = 'rgba(200, 200, 200, 0.4)';
    ctx.fillRect(x - width / 2, y - height / 2, width, height);

    ctx.strokeStyle = 'rgba(120, 120, 120, 0.5)';
    ctx.lineWidth = 1;
    const cols = 4;
    for (let c = 1; c < cols; c++) {
      ctx.beginPath();
      ctx.moveTo(x - width / 2 + (width / cols) * c, y - height / 2);
      ctx.lineTo(x - width / 2 + (width / cols) * c, y + height / 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawTire(ctx, tire) {
    const { x, y, color = '#1e293b', scale = 1 } = tire;
    const r = Math.max(5, 12 * scale);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, r * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }

  function drawStick(ctx, stick) {
    const { x, y, color = '#475569', scale = 1 } = stick;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-12, -14);
    ctx.lineTo(4, 12);
    ctx.lineTo(16, 12);
    ctx.stroke();
    ctx.restore();
  }

  function drawBarrier(ctx, barrier) {
    const { x, y, color = '#105991', width = 48, height = 10 } = barrier;
    ctx.fillStyle = color;
    ctx.fillRect(x - width / 2, y - height / 2, width, height);
  }

  function drawSelectionBox(ctx, obj) {
    const bounds = getObjectBounds(obj);
    ctx.save();
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(bounds.x - 4, bounds.y - 4, bounds.width + 8, bounds.height + 8);

    // 4 Corner handles (the corner dots for resizing)
    ctx.setLineDash([]);
    const handleRadius = 4.5;
    const corners = getCornerHandles(bounds);

    corners.forEach(c => {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetY = 1;

      ctx.beginPath();
      ctx.arc(c.x, c.y, handleRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#0284c7';
      ctx.stroke();
    });

    ctx.restore();
  }

  function getCornerHandles(bounds) {
    const pad = 4;
    return [
      { key: 'tl', x: bounds.x - pad, y: bounds.y - pad, cursor: 'nwse-resize' },
      { key: 'tr', x: bounds.x + bounds.width + pad, y: bounds.y - pad, cursor: 'nesw-resize' },
      { key: 'bl', x: bounds.x - pad, y: bounds.y + bounds.height + pad, cursor: 'nesw-resize' },
      { key: 'br', x: bounds.x + bounds.width + pad, y: bounds.y + bounds.height + pad, cursor: 'nwse-resize' }
    ];
  }

  function getOppositeCorner(bounds, handleKey) {
    switch (handleKey) {
      case 'tl': return { x: bounds.x + bounds.width, y: bounds.y + bounds.height };
      case 'tr': return { x: bounds.x, y: bounds.y + bounds.height };
      case 'bl': return { x: bounds.x + bounds.width, y: bounds.y };
      case 'br': return { x: bounds.x, y: bounds.y };
      default: return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
    }
  }

  function hitTestResizeHandle(x, y) {
    if (!state.selectedObjectId) return null;
    const selected = getObjectById(state.selectedObjectId);
    if (!selected) return null;

    const bounds = getObjectBounds(selected);
    const corners = getCornerHandles(bounds);
    const hitRadius = 14;

    for (let i = 0; i < corners.length; i++) {
      const c = corners[i];
      if (Math.hypot(x - c.x, y - c.y) <= hitRadius) {
        return c;
      }
    }
    return null;
  }

  // --- DYNAMIC ALIGNMENT GUIDELINES (Matches screenshot cyan dotted lines) ---
  function renderGuidelines() {
    const g = el.guidelineElements;
    g.innerHTML = '';

    if (!state.showGuidelines || !state.selectedObjectId) return;
    const selected = getObjectById(state.selectedObjectId);
    if (!selected || selected.type === 'line') return;

    // Draw alignment guidelines across full canvas for selected element
    const x = selected.x;
    const y = selected.y;

    // Vertical cyan/blue dotted guidelines
    const vLine = createSvgElement('line', {
      x1: x, y1: '0',
      x2: x, y2: '850',
      stroke: '#0284c7',
      'stroke-width': '1.2',
      'stroke-dasharray': '3 3'
    });
    g.appendChild(vLine);

    // Second parallel guide like screenshot
    const vLine2 = createSvgElement('line', {
      x1: x + 16, y1: '0',
      x2: x + 16, y2: '850',
      stroke: '#0284c7',
      'stroke-width': '1.2',
      'stroke-dasharray': '3 3'
    });
    g.appendChild(vLine2);

    const vLine3 = createSvgElement('line', {
      x1: x - 16, y1: '0',
      x2: x - 16, y2: '850',
      stroke: '#0284c7',
      'stroke-width': '1.2',
      'stroke-dasharray': '3 3'
    });
    g.appendChild(vLine3);

    // Horizontal cyan/blue dotted guidelines
    const hLine = createSvgElement('line', {
      x1: '0', y1: y,
      x2: '1000', y2: y,
      stroke: '#0284c7',
      'stroke-width': '1.2',
      'stroke-dasharray': '3 3'
    });
    g.appendChild(hLine);

    const hLine2 = createSvgElement('line', {
      x1: '0', y1: y - 16,
      x2: '1000', y2: y - 16,
      stroke: '#0284c7',
      'stroke-width': '1.2',
      'stroke-dasharray': '3 3'
    });
    g.appendChild(hLine2);
  }

  // --- FLOATING CONTEXT TOOLBAR LOGIC ---
  function updateFloatingBar() {
    const selected = getObjectById(state.selectedObjectId);
    if (!selected) {
      el.floatingBar.style.display = 'none';
      return;
    }

    el.floatingBar.style.display = 'flex';
    let name = 'Object';
    if (selected.type === 'player') name = `Player ${selected.label || ''}`;
    else if (selected.type === 'opponent') name = 'Opponent (X)';
    else if (selected.type === 'puck') name = 'Puck';
    else if (selected.type === 'line') name = 'Pass / Line';
    else if (selected.type === 'shape') name = selected.kind || 'Shape';
    else if (selected.type === 'text') name = 'Text Note';
    else name = selected.type;

    el.contextObjName.textContent = name;
    el.currentSwatchCircle.style.backgroundColor = selected.color || '#111111';

    updateFloatingBarPosition();
  }

  function updateFloatingBarPosition() {
    const selected = getObjectById(state.selectedObjectId);
    if (!selected || el.floatingBar.style.display === 'none') return;

    const bounds = getObjectBounds(selected);
    const canvasRect = el.canvas.getBoundingClientRect();
    const containerRect = document.querySelector('.ice-stage-container').getBoundingClientRect();
    const scaleX = canvasRect.width / state.canvasWidth;
    const scaleY = canvasRect.height / state.canvasHeight;

    // Screen coordinates of object top-center
    const screenX = canvasRect.left + (bounds.x + bounds.width / 2) * scaleX - containerRect.left;
    const screenY = canvasRect.top + bounds.y * scaleY - containerRect.top;

    // Move menu up with generous clearance (68px above bounds) so user can freely grab and move object
    let posX = screenX - 90;
    let posY = screenY - 68;

    // If too close to top edge of stage, place safely below object
    if (posY < 10) {
      posY = screenY + (bounds.height * scaleY) + 24;
    }
    if (posX < 10) posX = 10;
    const maxPosX = containerRect.width - 200;
    if (posX > maxPosX) posX = maxPosX;

    el.floatingBar.style.left = `${posX}px`;
    el.floatingBar.style.top = `${posY}px`;
  }

  // --- EVENT HANDLING ---
  function bindEvents() {
    // 1. Tool selection in sidebar
    el.toolsGrid.addEventListener('click', onToolClick);

    // 2. Canvas mouse & touch interactions
    el.canvas.addEventListener('mousedown', onCanvasMouseDown);
    window.addEventListener('mousemove', onCanvasMouseMove);
    window.addEventListener('mouseup', onCanvasMouseUp);

    // Touch support for tablets/smartboards
    el.canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    // 3. Keyboard shortcuts
    window.addEventListener('keydown', onKeyDown);

    // 4. Header buttons & dropdowns
    setupDropdowns();
    setupHeaderActions();

    // 5. Context Bar actions
    setupContextBarEvents();

    // 6. Goalie accordion
    el.btnGoalieToggle.addEventListener('click', () => {
      el.goalieAccordion.classList.toggle('closed');
    });
    el.chkGoalieAngles.addEventListener('change', (e) => {
      state.showGoalieAngles = e.target.checked;
      renderRinkSVG();
    });
    if (el.chkHouseCoverage) {
      el.chkHouseCoverage.addEventListener('change', (e) => {
        state.showHouse = e.target.checked;
        if (state.showHouse) {
          const hasHouse = state.objects.some(o => o.id === 'house_line1' || o.isHouse);
          if (!hasHouse) {
            state.objects.unshift({
              id: 'house_line1',
              type: 'line',
              isHouse: true,
              color: '#111111',
              width: 2.4,
              style: 'solid',
              points: [
                { x: 220, y: 455 },
                { x: 350, y: 290 },
                { x: 470, y: 290 },
                { x: 470, y: 560 },
                { x: 350, y: 560 },
                { x: 220, y: 395 }
              ]
            });
          }
          showToast('House visible');
        } else {
          const selected = getObjectById(state.selectedObjectId);
          if (selected && (selected.id === 'house_line1' || selected.isHouse)) {
            state.selectedObjectId = null;
            updateFloatingBar();
          }
          showToast('House hidden');
        }
        render();
      });
    }
    el.chkTrapezoidRule.addEventListener('change', (e) => {
      state.showTrapezoid = e.target.checked;
      renderRinkSVG();
    });

    // 7. Drills Drawer
    el.btnDrillsTabHandle.addEventListener('click', () => {
      el.drillsDrawer.classList.toggle('open');
    });
    el.btnCloseDrillsDrawer.addEventListener('click', () => {
      el.drillsDrawer.classList.remove('open');
    });

    // Category tabs in drawer
    document.querySelectorAll('.cat-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        renderDrillsDrawerList(e.target.dataset.cat);
      });
    });

    // 8. Animation Controls
    el.btnToolAnimate.addEventListener('click', toggleAnimationBar);
    el.btnPlayPause.addEventListener('click', togglePlayPause);
    el.btnResetAnim.addEventListener('click', resetAnimation);
    el.btnCloseAnim.addEventListener('click', closeAnimationBar);
    el.animScrubber.addEventListener('input', (e) => {
      seekAnimation(parseFloat(e.target.value) / 100 * state.animDuration);
    });

    // 9. Coach Assistant Bubble
    el.btnCoachAssistant.addEventListener('click', () => {
      openNotesModal();
    });

    // 10. Notes modal
    el.btnDrillNotes.addEventListener('click', openNotesModal);
    el.btnCloseNotesModal.addEventListener('click', closeNotesModal);
    el.btnCancelNotes.addEventListener('click', closeNotesModal);
    el.btnSaveNotes.addEventListener('click', saveDrillNotes);

    // Sidebar collapse toggle
    el.btnCollapseTools.addEventListener('click', () => {
      el.sidebarTools.classList.toggle('collapsed');
      setTimeout(onResize, 220);
    });
  }

  function onToolClick(e) {
    const btn = e.target.closest('.tool-btn');
    if (!btn) return;

    const tool = btn.dataset.tool;
    if (!tool) return;

    if (tool === 'animate') {
      toggleAnimationBar();
      return;
    }

    // Set active button
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    state.currentTool = tool;

    // Handle token presets
    if (tool === 'token-player') {
      state.activePlayerToken = btn.dataset.player || 'LW';
    } else if (tool === 'token-coach') {
      state.activePlayerToken = '©';
    } else if (tool === 'token-opponent') {
      state.activePlayerToken = 'X';
    }

    if (tool !== 'select') {
      state.selectedObjectId = null;
      updateFloatingBar();
      render();
    }
  }

  // --- CANVAS MOUSE & TOUCH LOGIC ---
  function getCanvasCoords(clientX, clientY) {
    const rect = el.canvas.getBoundingClientRect();
    const scaleX = rect.width / state.canvasWidth;
    const scaleY = rect.height / state.canvasHeight;
    const x = (clientX - rect.left) / (scaleX || 1);
    const y = (clientY - rect.top) / (scaleY || 1);
    return { x: Math.max(0, Math.min(state.canvasWidth, x)), y: Math.max(0, Math.min(state.canvasHeight, y)) };
  }

  function onCanvasMouseDown(e) {
    const pos = getCanvasCoords(e.clientX, e.clientY);
    handlePointerDown(pos, e.shiftKey);
  }

  function updateCursor(pos) {
    if (state.isResizing && state.activeResizeHandle) {
      el.canvas.style.cursor = state.activeResizeHandle.cursor;
      return;
    }
    if (state.isDragging) {
      el.canvas.style.cursor = 'move';
      return;
    }

    if (state.currentTool === 'select') {
      if (state.selectedObjectId) {
        const handle = hitTestResizeHandle(pos.x, pos.y);
        if (handle) {
          el.canvas.style.cursor = handle.cursor;
          return;
        }
      }
      const hit = hitTestObject(pos.x, pos.y);
      if (hit) {
        el.canvas.style.cursor = (hit.id === state.selectedObjectId) ? 'move' : 'pointer';
        return;
      }
      el.canvas.style.cursor = 'default';
      return;
    }

    if (state.currentTool === 'eraser') {
      el.canvas.style.cursor = 'not-allowed';
      return;
    }

    el.canvas.style.cursor = 'crosshair';
  }

  function onCanvasMouseMove(e) {
    const pos = getCanvasCoords(e.clientX, e.clientY);
    updateCursor(pos);
    handlePointerMove(pos);
  }

  function onCanvasMouseUp(e) {
    handlePointerUp();
  }

  function onTouchStart(e) {
    if (e.touches.length === 1) {
      e.preventDefault();
      const pos = getCanvasCoords(e.touches[0].clientX, e.touches[0].clientY);
      handlePointerDown(pos, false);
    }
  }

  function onTouchMove(e) {
    if (e.touches.length === 1) {
      e.preventDefault();
      const pos = getCanvasCoords(e.touches[0].clientX, e.touches[0].clientY);
      handlePointerMove(pos);
    }
  }

  function onTouchEnd() {
    handlePointerUp();
  }

  function handlePointerDown(pos, isShift) {
    // 0. Check if user clicked on any corner dot/handle of the currently selected item!
    if (state.currentTool === 'select' && state.selectedObjectId) {
      const handle = hitTestResizeHandle(pos.x, pos.y);
      if (handle) {
        pushHistory();
        const selected = getObjectById(state.selectedObjectId);
        const bounds = getObjectBounds(selected);
        state.isResizing = true;
        state.activeResizeHandle = handle;
        state.resizeInitial = {
          handleKey: handle.key,
          startPos: { ...pos },
          bounds: { ...bounds },
          obj: JSON.parse(JSON.stringify(selected)),
          anchor: getOppositeCorner(bounds, handle.key)
        };
        el.canvas.style.cursor = handle.cursor;
        return;
      }
    }

    pushHistory();

    // 1. Eraser mode
    if (state.currentTool === 'eraser') {
      const clickedObj = hitTestObject(pos.x, pos.y);
      if (clickedObj) {
        deleteObject(clickedObj.id);
      }
      return;
    }

    // 2. Placement Tools (Drop item directly onto ice)
    if (state.currentTool.startsWith('token-') || state.currentTool.startsWith('item-') || state.currentTool.startsWith('shape-') || state.currentTool === 'text') {
      placeNewObject(state.currentTool, pos);
      // Switch back to select for easy immediate manipulation
      selectTool('select');
      render();
      return;
    }

    // 3. Line / Path drawing tools
    if (state.currentTool === 'line' || state.currentTool === 'path-arrow' || state.currentTool === 'wavy-line' || state.currentTool === 'line-thick' || state.currentTool === 'line-dimension') {
      state.isDragging = true;
      state.dragStart = { ...pos };
      state.currentDrawingLine = {
        id: 'line_' + Date.now(),
        type: 'line',
        points: [{ ...pos }, { ...pos }],
        color: state.currentColor,
        width: state.currentTool === 'line-thick' ? 6 : state.strokeWidth,
        style: state.currentTool === 'wavy-line' ? 'wavy' : state.strokeStyle,
        hasArrow: state.currentTool === 'path-arrow',
        isWavy: state.currentTool === 'wavy-line'
      };
      render();
      return;
    }

    // 4. Select / Move Tool
    if (state.currentTool === 'select') {
      const hit = hitTestObject(pos.x, pos.y);
      if (hit) {
        state.selectedObjectId = hit.id;
        state.isDragging = true;
        document.body.classList.add('is-dragging-canvas');
        state.dragStart = { ...pos };
        state.dragOffset = {
          x: pos.x - (hit.x !== undefined ? hit.x : pos.x),
          y: pos.y - (hit.y !== undefined ? hit.y : pos.y)
        };
        updateFloatingBar();
      } else {
        state.selectedObjectId = null;
        updateFloatingBar();
      }
      render();
    }
  }

  function handlePointerMove(pos) {
    // A. Handle Resizing
    if (state.isResizing && state.resizeInitial) {
      applyResize(pos);
      render();
      updateFloatingBarPosition();
      return;
    }

    if (!state.isDragging) return;

    // B. Handle Line drawing
    if (state.currentDrawingLine) {
      // Append or update endpoint
      if (state.currentDrawingLine.isWavy) {
        state.currentDrawingLine.points.push({ ...pos });
      } else {
        state.currentDrawingLine.points[1] = { ...pos };
      }
      render();
      return;
    }

    // C. Handle Moving selected object
    if (state.selectedObjectId) {
      const selected = getObjectById(state.selectedObjectId);
      if (selected) {
        if (selected.type === 'line' && selected.points) {
          const dx = pos.x - state.dragStart.x;
          const dy = pos.y - state.dragStart.y;
          state.dragStart = { ...pos };
          selected.points.forEach(pt => {
            pt.x += dx;
            pt.y += dy;
          });
        } else {
          selected.x = pos.x - state.dragOffset.x;
          selected.y = pos.y - state.dragOffset.y;
        }
        render();
        updateFloatingBarPosition();
      }
    }
  }

  function applyResize(pos) {
    const init = state.resizeInitial;
    const selected = getObjectById(state.selectedObjectId);
    if (!selected || !init) return;

    const anchor = init.anchor;
    const origBounds = init.bounds;

    let newLeft = Math.min(pos.x, anchor.x);
    let newTop = Math.min(pos.y, anchor.y);
    let newRight = Math.max(pos.x, anchor.x);
    let newBottom = Math.max(pos.y, anchor.y);

    let newWidth = Math.max(12, newRight - newLeft);
    let newHeight = Math.max(12, newBottom - newTop);

    const scaleX = newWidth / Math.max(1, origBounds.width);
    const scaleY = newHeight / Math.max(1, origBounds.height);
    const uniformScale = Math.max(scaleX, scaleY);

    if (selected.type === 'shape') {
      if (selected.kind === 'square' || selected.kind === 'circle') {
        const side = Math.max(newWidth, newHeight);
        newWidth = side;
        newHeight = side;
        if (init.handleKey === 'tl') {
          newLeft = anchor.x - side;
          newTop = anchor.y - side;
        } else if (init.handleKey === 'tr') {
          newLeft = anchor.x;
          newTop = anchor.y - side;
        } else if (init.handleKey === 'bl') {
          newLeft = anchor.x - side;
          newTop = anchor.y;
        } else {
          newLeft = anchor.x;
          newTop = anchor.y;
        }
      }
      selected.width = Math.round(newWidth);
      selected.height = Math.round(newHeight);
      selected.x = Math.round(newLeft + newWidth / 2);
      selected.y = Math.round(newTop + newHeight / 2);
    } else if (selected.type === 'player') {
      const origRadius = init.obj.radius || 18;
      selected.radius = Math.max(10, Math.min(75, Math.round(origRadius * uniformScale)));
      selected.x = Math.round(newLeft + newWidth / 2);
      selected.y = Math.round(newTop + newHeight / 2);
    } else if (selected.type === 'opponent') {
      const origSize = init.obj.size || 24;
      selected.size = Math.max(12, Math.min(90, Math.round(origSize * uniformScale)));
      selected.x = Math.round(newLeft + newWidth / 2);
      selected.y = Math.round(newTop + newHeight / 2);
    } else if (selected.type === 'puck') {
      const origRadius = init.obj.radius || 8;
      selected.radius = Math.max(4, Math.min(45, Math.round(origRadius * uniformScale)));
      selected.x = Math.round(newLeft + newWidth / 2);
      selected.y = Math.round(newTop + newHeight / 2);
    } else if (selected.type === 'puck-cluster' || selected.type === 'cone' || selected.type === 'tire' || selected.type === 'stick') {
      const origScale = init.obj.scale || 1;
      selected.scale = Math.max(0.35, Math.min(4.0, parseFloat((origScale * uniformScale).toFixed(2))));
      selected.x = Math.round(newLeft + newWidth / 2);
      selected.y = Math.round(newTop + newHeight / 2);
    } else if (selected.type === 'net' || selected.type === 'barrier') {
      selected.width = Math.round(newWidth);
      selected.height = Math.round(newHeight);
      selected.x = Math.round(newLeft + newWidth / 2);
      selected.y = Math.round(newTop + newHeight / 2);
    } else if (selected.type === 'text') {
      const origFs = init.obj.fontSize || 14;
      selected.fontSize = Math.max(9, Math.min(54, Math.round(origFs * uniformScale)));
      selected.x = Math.round(newLeft);
      selected.y = Math.round(newTop + newHeight / 2);
    } else if (selected.type === 'line' && selected.points && init.obj.points) {
      const origPts = init.obj.points;
      selected.points = origPts.map(pt => ({
        x: Math.round(newLeft + ((pt.x - origBounds.x) / Math.max(1, origBounds.width)) * newWidth),
        y: Math.round(newTop + ((pt.y - origBounds.y) / Math.max(1, origBounds.height)) * newHeight)
      }));
    }
  }

  function handlePointerUp() {
    if (state.isResizing) {
      state.isResizing = false;
      state.activeResizeHandle = null;
      state.resizeInitial = null;
    }
    if (state.currentDrawingLine) {
      // Finalize line
      if (state.currentDrawingLine.points.length >= 2) {
        state.objects.push(state.currentDrawingLine);
        state.selectedObjectId = state.currentDrawingLine.id;
        updateFloatingBar();
      }
      state.currentDrawingLine = null;
    }
    state.isDragging = false;
    document.body.classList.remove('is-dragging-canvas');
    render();
  }

  function placeNewObject(toolType, pos) {
    const id = 'obj_' + Date.now();
    let newObj = null;

    if (toolType === 'token-player') {
      newObj = {
        id,
        type: 'player',
        role: state.activePlayerToken,
        label: state.activePlayerToken,
        x: pos.x,
        y: pos.y,
        color: state.currentColor,
        radius: 18
      };
    } else if (toolType === 'token-coach') {
      newObj = {
        id,
        type: 'player',
        role: 'COACH',
        label: '©',
        x: pos.x,
        y: pos.y,
        color: state.currentColor,
        radius: 18
      };
    } else if (toolType === 'token-opponent') {
      newObj = {
        id,
        type: 'opponent',
        label: 'X',
        x: pos.x,
        y: pos.y,
        color: state.currentColor,
        size: 24
      };
    } else if (toolType === 'item-puck') {
      newObj = { id, type: 'puck', x: pos.x, y: pos.y, color: '#111111', radius: 8 };
    } else if (toolType === 'item-puck-cluster') {
      newObj = { id, type: 'puck-cluster', x: pos.x, y: pos.y, color: '#111111' };
    } else if (toolType === 'item-cone') {
      newObj = { id, type: 'cone', x: pos.x, y: pos.y, color: '#ea580c' };
    } else if (toolType === 'item-net') {
      newObj = { id, type: 'net', x: pos.x, y: pos.y, color: '#dc2626' };
    } else if (toolType === 'item-tire') {
      newObj = { id, type: 'tire', x: pos.x, y: pos.y, color: '#1e293b' };
    } else if (toolType === 'item-stick') {
      newObj = { id, type: 'stick', x: pos.x, y: pos.y, color: '#475569' };
    } else if (toolType === 'item-barrier') {
      newObj = { id, type: 'barrier', x: pos.x, y: pos.y, color: '#105991' };
    } else if (toolType.startsWith('shape-')) {
      const kind = toolType.replace('shape-', '');
      newObj = { id, type: 'shape', kind, x: pos.x, y: pos.y, color: state.currentColor, width: 36, height: 36 };
    } else if (toolType === 'text') {
      const textVal = prompt('Enter text note on ice:', 'F1 Forecheck');
      if (textVal) {
        newObj = { id, type: 'text', text: textVal, x: pos.x, y: pos.y, color: state.currentColor, fontSize: 14 };
      }
    }

    if (newObj) {
      state.objects.push(newObj);
      state.selectedObjectId = newObj.id;
      updateFloatingBar();
    }
  }

  function selectTool(toolName) {
    state.currentTool = toolName;
    document.querySelectorAll('.tool-btn').forEach(btn => {
      if (btn.dataset.tool === toolName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // --- HIT TESTING ---
  function distToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const l2 = dx * dx + dy * dy;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }

  function isHitOnObject(x, y, obj) {
    if (obj.type === 'player') {
      const r = (obj.radius || 18) + 5;
      return Math.hypot(x - obj.x, y - obj.y) <= r;
    }
    if (obj.type === 'opponent') {
      const s = Math.max(20, (obj.size || 24) * 0.9);
      return Math.abs(x - obj.x) <= s && Math.abs(y - obj.y) <= s;
    }
    if (obj.type === 'puck') {
      const r = (obj.radius || 8) + 6;
      return Math.hypot(x - obj.x, y - obj.y) <= r;
    }
    if (obj.type === 'line') {
      if (!obj.points || obj.points.length < 2) return false;
      const tolerance = Math.max(12, (obj.width || 3) + 7);
      for (let i = 0; i < obj.points.length - 1; i++) {
        const p1 = obj.points[i];
        const p2 = obj.points[i + 1];
        if (distToSegment(x, y, p1.x, p1.y, p2.x, p2.y) <= tolerance) {
          return true;
        }
      }
      return false;
    }
    if (obj.type === 'shape') {
      const w = (obj.width || 36);
      const h = (obj.height || 36);
      if (obj.kind === 'circle') {
        return Math.hypot(x - obj.x, y - obj.y) <= Math.max(w, h) / 2 + 4;
      }
      return Math.abs(x - obj.x) <= w / 2 + 4 && Math.abs(y - obj.y) <= h / 2 + 4;
    }
    const b = getObjectBounds(obj);
    return x >= b.x - 4 && x <= b.x + b.width + 4 && y >= b.y - 4 && y <= b.y + b.height + 4;
  }

  function hitTestObject(x, y) {
    // Priority 1: Check foreground tokens (players, opponents, pucks, equipment, shapes, text)
    // from top-most to bottom-most, so lines NEVER block items inside them!
    for (let i = state.objects.length - 1; i >= 0; i--) {
      const obj = state.objects[i];
      if (obj.type !== 'line') {
        if (isHitOnObject(x, y, obj)) {
          return obj;
        }
      }
    }

    // Priority 2: Check lines ONLY if clicked directly on the actual line stroke
    for (let i = state.objects.length - 1; i >= 0; i--) {
      const obj = state.objects[i];
      if (obj.type === 'line') {
        if ((obj.id === 'house_line1' || obj.isHouse) && !state.showHouse) {
          continue;
        }
        if (isHitOnObject(x, y, obj)) {
          return obj;
        }
      }
    }

    return null;
  }

  function getObjectBounds(obj) {
    if (obj.type === 'player') {
      const r = obj.radius || 18;
      return { x: obj.x - r, y: obj.y - r, width: r * 2, height: r * 2 };
    }
    if (obj.type === 'puck') {
      const r = obj.radius || 8;
      return { x: obj.x - r, y: obj.y - r * 0.75, width: r * 2, height: r * 1.5 };
    }
    if (obj.type === 'opponent') {
      const s = obj.size || 24;
      return { x: obj.x - s / 2, y: obj.y - s / 2, width: s, height: s };
    }
    if (obj.type === 'shape') {
      const w = obj.width || 36;
      const h = obj.height || 36;
      return { x: obj.x - w / 2, y: obj.y - h / 2, width: w, height: h };
    }
    if (obj.type === 'cone') {
      const s = obj.scale || 1;
      return { x: obj.x - 12 * s, y: obj.y - 15 * s, width: 24 * s, height: 29 * s };
    }
    if (obj.type === 'tire') {
      const s = obj.scale || 1;
      const r = Math.max(5, 12 * s);
      return { x: obj.x - r, y: obj.y - r, width: r * 2, height: r * 2 };
    }
    if (obj.type === 'stick') {
      const s = obj.scale || 1;
      return { x: obj.x - 14 * s, y: obj.y - 16 * s, width: 32 * s, height: 30 * s };
    }
    if (obj.type === 'net') {
      const w = obj.width || 48;
      const h = obj.height || 28;
      return { x: obj.x - w / 2, y: obj.y - h / 2, width: w, height: h };
    }
    if (obj.type === 'barrier') {
      const w = obj.width || 48;
      const h = obj.height || 10;
      return { x: obj.x - w / 2, y: obj.y - h / 2, width: w, height: h };
    }
    if (obj.type === 'puck-cluster') {
      const s = obj.scale || 1;
      return { x: obj.x - 14 * s, y: obj.y - 12 * s, width: 28 * s, height: 26 * s };
    }
    if (obj.type === 'text') {
      const fs = obj.fontSize || 14;
      const w = Math.max(24, (obj.text || '').length * (fs * 0.6) + 10);
      return { x: obj.x, y: obj.y - fs / 2, width: w, height: fs };
    }
    if (obj.type === 'line' && obj.points && obj.points.length >= 2) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      obj.points.forEach(p => {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      });
      return { x: minX, y: minY, width: Math.max(20, maxX - minX), height: Math.max(20, maxY - minY) };
    }
    return { x: obj.x || 0, y: obj.y || 0, width: 24, height: 24 };
  }

  function getObjectById(id) {
    return state.objects.find(o => o.id === id);
  }

  function deleteObject(id) {
    pushHistory();
    state.objects = state.objects.filter(o => o.id !== id);
    if (state.selectedObjectId === id) {
      state.selectedObjectId = null;
      updateFloatingBar();
    }
    render();
  }

  // --- CONTEXT BAR ACTIONS ---
  function setupContextBarEvents() {
    // Swatch popover toggle
    el.currentSwatchBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      el.colorPalettePopover.parentElement.classList.toggle('open');
      el.strokeMenuPopover.parentElement.classList.remove('open');
      el.moreMenuPopover.parentElement.classList.remove('open');
    });

    // Swatch color selection
    el.colorPalettePopover.addEventListener('click', (e) => {
      const dot = e.target.closest('.palette-dot');
      if (!dot) return;
      const color = dot.dataset.color;
      state.currentColor = color;
      el.currentSwatchCircle.style.backgroundColor = color;

      const selected = getObjectById(state.selectedObjectId);
      if (selected) {
        pushHistory();
        selected.color = color;
        render();
      }
      el.colorPalettePopover.parentElement.classList.remove('open');
    });

    // Stroke menu toggle
    el.btnStrokeStyle.addEventListener('click', (e) => {
      e.stopPropagation();
      el.strokeMenuPopover.parentElement.classList.toggle('open');
      el.colorPalettePopover.parentElement.classList.remove('open');
      el.moreMenuPopover.parentElement.classList.remove('open');
    });

    // Stroke options
    el.strokeMenuPopover.addEventListener('click', (e) => {
      const btn = e.target.closest('.stroke-option-btn');
      if (!btn) return;
      const width = btn.dataset.width;
      const style = btn.dataset.style;
      const selected = getObjectById(state.selectedObjectId);

      if (width) {
        state.strokeWidth = parseFloat(width);
        if (selected) {
          pushHistory();
          selected.width = state.strokeWidth;
        }
      }
      if (style) {
        state.strokeStyle = style;
        if (selected) {
          pushHistory();
          selected.style = style;
          selected.isWavy = style === 'wavy';
        }
      }
      render();
    });

    // More menu toggle
    el.btnContextMore.addEventListener('click', (e) => {
      e.stopPropagation();
      el.moreMenuPopover.parentElement.classList.toggle('open');
      el.colorPalettePopover.parentElement.classList.remove('open');
      el.strokeMenuPopover.parentElement.classList.remove('open');
    });

    // Actions
    el.actDuplicate.addEventListener('click', () => {
      const selected = getObjectById(state.selectedObjectId);
      if (selected) {
        pushHistory();
        const clone = JSON.parse(JSON.stringify(selected));
        clone.id = 'obj_' + Date.now();
        clone.x = (clone.x || 100) + 20;
        clone.y = (clone.y || 100) + 20;
        state.objects.push(clone);
        state.selectedObjectId = clone.id;
        updateFloatingBar();
        render();
      }
      el.moreMenuPopover.parentElement.classList.remove('open');
    });

    el.actBringForward.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = state.objects.findIndex(o => o.id === state.selectedObjectId);
      if (idx !== -1 && idx < state.objects.length - 1) {
        pushHistory();
        const item = state.objects.splice(idx, 1)[0];
        state.objects.push(item);
        render();
        showToast('Brought to front');
      }
      el.moreMenuPopover.parentElement.classList.remove('open');
    });

    el.actSendBackward.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = state.objects.findIndex(o => o.id === state.selectedObjectId);
      if (idx !== -1) {
        pushHistory();
        const item = state.objects.splice(idx, 1)[0];
        state.objects.unshift(item);
        // Clear selection box so the user can immediately select and move items in front
        state.selectedObjectId = null;
        updateFloatingBar();
        render();
        showToast('Sent to back');
      }
      el.moreMenuPopover.parentElement.classList.remove('open');
    });

    el.actDelete.addEventListener('click', () => {
      if (state.selectedObjectId) {
        deleteObject(state.selectedObjectId);
      }
      el.moreMenuPopover.parentElement.classList.remove('open');
    });

    // Close popovers on body click
    document.addEventListener('click', () => {
      document.querySelectorAll('.open').forEach(el => el.classList.remove('open'));
    });
  }

  // --- HEADER & DROPDOWNS ---
  function setupDropdowns() {
    // Mins dropdown
    el.minsDropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      el.minsDropdownBtn.parentElement.classList.toggle('open');
      el.rinkDropdownBtn.parentElement.classList.remove('open');
    });

    el.minsMenu.addEventListener('click', (e) => {
      const item = e.target.closest('.dropdown-item');
      if (!item) return;
      const val = item.dataset.mins;
      state.duration = val;
      el.selectedMins.textContent = val;
      el.minsMenu.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      el.minsDropdownBtn.parentElement.classList.remove('open');
    });

    // Rink dropdown
    el.rinkDropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      el.rinkDropdownBtn.parentElement.classList.toggle('open');
      el.minsDropdownBtn.parentElement.classList.remove('open');
    });

    el.rinkMenu.addEventListener('click', (e) => {
      const item = e.target.closest('.dropdown-item');
      if (!item) return;
      const rink = item.dataset.rink;
      setRinkMode(rink);
      el.rinkMenu.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      el.rinkDropdownBtn.parentElement.classList.remove('open');
    });

    // Title input
    el.drillTitleInput.addEventListener('change', (e) => {
      state.drillTitle = e.target.value.trim() || 'Untitled Drill';
    });
  }

  function setRinkMode(rinkType) {
    state.currentRink = rinkType;
    let label = 'Rink';
    if (rinkType === 'half-dzone') label = 'Half (D-Zone)';
    else if (rinkType === 'half-ozone') label = 'Half (O-Zone)';
    else if (rinkType === 'full') label = 'Full Rink';
    else label = 'Neutral Zone';
    el.selectedRink.textContent = label;
    renderRinkSVG();
    render();
  }

  function setupHeaderActions() {
    // Undo / Redo
    el.btnTopUndo.addEventListener('click', undo);
    el.btnTopRedo.addEventListener('click', redo);
    el.btnGridUndo.addEventListener('click', undo);
    el.btnGridRedo.addEventListener('click', redo);

    // Save drill
    el.btnSaveDrill.addEventListener('click', saveDrillToLocal);
    el.btnSaveAs.addEventListener('click', () => {
      const newName = prompt('Enter duplicate drill name:', state.drillTitle + ' (Copy)');
      if (newName) {
        state.drillTitle = newName;
        el.drillTitleInput.value = newName;
        saveDrillToLocal();
      }
    });

    // Print
    el.btnPrintDrill.addEventListener('click', () => {
      window.print();
    });

    // Export PNG
    el.btnExportImage.addEventListener('click', exportDrillPNG);

    // Toggle guidelines / snap
    el.btnToggleLayers.addEventListener('click', () => {
      state.showGuidelines = !state.showGuidelines;
      showToast(state.showGuidelines ? 'Guidelines Enabled' : 'Guidelines Hidden');
      render();
    });

    // Clear board
    el.btnClearBoard.addEventListener('click', () => {
      if (confirm('Clear all players, lines and objects from the ice?')) {
        pushHistory();
        state.objects = [];
        state.selectedObjectId = null;
        updateFloatingBar();
        render();
        showToast('Canvas cleared');
      }
    });

    // Library folder button
    el.btnFolderLibrary.addEventListener('click', () => {
      el.drillsDrawer.classList.toggle('open');
    });

    // Save current to library
    el.btnSaveCurrentToLibrary.addEventListener('click', () => {
      saveDrillToLocal();
      renderDrillsDrawerList();
    });
  }

  // --- KEYBOARD SHORTCUTS ---
  function onKeyDown(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (state.selectedObjectId) {
        e.preventDefault();
        deleteObject(state.selectedObjectId);
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      undo();
    } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
      e.preventDefault();
      redo();
    } else if (e.key === 'v' || e.key === 'V') {
      selectTool('select');
    } else if (e.key === 'l' || e.key === 'L') {
      selectTool('line');
    } else if (e.key === 'p' || e.key === 'P') {
      selectTool('item-puck');
    } else if (e.key === 'Escape') {
      state.selectedObjectId = null;
      updateFloatingBar();
      render();
    }
  }

  // --- UNDO / REDO HISTORY STACK ---
  function pushHistory() {
    // Truncate future if branched
    state.history = state.history.slice(0, state.historyIndex + 1);
    state.history.push(JSON.stringify(state.objects));
    state.historyIndex = state.history.length - 1;
  }

  function undo() {
    if (state.historyIndex > 0) {
      state.historyIndex--;
      state.objects = JSON.parse(state.history[state.historyIndex]);
      state.selectedObjectId = null;
      updateFloatingBar();
      render();
      showToast('Undo');
    }
  }

  function redo() {
    if (state.historyIndex < state.history.length - 1) {
      state.historyIndex++;
      state.objects = JSON.parse(state.history[state.historyIndex]);
      state.selectedObjectId = null;
      updateFloatingBar();
      render();
      showToast('Redo');
    }
  }

  // --- ANIMATION SYSTEM ---
  function toggleAnimationBar() {
    if (el.animControlBar.style.display === 'none') {
      el.animControlBar.style.display = 'flex';
      setupAnimationState();
    } else {
      closeAnimationBar();
    }
  }

  function closeAnimationBar() {
    pauseAnimation();
    el.animControlBar.style.display = 'none';
  }

  function setupAnimationState() {
    state.animTime = 0;
    updateAnimationUI();
  }

  function togglePlayPause() {
    if (state.isAnimating) {
      pauseAnimation();
    } else {
      playAnimation();
    }
  }

  function playAnimation() {
    state.isAnimating = true;
    el.iconPlay.style.display = 'none';
    el.iconPause.style.display = 'inline';
    el.txtPlayPause.textContent = 'Pause';

    const stepMs = 50;
    state.animInterval = setInterval(() => {
      state.animTime += stepMs / 1000;
      if (state.animTime >= state.animDuration) {
        state.animTime = 0; // Loop or stop
      }
      updateAnimationUI();
      renderAnimatedFrame(state.animTime / state.animDuration);
    }, stepMs);
  }

  function pauseAnimation() {
    state.isAnimating = false;
    clearInterval(state.animInterval);
    el.iconPlay.style.display = 'inline';
    el.iconPause.style.display = 'none';
    el.txtPlayPause.textContent = 'Play Drill';
  }

  function resetAnimation() {
    pauseAnimation();
    state.animTime = 0;
    updateAnimationUI();
    render();
  }

  function seekAnimation(time) {
    state.animTime = time;
    updateAnimationUI();
    renderAnimatedFrame(state.animTime / state.animDuration);
  }

  function updateAnimationUI() {
    const progress = (state.animTime / state.animDuration) * 100;
    el.animScrubber.value = progress;
    el.animTimeLabel.textContent = `${state.animTime.toFixed(1)}s / ${state.animDuration.toFixed(1)}s`;
  }

  function renderAnimatedFrame(t) {
    render();
    // Simulate motion along path lines for player tokens
    const ctx = el.ctx;
    ctx.save();
    // Subtle animated glow pulse on active play
    ctx.beginPath();
    const pulseRadius = 18 + Math.sin(t * Math.PI * 4) * 3;
    const puck = state.objects.find(o => o.type === 'puck');
    if (puck) {
      ctx.arc(puck.x, puck.y, pulseRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(2, 132, 199, 0.2)';
      ctx.fill();
    }
    ctx.restore();
  }

  // --- SAVE, LOAD, EXPORT & PRINT ---
  function saveDrillToLocal() {
    const drillData = {
      id: 'drill_' + Date.now(),
      title: state.drillTitle,
      duration: state.duration,
      rink: state.currentRink,
      description: state.notes,
      coachingPoints: state.coachingPoints,
      objects: state.objects,
      savedAt: new Date().toISOString()
    };

    let userDrills = JSON.parse(localStorage.getItem('hockey_drills') || '[]');
    userDrills.unshift(drillData);
    localStorage.setItem('hockey_drills', JSON.stringify(userDrills));

    showToast(`Drill "${state.drillTitle}" saved!`);
    renderDrillsDrawerList();
  }

  function loadPresetDrill(presetId) {
    const preset = PRESET_DRILLS.find(p => p.id === presetId);
    if (!preset) return;

    state.drillTitle = preset.title;
    el.drillTitleInput.value = preset.title;
    state.duration = preset.duration;
    el.selectedMins.textContent = preset.duration;
    setRinkMode(preset.rink);

    state.objects = JSON.parse(JSON.stringify(preset.objects));
    state.selectedObjectId = preset.selectedId || null;
    state.showGuidelines = !!preset.showGuidelinesOnLoad;

    state.history = [JSON.stringify(state.objects)];
    state.historyIndex = 0;

    updateFloatingBar();
    render();
  }

  function renderDrillsDrawerList(category = 'all') {
    el.drillsList.innerHTML = '';

    // Preset drills
    const presetsToShow = category === 'all' ? PRESET_DRILLS : PRESET_DRILLS.filter(d => d.category === category);
    presetsToShow.forEach(drill => {
      const card = document.createElement('div');
      card.className = `drill-card ${state.drillTitle === drill.title ? 'active' : ''}`;
      card.innerHTML = `
        <div class="drill-card-title">${drill.title}</div>
        <div class="drill-card-meta">
          <span class="badge-tag">${drill.duration}</span>
          <span>${drill.rink.toUpperCase()}</span>
        </div>
      `;
      card.addEventListener('click', () => {
        loadPresetDrill(drill.id);
        el.drillsDrawer.classList.remove('open');
      });
      el.drillsList.appendChild(card);
    });

    // Custom user saved drills from LocalStorage
    const userDrills = JSON.parse(localStorage.getItem('hockey_drills') || '[]');
    userDrills.forEach(drill => {
      const card = document.createElement('div');
      card.className = 'drill-card';
      card.innerHTML = `
        <div class="drill-card-title">${drill.title} (Custom)</div>
        <div class="drill-card-meta">
          <span class="badge-tag">${drill.duration || '10 Mins'}</span>
          <span>Saved Drill</span>
        </div>
      `;
      card.addEventListener('click', () => {
        state.drillTitle = drill.title;
        el.drillTitleInput.value = drill.title;
        state.objects = drill.objects || [];
        setRinkMode(drill.rink || 'half-dzone');
        updateFloatingBar();
        render();
        el.drillsDrawer.classList.remove('open');
      });
      el.drillsList.appendChild(card);
    });
  }

  function exportDrillPNG() {
    // Generate high quality composite image with rink background + canvas drawings
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 1600;
    exportCanvas.height = 1360;
    const expCtx = exportCanvas.getContext('2d');

    // Fill white
    expCtx.fillStyle = '#ffffff';
    expCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Render SVG onto export canvas via image
    const svgData = new XMLSerializer().serializeToString(el.rinkSvg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      expCtx.drawImage(img, 0, 0, 1600, 1360);
      expCtx.drawImage(el.canvas, 0, 0, 1600, 1360);

      // Title watermark header
      expCtx.fillStyle = '#0f172a';
      expCtx.font = 'bold 28px Inter, sans-serif';
      expCtx.fillText(`${state.drillTitle} • ${state.duration}`, 60, 50);

      const downloadLink = document.createElement('a');
      downloadLink.download = `${state.drillTitle.toLowerCase().replace(/\s+/g, '_')}_diagram.png`;
      downloadLink.href = exportCanvas.toDataURL('image/png');
      downloadLink.click();
      URL.revokeObjectURL(blobURL);
      showToast('Drill diagram downloaded!');
    };
    img.src = blobURL;
  }

  // --- COACH NOTES MODAL ---
  function openNotesModal() {
    el.modalDrillName.value = state.drillTitle;
    el.modalCoachingPoints.value = state.coachingPoints;
    el.modalDescription.value = state.notes;
    el.notesModal.style.display = 'flex';
  }

  function closeNotesModal() {
    el.notesModal.style.display = 'none';
  }

  function saveDrillNotes() {
    state.drillTitle = el.modalDrillName.value.trim() || state.drillTitle;
    el.drillTitleInput.value = state.drillTitle;
    state.coachingPoints = el.modalCoachingPoints.value;
    state.notes = el.modalDescription.value;
    closeNotesModal();
    showToast('Coaching notes updated!');
  }

  function showToast(msg) {
    el.toastBanner.textContent = msg;
    el.toastBanner.classList.add('show');
    setTimeout(() => {
      el.toastBanner.classList.remove('show');
    }, 2400);
  }

  // Start app
  init();
})();
