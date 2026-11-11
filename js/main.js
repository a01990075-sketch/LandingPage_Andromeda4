(function () {
  'use strict';
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var $ = function (id) { return document.getElementById(id); };

  $('year').textContent = new Date().getFullYear();

  // ---- Cronómetro: desde el momento en que se abre la página hasta el fin de noviembre ----
  var now0 = new Date();
  var year = now0.getFullYear();
  // 30 de noviembre, 23:59:59 (hora local del visitante). Cambia el año aquí si lo necesitas.
  var end = new Date(year, 10, 30, 23, 59, 59);
  var start = new Date(year, 10, 1, 0, 0, 0);
  var fmt = new Intl.DateTimeFormat('es-MX', { dateStyle: 'full' });
  $('launch-date').textContent = 'Fecha límite: ' + fmt.format(end) + ', 11:59 p. m.';

  function tick() {
    var now = new Date();
    var diff = end - now;
    if (diff <= 0) {
      $('clock').innerHTML = '<p class="done" style="font-family:var(--display);font-size:2rem;text-align:center">¡Misión cumplida! Llegamos a Andrómeda.</p>';
      setProgress(100);
      return false;
    }
    var s = Math.floor(diff / 1000);
    $('d').textContent = pad(Math.floor(s / 86400));
    $('h').textContent = pad(Math.floor(s % 86400 / 3600));
    $('m').textContent = pad(Math.floor(s % 3600 / 60));
    $('s').textContent = pad(s % 60);
    var pct = Math.min(100, Math.max(0, (now - start) / (end - start) * 100));
    setProgress(pct);
    return true;
  }
  function setProgress(p) {
    $('bar').style.width = p + '%';
    $('rocket').style.left = p + '%';
    $('progress-text').textContent = 'Llevamos ' + p.toFixed(1) + '% del camino de noviembre.';
  }
  if (tick()) {
    var timer = setInterval(function () { if (!tick()) clearInterval(timer); }, 1000);
  }

  // ---- Fondo de estrellas ----
  var c = $('stars'), ctx = c.getContext('2d'), stars = [];
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function resize() {
    c.width = innerWidth; c.height = innerHeight;
    var n = Math.round(c.width * c.height / 9000);
    stars = [];
    for (var i = 0; i < n; i++) {
      stars.push({ x: Math.random() * c.width, y: Math.random() * c.height, r: Math.random() * 1.4 + .3, p: Math.random() * 6.28, v: Math.random() * .02 + .005, cy: Math.random() < .12 });
    }
  }
  function draw() {
    ctx.clearRect(0, 0, c.width, c.height);
    stars.forEach(function (s) {
      s.p += s.v;
      var a = reduce ? .6 : .35 + .55 * Math.abs(Math.sin(s.p));
      ctx.globalAlpha = a;
      ctx.fillStyle = s.cy ? '#00EFE7' : '#ffffff';
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.28); ctx.fill();
    });
    if (!reduce) requestAnimationFrame(draw);
  }
  addEventListener('resize', resize);
  resize(); draw();
})();
