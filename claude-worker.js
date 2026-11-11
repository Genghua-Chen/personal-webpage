/* Claude Code — a tiny pixel-art worker that types furiously in the corner.
 *
 * Interactions
 *   hover        → shows what it's "working on"
 *   click        → startled jump + a quip
 *   5 fast clicks→ frenzy mode, then ships it (confetti)
 *   double-click → coffee break
 *   drag / throw → panics, falls back down with gravity, bounces, resumes
 *   idle 45 s    → dozes off (any click wakes it)
 */
(function () {
  'use strict';
  if (window.__ccWorker) return;
  window.__ccWorker = true;

  /* ── Logical canvas (drawn 1:1, scaled up with CSS pixelated) ── */
  var W = 80, H = 64;

  var C = {
    skin: '#f2c29b', skinShade: '#d9a27a', hair: '#3b2a20',
    shirt: '#d97757', shirtShade: '#b65d40', collar: '#f5e6dc',
    eye: '#1d1d24', mouth: '#7a3b2e', blush: '#ef8f7f',
    desk: '#9a6a3f', deskLight: '#b98652', deskDark: '#6e4826', leg: '#5a3a1f',
    frame: '#2b2b33', frameLight: '#3c3c47', screen: '#15151c',
    chair: '#3f4254', chairLight: '#545871',
    kbd: '#d6d6dc', key: '#9898a4',
    mug: '#eeeeee', mugShade: '#c9c9c9', coffee: '#5a3a22',
    lamp: '#f2c14e', lampDark: '#44444f', glow: 'rgba(255,214,120,0.18)',
    sweat: '#8fd3ff', fire: ['#ffd23f', '#ff8c2b', '#ff4b2b']
  };
  var CODE_COLORS = ['#d97757', '#7fd1b9', '#c792ea', '#82aaff', '#e6e6e6', '#ffcb6b', '#6c6c80'];

  var STATUS = [
    '✻ Thinking…', '✻ Refactoring…', '✻ Reading 42 files…', '✻ Running tests…',
    '✻ Fixing the fix…', '✻ Writing commit message…', '✻ Grepping the codebase…',
    '✻ Reticulating splines…', '✻ Updating todos…', '✻ Compacting context…'
  ];
  var CLICK_LINES = [
    "Hey! I'm in the zone.", 'Shh… almost done.', 'Do you want to proceed? (y/n)',
    "You're absolutely right!", 'One more test…', 'That tickles!',
    "I'll fix it, I promise.", "Ctrl+C won't stop me.", 'Tests pass on my machine.',
    'Just one more refactor…'
  ];
  var DRAG_LINES = ['Whoa whoa whoa!', 'My unsaved work!', 'Put me down!', 'Not the keyboard!'];
  var LAND_LINES = ['…anyway.', 'Back to work.', 'Where was I?', 'Resuming session.'];
  var HARD_LAND_LINES = ['Ow! My keyboard!', 'Ouch. Stack overflow.', 'I felt that in my RAM.'];
  var GLYPHS = '{}();=<>/*#$[]&|!+'.split('');

  /* ── Styles ── */
  var css = '' +
    '.ccw{position:fixed;left:0;top:0;z-index:50;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;' +
    'cursor:grab;outline:none;-webkit-tap-highlight-color:transparent}' +
    '.ccw.dragging{cursor:grabbing}' +
    '.ccw canvas{display:block;image-rendering:pixelated;image-rendering:crisp-edges;transform-origin:50% 100%;' +
    'filter:drop-shadow(0 4px 6px rgba(0,0,0,.12))}' +
    '.ccw:focus-visible canvas{outline:2px dashed #d97757;outline-offset:4px}' +
    '.ccw-label{position:absolute;left:0;right:0;bottom:calc(100% + 2px);text-align:center;pointer-events:none;' +
    'font:700 13px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:#d97757;letter-spacing:.02em;' +
    'text-shadow:-1px -1px 0 #2a1a12,1px -1px 0 #2a1a12,-1px 1px 0 #2a1a12,1px 1px 0 #2a1a12,0 2px 0 #2a1a12}' +
    '.ccw-bubble{position:absolute;bottom:calc(100% + 24px);right:0;max-width:220px;width:max-content;' +
    'padding:6px 10px;background:#fff;color:#222;border:2px solid #222;border-radius:4px;' +
    'font:600 12px/1.35 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;box-shadow:3px 3px 0 #222;' +
    'opacity:0;transform:translateY(4px);transition:opacity .15s,transform .15s;pointer-events:none;white-space:normal}' +
    '.ccw-bubble.show{opacity:1;transform:none}' +
    '.ccw-bubble::after{content:"";position:absolute;right:38%;bottom:-8px;border:6px solid transparent;' +
    'border-top-color:#222;border-bottom:0}' +
    '.ccw-fx{position:absolute;inset:0;pointer-events:none;overflow:visible}' +
    '.ccw-glyph{position:absolute;font:700 12px/1 ui-monospace,Menlo,monospace;pointer-events:none;' +
    'animation:ccw-float .9s ease-out forwards}' +
    '@keyframes ccw-float{0%{opacity:1;transform:translate(0,0) scale(1)}' +
    '100%{opacity:0;transform:translate(var(--dx),-38px) scale(.8)}}' +
    '.ccw-confetti{position:absolute;width:6px;height:6px;pointer-events:none;' +
    'animation:ccw-conf 1.3s cubic-bezier(.2,.7,.4,1) forwards}' +
    '@keyframes ccw-conf{0%{opacity:1;transform:translate(0,0) rotate(0)}' +
    '100%{opacity:0;transform:translate(var(--dx),var(--dy)) rotate(var(--r))}}' +
    '.ccw-z{position:absolute;font:700 14px/1 ui-monospace,Menlo,monospace;color:#6c7a99;pointer-events:none;' +
    'animation:ccw-z 2.2s ease-out forwards}' +
    '@keyframes ccw-z{0%{opacity:0;transform:translate(0,0) scale(.6)}20%{opacity:1}' +
    '100%{opacity:0;transform:translate(18px,-40px) scale(1.3)}}' +
    '@media (prefers-reduced-motion:reduce){.ccw-glyph,.ccw-confetti,.ccw-z{animation-duration:.01s}}';
  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ── DOM ── */
  var root = document.createElement('div');
  root.className = 'ccw';
  root.tabIndex = 0;
  root.setAttribute('role', 'button');
  root.setAttribute('aria-label', 'Claude Code, a pixel-art worker typing away. Click, double-click, or drag it.');
  var bubble = document.createElement('div');
  bubble.className = 'ccw-bubble';
  var label = document.createElement('div');
  label.className = 'ccw-label';
  label.textContent = 'Claude Code';
  var canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  var fx = document.createElement('div');
  fx.className = 'ccw-fx';
  root.appendChild(bubble); root.appendChild(canvas); root.appendChild(label); root.appendChild(fx);
  var ctx = canvas.getContext('2d');

  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Sizing / position ── */
  var S, boxW, boxH, MARGIN = 14;
  var pos = { x: 0, y: 0 }, moved = false;
  function scaleFor() {
    var w = window.innerWidth;
    return w >= 1100 ? 3 : w >= 700 ? 2.4 : 1.7;
  }
  function floorY() { return window.innerHeight - boxH - MARGIN; }
  function applySize() {
    S = scaleFor();
    boxW = Math.round(W * S); boxH = Math.round(H * S);
    canvas.style.width = boxW + 'px'; canvas.style.height = boxH + 'px';
    root.style.width = boxW + 'px';
    label.style.fontSize = Math.max(10, Math.round(S * 4.3)) + 'px';
  }
  function place() {
    root.style.transform = 'translate(' + Math.round(pos.x) + 'px,' + Math.round(pos.y) + 'px)';
  }
  function clampPos() {
    pos.x = Math.max(4, Math.min(window.innerWidth - boxW - 4, pos.x));
    pos.y = Math.max(4, Math.min(floorY(), pos.y));
  }
  function home() {
    applySize();
    var savedX = parseFloat(sessionStorage.getItem('ccw-x'));
    if (!isNaN(savedX)) { moved = true; pos.x = savedX * window.innerWidth; }
    else pos.x = window.innerWidth - boxW - 18;
    pos.y = floorY();
    clampPos(); place();
  }
  window.addEventListener('resize', function () {
    applySize();
    if (!moved) pos.x = window.innerWidth - boxW - 18;
    if (!flying && !dragging) pos.y = floorY();
    clampPos(); place();
  });

  /* ── State ── */
  var state = 'typing', stateUntil = 0, now = 0;
  var lastActivity = performance.now();
  var hovering = false;
  var jumpY = 0, jumpV = 0;            // little hop inside the canvas
  var rot = 0, sx = 1, sy = 1;         // CSS transforms on canvas
  var dragging = false, flying = false, vel = { x: 0, y: 0 };
  var clickTimes = [];

  function setState(s, ms) { state = s; stateUntil = ms ? now + ms : 0; }

  /* ── Speech bubble ── */
  var bubbleTimer = 0, bubbleSticky = false;
  function say(text, ms, sticky) {
    bubble.textContent = text;
    bubble.classList.add('show');
    bubbleSticky = !!sticky;
    clearTimeout(bubbleTimer);
    if (ms) bubbleTimer = setTimeout(function () { bubble.classList.remove('show'); bubbleSticky = false; }, ms);
  }
  function hush() { if (!bubbleSticky) bubble.classList.remove('show'); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  /* ── Monitor code lines ── */
  var lines = [];
  function newLine() {
    var indent = Math.floor(Math.random() * 4) * 2;
    var segs = [], x = indent, n = 1 + Math.floor(Math.random() * 3);
    for (var i = 0; i < n && x < 19; i++) {
      var w = 2 + Math.floor(Math.random() * 6);
      if (x + w > 20) w = 20 - x;
      segs.push({ x: x, w: w, c: pick(CODE_COLORS) });
      x += w + 1;
    }
    return segs;
  }
  for (var i = 0; i < 7; i++) lines.push(newLine());
  var lastLine = 0;

  /* ── FX ── */
  function glyph(color) {
    var s = document.createElement('span');
    s.className = 'ccw-glyph';
    s.textContent = pick(GLYPHS);
    s.style.color = color || pick(CODE_COLORS.slice(0, 6));
    s.style.left = (0.5 + Math.random() * 0.25) * boxW + 'px';
    s.style.top = 0.6 * boxH + 'px';
    s.style.setProperty('--dx', (Math.random() * 30 - 15) + 'px');
    fx.appendChild(s);
    setTimeout(function () { s.remove(); }, 950);
  }
  function confetti() {
    var cols = ['#d97757', '#ffd23f', '#7fd1b9', '#82aaff', '#c792ea', '#ff6b8b'];
    for (var i = 0; i < 36; i++) {
      var p = document.createElement('span');
      p.className = 'ccw-confetti';
      p.style.background = pick(cols);
      p.style.left = boxW * 0.6 + 'px';
      p.style.top = boxH * 0.35 + 'px';
      var a = Math.random() * Math.PI * 2, d = 50 + Math.random() * 90;
      p.style.setProperty('--dx', Math.cos(a) * d + 'px');
      p.style.setProperty('--dy', (Math.sin(a) * d - 40) + 'px');
      p.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg');
      fx.appendChild(p);
      (function (el) { setTimeout(function () { el.remove(); }, 1350); })(p);
    }
  }
  function zzz() {
    var z = document.createElement('span');
    z.className = 'ccw-z';
    z.textContent = Math.random() < 0.5 ? 'z' : 'Z';
    z.style.left = boxW * 0.66 + 'px';
    z.style.top = boxH * 0.2 + 'px';
    fx.appendChild(z);
    setTimeout(function () { z.remove(); }, 2300);
  }

  /* ── Drawing ── */
  function px(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }

  function drawMonitor() {
    px(3, 18, 28, 21, C.frame);
    px(3, 18, 28, 1, C.frameLight);
    px(5, 20, 24, 17, C.screen);
    if (state === 'sleep') {
      // screensaver: a drifting orange star
      var sxp = 6 + Math.floor((Math.sin(now / 900) + 1) * 10), syp = 21 + Math.floor((Math.cos(now / 700) + 1) * 6);
      px(sxp + 1, syp, 1, 3, '#d97757'); px(sxp, syp + 1, 3, 1, '#d97757');
    } else if (state === 'frenzy') {
      for (var r = 0; r < 8; r++) {
        var segs = lines[(r + Math.floor(now / 40)) % lines.length];
        for (var k = 0; k < segs.length; k++) px(6 + segs[k].x, 21 + r * 2, segs[k].w, 1, Math.random() < 0.3 ? '#ff4b2b' : segs[k].c);
      }
    } else {
      for (var j = 0; j < lines.length; j++) {
        var sg = lines[j];
        for (var m = 0; m < sg.length; m++) px(6 + sg[m].x, 21 + j * 2, sg[m].w, 1, sg[m].c);
      }
      // blinking cursor after last line
      if (Math.floor(now / 400) % 2 === 0) px(6 + (lines[lines.length - 1].reduce(function (a, s) { return Math.max(a, s.x + s.w); }, 0)) + 1, 33, 1, 2, '#e6e6e6');
    }
    if (state === 'ship') { px(5, 20, 24, 17, 'rgba(60,200,120,0.25)'); }
    // stand
    px(15, 39, 4, 4, C.frame);
    px(11, 42, 12, 2, C.frameLight);
  }

  function drawLamp() {
    ctx.fillStyle = C.glow;
    ctx.beginPath(); ctx.moveTo(63, 34); ctx.lineTo(69, 34); ctx.lineTo(74, 44); ctx.lineTo(56, 44); ctx.closePath(); ctx.fill();
    px(70, 42, 7, 2, C.lampDark);
    px(73, 31, 1, 11, C.lampDark);
    px(68, 30, 6, 1, C.lampDark);
    px(63, 30, 6, 4, C.lamp);
    px(63, 33, 6, 1, '#d9a536');
  }

  function drawMug(onDesk) {
    if (!onDesk) return;
    px(57, 39, 4, 5, C.mug);
    px(57, 39, 4, 1, C.coffee);
    px(61, 40, 1, 3, C.mugShade);
    px(60, 40, 1, 4, C.mugShade);
    // steam
    if (!reduced) {
      var t = now / 300;
      ctx.fillStyle = 'rgba(180,180,190,0.6)';
      ctx.fillRect(58 + Math.round(Math.sin(t)), 36 - (Math.floor(t * 2) % 3), 1, 1);
      ctx.fillRect(59 + Math.round(Math.sin(t + 2)), 35 - (Math.floor(t * 2 + 1) % 3), 1, 1);
    }
  }

  function drawPerson() {
    var hy = 16 + Math.round(jumpY);
    var bob = 0;
    if (state === 'typing' && !reduced) bob = Math.floor(now / 260) % 2;
    if (state === 'frenzy') bob = Math.floor(now / 70) % 2;
    if (state === 'sleep') bob = 3 + (Math.floor(now / 1200) % 2);
    hy += bob;

    // chair back
    px(36, 22, 22, 22, C.chair);
    px(37, 21, 20, 1, C.chair);
    px(37, 22, 20, 1, C.chairLight);

    // torso
    var ty = hy + 12;
    px(39, ty, 16, 44 - ty, C.shirt);
    px(39, ty, 1, 44 - ty, C.shirtShade);
    px(54, ty, 1, 44 - ty, C.shirtShade);
    px(45, ty, 4, 1, C.collar);
    // little ✻ logo on shirt
    px(46, ty + 4, 1, 3, C.collar); px(45, ty + 5, 3, 1, C.collar);

    // neck + head
    px(45, hy + 11, 4, 1, C.skinShade);
    px(41, hy, 12, 11, C.skin);
    px(40, hy + 3, 1, 5, C.skin); px(53, hy + 3, 1, 5, C.skin); // ears
    // hair
    px(40, hy - 1, 14, 3, C.hair);
    px(41, hy - 2, 11, 1, C.hair);
    px(40, hy + 2, 1, 2, C.hair); px(53, hy + 2, 1, 2, C.hair);
    px(44, hy + 2, 3, 1, C.hair); // fringe

    drawFace(hy);
    drawArms(hy, ty);
  }

  function drawFace(hy) {
    var e = C.eye, blink = Math.floor(now / 3200) !== Math.floor((now - 140) / 3200);
    switch (state) {
      case 'surprised':
        px(43, hy + 4, 2, 3, e); px(49, hy + 4, 2, 3, e);
        px(46, hy + 8, 2, 2, C.mouth);
        break;
      case 'panic':
        px(43, hy + 4, 2, 2, '#fff'); px(49, hy + 4, 2, 2, '#fff');
        px(44, hy + 5, 1, 1, e); px(49, hy + 5, 1, 1, e);
        px(45, hy + 8, 4, 2, C.mouth); px(46, hy + 9, 2, 1, '#e55');
        px(54, hy + 1 + (Math.floor(now / 150) % 3), 1, 2, C.sweat);
        px(39, hy + 2 + (Math.floor(now / 170) % 3), 1, 2, C.sweat);
        break;
      case 'happy': case 'ship': case 'coffee':
        px(43, hy + 6, 1, 1, e); px(44, hy + 5, 1, 1, e); px(45, hy + 6, 1, 1, e);
        px(49, hy + 6, 1, 1, e); px(50, hy + 5, 1, 1, e); px(51, hy + 6, 1, 1, e);
        if (state !== 'coffee') { px(45, hy + 8, 4, 1, C.mouth); px(44, hy + 7, 1, 1, C.mouth); px(49, hy + 7, 1, 1, C.mouth); }
        px(42, hy + 7, 2, 1, C.blush); px(50, hy + 7, 2, 1, C.blush);
        break;
      case 'sleep':
        px(43, hy + 6, 3, 1, e); px(49, hy + 6, 3, 1, e);
        px(46, hy + 8, 2, 1, C.mouth);
        break;
      case 'frenzy':
        px(42, hy + 3, 3, 1, e); px(45, hy + 4, 1, 1, e); // angry brows
        px(50, hy + 3, 3, 1, e); px(49, hy + 4, 1, 1, e);
        px(43, hy + 5, 2, 2, e); px(49, hy + 5, 2, 2, e);
        px(45, hy + 8, 4, 1, C.mouth);
        px(42, hy + 7, 2, 1, '#ff6b5b'); px(50, hy + 7, 2, 1, '#ff6b5b');
        break;
      default: // typing / focused
        if (blink) { px(43, hy + 6, 2, 1, e); px(49, hy + 6, 2, 1, e); }
        else { px(44, hy + 5, 1, 2, e); px(49, hy + 5, 1, 2, e); }
        px(46, hy + 8, 2, 1, C.mouth);
    }
  }

  function drawArms(hy, ty) {
    var lh = 0, rh = 0;
    if (state === 'typing' && !reduced) {
      var f = Math.floor(now / 110);
      lh = (f % 3 === 0) ? 2 : (f % 3 === 1 ? 0 : 1);
      rh = (f % 4 === 1) ? 2 : (f % 4 === 3 ? 1 : 0);
    } else if (state === 'frenzy') {
      lh = Math.floor(Math.random() * 3); rh = Math.floor(Math.random() * 3);
    }

    if (state === 'panic' || state === 'ship') {
      // arms up!
      var wave = state === 'ship' ? Math.floor(now / 160) % 2 : Math.floor(now / 90) % 2;
      px(36, ty - 6 + wave, 3, 8, C.shirt);
      px(55, ty - 6 + (1 - wave), 3, 8, C.shirt);
      px(36, ty - 9 + wave, 3, 3, C.skin);
      px(55, ty - 9 + (1 - wave), 3, 3, C.skin);
      return;
    }
    // upper arms
    px(37, ty + 1, 3, 9, C.shirt); px(54, ty + 1, 3, 9, C.shirt);
    px(37, ty + 1, 1, 9, C.shirtShade); px(56, ty + 1, 1, 9, C.shirtShade);
    // forearms toward keyboard (drawn after desk in drawFront)
    armsFront = { lh: lh, rh: rh, ty: ty };
  }
  var armsFront = null;

  function drawFront() {
    // keyboard
    px(38, 42, 18, 2, C.kbd);
    for (var k = 0; k < 8; k++) px(39 + k * 2, 42, 1, 1, C.key);
    if (!armsFront) return;
    var a = armsFront;
    if (state === 'coffee') {
      // left hand rests, right hand brings mug to face
      px(39, 40, 3, 2, C.skin);
      var hy = 16 + Math.round(jumpY);
      px(52, hy + 7, 4, 5, C.mug); px(52, hy + 7, 4, 1, C.coffee); px(56, hy + 8, 1, 3, C.mugShade);
      px(53, hy + 11, 3, 2, C.skin);
      px(54, a.ty + 1, 3, 6, C.shirt);
      return;
    }
    // hands on keys
    px(39, 40 - a.lh, 4, 2, C.skin);
    px(51, 40 - a.rh, 4, 2, C.skin);
    px(39, 39 - a.lh, 2, 1, C.shirt);
    px(53, 39 - a.rh, 2, 1, C.shirt);
    if (state === 'frenzy' && !reduced) {
      // motion blur
      px(39, 37, 4, 1, 'rgba(242,194,155,0.5)');
      px(51, 37, 4, 1, 'rgba(242,194,155,0.5)');
      var fc = C.fire[Math.floor(Math.random() * 3)];
      px(40 + Math.floor(Math.random() * 14), 40 - Math.floor(Math.random() * 3), 1, 1, fc);
    }
  }

  function drawDesk() {
    px(1, 44, 78, 3, C.desk);
    px(1, 44, 78, 1, C.deskLight);
    px(3, 47, 74, 4, C.deskDark);
    px(5, 51, 3, 13, C.leg); px(72, 51, 3, 13, C.leg);
    px(9, 48, 10, 1, C.desk); // drawer handle
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    armsFront = null;
    drawLamp();
    drawPerson();
    drawDesk();
    drawMonitor();
    drawMug(state !== 'coffee');
    drawFront();
  }

  /* ── Main loop ── */
  var lastGlyph = 0, lastZ = 0, lastStatus = 0, prevT = performance.now();
  function tick(t) {
    var dt = Math.min(50, t - prevT); prevT = t; now = t;
    var k = dt / 16.67;

    // state timeouts
    if (stateUntil && now > stateUntil) {
      var prev = state;
      if (prev === 'frenzy') { setState('ship', 2200); say('Shipped it! ✅  All tests green.', 2200); confetti(); }
      else if (prev === 'coffee') { setState('typing'); say('Ahh. Back to work.', 1400); }
      else { setState('typing'); }
    }

    // fall asleep when the page is idle
    if (state === 'typing' && !hovering && now - lastActivity > 45000) { setState('sleep'); hush(); }

    // in-canvas hop
    if (jumpY < 0 || jumpV !== 0) {
      jumpV += 0.5 * k; jumpY += jumpV * k;
      if (jumpY >= 0) { jumpY = 0; jumpV = 0; }
    }

    // code scroll
    var lineGap = state === 'typing' ? 520 : state === 'frenzy' ? 60 : 0;
    if (lineGap && now - lastLine > lineGap) { lines.shift(); lines.push(newLine()); lastLine = now; }

    // keystroke glyphs
    var gGap = state === 'typing' ? 380 : state === 'frenzy' ? 55 : 0;
    if (gGap && !reduced && now - lastGlyph > gGap && document.visibilityState === 'visible') {
      glyph(state === 'frenzy' ? pick(C.fire) : null); lastGlyph = now;
    }
    if (state === 'sleep' && now - lastZ > 900) { zzz(); lastZ = now; }

    // hover status rotates
    if (hovering && state === 'typing' && !bubbleSticky && now - lastStatus > 2400) {
      say(pick(STATUS)); lastStatus = now;
    }

    // throw physics
    if (flying) {
      vel.y += 0.9 * k;
      pos.x += vel.x * k; pos.y += vel.y * k;
      var maxX = window.innerWidth - boxW - 4, fy = floorY();
      if (pos.x < 4) { pos.x = 4; vel.x = -vel.x * 0.5; }
      if (pos.x > maxX) { pos.x = maxX; vel.x = -vel.x * 0.5; }
      if (pos.y < 4) { pos.y = 4; vel.y = Math.abs(vel.y) * 0.3; }
      if (pos.y >= fy) {
        pos.y = fy;
        var impact = vel.y;
        if (impact > 4) {
          vel.y = -impact * 0.35; vel.x *= 0.7;
          sx = 1 + Math.min(0.25, impact / 60); sy = 1 - Math.min(0.25, impact / 60);
        } else {
          flying = false; vel.x = vel.y = 0;
          land(landImpact);
        }
        landImpact = Math.max(landImpact, impact);
      }
      rot += ((vel.x * 1.2) - rot) * 0.2;
      place();
    } else if (!dragging) {
      rot += (0 - rot) * 0.2;
    }
    sx += (1 - sx) * 0.18 * k; sy += (1 - sy) * 0.18 * k;
    canvas.style.transform = 'rotate(' + rot.toFixed(2) + 'deg) scale(' + sx.toFixed(3) + ',' + sy.toFixed(3) + ')';

    draw();
    requestAnimationFrame(tick);
  }
  var landImpact = 0;

  function land(impact) {
    landImpact = 0;
    sessionStorage.setItem('ccw-x', String(pos.x / window.innerWidth));
    if (impact > 22) { setState('surprised', 900); say(pick(HARD_LAND_LINES), 1800); }
    else { setState('typing'); say(pick(LAND_LINES), 1400); }
  }

  /* ── Interactions ── */
  function wake() {
    lastActivity = performance.now();
    if (state === 'sleep') {
      setState('surprised', 900); jumpV = -3; jumpY = -0.01;
      say("I'm awake! I was… compiling.", 2000);
      return true;
    }
    return false;
  }
  ['pointermove', 'keydown', 'scroll', 'touchstart'].forEach(function (ev) {
    window.addEventListener(ev, function () { lastActivity = performance.now(); }, { passive: true });
  });

  function onClick() {
    if (wake()) return;
    if (state === 'frenzy' || state === 'ship' || state === 'coffee') return;
    var t = performance.now();
    clickTimes = clickTimes.filter(function (c) { return t - c < 1800; });
    clickTimes.push(t);
    if (clickTimes.length >= 5) {
      clickTimes = [];
      setState('frenzy', 3200);
      say('OK OK! Shipping it NOW!! 🔥', 3200, true);
      return;
    }
    jumpV = -3; jumpY = -0.01;
    setState('surprised', 650);
    say(clickTimes.length >= 3 ? 'Stop poking me! 😤' : pick(CLICK_LINES), 1800);
  }
  function onDoubleClick() {
    if (state === 'frenzy' || state === 'ship') return;
    clickTimes = [];
    setState('coffee', 2600);
    say('☕ Coffee break…', 2600, true);
  }

  var down = null, lastMove = null, clickTimer = 0;
  root.addEventListener('pointerdown', function (e) {
    if (e.button !== 0) return;
    lastActivity = performance.now();
    down = { x: e.clientX, y: e.clientY, ox: e.clientX - pos.x, oy: e.clientY - pos.y, t: performance.now() };
    lastMove = { x: e.clientX, y: e.clientY, t: performance.now() };
    vel.x = vel.y = 0;
    try { root.setPointerCapture(e.pointerId); } catch (_) {}
    // touch: long-press shows what it's working on (phones have no hover)
    clearTimeout(pressTimer);
    if (e.pointerType !== 'mouse') {
      pressTimer = setTimeout(function () {
        if (!down || dragging) return;
        down.long = true;
        if (wake()) return;
        if (state === 'typing') say(pick(STATUS), 2200);
        if (navigator.vibrate) navigator.vibrate(15);
      }, 480);
    }
  });
  var pressTimer = 0;
  root.addEventListener('pointermove', function (e) {
    if (!down) return;
    if (!dragging && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) {
      dragging = true; flying = false;
      root.classList.add('dragging');
      wake();
      setState('panic');
      say(pick(DRAG_LINES), 0, true);
    }
    if (!dragging) return;
    var t = performance.now(), dtm = Math.max(1, t - lastMove.t);
    vel.x = vel.x * 0.5 + ((e.clientX - lastMove.x) / dtm * 16) * 0.5;
    vel.y = vel.y * 0.5 + ((e.clientY - lastMove.y) / dtm * 16) * 0.5;
    lastMove = { x: e.clientX, y: e.clientY, t: t };
    pos.x = e.clientX - down.ox; pos.y = e.clientY - down.oy;
    pos.x = Math.max(4, Math.min(window.innerWidth - boxW - 4, pos.x));
    pos.y = Math.max(4, Math.min(floorY(), pos.y));
    rot += (Math.max(-25, Math.min(25, -vel.x * 1.5)) - rot) * 0.3; // dangle against motion
    place();
  });
  function endPointer(e) {
    if (!down) return;
    clearTimeout(pressTimer);
    var wasDrag = dragging, wasLong = down.long;
    down = null;
    if (wasLong && !wasDrag) return;
    if (wasDrag) {
      dragging = false; moved = true;
      root.classList.remove('dragging');
      bubbleSticky = false;
      if (performance.now() - lastMove.t > 80) { vel.x = 0; vel.y = 0; }
      vel.x = Math.max(-40, Math.min(40, vel.x)); vel.y = Math.max(-40, Math.min(40, vel.y));
      landImpact = 0;
      flying = true; // gravity takes it from here
      hush();
      return;
    }
    if (e.type === 'pointercancel') return;
    // distinguish single vs double click
    if (clickTimer) { clearTimeout(clickTimer); clickTimer = 0; onDoubleClick(); }
    else clickTimer = setTimeout(function () { clickTimer = 0; onClick(); }, e.pointerType === 'mouse' ? 230 : 300);
  }
  root.addEventListener('pointerup', endPointer);
  root.addEventListener('pointercancel', endPointer);

  root.addEventListener('pointerenter', function (e) {
    if (e.pointerType !== 'mouse') return;
    hovering = true; lastStatus = 0;
  });
  root.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  root.addEventListener('pointerleave', function () { hovering = false; hush(); });
  root.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
    if (e.key === 'c' || e.key === 'C') onDoubleClick();
  });

  /* ── Boot ── */
  function boot() {
    document.body.appendChild(root);
    home();
    requestAnimationFrame(function (t) { prevT = t; tick(t); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
