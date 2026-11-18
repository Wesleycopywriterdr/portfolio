// Escritório do time em bloquinhos (voxel), visão isométrica. Three.js r128, sem controles de câmera.
// Tudo aqui é simulado: os bonecos trocam entregas seguindo o caminho de uma copy, em ciclo.
(function () {
  var box = document.getElementById('escritorio'), statusEl = document.getElementById('escritorio-status'), legenda = document.getElementById('legenda');
  if (!box) return;

  // cargo, cor da roupa, cor da calça, cabelo, pele
  var TIME = [
    { cargo: 'Pesquisador', roupa: '#3f8f86', calca: '#2b3440', cabelo: '#2a1d15', pele: '#e9c19c' },
    { cargo: 'Estrategista', roupa: '#8a5cc2', calca: '#2a2f3a', cabelo: '#141414', pele: '#c98d63' },
    { cargo: 'Roteirista', roupa: '#d98b3a', calca: '#3a3530', cabelo: '#6b3b1f', pele: '#f1d0b0' },
    { cargo: 'Copy Chief', roupa: '#c6f432', calca: '#22262e', cabelo: '#3b2a20', pele: '#e3b58e' },
    { cargo: 'Revisor Anti-IA', roupa: '#5b7fa8', calca: '#2c2c34', cabelo: '#b8b2a8', pele: '#f0cfae' },
    { cargo: 'Auditor', roupa: '#d4cfc4', calca: '#3b4250', cabelo: '#1c1c1c', pele: '#8d5a3b' },
    { cargo: 'Designer', roupa: '#d0607a', calca: '#2b2b33', cabelo: '#2f1a10', pele: '#e8bf98' },
    { cargo: 'Editor de Vídeo', roupa: '#4a5a3c', calca: '#2a2a2a', cabelo: '#4a3020', pele: '#b97d55' },
    { cargo: 'Gestor de Tráfego', roupa: '#2f6fd0', calca: '#262a33', cabelo: '#141414', pele: '#f2d2b6' },
    { cargo: 'Analista', roupa: '#9b8a6a', calca: '#2d3138', cabelo: '#5a4030', pele: '#d9a57c' }
  ];
  // quem entrega o quê para quem (índices do TIME)
  var FLUXO = [
    [0, 1, 'a pesquisa de público', 'O Pesquisador está lendo comentários do público.'],
    [1, 2, 'o ângulo e a promessa', 'O Estrategista escolhe o ângulo da peça.'],
    [2, 3, 'a primeira versão', 'O Roteirista escreve a primeira versão.'],
    [3, 4, 'o texto revisado', 'O Copy Chief corta exagero e cobra prova.'],
    [4, 5, 'o texto sem clichê', 'O Revisor Anti-IA caça frase de robô.'],
    [2, 6, 'o roteiro das artes', 'O Roteirista separa o que vira arte.'],
    [2, 7, 'o roteiro do vídeo', 'O Roteirista marca os cortes do vídeo.'],
    [1, 8, 'o plano dos anúncios', 'O Estrategista fecha o plano de anúncios.'],
    [9, 0, 'o que deu resultado', 'O Analista confere o que funcionou.']
  ];

  if (legenda) {
    legenda.innerHTML = TIME.map(function (p) { return '<li><i style="background:' + p.roupa + '"></i>' + p.cargo + '</li>'; }).join('');
  }

  function falha() {
    box.innerHTML = '<div class="escritorio-falha">O escritório 3D não abriu neste aparelho. A legenda abaixo mostra quem trabalha nele.</div>';
  }
  window.ESCRITORIO_FALHA = falha;
  if (!window.THREE) { falha(); return; }
  var teste = document.createElement('canvas');
  if (!(teste.getContext('webgl') || teste.getContext('experimental-webgl'))) { falha(); return; }

  var THREE = window.THREE;
  var calmo = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = box.clientWidth, H = box.clientHeight, mob = W < 640;
  box.innerHTML = '';

  var ren = new THREE.WebGLRenderer({ antialias: !mob, alpha: true, powerPreference: 'low-power' });
  ren.setPixelRatio(mob ? 1 : Math.min(window.devicePixelRatio || 1, 1.75));
  ren.setSize(W, H);
  ren.shadowMap.enabled = !mob;
  ren.shadowMap.type = THREE.PCFSoftShadowMap;
  ren.outputEncoding = THREE.sRGBEncoding;
  box.appendChild(ren.domElement);

  var cena = new THREE.Scene();
  var cam = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 200);
  var ALVO = new THREE.Vector3(0, 0, -0.9);
  var CAM_BASE = new THREE.Vector3(13, 13, 15);
  cam.position.copy(CAM_BASE); cam.lookAt(ALVO);
  function enquadrar() {
    var a = W / H, v = Math.max(4.3, 7.4 / a);
    cam.left = -v * a; cam.right = v * a; cam.top = v; cam.bottom = -v; cam.updateProjectionMatrix();
  }
  enquadrar();

  cena.add(new THREE.HemisphereLight(0xdfe8ff, 0x20242c, 0.75));
  var sol = new THREE.DirectionalLight(0xfff3e0, 0.7);
  sol.position.set(8, 16, 6); sol.castShadow = !mob;
  sol.shadow.mapSize.set(1024, 1024);
  var sc = sol.shadow.camera; sc.left = -10; sc.right = 10; sc.top = 10; sc.bottom = -10; sc.far = 50;
  cena.add(sol);

  var MAT = {};
  function mat(c) { return MAT[c] || (MAT[c] = new THREE.MeshLambertMaterial({ color: c })); }
  var GEO = new THREE.BoxGeometry(1, 1, 1);
  function bloco(w, h, d, c, x, y, z, pai) { // y = base
    var m = new THREE.Mesh(GEO, typeof c === 'string' ? mat(c) : c);
    m.scale.set(w, h, d); m.position.set(x, y + h / 2, z);
    m.castShadow = !mob; m.receiveShadow = !mob;
    (pai || cena).add(m); return m;
  }

  // ---------- sala
  bloco(15, 0.3, 10.4, '#1d222a', 0, -0.3, 0);          // piso
  bloco(14.2, 0.02, 9.6, '#232933', 0, 0, 0);           // tapete
  bloco(15, 2.6, 0.25, '#2a303a', 0, -0.3, -5.2);       // parede do fundo
  bloco(0.25, 2.6, 10.4, '#262c35', -7.5, -0.3, 0);     // parede lateral
  // quadro de etapas na parede
  var cores = ['#3f8f86', '#8a5cc2', '#d98b3a', '#c6f432', '#5b7fa8', '#d4cfc4'];
  bloco(5.6, 1.3, 0.06, '#e9ecef', 1.4, 0.75, -5.04);
  cores.forEach(function (c, i) { bloco(0.6, 0.4, 0.04, c, -0.8 + i * 0.88, 1.15, -4.99); bloco(0.6, 0.06, 0.04, '#9aa2ad', -0.8 + i * 0.88, 0.95, -4.99); });
  // plantas
  function planta(x, z) {
    bloco(0.5, 0.5, 0.5, '#6b4b3a', x, 0, z);
    bloco(0.7, 0.6, 0.7, '#3f7a4a', x, 0.5, z); bloco(0.45, 0.4, 0.45, '#4f9a5a', x, 1.1, z);
  }
  planta(-6.8, -4.5); planta(6.6, -4.5); planta(-6.8, 4.4);
  // máquina de café
  bloco(1.2, 0.9, 0.6, '#3a3f48', 5.4, 0, -4.6); bloco(0.5, 0.5, 0.1, '#c6f432', 5.4, 0.95, -4.28);

  // ---------- mesas: 2 fileiras de 5
  var COLS = [-5.2, -2.6, 0, 2.6, 5.2], FILA_A = { mesa: -2.6, cadeira: -1.75 }, FILA_B = { mesa: 1.3, cadeira: 2.15 }, CORREDOR = -0.3;
  var telas = [];
  var postos = [];
  for (var i = 0; i < 10; i++) {
    var fila = i < 5 ? FILA_A : FILA_B, x = COLS[i % 5];
    bloco(1.7, 0.08, 0.85, '#c9b79c', x, 0.72, fila.mesa);                       // tampo
    [[-0.78, -0.35], [0.78, -0.35], [-0.78, 0.35], [0.78, 0.35]].forEach(function (p) { bloco(0.07, 0.72, 0.07, '#5b5f68', x + p[0], 0, fila.mesa + p[1]); });
    bloco(0.9, 0.55, 0.06, '#1a1d22', x, 0.95, fila.mesa - 0.18);                  // monitor
    bloco(0.08, 0.15, 0.08, '#1a1d22', x, 0.8, fila.mesa - 0.18);
    var tela = new THREE.Mesh(GEO, new THREE.MeshBasicMaterial({ color: '#2a3a20' }));
    tela.scale.set(0.8, 0.45, 0.02); tela.position.set(x, 1.225, fila.mesa - 0.14); cena.add(tela); telas.push(tela);
    bloco(0.5, 0.03, 0.18, '#2c3038', x, 0.8, fila.mesa + 0.2);                    // teclado
    bloco(0.62, 0.08, 0.6, '#30343c', x, 0.42, fila.cadeira);                      // cadeira
    bloco(0.62, 0.62, 0.08, '#30343c', x, 0.5, fila.cadeira + 0.32);
    bloco(0.08, 0.42, 0.08, '#55595f', x, 0, fila.cadeira);
    postos.push({ x: x, z: fila.cadeira, lado: x + 1.25 });
  }

  // ---------- bonecos
  function boneco(p) {
    var g = new THREE.Group();
    var corpo = new THREE.Group(); g.add(corpo);
    var pernaE = new THREE.Group(), pernaD = new THREE.Group();
    pernaE.position.set(-0.11, 0.5, 0); pernaD.position.set(0.11, 0.5, 0);
    bloco(0.19, 0.5, 0.22, p.calca, 0, -0.5, 0, pernaE); bloco(0.19, 0.5, 0.22, p.calca, 0, -0.5, 0, pernaD);
    bloco(0.2, 0.09, 0.27, '#1b1b1f', 0, -0.5, 0.03, pernaE); bloco(0.2, 0.09, 0.27, '#1b1b1f', 0, -0.5, 0.03, pernaD);
    corpo.add(pernaE); corpo.add(pernaD);
    bloco(0.5, 0.52, 0.3, p.roupa, 0, 0.5, 0, corpo);                              // tronco
    var bracoE = new THREE.Group(), bracoD = new THREE.Group();
    bracoE.position.set(-0.33, 0.98, 0); bracoD.position.set(0.33, 0.98, 0);
    bloco(0.15, 0.46, 0.17, p.roupa, 0, -0.42, 0, bracoE); bloco(0.15, 0.46, 0.17, p.roupa, 0, -0.42, 0, bracoD);
    bloco(0.14, 0.1, 0.15, p.pele, 0, -0.5, 0, bracoE); bloco(0.14, 0.1, 0.15, p.pele, 0, -0.5, 0, bracoD);
    corpo.add(bracoE); corpo.add(bracoD);
    var cabeca = new THREE.Group(); cabeca.position.set(0, 1.02, 0); corpo.add(cabeca);
    bloco(0.42, 0.42, 0.42, p.pele, 0, 0, 0, cabeca);
    bloco(0.46, 0.14, 0.46, p.cabelo, 0, 0.36, -0.01, cabeca);
    bloco(0.46, 0.3, 0.1, p.cabelo, 0, 0.12, -0.2, cabeca);
    bloco(0.07, 0.07, 0.02, '#15171b', -0.09, 0.2, 0.215, cabeca); bloco(0.07, 0.07, 0.02, '#15171b', 0.09, 0.2, 0.215, cabeca);
    var papel = bloco(0.26, 0.04, 0.34, '#f4f4ef', 0, -0.5, 0.12, bracoD); papel.visible = false;
    cena.add(g);
    return { g: g, corpo: corpo, pE: pernaE, pD: pernaD, bE: bracoE, bD: bracoD, cab: cabeca, papel: papel };
  }

  var gente = TIME.map(function (p, i) {
    var b = boneco(p), posto = postos[i];
    var q = { i: i, dados: p, b: b, posto: posto, x: posto.x, z: posto.z, rot: Math.PI, sentado: true, rota: [], espera: 0, fase: Math.random() * 6, ativo: false };
    var et = document.createElement('div'); et.className = 'rotulo-3d'; et.textContent = p.cargo; box.appendChild(et); q.et = et;
    return q;
  });

  function sentar(q, sim) {
    q.sentado = sim;
    q.b.corpo.position.y = sim ? -0.08 : 0;
    q.b.pE.rotation.x = q.b.pD.rotation.x = sim ? -Math.PI / 2 : 0;
  }
  gente.forEach(function (q) { sentar(q, true); });

  // ---------- simulação
  var passo = 0, ocupado = false, tempo = 0;
  function setStatus(t) { if (statusEl) statusEl.textContent = t; }
  function rota(de, para) {
    var a = postos[de], b = postos[para];
    return [[a.lado, a.z], [a.lado, CORREDOR], [b.lado, CORREDOR], [b.lado, b.z]];
  }
  function proximaEntrega() {
    var f = FLUXO[passo % FLUXO.length]; passo++;
    var q = gente[f[0]], alvo = gente[f[1]];
    ocupado = true; q.ativo = true; alvo.ativo = true;
    setStatus(f[3]);
    q.espera = 2.4;
    q.depois = function () {
      sentar(q, false); q.b.papel.visible = true;
      q.rota = rota(q.i, alvo.i);
      setStatus(TIME[f[0]].cargo + ' leva ' + f[2] + ' para o ' + TIME[f[1]].cargo + '.');
      q.chegou = function () {
        q.b.papel.visible = false; q.olhar = alvo; q.espera = 1.1;
        setStatus(TIME[f[1]].cargo + ' recebeu ' + f[2] + '.');
        q.depois = function () {
          q.rota = rota(alvo.i, q.i).concat([[q.posto.x, q.posto.z]]);
          q.rota.shift();
          q.chegou = function () {
            q.rot = Math.PI; sentar(q, true); q.ativo = false; alvo.ativo = false; ocupado = false; esperaEntre = 1.2;
          };
        };
      };
    };
  }
  var esperaEntre = 0.6;

  function atualizar(dt) {
    tempo += dt;
    if (!ocupado) { esperaEntre -= dt; if (esperaEntre <= 0) proximaEntrega(); }
    gente.forEach(function (q) {
      var b = q.b;
      if (q.espera > 0) {
        q.espera -= dt;
        if (q.espera <= 0 && q.depois) { var fn = q.depois; q.depois = null; fn(); }
      } else if (q.rota.length) {
        var alvo = q.rota[0], dx = alvo[0] - q.x, dz = alvo[1] - q.z, d = Math.hypot(dx, dz), v = 2.1 * dt;
        if (d <= v) { q.x = alvo[0]; q.z = alvo[1]; q.rota.shift(); if (!q.rota.length && q.chegou) { var c = q.chegou; q.chegou = null; c(); } }
        else { q.x += dx / d * v; q.z += dz / d * v; q.rot = Math.atan2(dx, dz); }
      }
      if (q.olhar && q.espera > 0) q.rot = Math.atan2(q.olhar.x - q.x, q.olhar.z - q.z);
      if (q.espera <= 0) q.olhar = null;
      var andando = q.rota.length > 0 && q.espera <= 0;
      b.g.position.set(q.x, 0, q.z);
      b.g.rotation.y = q.rot;
      var s = tempo * 9 + q.fase;
      if (andando) {
        b.pE.rotation.x = Math.sin(s) * 0.6; b.pD.rotation.x = -Math.sin(s) * 0.6;
        b.bE.rotation.x = -Math.sin(s) * 0.5; b.bD.rotation.x = -0.9;
        b.corpo.position.y = Math.abs(Math.sin(s)) * 0.04;
      } else if (q.sentado) {
        var dig = q.ativo || (Math.sin(tempo * 0.7 + q.fase) > -0.2); // a maioria digitando, alguns pensando
        b.bE.rotation.x = -1.2 + (dig ? Math.sin(s * 1.6) * 0.12 : 0);
        b.bD.rotation.x = -1.2 + (dig ? Math.cos(s * 1.6) * 0.12 : 0);
        b.cab.rotation.y = dig ? 0 : Math.sin(tempo * 0.8 + q.fase) * 0.4;
      } else {
        b.pE.rotation.x = b.pD.rotation.x = 0; b.bE.rotation.x = -0.5; b.bD.rotation.x = q.b.papel.visible ? -0.9 : -0.4;
      }
      var tela = telas[q.i];
      tela.material.color.set(q.ativo ? '#c6f432' : (q.sentado ? (Math.sin(tempo * 2 + q.fase) > 0.85 ? '#5d7a3a' : '#3d5228') : '#1f2a18'));
      q.et.classList.toggle('ativo', q.ativo);
    });
  }

  var vec = new THREE.Vector3();
  function rotulos() {
    gente.forEach(function (q) {
      var mostra = !mob || q.ativo;
      q.et.style.display = mostra ? '' : 'none';
      if (!mostra) return;
      vec.set(q.x, q.sentado ? 1.75 : 1.9, q.z).project(cam);
      q.et.style.transform = 'translate(' + ((vec.x + 1) / 2 * W) + 'px,' + ((1 - vec.y) / 2 * H) + 'px) translate(-50%,-100%)';
    });
  }

  function desenhar() { ren.render(cena, cam); rotulos(); }

  if (calmo) { atualizar(0.016); desenhar(); setStatus('Cada um na sua mesa: o trabalho passa de um especialista para o outro.'); return; }

  var visivel = false, tAnt = 0, rodando = false;
  function loop(t) {
    if (!visivel || document.hidden) { rodando = false; return; }
    var dt = Math.min(0.05, (t - tAnt) / 1000 || 0.016); tAnt = t;
    atualizar(dt);
    if (!mob) { cam.position.x = CAM_BASE.x + Math.sin(t / 6000) * 1.2; cam.lookAt(ALVO); }
    desenhar();
    requestAnimationFrame(loop);
  }
  function ligar() { if (rodando) return; rodando = true; tAnt = performance.now(); requestAnimationFrame(loop); }
  desenhar();
  new IntersectionObserver(function (es) { visivel = es[0].isIntersecting; if (visivel) ligar(); }, { threshold: 0.05 }).observe(box);
  document.addEventListener('visibilitychange', function () { if (!document.hidden && visivel) ligar(); });
  var tr;
  window.addEventListener('resize', function () {
    clearTimeout(tr);
    tr = setTimeout(function () {
      W = box.clientWidth; H = box.clientHeight; ren.setSize(W, H); enquadrar(); desenhar();
    }, 150);
  });
})();
