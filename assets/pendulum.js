// Double pendulum: two copies that start a tiny angle apart.
// Equations of motion from myPhysicsLab (myphysicslab.com/pendulum/double-pendulum-en.html).
// Integrated with 4th-order Runge-Kutta at a fixed 1 ms step.
(function () {
  var G = 9.81, M1 = 1, M2 = 1, L1 = 1, L2 = 1;
  var H = 0.001;              // time step, seconds
  var SAMPLE = 0.05;          // seconds between chart samples
  var THRESHOLD = 10;         // degrees: "clearly different"
  var TRAIL = 220;            // trail length in points

  var stage = document.getElementById('pendulum');
  var chart = document.getElementById('gapChart');
  if (!stage || !chart) return;
  var sctx = stage.getContext('2d');
  var cctx = chart.getContext('2d');

  var angleIn = document.getElementById('startAngle');
  var angleOut = document.getElementById('startAngleOut');
  var gapIn = document.getElementById('startGap');
  var playBtn = document.getElementById('playBtn');
  var resetBtn = document.getElementById('resetBtn');
  var outTime = document.getElementById('outTime');
  var outGap = document.getElementById('outGap');
  var outSplit = document.getElementById('outSplit');
  var outEnergy = document.getElementById('outEnergy');

  var a, b, t, E0, splitAt, trailA, trailB, history, nextSample, running, last;

  function deriv(s) {
    var t1 = s[0], w1 = s[1], t2 = s[2], w2 = s[3];
    var d = t1 - t2;
    var den = 2 * M1 + M2 - M2 * Math.cos(2 * t1 - 2 * t2);
    var a1 = (-G * (2 * M1 + M2) * Math.sin(t1) - M2 * G * Math.sin(t1 - 2 * t2)
      - 2 * Math.sin(d) * M2 * (w2 * w2 * L2 + w1 * w1 * L1 * Math.cos(d))) / (L1 * den);
    var a2 = (2 * Math.sin(d) * (w1 * w1 * L1 * (M1 + M2) + G * (M1 + M2) * Math.cos(t1)
      + w2 * w2 * L2 * M2 * Math.cos(d))) / (L2 * den);
    return [w1, a1, w2, a2];
  }
  function rk4(s, h) {
    var k1 = deriv(s);
    var k2 = deriv([s[0] + h / 2 * k1[0], s[1] + h / 2 * k1[1], s[2] + h / 2 * k1[2], s[3] + h / 2 * k1[3]]);
    var k3 = deriv([s[0] + h / 2 * k2[0], s[1] + h / 2 * k2[1], s[2] + h / 2 * k2[2], s[3] + h / 2 * k2[3]]);
    var k4 = deriv([s[0] + h * k3[0], s[1] + h * k3[1], s[2] + h * k3[2], s[3] + h * k3[3]]);
    var out = [];
    for (var i = 0; i < 4; i++) out.push(s[i] + h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
    return out;
  }
  function energy(s) {
    var t1 = s[0], w1 = s[1], t2 = s[2], w2 = s[3];
    var T = 0.5 * M1 * L1 * L1 * w1 * w1
      + 0.5 * M2 * (L1 * L1 * w1 * w1 + L2 * L2 * w2 * w2 + 2 * L1 * L2 * w1 * w2 * Math.cos(t1 - t2));
    var V = -(M1 + M2) * G * L1 * Math.cos(t1) - M2 * G * L2 * Math.cos(t2);
    return T + V;
  }
  var E_MIN = -(M1 + M2) * G * L1 - M2 * G * L2; // energy when hanging straight down

  function wrapDeg(rad) {
    var x = ((rad + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
    return Math.abs(x * 180 / Math.PI);
  }
  function gapDeg() { return wrapDeg(a[2] - b[2]); }
  function tip(s) {
    var x1 = L1 * Math.sin(s[0]), y1 = L1 * Math.cos(s[0]);
    return [x1, y1, x1 + L2 * Math.sin(s[2]), y1 + L2 * Math.cos(s[2])];
  }

  function reset() {
    var deg = +angleIn.value, g0 = +gapIn.value;
    var r = deg * Math.PI / 180;
    a = [r, 0, r, 0];
    b = [r + g0 * Math.PI / 180, 0, r, 0];
    t = 0; E0 = energy(a); splitAt = null;
    trailA = []; trailB = [];
    history = [[0, g0]]; nextSample = SAMPLE;
    angleOut.textContent = deg + '°';
    draw(); updateReadouts();
  }

  function step(seconds) {
    var n = Math.round(seconds / H);
    for (var i = 0; i < n; i++) {
      a = rk4(a, H); b = rk4(b, H); t += H;
      if (splitAt === null && gapDeg() > THRESHOLD) splitAt = t;
      if (t >= nextSample - 1e-9) { history.push([t, gapDeg()]); nextSample += SAMPLE; }
    }
    var pa = tip(a), pb = tip(b);
    trailA.push([pa[2], pa[3]]); trailB.push([pb[2], pb[3]]);
    if (trailA.length > TRAIL) { trailA.shift(); trailB.shift(); }
  }

  function fmtGap(x) {
    if (x >= 1) return x.toFixed(1) + '°';
    if (x >= 0.001) return x.toFixed(4) + '°';
    return x.toExponential(1) + '°';
  }
  function updateReadouts() {
    outTime.textContent = t.toFixed(2) + ' s';
    outGap.textContent = fmtGap(gapDeg());
    outSplit.textContent = splitAt === null ? 'not yet' : splitAt.toFixed(2) + ' s';
    var err = Math.abs(energy(a) - E0) / (E0 - E_MIN) * 100;
    outEnergy.textContent = err < 1e-4 ? '< 0.0001%' : err.toFixed(4) + '%';
  }

  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

  function fit(canvas) {
    var dpr = window.devicePixelRatio || 1;
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    }
    return { w: w, h: h, dpr: dpr };
  }

  function drawStage() {
    var f = fit(stage), ctx = sctx;
    ctx.setTransform(f.dpr, 0, 0, f.dpr, 0, 0);
    ctx.clearRect(0, 0, f.w, f.h);
    var cx = f.w / 2, cy = f.h / 2, scale = (Math.min(f.w, f.h) / 2 - 18) / (L1 + L2);
    var blue = css('--blue'), red = css('--red'), fg = css('--fg'), muted = css('--muted');

    function trail(pts, color) {
      if (pts.length < 2) return;
      ctx.strokeStyle = color; ctx.lineWidth = 1.5;
      for (var i = 1; i < pts.length; i++) {
        ctx.globalAlpha = (i / pts.length) * 0.55;
        ctx.beginPath();
        ctx.moveTo(cx + pts[i - 1][0] * scale, cy + pts[i - 1][1] * scale);
        ctx.lineTo(cx + pts[i][0] * scale, cy + pts[i][1] * scale);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    function arm(s, color) {
      var p = tip(s);
      ctx.strokeStyle = fg; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + p[0] * scale, cy + p[1] * scale);
      ctx.lineTo(cx + p[2] * scale, cy + p[3] * scale);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(cx + p[0] * scale, cy + p[1] * scale, 7, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + p[2] * scale, cy + p[3] * scale, 9, 0, Math.PI * 2); ctx.fill();
    }
    trail(trailA, blue); trail(trailB, red);
    ctx.globalAlpha = 0.85; arm(b, red); ctx.globalAlpha = 1; arm(a, blue);
    ctx.fillStyle = muted;
    ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
  }

  function drawChart() {
    var f = fit(chart), ctx = cctx;
    ctx.setTransform(f.dpr, 0, 0, f.dpr, 0, 0);
    ctx.clearRect(0, 0, f.w, f.h);
    var fg = css('--fg'), muted = css('--muted'), line = css('--line'), green = css('--green');
    var padL = 64, padR = 10, padT = 10, padB = 24;
    var W = f.w - padL - padR, Hh = f.h - padT - padB;
    var g0 = +gapIn.value;
    var yMin = Math.floor(Math.log10(g0)), yMax = Math.log10(180);
    var tMax = Math.max(20, Math.ceil(t / 10) * 10);
    function X(s) { return padL + (s / tMax) * W; }
    function Y(v) { var l = Math.log10(Math.max(v, Math.pow(10, yMin))); return padT + (1 - (l - yMin) / (yMax - yMin)) * Hh; }

    ctx.font = '11px "IBM Plex Mono", ui-monospace, monospace';
    ctx.textBaseline = 'middle';
    // y grid: powers of ten
    var span = Math.ceil(yMax) - yMin, every = span > 5 ? 2 : 1;
    for (var e = Math.ceil(yMax) - 1; e >= yMin; e -= every) {
      var y = Y(Math.pow(10, e));
      ctx.strokeStyle = line; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + W, y); ctx.stroke();
      ctx.fillStyle = muted; ctx.textAlign = 'right';
      var lab = e >= 0 ? Math.pow(10, e) + '°' : (Math.pow(10, e)).toFixed(-e) + '°';
      ctx.fillText(lab, padL - 8, y);
    }
    // threshold line
    var ty = Y(THRESHOLD);
    ctx.setLineDash([4, 4]); ctx.strokeStyle = green; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(padL, ty); ctx.lineTo(padL + W, ty); ctx.stroke(); ctx.setLineDash([]);
    // x labels
    ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = muted;
    var xStep = tMax <= 20 ? 5 : 10;
    for (var s = 0; s <= tMax; s += xStep) ctx.fillText(s + ' s', Math.min(X(s), padL + W - 12), padT + Hh + 7);
    // data
    ctx.strokeStyle = fg; ctx.lineWidth = 1.75; ctx.beginPath();
    for (var i = 0; i < history.length; i++) {
      var px = X(history[i][0]), py = Y(history[i][1]);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  function draw() { drawStage(); drawChart(); }

  function frame(now) {
    if (!running) return;
    var dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
    last = now;
    step(dt);
    draw(); updateReadouts();
    requestAnimationFrame(frame);
  }
  function setRunning(on) {
    running = on;
    playBtn.textContent = on ? 'Pause' : 'Play';
    playBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (on) { last = 0; requestAnimationFrame(frame); }
  }

  playBtn.addEventListener('click', function () { setRunning(!running); });
  resetBtn.addEventListener('click', function () { reset(); });
  angleIn.addEventListener('input', function () { reset(); });
  gapIn.addEventListener('change', function () { reset(); });
  window.addEventListener('resize', draw);

  reset();
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  setRunning(!reduce);
})();
