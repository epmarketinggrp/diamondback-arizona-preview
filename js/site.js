/* Diamondback Lock & Key · "Old Arizona" preview. Plain JavaScript, no libraries. */
(function () {
  'use strict';
  window.DBK = 1;
  var D = document, R = D.documentElement;
  function $(s, c) { return (c || D).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || D).querySelectorAll(s)); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* ---- Chandler clock, today's hours, menu, form (these always run) ---- */
  var clocks = $$('.clock');
  var timeFmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Phoenix', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
  function tick() { var t = timeFmt.format(new Date()); clocks.forEach(function (c) { c.textContent = t; }); }
  tick(); setInterval(tick, 1000);

  var today = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Phoenix', weekday: 'long' }).format(new Date());
  $$('.hours tr').forEach(function (tr) { if (tr.firstElementChild.textContent.trim() === today) tr.classList.add('today'); });

  var burger = $('#burger'), nav = $('#nav');
  function menu(open) { nav.classList.toggle('open', open); burger.setAttribute('aria-expanded', open ? 'true' : 'false'); }
  burger.addEventListener('click', function () { menu(!nav.classList.contains('open')); });
  nav.addEventListener('click', function (ev) { if (ev.target.tagName === 'A') menu(false); });
  D.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') menu(false); });

  $('#quote').addEventListener('submit', function (ev) {
    ev.preventDefault();
    $('#quoteNote').textContent = 'This is a design preview, so the form is switched off. Nothing was sent.';
  });

  /* ---- scroll: the rope in the header pays out, the menu marks the section on screen ---- */
  var links = $$('#nav a'), secs = links.map(function (a) { return $(a.getAttribute('href')); });
  function onScroll() {
    var max = R.scrollHeight - innerHeight;
    R.style.setProperty('--sp', max > 0 ? Math.min(1, Math.max(0, scrollY / max)).toFixed(4) : 0);
    var line = innerHeight * 0.4, best = -1, bestTop = -1e9;
    secs.forEach(function (s, i) { if (!s) return; var t = s.getBoundingClientRect().top; if (t <= line && t > bestTop) { bestTop = t; best = i; } });
    links.forEach(function (a, i) { a.classList.toggle('on', i === best); });
  }
  onScroll();

  if (reduce) { addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); return; }

  /* ---- reveal on scroll, counting numbers, diagrams and video only run in view ---- */
  var revealIO = new IntersectionObserver(function (entries) {
    var n = 0;
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target; revealIO.unobserve(el);
      setTimeout(function () { el.classList.add('in'); }, Math.min(n++ * 80, 400));
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
  $$('.rv').forEach(function (el) { revealIO.observe(el); });

  function fmt(v, dec, sep) { var s = v.toFixed(dec); return sep ? s.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : s; }
  var countIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target; countIO.unobserve(el);
      var to = +el.dataset.count, from = +(el.dataset.from || 0), dec = +(el.dataset.dec || 0), sep = el.dataset.sep, t0 = performance.now();
      (function step(t) {
        var p = Math.min(1, (t - t0) / 1500), q = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(from + (to - from) * q, dec, sep);
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(function (el) { countIO.observe(el); });

  var liveIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { en.target.classList.toggle('live', en.isIntersecting); });
  }, { threshold: 0.15 });
  $$('.svc').forEach(function (el) { liveIO.observe(el); });

  var vid = $('#shopVid');
  if (vid) new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { var p = vid.play(); if (p && p.catch) p.catch(function () {}); } else vid.pause();
    });
  }, { threshold: 0.25 }).observe(vid);

  /* ---- the typed line under the hero copy (the site's own phrases) ---- */
  var typed = $('#typed'), typing = false;
  var phrases = ['emergency callouts run 24/7', 'car key replacement', 're-key services', 'house lockout', 'keyless entry', 'access control systems', 'ignition switch services', 'a clear estimate before any work begins'];
  function startTyping() {
    if (typing || !typed) return; typing = true;
    var pi = 0;
    function erase() { var s = typed.textContent; if (s.length) { typed.textContent = s.slice(0, -1); setTimeout(erase, 26); } else { pi = (pi + 1) % phrases.length; write(); } }
    function write() { var s = phrases[pi], n = typed.textContent.length; if (n < s.length) { typed.textContent = s.slice(0, n + 1); setTimeout(write, 52); } else setTimeout(erase, 2100); }
    setTimeout(erase, 2400);
  }

  /* ---- particles: dust, embers, smoke, fireflies on one fixed canvas ---- */
  var cv = $('#fx'), cx = cv.getContext('2d'), W = 0, H = 0, P = [], drawn = false;
  function size() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size();
  function add(k, x, y, vx, vy, life, r, a) {
    if (P.length < 520) P.push({ k: k, x: x, y: y, vx: vx, vy: vy, l: life, m: life, r: r, a: a == null ? 1 : a, s: Math.random() * 6.283 });
  }
  function burst(x, y, n, sp) {
    for (var i = 0; i < n; i++) { var an = Math.random() * 6.283, v = rnd(sp * 0.2, sp); add('s', x, y, Math.cos(an) * v, Math.sin(an) * v - sp * 0.2, rnd(0.45, 1.15), rnd(1, 2.6)); }
  }
  function puff(x, y, n, sp, r, a) {
    for (var i = 0; i < n; i++) { var an = Math.random() * 6.283, v = rnd(0, sp); add('d', x + rnd(-5, 5), y + rnd(-5, 5), Math.cos(an) * v, Math.sin(an) * v * 0.6 - 10, rnd(0.5, 1.1), rnd(r * 0.5, r), a); }
  }
  function dot(x, y, r, c, a) { cx.globalAlpha = a; cx.fillStyle = c; cx.beginPath(); cx.arc(x, y, r, 0, 6.283); cx.fill(); }
  function fx(dt, t, real) {
    if (!P.length) { if (drawn) { cx.clearRect(0, 0, W, H); drawn = false; } return; }
    cx.clearRect(0, 0, W, H); drawn = true;
    for (var i = P.length - 1; i >= 0; i--) {
      var p = P[i]; p.l -= real;
      if (p.l <= 0 || p.y < -80 || p.y > H + 80 || p.x < -120 || p.x > W + 160) { P.splice(i, 1); continue; }
      var q = p.l / p.m, a;
      if (p.k === 's') { p.vy += 430 * dt; p.vx *= 1 - 1.5 * dt; p.vy *= 1 - 0.5 * dt; }
      else if (p.k === 'e') { p.vy -= 24 * dt; p.vx += Math.sin(t * 3 + p.s) * 46 * dt; }
      else if (p.k === 'd') { p.r += 16 * dt; p.vx *= 1 - 1.6 * dt; p.vy *= 1 - 1.6 * dt; }
      else if (p.k === 'w') { p.r += 12 * dt; }
      else if (p.k === 'k') { p.r += 34 * dt; p.vy -= 14 * dt; p.vx *= 1 - dt; }
      else if (p.k === 'f') { p.vx += Math.sin(t * 1.3 + p.s) * 30 * dt; p.vy += Math.cos(t * 1.7 + p.s * 2) * 30 * dt; p.vx *= 1 - 0.9 * dt; p.vy *= 1 - 0.9 * dt; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.k === 's' || p.k === 'e') {
        var c = q > 0.62 ? '#ffe9a8' : q > 0.3 ? '#ff9a3a' : '#c8461e';
        a = Math.min(1, q * 1.7) * p.a;
        dot(p.x, p.y, p.r * 3.2, '#ff8a2a', a * 0.16);
        dot(p.x, p.y, p.r * (0.45 + 0.55 * q), c, a);
      } else if (p.k === 'd' || p.k === 'w') dot(p.x, p.y, p.r, '#c4a06e', p.a * q * 0.5);
      else if (p.k === 'k') dot(p.x, p.y, p.r, '#3c2a20', p.a * q * 0.42);
      else if (p.k === 'm') dot(p.x, p.y, p.r, '#d2a66a', Math.sin(3.1416 * q) * 0.5);
      else if (p.k === 'f') {
        a = Math.sin(3.1416 * q) * (0.55 + 0.45 * Math.sin(t * 5 + p.s));
        dot(p.x, p.y, p.r * 4, '#e8f07a', a * 0.14);
        dot(p.x, p.y, p.r, '#f4f9a6', a);
      }
    }
    cx.globalAlpha = 1;
  }

  /* where the standing particles come from */
  var fire = $('#fire'), emg = $('#emergency'), hot = null, sizzle = 0, wipe0 = 0;
  function sources(dt, now) {
    var i, r;
    if (Math.random() < dt * 2.6) add('m', rnd(-40, W), rnd(0, H), rnd(8, 28), rnd(-5, 5), rnd(5, 9), rnd(0.8, 1.9));
    r = fire.getBoundingClientRect();
    if (r.top < H && r.bottom > 0 && Math.random() < dt * 24) add('e', r.left + r.width / 2 + rnd(-r.width * 0.3, r.width * 0.3), r.top + r.height * 0.55, rnd(-10, 10), rnd(-85, -35), rnd(1.4, 2.9), rnd(1, 2.3));
    r = emg.getBoundingClientRect();
    if (r.top < H && r.bottom > 0 && Math.random() < dt * 5) add('f', rnd(0, W), rnd(Math.max(0, r.top), Math.min(H, r.bottom)), rnd(-12, 12), rnd(-12, 12), rnd(3, 6), rnd(1.1, 1.9));
    if (hot) {
      r = hot.getBoundingClientRect();
      if (Math.random() < dt * 28) add('e', rnd(r.left, r.right), r.top + rnd(-2, 3), rnd(-12, 12), rnd(-60, -25), rnd(0.5, 1.1), rnd(0.8, 1.8));
    }
    if (sizzle) {
      if (now < sizzle) {
        r = iron.getBoundingClientRect();
        for (i = 0; i < 3; i++) add('e', rnd(r.left, r.right), rnd(r.top, r.bottom), rnd(-20, 20), rnd(-95, -30), rnd(0.5, 1.1), rnd(0.8, 2));
        if (Math.random() < 0.5) add('k', rnd(r.left, r.right), rnd(r.top, r.bottom), rnd(-20, 20), rnd(-60, -20), rnd(0.8, 1.5), rnd(8, 20), 0.8);
      } else sizzle = 0;
    }
    if (wipe0) {
      var w = Math.min(1, (now - wipe0) / 850), e = w * w * (3 - 2 * w), edge = (e * 1.24 - 0.12) * W;
      brandin.style.setProperty('--w', e.toFixed(4));
      for (i = 0; i < 5; i++) add('w', edge + rnd(-50, 60), rnd(0, H), rnd(260, 640), rnd(-40, 40), rnd(0.4, 0.9), rnd(5, 20), 0.75);
      if (w >= 1) wipe0 = 0;
    }
  }
  if (fine) {
    var travelled = 0, lastX = 0, lastY = 0;
    addEventListener('mousemove', function (ev) {
      travelled += Math.abs(ev.clientX - lastX) + Math.abs(ev.clientY - lastY); lastX = ev.clientX; lastY = ev.clientY;
      if (travelled > 46) { travelled = 0; puff(ev.clientX, ev.clientY + 8, 1, 10, 7, 0.55); }
      mx = ev.clientX / W; dirty = true;
    }, { passive: true });
    D.addEventListener('mouseover', function (ev) { hot = ev.target.closest ? ev.target.closest('.btn-pri,.btn-call') : null; });
  }
  addEventListener('pointerdown', function (ev) { puff(ev.clientX, ev.clientY, 7, 90, 12, 0.8); burst(ev.clientX, ev.clientY, 9, 240); }, { passive: true });

  /* ---- the opening: the iron drops, burns the mark in, a dust wind clears the screen ---- */
  var brandin = $('#brandin'), iron = $('#iron'), hdrMk = $('#hdrMk'), busy = false;
  function runIntro() {
    if (busy) return; busy = true;
    brandin.classList.remove('hit', 't'); brandin.style.setProperty('--w', 0);
    iron.classList.remove('drop', 'burnt', 'fly'); iron.style.transform = '';
    R.classList.remove('landed'); R.classList.add('intro', 'hold');
    void iron.offsetWidth;
    iron.classList.add('drop');
    setTimeout(function () {
      brandin.classList.add('hit');
      var r = iron.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
      burst(x, y, 90, 560);
      for (var i = 0; i < 16; i++) add('k', x + rnd(-r.width * 0.4, r.width * 0.4), y + rnd(-r.height * 0.3, r.height * 0.3), rnd(-30, 30), rnd(-70, -20), rnd(0.9, 1.8), rnd(10, 26), 0.9);
      sizzle = performance.now() + 650;
    }, 430);
    setTimeout(function () { iron.classList.add('burnt'); }, 540);
    setTimeout(function () { brandin.classList.add('t'); }, 640);
    setTimeout(function () {
      R.classList.remove('hold');
      var a = iron.getBoundingClientRect(), b = hdrMk.getBoundingClientRect();
      iron.classList.add('fly');
      iron.style.transform = 'translate(' + (b.left - a.left) + 'px,' + (b.top - a.top) + 'px) scale(' + (b.width / a.width) + ')';
      wipe0 = performance.now();
    }, 1560);
    setTimeout(function () { R.classList.add('landed'); }, 2380);
    setTimeout(function () {
      R.classList.remove('intro', 'landed');
      brandin.classList.remove('hit', 't'); brandin.style.removeProperty('--w');
      iron.classList.remove('drop', 'burnt', 'fly'); iron.style.transform = '';
      wipe0 = 0; busy = false; startTyping();
    }, 2720);
  }
  $('#replay').addEventListener('click', runIntro);

  /* ---- the hero scene: layers drift with the pointer, the sun sinks as the page scrolls ---- */
  var layers = $$('.scene .ly').map(function (el) { return { el: el, d: +el.dataset.d }; }), hero = $('#top'), mx = 0.5, dirty = true;
  function parallax() {
    var s = scrollY; if (s > hero.offsetHeight + 300) return;
    layers.forEach(function (l) {
      var ty = s * (l.d <= 0.05 ? 0.16 : (0.42 - l.d) * 0.2), tx = (mx - 0.5) * l.d * -56;
      l.el.style.transform = 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px)';
    });
  }

  /* ---- the small ink drawings in the margins drift, turn and (some) spin ---- */
  var floats = $$('.ft').map(function (el) { return { el: el, sec: el.parentNode, s: +el.dataset.s || 0, r: +el.dataset.r || 0, spin: +el.dataset.spin || 0 }; });
  function drift(t) {
    if (W <= 1020) return;
    var seen = [], rects = [];
    floats.forEach(function (f) {
      var i = seen.indexOf(f.sec), r;
      if (i < 0) { seen.push(f.sec); r = f.sec.getBoundingClientRect(); rects.push(r); } else r = rects[i];
      if (r.bottom < -100 || r.top > H + 100) return;
      var p = Math.max(-1.5, Math.min(1.5, (r.top + r.height / 2 - H / 2) / H));
      f.el.style.transform = 'translate3d(0,' + (p * f.s).toFixed(1) + 'px,0) rotate(' + (p * f.r + f.spin * t).toFixed(1) + 'deg)';
    });
  }

  /* ---- the valley map: a trail is inked from the shop to the city under the pointer ---- */
  var map = $('#map'), hoverCity = null, autoOn = [], autoIdx = 0, mapSeen = false;
  function city(c, on) { $$('[data-c="' + c + '"]').forEach(function (el) { el.classList.toggle('on', on); }); }
  function hover(c) {
    while (autoOn.length) city(autoOn.pop(), false);
    if (hoverCity) city(hoverCity, false);
    hoverCity = c; if (c) city(c, true);
  }
  var cityEls = $$('.pt', map).concat($$('.acol a'));
  cityEls.forEach(function (el) {
    el.addEventListener('mouseenter', function () { hover(el.dataset.c); });
    el.addEventListener('mouseleave', function () { hover(null); });
    el.addEventListener('focus', function () { hover(el.dataset.c); });
    el.addEventListener('blur', function () { hover(null); });
  });
  var order = $$('.pt', map).map(function (g) { return g.dataset.c; });
  new IntersectionObserver(function (entries) { mapSeen = entries[0].isIntersecting; }, { threshold: 0.2 }).observe(map);
  setInterval(function () {
    if (!mapSeen || hoverCity || D.hidden) return;
    var c = order[(autoIdx++ * 7) % order.length];
    city(c, true); autoOn.push(c);
    if (autoOn.length > 3) city(autoOn.shift(), false);
  }, 1100);

  /* ---- one loop drives everything that moves by script ---- */
  addEventListener('scroll', function () { dirty = true; }, { passive: true });
  addEventListener('resize', function () { size(); dirty = true; });
  var last = performance.now();
  function frame(now) {
    var real = Math.min(2, (now - last) / 1000), dt = Math.min(0.05, real); last = now;
    if (dirty) { dirty = false; onScroll(); parallax(); }
    drift(now / 1000);
    sources(dt, now);
    fx(dt, now / 1000, real);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  if (R.classList.contains('intro')) { R.classList.remove('intro'); runIntro(); } else startTyping();
})();
