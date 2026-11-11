(function () {
  'use strict';
  // Si la página de Rocket Tec no carga, se usa esta copia de respaldo.
  var FALLBACK = [
    {nombre:'ALFA-1', inicio:'2026-11-10T08:30:00-07:00', fin:'2026-11-10T11:30:00-07:00', estado:'programada', motivo:'', pagina:'https://echucuan.github.io/rocketTecSinaloa2026/ventanas/ALFA-1.html'},
    {nombre:'ALFA-2', inicio:'2026-11-11T07:00:00-07:00', fin:'2026-11-11T08:00:00-07:00', estado:'programada', motivo:'', pagina:'https://echucuan.github.io/rocketTecSinaloa2026/ventanas/ALFA-2.html'},
    {nombre:'ALFA-3', inicio:'2026-11-11T10:00:00-07:00', fin:'2026-11-11T11:00:00-07:00', estado:'programada', motivo:'', pagina:'https://echucuan.github.io/rocketTecSinaloa2026/ventanas/ALFA-3.html'}
  ];
  var DEFAULT_PAGE = 'https://echucuan.github.io/rocketTecSinaloa2026/ventanas/ALFA-1.html';
  var src = (Array.isArray(window.ROCKET_WINDOWS) && window.ROCKET_WINDOWS.length) ? window.ROCKET_WINDOWS : FALLBACK;
  var wins = src.map(function (w) {
    var o = Object.assign({}, w); o.start = Date.parse(w.inicio); o.end = Date.parse(w.fin); return o;
  }).filter(function (w) { return isFinite(w.start) && w.end > w.start; })
    .sort(function (a, b) { return a.start - b.start; });

  var $ = function (id) { return document.getElementById(id); };
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var units = ['DÍAS', 'HORAS', 'MIN', 'SEG'];
  var dateF = new Intl.DateTimeFormat('es-MX', {timeZone: 'America/Mazatlan', day: 'numeric', month: 'short'});
  var timeF = new Intl.DateTimeFormat('es-MX', {timeZone: 'America/Mazatlan', hour: 'numeric', minute: '2-digit'});

  function nearest(now) {
    var i = wins.findIndex(function (w) { return w.end > now && ['cancelada', 'exitosa'].indexOf(w.estado) < 0; });
    return i < 0 ? Math.max(0, wins.length - 1) : i;
  }
  var sel = nearest(Date.now()), manualUntil = 0;
  function move(d) {
    sel = Math.max(0, Math.min(wins.length - 1, sel + d));
    manualUntil = Date.now() + 60000;
    render();
  }
  $('win-prev').addEventListener('click', function () { move(-1); });
  $('win-next').addEventListener('click', function () { move(1); });
  var box = $('win'), tx;
  box.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); move(e.key === 'ArrowLeft' ? -1 : 1); }
  });
  box.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, {passive: true});
  box.addEventListener('touchend', function (e) {
    if (tx === undefined) return;
    var d = e.changedTouches[0].clientX - tx;
    if (Math.abs(d) > 45) move(d < 0 ? 1 : -1);
    tx = undefined;
  }, {passive: true});

  function render() {
    var now = Date.now();
    if (now >= manualUntil) sel = nearest(now);
    var w = wins[sel], status = $('win-status'), clock = $('win-clock'), note = $('win-note');
    if (!w) { $('win-pos').textContent = 'SIN VENTANAS'; status.textContent = 'En espera de programación'; clock.textContent = ''; return; }
    $('win-pos').textContent = (sel + 1) + ' / ' + wins.length;
    $('win-prev').disabled = sel === 0;
    $('win-next').disabled = sel >= wins.length - 1;
    $('win-title').textContent = w.nombre;
    $('win-detail').href = w.pagina || DEFAULT_PAGE;
    $('win-schedule').textContent = dateF.format(w.start) + ' · ' + timeF.format(w.start) + ' – ' + timeF.format(w.end) + ' · Sinaloa';
    var open = now >= w.start && now < w.end, closed = now >= w.end;
    box.classList.toggle('is-open', open);
    box.classList.toggle('is-closed', closed);
    if (w.estado === 'cancelada' || w.estado === 'exitosa') {
      status.textContent = w.estado === 'exitosa' ? '✓ Ventana exitosa' : '⊘ Ventana cancelada';
      clock.textContent = w.nombre; clock.className = 'win-clock win-text';
      note.textContent = w.motivo || 'Resultado registrado de esta ventana.';
      return;
    }
    var zero = open && now - w.start < 1000;
    status.textContent = closed ? 'Ventana finalizada' : zero ? 'T = 0 · apertura de ventana' : open ? 'Ventana abierta · tiempo transcurrido' : 'Apertura en';
    if (closed) {
      note.textContent = 'T de referencia: apertura de la ventana.';
      clock.textContent = w.nombre + ' cerrada'; clock.className = 'win-clock win-text'; return;
    }
    if (open) {
      var left = Math.max(0, Math.ceil((w.end - now) / 1000));
      note.textContent = (zero ? 'T = 0: la ventana abre ahora.' : 'T+: tiempo desde la apertura.') + ' Cierre en ' + pad(Math.floor(left / 3600)) + ':' + pad(Math.floor(left % 3600 / 60)) + ':' + pad(left % 60);
    } else note.textContent = 'T−: tiempo para abrir · T = 0: apertura · T+: tiempo desde la apertura';
    var s = Math.max(0, open ? Math.floor((now - w.start) / 1000) : Math.ceil((w.start - now) / 1000));
    var v = [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60];
    if (!clock.querySelector('.cu')) {
      clock.className = 'win-clock';
      clock.innerHTML = '<span class="cp">T−</span>' + units.map(function (l) { return '<span class="cu"><b>00</b><small>' + l + '</small></span>'; }).join('');
    }
    clock.querySelector('.cp').textContent = zero ? 'T=0' : open ? 'T+' : 'T−';
    clock.querySelectorAll('.cu b').forEach(function (b, i) { b.textContent = pad(v[i]); });
    clock.setAttribute('aria-label', v[0] + ' días, ' + v[1] + ' horas, ' + v[2] + ' minutos y ' + v[3] + ' segundos');
  }
  render();
  setInterval(render, 1000);
})();
