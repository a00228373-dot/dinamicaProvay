/* =========================================================
   ROBOT MAKERS · TRIVIA — script.js
   ========================================================= */
(() => {
  'use strict';

  /* ---------------------------------------------------------
     Generador de Sonidos Futuristas (Web Audio API)
     --------------------------------------------------------- */
  const soundFx = (() => {
    let ctx = null;
    let muted = false;

    function getContext() {
      if (!ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) ctx = new AudioCtx();
      }
      if (ctx && ctx.state === 'suspended') ctx.resume();
      return ctx;
    }

    function toggleMute() {
      muted = !muted;
      return muted;
    }

    function isMuted() { return muted; }

    // Click cibernético sutil
    function click() {
      if (muted) return;
      const ac = getContext();
      if (!ac) return;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, ac.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1100, ac.currentTime + 0.04);
      gain.gain.setValueAtTime(0.06, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + 0.05);
    }

    // Disparo / Láser futurista (al arrojar pregunta o confirmar acción)
    function laser() {
      if (muted) return;
      const ac = getContext();
      if (!ac) return;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(580, ac.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, ac.currentTime + 0.16);
      gain.gain.setValueAtTime(0.09, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.16);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + 0.16);
    }

    // Arranque de energía / Encendido (Pantalla de carga -> Inicio)
    function powerUp() {
      if (muted) return;
      const ac = getContext();
      if (!ac) return;
      const now = ac.currentTime;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(920, now + 0.55);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    }

    // Éxito / Respuesta correcta (Acorde brillante ascendente)
    function success() {
      if (muted) return;
      const ac = getContext();
      if (!ac) return;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const now = ac.currentTime + i * 0.07;
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start(now);
        osc.stop(now + 0.22);
      });
    }

    // Error / Respuesta incorrecta (Zumbido grave)
    function error() {
      if (muted) return;
      const ac = getContext();
      if (!ac) return;
      const now = ac.currentTime;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.setValueAtTime(95, now + 0.12);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    }

    return { toggleMute, isMuted, click, laser, powerUp, success, error };
  })();

  /* ---------------------------------------------------------
     Utilidades
     --------------------------------------------------------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const storage = {
    get(key) { try { return window.localStorage.getItem(key); } catch (e) { return null; } },
    set(key, val) { try { window.localStorage.setItem(key, val); } catch (e) { /* sin almacenamiento */ } }
  };

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  /* ---------------------------------------------------------
     Referencias al DOM
     --------------------------------------------------------- */
  const els = {
    intro: $('#intro'),
    startBtn: $('#startBtn'),
    bootBar: $('#bootBar'),
    bootFill: $('#bootFill'),
    bootText: $('#bootText'),
    bootPct: $('#bootPct'),
    app: $('#app'),
    introMuteBtn: $('#introMuteBtn'),
    appMuteBtn: $('#appMuteBtn'),

    form: $('#registerForm'),
    nameInput: $('#nameInput'),
    playerCount: $('#playerCount'),

    qCard: $('#questionCard'),
    qEmpty: $('#qEmpty'),
    qContent: $('#qContent'),
    qCategory: $('#qCategory'),
    qText: $('#qText'),
    qOptions: $('#qOptions'),
    qExplain: $('#qExplain'),
    qCounter: $('#qCounter'),
    throwBtn: $('#throwBtn'),
    revealBtn: $('#revealBtn'),

    leader: $('#leaderBanner'),
    scoreBody: $('#scoreBody'),
    finishBtn: $('#finishBtn'),

    winner: $('#winner'),
    winnerTitle: $('#winnerTitle'),
    winnerNames: $('#winnerNames'),
    winnerScore: $('#winnerScore'),
    podium: $('#podium'),
    keepPlayingBtn: $('#keepPlayingBtn'),
    newContestBtn: $('#newContestBtn'),

    toasts: $('#toasts')
  };

  /* ---------------------------------------------------------
     Preguntas (basadas en el guion de la presentación)
     --------------------------------------------------------- */
  const QUESTIONS = [
    // --- Robots ---
    { cat: 'Robots', q: 'Un robot es una máquina que hace tres cosas. ¿Cuáles son?',
      a: 'Sentir, pensar y actuar', w: ['Correr, saltar y volar', 'Hablar, cantar y bailar', 'Comer, dormir y jugar'],
      e: 'Todo robot siente, piensa y actúa.' },
    { cat: 'Robots', q: 'El ascensor que detecta si hay alguien en la puerta es un ejemplo de…',
      a: 'Sentir', w: ['Pensar', 'Actuar', 'Cantar'],
      e: 'El ascensor siente si alguien está en la puerta.' },
    { cat: 'Robots', q: 'La aspiradora robot que decide por dónde ir para no chocar es un ejemplo de…',
      a: 'Pensar', w: ['Sentir', 'Actuar', 'Brillar'],
      e: 'La aspiradora piensa cuál camino tomar.' },
    { cat: 'Robots', q: 'El semáforo que cambia de luz es un ejemplo de…',
      a: 'Actuar', w: ['Sentir', 'Pensar', 'Dormir'],
      e: 'Cambiar de luz es la acción del semáforo.' },
    { cat: 'Robots', q: 'Una máquina que siente, piensa y actúa es un…',
      a: 'Robot', w: ['Libro', 'Zapato', 'Globo'],
      e: '¡Eso es un robot!' },

    // --- Arduino ---
    { cat: 'Arduino', q: '¿Cómo se llama el cerebro de nuestros robots?',
      a: 'Arduino', w: ['Ardilla', 'Tornillo', 'Magnetito'],
      e: 'Arduino es el cerebro de los robots de Robot Makers.' },
    { cat: 'Arduino', q: 'Arduino es una…',
      a: 'Minicomputadora que tú programas', w: ['Pila recargable', 'Rueda inteligente', 'Linterna'],
      e: 'Es una minicomputadora que ustedes programan.' },
    { cat: 'Arduino', q: '¿En qué parte de Arduino "piensa" la placa?',
      a: 'En el chip', w: ['En el USB', 'En los pines', 'En el cable rojo'],
      e: 'El chip es donde piensa Arduino.' },
    { cat: 'Arduino', q: '¿Para qué sirven los pines de Arduino?',
      a: 'Son las entradas donde conectamos cables', w: ['Para decorar la placa', 'Para enfriar el chip', 'Para que no se mueva de la mesa'],
      e: 'En los pines conectamos los cables.' },
    { cat: 'Arduino', q: '¿Por dónde le mandamos las órdenes a Arduino?',
      a: 'Por el USB', w: ['Por la pila', 'Por el motor', 'Por el sensor'],
      e: 'El USB sirve para enviarle las órdenes.' },
    { cat: 'Arduino', q: '¿En qué país nació Arduino?',
      a: 'Italia', w: ['Japón', 'México', 'Egipto'],
      e: 'Arduino nació en Italia y hoy lo usa gente de todo el mundo.' },
    { cat: 'Arduino', q: 'Arduino se creó para que los ______ aprendieran electrónica.',
      a: 'Estudiantes', w: ['Astronautas', 'Chefs', 'Futbolistas'],
      e: 'Fue hecho para que estudiantes aprendieran electrónica.' },

    // --- Cables ---
    { cat: 'Cables', q: 'En un robot, los cables son como los…',
      a: 'Nervios', w: ['Huesos', 'Dientes', 'Zapatos'],
      e: 'Los cables mandan mensajes, igual que los nervios.' },
    { cat: 'Cables', q: 'La electricidad es como personas pasándose una…',
      a: 'Pelota', w: ['Bufanda', 'Pizza', 'Mochila'],
      e: 'Si todos están conectados, la pelota llega hasta el final.' },
    { cat: 'Cables', q: 'Si se desconecta un cable, ¿qué le pasa al circuito?',
      a: 'Se corta', w: ['Funciona más rápido', 'Cambia de color', 'Se hace más grande'],
      e: 'Si alguien se suelta, la pelota ya no llega: el circuito se corta.' },
    { cat: 'Cables', q: '¿De qué color es el cable positivo?',
      a: 'Rojo', w: ['Negro', 'Azul', 'Verde'],
      e: 'El rojo es positivo.' },
    { cat: 'Cables', q: '¿De qué color es el cable negativo?',
      a: 'Negro', w: ['Rojo', 'Amarillo', 'Rosa'],
      e: 'El negro es negativo.' },

    // --- Sensores ---
    { cat: 'Sensores', q: '¿Con qué siente el mundo un robot?',
      a: 'Con sensores', w: ['Con ruedas', 'Con tornillos', 'Con el cargador'],
      e: 'Nosotros sentimos con ojos, oídos y tacto; un robot, con sensores.' },
    { cat: 'Sensores', q: 'Un robot sin sensores es como una persona con…',
      a: 'Los ojos cerrados y los oídos tapados', w: ['Mucha hambre', 'Un sombrero puesto', 'Los zapatos al revés'],
      e: 'Sin sensores, el robot no puede sentir nada.' },
    { cat: 'Sensores', q: '¿Cuál de estos NO es un sensor de los que vimos?',
      a: 'Sensor de sabor', w: ['Sensor de luz', 'Sensor de sonido', 'Sensor de distancia'],
      e: 'Vimos sensores de luz, de sonido, botones y de distancia.' },
    { cat: 'Sensores', q: '¿Qué mide el sensor de distancia?',
      a: 'Qué tan lejos está un objeto', w: ['La temperatura', 'El peso', 'El color'],
      e: 'Calcula si el objeto está cerca o lejos.' },
    { cat: 'Sensores', q: '¿Qué animal inspira al sensor de distancia?',
      a: 'El murciélago', w: ['El gato', 'El perro', 'La jirafa'],
      e: 'El sensor funciona como un murciélago.' },
    { cat: 'Sensores', q: 'El sonido del murciélago choca con algo y regresa como…',
      a: 'Eco', w: ['Trueno', 'Música', 'Viento'],
      e: 'El sonido rebota y regresa como eco.' },
    { cat: 'Sensores', q: 'Si el eco regresa rápido, el objeto está…',
      a: 'Cerca', w: ['Lejos', 'Muy caliente', 'Apagado'],
      e: 'Eco rápido = objeto cerca.' },
    { cat: 'Sensores', q: 'Si el eco tarda mucho en regresar, el objeto está…',
      a: 'Lejos', w: ['Cerca', 'Pegado al sensor', 'Encendido'],
      e: 'Eco lento = objeto lejos.' },
    { cat: 'Sensores', q: 'El sensor de distancia hace tres cosas: grita, escucha y…',
      a: 'Calcula', w: ['Canta', 'Baila', 'Dibuja'],
      e: 'Grita, escucha y calcula.' },
    { cat: 'Sensores', q: 'En la demostración, mientras más cerca está la mano del sensor, el buzzer suena…',
      a: 'Más rápido', w: ['Más lento', 'Igual que siempre', 'No suena'],
      e: 'Mientras más cerca, más rápido suena.' },

    // --- Motores ---
    { cat: 'Motores', q: 'Los motores son los ______ del robot.',
      a: 'Músculos', w: ['Ojos', 'Nervios', 'Dientes'],
      e: 'Los motores le dan movimiento al robot.' },
    { cat: 'Motores', q: 'Sin motor, un robot es como una…',
      a: 'Estatua', w: ['Nube', 'Pizza', 'Canción'],
      e: 'Sin motor, el robot no se mueve.' },
    { cat: 'Motores', q: 'Si cambiamos de lugar los cables del motor, ¿qué pasa?',
      a: 'Gira al revés', w: ['Se apaga para siempre', 'Gira más rápido', 'Se convierte en sensor'],
      e: 'El motor gira hacia el otro lado.' },

    // --- Programación ---
    { cat: 'Programación', q: 'Programar es dar ______ en un idioma que la máquina entienda.',
      a: 'Órdenes', w: ['Abrazos', 'Regalos', 'Premios'],
      e: 'Programar es dar órdenes a la máquina.' },
    { cat: 'Programación', q: 'Si hay un obstáculo cerca, el robot…',
      a: 'Gira', w: ['Avanza más rápido', 'Se apaga', 'Canta'],
      e: 'Si hay un obstáculo cerca, gira para esquivarlo.' },
    { cat: 'Programación', q: 'Si no hay nada enfrente, el robot…',
      a: 'Avanza', w: ['Gira en círculos', 'Retrocede', 'Se detiene para siempre'],
      e: 'Si no hay obstáculo, sigue avanzando.' },
    { cat: 'Programación', q: '¿Cuántas reglas bastan para que un robot esquive obstáculos?',
      a: 'Dos', w: ['Cien', 'Mil', 'Cero'],
      e: 'Solo son dos reglas, ¡y ya esquiva cosas!' },

    // --- Todo junto ---
    { cat: 'Todo junto', q: 'En el robot, ¿qué parte siente?',
      a: 'El sensor', w: ['El motor', 'La pila', 'La rueda'],
      e: 'El sensor siente.' },
    { cat: 'Todo junto', q: 'En el robot, ¿qué parte piensa?',
      a: 'El Arduino', w: ['El motor', 'El sensor', 'La pila'],
      e: 'Arduino es el cerebro: piensa.' },
    { cat: 'Todo junto', q: 'En el robot, ¿qué partes actúan y se mueven?',
      a: 'Los motores', w: ['El sensor', 'El chip', 'El cable negro'],
      e: 'Los motores hacen que el robot se mueva.' },
    { cat: 'Todo junto', q: 'La pila es el ______ del robot porque le da energía.',
      a: 'Corazón', w: ['Cerebro', 'Ojo', 'Zapato'],
      e: 'La pila es el corazón: da energía.' },

    // --- El curso ---
    { cat: 'El curso', q: '¿Cuáles son las cuatro cosas que se aprenden en Robot Makers?',
      a: 'Circuitos, sensores, motores y programación', w: ['Dibujo, canto, baile y cocina', 'Pintura, música, teatro y cocina', 'Natación, fútbol, ajedrez y yoga'],
      e: 'Circuitos, sensores, motores y programación.' },
    { cat: 'El curso', q: 'El 28 de noviembre, cada niño construye…',
      a: 'Su propio robot que esquiva obstáculos', w: ['Un cohete a la Luna', 'Una computadora gigante', 'Un robot que cocina pizzas'],
      e: 'Cada quien construye su robot que esquiva obstáculos.' }
  ];

  /* ---------------------------------------------------------
     Estado
     --------------------------------------------------------- */
  const STORE_KEY = 'robotMakers.trivia.players.v1';
  const MAX_PLAYERS = 30;

  const state = {
    started: false,
    players: loadPlayers(),
    deck: [],
    cycles: 0,
    lastIndex: null,
    current: null,
    throwing: false,
    leaderKey: null,
    closeTimer: 0,
    lastFocus: null
  };

  function loadPlayers() {
    try {
      const raw = storage.get(STORE_KEY);
      if (!raw) return [];
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) return [];
      return data
        .filter((p) => p && typeof p.name === 'string' && Number.isFinite(Number(p.score)))
        .slice(0, MAX_PLAYERS)
        .map((p) => ({
          id: String(p.id || uid()),
          name: p.name.slice(0, 20),
          score: Math.max(0, Math.round(Number(p.score)))
        }));
    } catch (e) {
      return [];
    }
  }

  function savePlayers() {
    storage.set(STORE_KEY, JSON.stringify(state.players));
  }

  /* ---------------------------------------------------------
     Avisos (toasts)
     --------------------------------------------------------- */
  function toast(msg, type = 'info') {
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.textContent = msg;
    els.toasts.append(t);
    while (els.toasts.children.length > 3) els.toasts.firstElementChild.remove();
    setTimeout(() => t.remove(), 3100);
  }

  /* ---------------------------------------------------------
     Fondo interactivo avanzado: nodos flotantes, física de fluidos,
     ondas de choque, rayos de energía interactivos y cursor cinemático
     --------------------------------------------------------- */
  const fx = (() => {
    const canvas = $('#bg');
    const ctx = canvas.getContext('2d');
    const glow = $('#cursorGlow');
    const parallaxEls = $$('[data-parallax]');
    const COLORS = ['0,240,255', '255,43,214', '182,255,59', '255,216,74', '123,92,255'];
    const TYPES = ['circle', 'diamond', 'cross', 'ring'];
    const LINK = 135;
    const INFLUENCE_R = 230;

    const mouse = {
      x: -9999, y: -9999,
      prevX: -9999, prevY: -9999,
      vx: 0, vy: 0,
      smoothVx: 0, smoothVy: 0,
      speed: 0,
      active: false
    };

    let w = 0, h = 0, dpr = 1, raf = 0;
    let particles = [], trail = [], sparks = [], ripples = [];
    let tpx = 0, tpy = 0, px = 0, py = 0, lastPx = 99, lastPy = 99;
    let gx = 0, gy = 0;
    let lastTrail = { x: -999, y: -999 };

    function makeParticle() {
      const c = pick(COLORS);
      const angle = rand(0, Math.PI * 2);
      const speed = rand(0.2, 0.75) * (REDUCED ? 0.2 : 0.48);
      const bx = Math.cos(angle) * speed;
      const by = Math.sin(angle) * speed;
      const type = pick(TYPES);
      const r = type === 'cross' ? rand(3.5, 6) : (type === 'diamond' ? rand(2.8, 5) : rand(1.6, 3.8));
      return {
        x: rand(0, w || 1000),
        y: rand(0, h || 1000),
        bx, by,
        vx: bx, vy: by,
        r,
        c,
        type,
        rot: rand(0, Math.PI * 2),
        vRot: rand(-0.02, 0.02),
        glow: 0
      };
    }

    function targetCount() {
      return REDUCED ? 32 : clamp(Math.round((w * h) / 14000), 45, 120);
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = targetCount();
      while (particles.length < n) particles.push(makeParticle());
      if (particles.length > n) particles.length = n;
    }

    function burst(x, y, n = 18) {
      if (REDUCED) return;
      for (let i = 0; i < n; i++) {
        const a = rand(0, Math.PI * 2);
        const s = rand(2, 7.5);
        sparks.push({
          x, y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s - rand(0.5, 2),
          life: 1,
          c: pick(COLORS),
          size: rand(1.5, 3.8)
        });
      }
      if (sparks.length > 250) sparks.splice(0, sparks.length - 250);
    }

    function ripple(x, y, c = '0,240,255', maxR = 300) {
      if (REDUCED) return;
      ripples.push({
        x, y,
        r: 6,
        maxR,
        speed: 7.5,
        c,
        alpha: 1
      });
      if (ripples.length > 8) ripples.shift();
    }

    function frame() {
      raf = requestAnimationFrame(frame);
      ctx.clearRect(0, 0, w, h);

      if (mouse.active) {
        mouse.vx = mouse.x - mouse.prevX;
        mouse.vy = mouse.y - mouse.prevY;
        mouse.prevX = mouse.x;
        mouse.prevY = mouse.y;

        mouse.smoothVx += (mouse.vx - mouse.smoothVx) * 0.22;
        mouse.smoothVy += (mouse.vy - mouse.smoothVy) * 0.22;
        mouse.speed = Math.hypot(mouse.smoothVx, mouse.smoothVy);

        if (!REDUCED) {
          gx += (mouse.x - gx) * 0.18;
          gy += (mouse.y - gy) * 0.18;
          const angle = Math.atan2(mouse.smoothVy, mouse.smoothVx);
          const stretch = Math.min(mouse.speed * 0.024, 0.65);
          glow.style.transform = `translate3d(${(gx - 150).toFixed(1)}px, ${(gy - 150).toFixed(1)}px, 0) rotate(${angle.toFixed(3)}rad) scale(${(1 + stretch).toFixed(2)}, ${(1 - stretch * 0.35).toFixed(2)})`;
        }
      } else {
        mouse.speed = 0;
      }

      if (!REDUCED) {
        px += (tpx - px) * 0.07;
        py += (tpy - py) * 0.07;
        if (Math.abs(px - lastPx) > 0.0003 || Math.abs(py - lastPy) > 0.0003) {
          const sx = px.toFixed(4), sy = py.toFixed(4);
          for (const el of parallaxEls) {
            el.style.setProperty('--px', sx);
            el.style.setProperty('--py', sy);
          }
          lastPx = px; lastPy = py;
        }
      }

      for (let i = ripples.length - 1; i >= 0; i--) {
        const rip = ripples[i];
        rip.r += rip.speed;
        rip.alpha *= 0.955;
        if (rip.alpha <= 0.02 || rip.r >= rip.maxR) {
          ripples.splice(i, 1);
          continue;
        }
        ctx.strokeStyle = `rgba(${rip.c}, ${(rip.alpha * 0.45).toFixed(3)})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.r, 0, Math.PI * 2);
        ctx.stroke();

        if (rip.r > 20) {
          ctx.strokeStyle = `rgba(${rip.c}, ${(rip.alpha * 0.18).toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(rip.x, rip.y, Math.max(0, rip.r - 18), 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      const nearNodes = [];
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.rot += p.vRot;

        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const d = Math.hypot(dx, dy) || 1;

          if (d < INFLUENCE_R) {
            const factor = 1 - d / INFLUENCE_R;
            p.glow += (factor - p.glow) * 0.18;

            if (d < 145) {
              const push = Math.pow(1 - d / 145, 1.8) * 3.8;
              p.vx += (dx / d) * push;
              p.vy += (dy / d) * push;
            }

            const wake = factor * Math.min(mouse.speed, 35) * 0.14;
            p.vx += mouse.smoothVx * wake;
            p.vy += mouse.smoothVy * wake;

            const swirl = factor * 0.55;
            p.vx += (-dy / d) * swirl;
            p.vy += (dx / d) * swirl;

            nearNodes.push({ p, d });
          } else {
            p.glow *= 0.94;
          }
        } else {
          p.glow *= 0.94;
        }

        for (let j = 0; j < ripples.length; j++) {
          const rip = ripples[j];
          const rdx = p.x - rip.x, rdy = p.y - rip.y;
          const rd = Math.hypot(rdx, rdy) || 1;
          const diff = Math.abs(rd - rip.r);
          if (diff < 26) {
            const ripForce = (1 - diff / 26) * (1 - rip.r / rip.maxR) * 4.6;
            p.vx += (rdx / rd) * ripForce;
            p.vy += (rdy / rd) * ripForce;
            p.glow = Math.max(p.glow, 0.85);
          }
        }

        p.vx += (p.bx - p.vx) * 0.038;
        p.vy += (p.by - p.vy) * 0.038;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -20) p.x = w + 20; else if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20; else if (p.y > h + 20) p.y = -20;
      }

      if (mouse.active && nearNodes.length > 0 && !REDUCED) {
        nearNodes.sort((a, b) => a.d - b.d);
        const maxRays = Math.min(nearNodes.length, 4);
        for (let i = 0; i < maxRays; i++) {
          const { p, d } = nearNodes[i];
          const alpha = (1 - d / INFLUENCE_R) * 0.55;
          ctx.strokeStyle = `rgba(${p.c}, ${alpha.toFixed(3)})`;
          ctx.lineWidth = 1.4 * (1 - d / INFLUENCE_R) + 0.6;
          ctx.beginPath();
          const midX = (mouse.x + p.x) / 2 + (Math.random() - 0.5) * 4;
          const midY = (mouse.y + p.y) / 2 + (Math.random() - 0.5) * 4;
          ctx.moveTo(mouse.x, mouse.y);
          ctx.quadraticCurveTo(midX, midY, p.x, p.y);
          ctx.stroke();
        }
      }

      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          if (dx > LINK || dx < -LINK) continue;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK * LINK) {
            const d = Math.sqrt(d2);
            const excitement = Math.max(a.glow, b.glow);
            const baseAlpha = (1 - d / LINK) * 0.18;
            const finalAlpha = Math.min(0.9, baseAlpha + excitement * 0.45);
            const strokeColor = excitement > 0.25 ? a.c : '0,240,255';
            ctx.strokeStyle = `rgba(${strokeColor}, ${finalAlpha.toFixed(3)})`;
            ctx.lineWidth = excitement > 0.3 ? 1.5 : 0.8;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const g = p.glow;
        const curR = p.r * (1 + g * 0.45);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);

        ctx.fillStyle = `rgba(${p.c}, ${(0.12 + g * 0.4).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(0, 0, curR * (2.8 + g * 1.5), 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = g > 0.4 ? '#ffffff' : `rgba(${p.c}, ${(0.85 + g * 0.15).toFixed(3)})`;
        ctx.strokeStyle = `rgba(${p.c}, 0.9)`;

        if (p.type === 'diamond') {
          ctx.beginPath();
          ctx.moveTo(0, -curR);
          ctx.lineTo(curR, 0);
          ctx.lineTo(0, curR);
          ctx.lineTo(-curR, 0);
          ctx.closePath();
          ctx.fill();
        } else if (p.type === 'cross') {
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(-curR, 0); ctx.lineTo(curR, 0);
          ctx.moveTo(0, -curR); ctx.lineTo(0, curR);
          ctx.stroke();
        } else if (p.type === 'ring') {
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(0, 0, curR, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, 0, curR * 0.35, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, curR, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      ctx.globalCompositeOperation = 'lighter';
      for (let i = trail.length - 1; i >= 0; i--) {
        const t = trail[i];
        t.life -= 0.032;
        if (t.life <= 0) { trail.splice(i, 1); continue; }
        ctx.fillStyle = `rgba(${t.c}, ${(t.life * 0.45).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(t.x, t.y, 2 + t.life * 7.5, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.vx *= 0.955;
        s.vy = s.vy * 0.955 + 0.06;
        s.x += s.vx;
        s.y += s.vy;
        s.life -= 0.024;
        if (s.life <= 0) { sparks.splice(i, 1); continue; }
        ctx.fillStyle = `rgba(${s.c}, ${s.life.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    function start() {
      if (!raf) raf = requestAnimationFrame(frame);
    }
    function stop() {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
    }

    function init() {
      resize();
      window.addEventListener('resize', resize);

      window.addEventListener('pointermove', (e) => {
        if (!mouse.active) {
          mouse.prevX = e.clientX;
          mouse.prevY = e.clientY;
          gx = e.clientX;
          gy = e.clientY;
        }
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouse.active = true;
        tpx = (e.clientX / w - 0.5) * 2;
        tpy = (e.clientY / h - 0.5) * 2;
        if (e.pointerType === 'mouse') glow.classList.add('on');

        if (!REDUCED) {
          const dx = e.clientX - lastTrail.x, dy = e.clientY - lastTrail.y;
          if (dx * dx + dy * dy > 30) {
            trail.push({ x: e.clientX, y: e.clientY, life: 1, c: pick(COLORS) });
            if (trail.length > 70) trail.shift();
            lastTrail = { x: e.clientX, y: e.clientY };
          }
        }
      }, { passive: true });

      window.addEventListener('pointerup', (e) => {
        if (e.pointerType !== 'mouse') mouse.active = false;
      }, { passive: true });
      window.addEventListener('pointercancel', () => { mouse.active = false; }, { passive: true });

      window.addEventListener('pointerdown', (e) => {
        burst(e.clientX, e.clientY, 16);
        ripple(e.clientX, e.clientY, pick(COLORS), 260);
      }, { passive: true });

      document.documentElement.addEventListener('mouseleave', () => {
        mouse.active = false;
        glow.classList.remove('on');
      });

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) stop(); else start();
      });

      start();
    }

    return { init, burst, ripple };
  })();

  /* Brillo que sigue al cursor dentro de cada panel */
  function initPanelGlow() {
    els.app.addEventListener('pointermove', (e) => {
      const panel = e.target.closest ? e.target.closest('.panel') : null;
      if (!panel) return;
      const r = panel.getBoundingClientRect();
      panel.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      panel.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
  }

  /* ---------------------------------------------------------
     Pantalla de carga: telemetría de diagnóstico robótico profesional
     --------------------------------------------------------- */
  const BOOT_STEPS = [
    '[01/05] Sincronizando núcleo Arduino Uno…',
    '[02/05] Calibrando sensores ultrasónicos…',
    '[03/05] Verificando servomotores y bus I2C…',
    '[04/05] Cargando matriz de preguntas…',
    '[05/05] Sistema en línea · Listo para el concurso'
  ];
  let bootTimer = 0;

  function runBoot() {
    let pct = 0;
    bootTimer = setInterval(() => {
      pct = Math.min(100, pct + rand(2.2, 5.8));
      const rounded = Math.round(pct);
      els.bootFill.style.width = rounded + '%';
      els.bootBar.setAttribute('aria-valuenow', rounded);
      if (els.bootPct) els.bootPct.textContent = rounded + '%';
      const idx = Math.min(BOOT_STEPS.length - 1, Math.floor((pct / 100) * BOOT_STEPS.length));
      els.bootText.textContent = BOOT_STEPS[idx];
      if (pct >= 100) {
        clearInterval(bootTimer);
        bootTimer = 0;
        els.bootText.textContent = '[100%] SISTEMA EN LÍNEA · LISTO';
        if (els.bootPct) els.bootPct.textContent = '100%';
        els.startBtn.classList.add('ready');
      }
    }, 75);
  }

  function startApp() {
    if (state.started) return;
    state.started = true;
    if (bootTimer) { clearInterval(bootTimer); bootTimer = 0; }

    soundFx.powerUp();

    els.bootFill.style.width = '100%';
    if (els.bootPct) els.bootPct.textContent = '100%';

    const r = els.startBtn.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    fx.burst(cx, cy, 45);
    fx.ripple(cx, cy, '0,240,255', 460);

    els.intro.classList.add('leaving');
    els.app.removeAttribute('inert');
    els.app.classList.add('visible');
    document.body.classList.remove('no-scroll');
    window.scrollTo(0, 0);

    setTimeout(() => { els.intro.hidden = true; }, 950);
  }

  /* ---------------------------------------------------------
     Participantes y marcador
     --------------------------------------------------------- */
  function computeRanking() {
    const sorted = state.players
      .map((p, i) => ({ p, i }))
      .sort((a, b) => b.p.score - a.p.score || a.i - b.i)
      .map((x) => x.p);

    const ranking = [];
    let rank = 0;
    let prev = null;
    sorted.forEach((p, i) => {
      if (p.score !== prev) { rank = i + 1; prev = p.score; }
      ranking.push({ p, rank });
    });
    return ranking;
  }

  function makeCell(cls) {
    const td = document.createElement('td');
    td.className = cls;
    return td;
  }

  function makeBtn(cls, action, label, aria) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn ' + cls;
    b.dataset.action = action;
    b.textContent = label;
    b.setAttribute('aria-label', aria);
    return b;
  }

  function renderScoreboard(opts = {}) {
    const firstTops = new Map();
    $$('tr[data-id]', els.scoreBody).forEach((tr) => firstTops.set(tr.dataset.id, tr.getBoundingClientRect().top));

    let restore = null;
    const active = document.activeElement;
    if (active && els.scoreBody.contains(active) && active.dataset && active.dataset.action) {
      const tr = active.closest('tr');
      if (tr) restore = { id: tr.dataset.id, action: active.dataset.action };
    }

    const ranking = computeRanking();
    const maxScore = ranking.length ? ranking[0].p.score : 0;
    const rows = new Map();
    const frag = document.createDocumentFragment();

    if (!ranking.length) {
      const tr = document.createElement('tr');
      tr.className = 'empty-row';
      const td = document.createElement('td');
      td.colSpan = 4;
      td.textContent = 'Aún no hay participantes. ¡Registra al primero!';
      tr.append(td);
      frag.append(tr);
    }

    ranking.forEach(({ p, rank }) => {
      const tr = document.createElement('tr');
      tr.dataset.id = p.id;
      if (p.score > 0 && rank <= 3) tr.classList.add('rank-' + rank);
      if (!firstTops.has(p.id)) tr.classList.add('enter');

      const tdRank = makeCell('c-rank');
      if (maxScore === 0) tdRank.textContent = '–';
      else tdRank.textContent = String(rank);

      const tdName = makeCell('c-name');
      tdName.textContent = p.name;
      tdName.title = p.name;

      const tdPts = makeCell('c-pts');
      tdPts.textContent = String(p.score);
      if (opts.popId === p.id && opts.delta) {
        tdPts.classList.add('pop');
        const f = document.createElement('span');
        f.className = 'float-plus' + (opts.delta < 0 ? ' neg' : '');
        f.textContent = (opts.delta > 0 ? '+' : '') + opts.delta;
        f.setAttribute('aria-hidden', 'true');
        tdPts.append(f);
        setTimeout(() => f.remove(), 1000);
      }

      const tdAct = makeCell('c-act');
      const box = document.createElement('div');
      box.className = 'actions';
      box.append(
        makeBtn('btn-plus', 'plus', '+10', 'Sumar 10 puntos a ' + p.name),
        makeBtn('btn-ghost', 'minus', '−10', 'Restar 10 puntos a ' + p.name),
        makeBtn('btn-ghost', 'remove', '✕', 'Eliminar a ' + p.name)
      );
      tdAct.append(box);

      tr.append(tdRank, tdName, tdPts, tdAct);
      frag.append(tr);
      rows.set(p.id, tr);
    });

    els.scoreBody.replaceChildren(frag);

    if (!REDUCED) {
      const moving = [];
      rows.forEach((tr, id) => {
        if (!firstTops.has(id)) return;
        const dy = firstTops.get(id) - tr.getBoundingClientRect().top;
        if (Math.abs(dy) > 1) {
          tr.style.transition = 'none';
          tr.style.transform = 'translateY(' + dy + 'px)';
          moving.push(tr);
        }
      });
      if (moving.length) {
        void els.scoreBody.offsetHeight;
        requestAnimationFrame(() => {
          moving.forEach((tr) => {
            tr.style.transition = 'transform .5s cubic-bezier(.22,1,.36,1)';
            tr.style.transform = '';
            setTimeout(() => { tr.style.transition = ''; }, 560);
          });
        });
      }
    }

    if (restore) {
      const tr = rows.get(restore.id);
      const btn = tr && tr.querySelector('[data-action="' + restore.action + '"]');
      if (btn) btn.focus({ preventScroll: true });
    }

    updateLeader(ranking, maxScore);
    const n = state.players.length;
    els.playerCount.textContent = n + (n === 1 ? ' participante' : ' participantes');
  }

  function updateLeader(ranking, maxScore) {
    const box = els.leader;
    let key;
    box.replaceChildren();

    if (!ranking.length) {
      key = 'none';
      box.textContent = 'Registra a los participantes para empezar.';
    } else if (maxScore <= 0) {
      key = 'zero';
      box.textContent = '¡Todos en 0! Suma +10 al primero que acierte.';
    } else {
      const leaders = ranking.filter((e) => e.rank === 1).map((e) => e.p.name);
      key = leaders.join('|') + '#' + maxScore;
      if (leaders.length === 1) {
        const s = document.createElement('strong');
        s.textContent = leaders[0];
        box.append('Va ganando: ', s, ' · ' + maxScore + ' pts');
      } else {
        const s = document.createElement('strong');
        s.textContent = leaders.join(', ');
        box.append('Empate arriba: ', s, ' · ' + maxScore + ' pts');
      }
    }

    if (key !== state.leaderKey) {
      state.leaderKey = key;
      box.classList.remove('flash');
      void box.offsetWidth;
      box.classList.add('flash');
    }
  }

  function addPlayer(rawName) {
    const name = rawName.replace(/\s+/g, ' ').trim();
    if (!name) { toast('Escribe un nombre primero', 'warn'); return false; }
    if (state.players.length >= MAX_PLAYERS) { toast('Ya hay ' + MAX_PLAYERS + ' participantes', 'warn'); return false; }
    const lower = name.toLocaleLowerCase('es');
    if (state.players.some((p) => p.name.toLocaleLowerCase('es') === lower)) {
      toast('Ya existe un participante con ese nombre', 'warn');
      return false;
    }
    state.players.push({ id: uid(), name: name.slice(0, 20), score: 0 });
    savePlayers();
    renderScoreboard();
    toast('¡' + name.slice(0, 20) + ' se unió al concurso!', 'ok');
    return true;
  }

  function changeScore(id, delta) {
    const p = state.players.find((x) => x.id === id);
    if (!p) return;
    const next = Math.max(0, p.score + delta);
    if (next === p.score) return;
    p.score = next;
    savePlayers();
    renderScoreboard({ popId: id, delta });
  }

  function removePlayer(id) {
    const p = state.players.find((x) => x.id === id);
    if (!p) return;
    if (!window.confirm('¿Eliminar a "' + p.name + '" del concurso?')) return;
    state.players = state.players.filter((x) => x.id !== id);
    savePlayers();
    renderScoreboard();
  }

  /* ---------------------------------------------------------
     Trivia: mazo sin repeticiones consecutivas
     --------------------------------------------------------- */
  function drawQuestion() {
    if (state.deck.length === 0) {
      if (state.cycles > 0) toast('¡Se acabaron las preguntas! Barajamos de nuevo', 'ok');
      state.cycles++;
      state.deck = shuffle(QUESTIONS.map((_, i) => i));
      const n = state.deck.length;
      if (n > 1 && state.lastIndex !== null && state.deck[n - 1] === state.lastIndex) {
        const j = Math.floor(Math.random() * (n - 1));
        [state.deck[n - 1], state.deck[j]] = [state.deck[j], state.deck[n - 1]];
      }
    }
    const idx = state.deck.pop();
    state.lastIndex = idx;
    return QUESTIONS[idx];
  }

  function showQuestion(q) {
    const options = shuffle([q.a, ...q.w]);
    state.current = { q, options, revealed: false };

    els.qEmpty.hidden = true;
    els.qContent.hidden = false;
    els.qCategory.textContent = q.cat;
    els.qText.textContent = q.q;
    els.qExplain.hidden = true;
    els.qExplain.replaceChildren();

    els.qOptions.replaceChildren();
    options.forEach((text, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'q-opt';
      b.dataset.index = String(i);
      b.style.setProperty('--i', String(i));
      const letter = document.createElement('span');
      letter.className = 'letter';
      letter.textContent = String.fromCharCode(65 + i);
      const label = document.createElement('span');
      label.textContent = text;
      b.append(letter, label);
      els.qOptions.append(b);
    });

    els.qContent.style.animation = 'none';
    void els.qContent.offsetWidth;
    els.qContent.style.animation = '';

    const asked = QUESTIONS.length - state.deck.length;
    els.qCounter.textContent = 'Pregunta ' + asked + ' de ' + QUESTIONS.length;
    els.revealBtn.disabled = false;
  }

  function throwQuestion() {
    if (state.throwing) return;
    state.throwing = true;
    soundFx.laser();
    els.throwBtn.disabled = true;
    els.revealBtn.disabled = true;
    els.qCard.classList.add('throwing');

    const q = drawQuestion();
    setTimeout(() => {
      els.qCard.classList.remove('throwing');
      showQuestion(q);
      state.throwing = false;
      els.throwBtn.disabled = false;
    }, REDUCED ? 60 : 650);
  }

  function revealAnswer(choice = null) {
    const cur = state.current;
    if (!cur || cur.revealed || state.throwing) return;
    cur.revealed = true;

    const correctIdx = cur.options.indexOf(cur.q.a);
    $$('.q-opt', els.qOptions).forEach((b, i) => {
      b.disabled = true;
      if (i === correctIdx) b.classList.add('correct');
      else if (i === choice) b.classList.add('wrong');
      else b.classList.add('dim');
    });

    const strong = document.createElement('strong');
    strong.textContent = 'Respuesta: ' + cur.q.a + '.';
    const info = document.createElement('span');
    info.textContent = ' ' + cur.q.e;
    els.qExplain.replaceChildren(strong, info);
    els.qExplain.hidden = false;
    els.revealBtn.disabled = true;

    if (choice !== null) {
      if (choice === correctIdx) {
        soundFx.success();
        toast('¡Correcto!', 'ok');
        const r = els.qCard.getBoundingClientRect();
        fx.burst(r.left + r.width / 2, r.top + r.height / 2, 30);
      } else {
        soundFx.error();
        toast('¡Casi! Mira la respuesta correcta', 'warn');
      }
    }
  }

  /* ---------------------------------------------------------
     Confeti
     --------------------------------------------------------- */
  const confetti = (() => {
    const canvas = $('#confetti');
    const ctx = canvas.getContext('2d');
    const COLORS = ['#00f0ff', '#ff2bd6', '#b6ff3b', '#ffd84a', '#7b5cff', '#ffffff', '#ff7a45'];
    const COUNT = REDUCED ? 80 : 260;
    let w = 0, h = 0, dpr = 1, raf = 0, running = false;
    let pieces = [];
    let lastT = 0, lastBurst = 0;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function reset(p, mode) {
      const sf = clamp(h / 900, 0.6, 1.4);
      p.color = pick(COLORS);
      p.size = rand(6, 12);
      p.shape = Math.random() < 0.65 ? 0 : 1;
      p.rot = rand(0, Math.PI * 2);
      p.vr = rand(-0.2, 0.2);
      p.wobble = rand(0, Math.PI * 2);
      p.wobbleSpeed = rand(0.05, 0.15);
      if (mode === 'burst') {
        const left = Math.random() < 0.5;
        p.x = left ? w * 0.04 : w * 0.96;
        p.y = h + 10;
        p.vx = (left ? 1 : -1) * rand(2, 11) * sf;
        p.vy = -rand(14, 27) * sf;
      } else {
        p.x = rand(0, w);
        p.y = -rand(10, 60);
        p.vx = rand(-1, 1);
        p.vy = rand(1.5, 3.5);
      }
      return p;
    }

    function loop(t) {
      if (!running) return;
      raf = requestAnimationFrame(loop);
      const f = clamp((t - (lastT || t)) / 16.67, 0.2, 3);
      lastT = t;

      if (t - lastBurst > 2200) {
        lastBurst = t;
        for (let i = 0; i < 70; i++) reset(pieces[Math.floor(Math.random() * pieces.length)], 'burst');
      }

      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < pieces.length; i++) {
        const p = pieces[i];
        p.vy += 0.25 * f;
        p.vx *= Math.pow(0.992, f);
        if (p.vy > 5) p.vy -= (p.vy - 5) * 0.1 * f;
        p.wobble += p.wobbleSpeed * f;
        p.x += (p.vx + Math.sin(p.wobble) * 1.1) * f;
        p.y += p.vy * f;
        p.rot += p.vr * f;

        if (p.y > h + 30 || p.x < -60 || p.x > w + 60) reset(p, 'rain');

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.shape === 0) {
          ctx.scale(1, Math.abs(Math.cos(p.wobble)) * 0.8 + 0.2);
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 3, 0, 6.2832);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    function start() {
      stop();
      resize();
      pieces = Array.from({ length: COUNT }, () => reset({}, 'burst'));
      pieces.forEach((p, i) => { if (i % 3 === 0) { reset(p, 'rain'); p.y = rand(-h, 0); } });
      running = true;
      lastT = 0;
      lastBurst = performance.now();
      raf = requestAnimationFrame(loop);
    }

    function stop() {
      running = false;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      ctx.clearRect(0, 0, w || canvas.width, h || canvas.height);
    }

    window.addEventListener('resize', () => { if (running) resize(); });

    return { start, stop };
  })();

  /* ---------------------------------------------------------
     Fin del concurso y ganador
     --------------------------------------------------------- */
  function finishContest() {
    if (!state.players.length) {
      toast('Primero registra participantes', 'warn');
      return;
    }
    const max = Math.max(...state.players.map((p) => p.score));
    if (max <= 0) {
      toast('Nadie tiene puntos todavía. ¡Suma +10 al primero que acierte!', 'warn');
      return;
    }
    const ranking = computeRanking();
    const winners = state.players.filter((p) => p.score === max);
    soundFx.powerUp();
    openWinner(winners, max, ranking);
  }

  function openWinner(winners, max, ranking) {
    clearTimeout(state.closeTimer);

    els.winnerTitle.textContent = winners.length > 1 ? '¡EMPATE DE CAMPEONES!' : '¡CAMPEÓN!';
    els.winnerNames.replaceChildren();
    winners.forEach((p) => {
      const s = document.createElement('span');
      s.textContent = p.name;
      els.winnerNames.append(s);
    });
    els.winnerScore.textContent = max + ' puntos';

    els.podium.replaceChildren();
    ranking
      .filter((e) => e.p.score > 0 && e.rank <= 3)
      .forEach((e, i) => {
        const li = document.createElement('li');
        li.style.setProperty('--i', String(i));
        const m = document.createElement('span');
        m.textContent = String(e.rank);
        const n = document.createElement('span');
        n.className = 'p-name';
        n.textContent = e.p.name;
        const pt = document.createElement('span');
        pt.className = 'p-pts';
        pt.textContent = e.p.score + ' pts';
        li.append(m, n, pt);
        els.podium.append(li);
      });

    state.lastFocus = document.activeElement;
    els.winner.hidden = false;
    els.winner.scrollTop = 0;
    document.body.classList.add('no-scroll');
    void els.winner.offsetWidth;
    els.winner.classList.add('show');
    confetti.start();
    els.keepPlayingBtn.focus({ preventScroll: true });
  }

  function closeWinner() {
    if (els.winner.hidden) return;
    els.winner.classList.remove('show');
    confetti.stop();
    document.body.classList.remove('no-scroll');
    clearTimeout(state.closeTimer);
    state.closeTimer = setTimeout(() => { els.winner.hidden = true; }, 450);
    if (state.lastFocus && typeof state.lastFocus.focus === 'function') {
      state.lastFocus.focus({ preventScroll: true });
    }
  }

  function newContest() {
    state.players.forEach((p) => { p.score = 0; });
    savePlayers();
    state.deck = [];
    state.cycles = 0;
    state.leaderKey = null;
    renderScoreboard();
    closeWinner();
    toast('¡Nuevo concurso listo! Todos en 0', 'ok');
  }

  /* ---------------------------------------------------------
     Eventos y Sonidos en Interacciones
     --------------------------------------------------------- */
  function updateMuteButtons(isMuted) {
    [els.introMuteBtn, els.appMuteBtn].forEach((btn) => {
      if (!btn) return;
      if (isMuted) {
        btn.textContent = '🔇';
        btn.classList.add('is-muted');
        btn.setAttribute('aria-label', 'Sonido desactivado');
        btn.title = 'Sonido desactivado';
      } else {
        btn.textContent = '🔊';
        btn.classList.remove('is-muted');
        btn.setAttribute('aria-label', 'Sonido activado');
        btn.title = 'Sonido activado';
      }
    });
  }

  function handleMuteToggle() {
    const muted = soundFx.toggleMute();
    updateMuteButtons(muted);
    if (!muted) soundFx.click();
  }

  function bindEvents() {
    els.startBtn.addEventListener('click', startApp);

    if (els.introMuteBtn) els.introMuteBtn.addEventListener('click', handleMuteToggle);
    if (els.appMuteBtn) els.appMuteBtn.addEventListener('click', handleMuteToggle);

    els.form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (addPlayer(els.nameInput.value)) {
        els.nameInput.value = '';
        soundFx.click();
      }
      els.nameInput.focus({ preventScroll: true });
    });

    els.scoreBody.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const tr = btn.closest('tr');
      const id = tr && tr.dataset.id;
      if (!id) return;
      switch (btn.dataset.action) {
        case 'plus':
          soundFx.click();
          changeScore(id, 10);
          break;
        case 'minus':
          soundFx.click();
          changeScore(id, -10);
          break;
        case 'remove':
          soundFx.click();
          removePlayer(id);
          break;
      }
    });

    els.throwBtn.addEventListener('click', throwQuestion);
    els.revealBtn.addEventListener('click', () => {
      soundFx.click();
      revealAnswer(null);
    });
    els.qOptions.addEventListener('click', (e) => {
      const opt = e.target.closest('.q-opt');
      if (!opt || opt.disabled) return;
      revealAnswer(Number(opt.dataset.index));
    });

    els.finishBtn.addEventListener('click', finishContest);
    els.keepPlayingBtn.addEventListener('click', () => {
      soundFx.click();
      closeWinner();
    });
    els.newContestBtn.addEventListener('click', () => {
      soundFx.click();
      newContest();
    });

    // Sonido en clics generales de botones
    document.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (b && b !== els.startBtn && !b.dataset.action && b.id !== 'introMuteBtn' && b.id !== 'appMuteBtn') {
        soundFx.click();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (els.winner.hidden) return;
      if (e.key === 'Escape') {
        closeWinner();
      } else if (e.key === 'Tab') {
        const first = els.keepPlayingBtn;
        const last = els.newContestBtn;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (!els.winner.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  /* ---------------------------------------------------------
     Inicio
     --------------------------------------------------------- */
  function init() {
    fx.init();
    initPanelGlow();
    bindEvents();
    renderScoreboard();
    runBoot();
    els.startBtn.focus({ preventScroll: true });
  }

  init();
})();
