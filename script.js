// Página do Wesley Augusto: entradas na rolagem, contadores, anel das 8 etapas e carga preguiçosa do escritório 3D.
(function () {
  var doc = document.documentElement;
  doc.classList.add('js');
  var calmo = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var temIO = 'IntersectionObserver' in window;

  // ---------- entradas suaves
  var surgem = document.querySelectorAll('.surge');
  if (calmo || !temIO) {
    surgem.forEach(function (el) { el.classList.add('visivel'); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visivel'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    surgem.forEach(function (el) { io.observe(el); });
  }

  // ---------- contadores
  var contas = document.querySelectorAll('[data-conta]');
  function contar(el) {
    var fim = +el.getAttribute('data-conta'), pre = el.getAttribute('data-prefixo') || '', t0 = null, dur = 1200;
    function passo(t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / dur), v = Math.round(fim * (1 - Math.pow(1 - k, 3)));
      el.textContent = pre + v;
      if (k < 1) requestAnimationFrame(passo);
    }
    requestAnimationFrame(passo);
  }
  if (!calmo && temIO) {
    var ioc = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { contar(e.target); ioc.unobserve(e.target); } });
    }, { threshold: 0.6 });
    contas.forEach(function (el) { ioc.observe(el); });
  }

  // ---------- anel das 8 etapas
  var nomes = ['Pesquisa de público', 'Estratégia', 'Roteiro', 'Copy chief', 'Revisor anti-IA', 'Auditor', 'Minha revisão', 'Aprendizado'];
  var N = nomes.length, R = 118, CX = 150, CY = 150;
  var gNos = document.getElementById('anel-nos'), ponto = document.getElementById('anel-ponto');
  var prog = document.getElementById('anel-progresso'), numEl = document.getElementById('anel-num'), nomeEl = document.getElementById('anel-nome');
  var itens = document.querySelectorAll('#etapas li');
  var circ = 2 * Math.PI * R;
  var nos = [];
  if (gNos) {
    var ns = 'http://www.w3.org/2000/svg';
    for (var i = 0; i < N; i++) {
      var a = -Math.PI / 2 + i * 2 * Math.PI / N;
      var g = document.createElementNS(ns, 'g'); g.setAttribute('class', 'anel-no');
      var c = document.createElementNS(ns, 'circle'); c.setAttribute('cx', CX + R * Math.cos(a)); c.setAttribute('cy', CY + R * Math.sin(a)); c.setAttribute('r', 17);
      var tx = document.createElementNS(ns, 'text'); tx.setAttribute('x', CX + R * Math.cos(a)); tx.setAttribute('y', CY + R * Math.sin(a)); tx.textContent = i + 1;
      g.appendChild(c); g.appendChild(tx); gNos.appendChild(g); nos.push(g);
    }
    prog.style.strokeDasharray = circ;
    prog.style.strokeDashoffset = circ;
  }
  var atual = -1;
  function marcar(k) {
    if (k === atual) return; atual = k;
    nos.forEach(function (n, j) { n.classList.toggle('ativo', j === k); n.classList.toggle('feito', j < k); });
    itens.forEach(function (li, j) { li.classList.toggle('ativo', j === k); });
    if (numEl) numEl.textContent = (k + 1) + '/' + N;
    if (nomeEl) nomeEl.textContent = nomes[k];
  }
  function posAnel(f) { // f de 0 a N
    var a = -Math.PI / 2 + f * 2 * Math.PI / N;
    ponto.setAttribute('cx', CX + R * Math.cos(a)); ponto.setAttribute('cy', CY + R * Math.sin(a));
    prog.style.strokeDashoffset = circ * (1 - f / N);
  }
  if (gNos) {
    if (calmo) {
      marcar(0); ponto.style.display = 'none'; prog.style.strokeDashoffset = 0;
    } else {
      var POR = 2200, rodando = false, tAcum = 0, tAnt = null;
      // cada etapa: o ponto para no nó e depois corre até o próximo
      function quadro(t) {
        if (!rodando) { tAnt = null; return; }
        if (tAnt !== null) tAcum += t - tAnt;
        tAnt = t;
        var f = (tAcum / POR) % N, k = Math.floor(f), r = f - k;
        var mov = r < 0.65 ? 0 : (r - 0.65) / 0.35;
        mov = mov * mov * (3 - 2 * mov);
        marcar(k);
        posAnel(k + mov);
        requestAnimationFrame(quadro);
      }
      marcar(0); posAnel(0);
      var anel = document.getElementById('sistema');
      if (temIO) {
        new IntersectionObserver(function (es) {
          var v = es[0].isIntersecting;
          if (v && !rodando) { rodando = true; requestAnimationFrame(quadro); }
          if (!v) rodando = false;
        }, { threshold: 0.15 }).observe(anel);
      } else { rodando = true; requestAnimationFrame(quadro); }
      // tocar numa etapa pula para ela
      itens.forEach(function (li, j) {
        li.style.cursor = 'pointer';
        li.addEventListener('click', function () { tAcum = j * POR; });
      });
    }
  }

  // ---------- escritório 3D: só baixa quando a seção está chegando
  var box = document.getElementById('escritorio');
  if (!box) return;
  var carregado = false;
  function carregar(src, ok, erro) {
    var s = document.createElement('script'); s.src = src; s.async = true; s.onload = ok; s.onerror = erro; document.head.appendChild(s);
  }
  function iniciar() {
    if (carregado) return; carregado = true;
    var falhou = function () { window.ESCRITORIO_FALHA && window.ESCRITORIO_FALHA(); };
    carregar('https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js', function () {
      carregar('escritorio.js', function () {}, falhou);
    }, function () {
      carregar('escritorio.js', function () {}, falhou); // escritorio.js mostra a versão parada se o Three.js não vier
    });
  }
  if (temIO) {
    var iol = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { iniciar(); iol.disconnect(); }
    }, { rootMargin: '700px 0px' });
    iol.observe(box);
  } else { iniciar(); }
})();
