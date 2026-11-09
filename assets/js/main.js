/* ==========================================================================
   Joel Caranqui — Portafolio · interacciones
   Sin dependencias. Un único bucle requestAnimationFrame para todo lo que
   depende del scroll o del ratón.
   ========================================================================== */
(() => {
  'use strict';
  window.__jcReady = true;

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ } },
  };

  /* ---------- Ratón ---------- */
  const mouse = { x: innerWidth / 2, y: innerHeight / 2, active: false };
  addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true;
  }, { passive: true });
  root.addEventListener('mouseleave', () => { mouse.active = false; });
  addEventListener('blur', () => { mouse.active = false; });

  /* ---------- Email protegido ----------
     El email no aparece escrito en el HTML para que los bots que recogen
     direcciones no lo encuentren. Se monta aquí al cargar la página. */
  const EMAIL = ['moc.liamnotorp', 'iuqnarac.leoj']
    .map((s) => s.split('').reverse().join(''))
    .reverse()
    .join(String.fromCharCode(64));
  $$('[data-email]').forEach((el) => {
    el.href = `mailto:${EMAIL}`;
    if (!el.hasAttribute('data-email-text')) return;
    if (el.dataset.emailText === 'wbr') {
      const [user, domain] = EMAIL.split(String.fromCharCode(64));
      el.textContent = user;
      el.append(document.createElement('wbr'), `${String.fromCharCode(64)}${domain}`);
    } else {
      el.textContent = EMAIL;
    }
  });

  /* ---------- Utilidades de texto ---------- */
  // Divide el texto de un elemento en palabras o letras sin perder las etiquetas internas (em, sup…)
  function splitText(el, mode) {
    const out = [];
    const walk = (node) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.className = 'word';
            if (mode === 'chars') {
              Array.from(part).forEach((ch) => {
                const c = document.createElement('span');
                c.className = 'char'; c.textContent = ch;
                w.append(c); out.push(c);
              });
            } else if (mode === 'hl') {
              w.className = 'hl'; w.textContent = part; out.push(w);
            } else {
              const i = document.createElement('span');
              i.className = 'word__i'; i.textContent = part;
              w.append(i); out.push(i);
            }
            frag.append(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'svg') {
          walk(n);
        }
      });
    };
    walk(el);
    return out;
  }

  // Texto que "rueda" en enlaces y botones
  $$('[data-roll]').forEach((el) => {
    const text = el.textContent.trim();
    el.textContent = '';
    const wrap = document.createElement('span');
    wrap.className = 'roll'; wrap.setAttribute('aria-hidden', 'true');
    Array.from(text).forEach((ch, i) => {
      const c = document.createElement('span');
      c.className = 'roll__c'; c.style.setProperty('--i', i);
      c.textContent = ch === ' ' ? ' ' : ch;
      wrap.append(c);
    });
    const sr = document.createElement('span');
    sr.className = 'sr-only'; sr.textContent = text;
    el.append(wrap, sr);
  });

  // Títulos con entrada palabra a palabra
  $$('[data-split]').forEach((el) => {
    splitText(el, 'words').forEach((w, i) => w.style.setProperty('--d', `${i * 0.07}s`));
  });

  // Letras del hero
  const heroChars = [];
  $$('.hero__line .split').forEach((el) => heroChars.push(...splitText(el, 'chars')));
  heroChars.forEach((c, i) => { c.style.setProperty('--d', `${i * 0.045}s`); c._w = 760; });

  // Marca del footer
  $$('.footer__mark .split').forEach((el) => splitText(el, 'chars'));

  // Año actual
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------- Pantalla de carga + entrada ---------- */
  function runLoader() {
    return new Promise((resolve) => {
      const loader = $('.loader');
      if (!loader || reduce || root.classList.contains('seen')) { loader && loader.remove(); resolve(); return; }
      store.set('jc-seen', '1');
      const num = $('[data-count]', loader);
      const bar = $('.loader__bar span', loader);
      const dur = 1500;
      const t0 = performance.now();
      const tick = (now) => {
        const p = clamp((now - t0) / dur, 0, 1);
        const e = 1 - Math.pow(1 - p, 3);
        num.textContent = String(Math.round(e * 100)).padStart(3, '0');
        bar.style.transform = `scaleX(${e})`;
        if (p < 1) { requestAnimationFrame(tick); return; }
        setTimeout(() => {
          loader.classList.add('is-done');
          setTimeout(resolve, 380);
          setTimeout(() => loader.remove(), 1100);
        }, 150);
      };
      requestAnimationFrame(tick);
    });
  }

  const fontsReady = Promise.race([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise((r) => setTimeout(r, 1500)),
  ]);

  let introDone = false;
  Promise.all([runLoader(), fontsReady]).then(() => {
    root.classList.add('is-loaded');
    setTimeout(() => { introDone = true; }, 1800);
    setTimeout(bootTerminal, reduce ? 0 : 1500);
  });

  /* ---------- Roles que se escriben solos ---------- */
  (function roles() {
    const el = $('.roles__text');
    if (!el) return;
    const words = ['Desarrollador Web', 'Técnico en Sistemas', 'Estudiante de ASIR', 'Siempre aprendiendo'];
    if (reduce) return;
    let w = 0, c = words[0].length, del = true;
    const step = () => {
      const word = words[w];
      c += del ? -1 : 1;
      el.textContent = word.slice(0, c);
      let wait = del ? 45 : 90;
      if (!del && c === word.length) { wait = 2200; del = true; }
      else if (del && c === 0) { del = false; w = (w + 1) % words.length; wait = 350; }
      setTimeout(step, wait);
    };
    setTimeout(step, 3500);
  })();

  /* ---------- Campo de cruces interactivo del hero ---------- */
  const field = (() => {
    const cv = $('.hero__field');
    if (!cv) return null;
    const ctx = cv.getContext('2d');
    const gap = 34;
    let w = 0, h = 0, pts = [], t = 0;

    function resize() {
      const r = cv.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pts = [];
      const cols = Math.ceil(w / gap) + 1, rows = Math.ceil(h / gap) + 1;
      const ox = (w - (cols - 1) * gap) / 2, oy = (h - (rows - 1) * gap) / 2;
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) pts.push({ x: ox + x * gap, y: oy + y * gap, dx: 0, dy: 0 });
      draw();
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      const r = cv.getBoundingClientRect();
      const mx = mouse.x - r.left, my = mouse.y - r.top;
      const R = 190;
      const hot = [];
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(18,17,16,.17)';
      ctx.beginPath();
      for (const p of pts) {
        let tx = 0, ty = 0, k = 0;
        if (mouse.active && fine) {
          const ddx = p.x - mx, ddy = p.y - my;
          const d = Math.hypot(ddx, ddy);
          if (d < R) {
            k = 1 - d / R;
            const f = k * k * 30;
            tx = (ddx / (d || 1)) * f; ty = (ddy / (d || 1)) * f;
          }
        }
        if (!reduce) ty += Math.sin(p.x * 0.011 + t * 1.3) * Math.cos(p.y * 0.013 - t * 0.9) * 2.4;
        p.dx = lerp(p.dx, tx, 0.14); p.dy = lerp(p.dy, ty, 0.14);
        const x = p.x + p.dx, y = p.y + p.dy;
        if (k > 0.04) { hot.push(x, y, k); continue; }
        ctx.moveTo(x - 3, y); ctx.lineTo(x + 3, y);
        ctx.moveTo(x, y - 3); ctx.lineTo(x, y + 3);
      }
      ctx.stroke();
      ctx.strokeStyle = '#ff4b1f';
      ctx.lineWidth = 1.6;
      for (let i = 0; i < hot.length; i += 3) {
        const x = hot[i], y = hot[i + 1], k = hot[i + 2];
        const s = 3 + k * 5;
        ctx.globalAlpha = 0.3 + k * 0.7;
        ctx.beginPath();
        ctx.moveTo(x - s, y); ctx.lineTo(x + s, y);
        ctx.moveTo(x, y - s); ctx.lineTo(x, y + s);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    let visible = true;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(cv);
    resize();
    let rt;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
    return { frame() { if (!visible || reduce) return; t += 0.016; draw(); } };
  })();

  // Peso variable de las letras según la cercanía del cursor
  let heroVisible = true;
  const heroEl = $('.hero');
  if (heroEl) new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }).observe(heroEl);

  function heroWeights() {
    if (!fine || reduce || !introDone || !heroVisible) return;
    const rects = heroChars.map((c) => c.getBoundingClientRect());
    heroChars.forEach((c, i) => {
      const r = rects[i];
      const d = Math.hypot(mouse.x - (r.left + r.width / 2), mouse.y - (r.top + r.height / 2));
      let k = mouse.active ? clamp(1 - d / 340, 0, 1) : 0;
      k = k * k * (3 - 2 * k);
      const target = 760 - 560 * k;
      const next = lerp(c._w, target, 0.14);
      if (Math.abs(next - c._w) > 0.5) { c._w = next; c.style.fontWeight = Math.round(next); }
    });
  }

  /* ---------- Terminal interactiva ---------- */
  const term = $('.term');
  let bootTerminal = () => {};
  if (term) {
    const out = $('.term__out', term);
    const body = $('.term__body', term);
    const form = $('.term__line', term);
    const input = $('#term-input');
    const history = [];
    let hIndex = 0;
    let busy = false;

    const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const print = (html, cls = '') => {
      const row = document.createElement('div');
      row.className = `term__row ${cls}`;
      row.innerHTML = html;
      out.append(row);
      body.scrollTop = body.scrollHeight;
    };
    const go = (id) => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    };
    const sections = ['inicio', 'sobre-mi', 'stack', 'experiencia', 'contacto'];
    const grid = (rows) => `<div class="t-grid">${rows.map(([a, b]) => `<span class="t-cmd">${a}</span><span class="t-dim">${b}</span>`).join('')}</div>`;

    const cmds = {
      help: () => print(`Comandos disponibles:${grid([
        ['whoami', 'quién soy'],
        ['stack', 'tecnologías que uso'],
        ['exp', 'experiencia y formación'],
        ['contacto', 'cómo hablar conmigo'],
        ['neofetch', 'info del sistema (yo)'],
        ['ls', 'listar secciones'],
        ['cd &lt;sección&gt;', 'ir a una sección'],
        ['date', 'fecha y hora'],
        ['clear', 'limpiar la terminal'],
      ])}`),
      whoami: () => print('<span class="t-hi">Joel Caranqui</span><br>Técnico en Desarrollo Web (DAW) · cursando ASIR.<br><span class="t-dim">Curioso, constante y siempre aprendiendo.</span>'),
      stack: () => print(grid([
        ['frontend', 'HTML5 · CSS3 · JavaScript · Bootstrap · Tailwind'],
        ['backend', 'PHP · Laravel · Java · MySQL · WordPress'],
        ['sistemas', 'Linux · redes · seguridad'],
        ['tools', 'Git · GitHub · VS Code · Photoshop · Canva'],
      ])),
      exp: () => print(grid([
        ['ahora', 'ASIR — Ciclo formativo'],
        ['2025', 'Desarrollador Web — Dédalo Group (Italia)'],
        ['2023–25', 'DAW — Ciclo formativo'],
      ]) + '<span class="t-dim">→ escribe </span><span class="t-cmd">cd experiencia</span><span class="t-dim"> para ver más</span>'),
      contacto: () => print(`Email: <a class="t-link" href="mailto:${EMAIL}">${EMAIL}</a><br>LinkedIn: <a class="t-link" href="https://www.linkedin.com/in/joel-caranqui/" target="_blank" rel="noopener">/in/joel-caranqui</a>`),
      neofetch: () => print(`<div class="t-neo"><span class="t-ascii">  ___\n |_  |\n   | |\n/\\__/ /\n\\____/</span><div class="t-grid">${[
        ['usuario', 'joel@portfolio'],
        ['os', 'Humano v2026'],
        ['shell', 'curiosidad'],
        ['formación', 'DAW ✓ · ASIR …'],
        ['idiomas', 'español · inglés'],
        ['uptime', 'programando desde 2023'],
      ].map(([a, b]) => `<span class="t-hi">${a}</span><span>${b}</span>`).join('')}</div></div>`),
      ls: () => print(sections.slice(1).map((s) => `<span class="t-dir">${s}/</span>`).join('&nbsp;&nbsp;')),
      cd: (arg) => {
        const target = (arg || '').replace(/^[./~]+|\/$/g, '').toLowerCase();
        if (!target) { print('<span class="t-dim">~</span>'); go('inicio'); return; }
        const match = sections.find((s) => s === target || s.startsWith(target));
        if (!match) { print(`<span class="t-err">cd: no existe la sección:</span> ${esc(arg)}`); return; }
        print(`<span class="t-dim">→ navegando a</span> /${match}`);
        setTimeout(() => go(match), 250);
      },
      pwd: () => print('/home/joel/portfolio'),
      date: () => print(new Date().toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' })),
      echo: (arg) => print(esc(arg || '')),
      clear: () => { out.innerHTML = ''; },
      history: () => print(history.map((h, i) => `<span class="t-dim">${String(i + 1).padStart(3, ' ')}</span>  ${esc(h)}`).join('<br>') || '<span class="t-dim">(vacío)</span>'),
      sudo: (arg) => {
        if (/contrat|hire/i.test(arg || '')) {
          print('<span class="t-hi">[sudo]</span> contraseña para joel: ********<br>✔ Acceso concedido. Excelente decisión.<br><span class="t-dim">Abriendo contacto…</span>');
          setTimeout(() => go('contacto'), 900);
          return;
        }
        print('<span class="t-err">joel no está en el archivo sudoers.</span> Este incidente será reportado.<br><span class="t-dim">Prueba</span> <span class="t-cmd">sudo contratar</span>');
      },
      rm: () => print('<span class="t-err">Buen intento.</span> Aquí no se borra nada.'),
      exit: () => print('No puedes salir… bueno, sí: haz scroll ↓'),
      hola: () => print('¡Hola! 👋 Escribe <span class="t-cmd">help</span> para empezar.'),
    };
    cmds.contact = cmds.contacto;
    cmds.experiencia = cmds.exp;
    cmds.skills = cmds.stack;
    cmds.hello = cmds.hola;
    cmds.contratar = () => cmds.sudo('contratar');

    const run = (raw) => {
      const line = raw.trim();
      print(`<span class="t-prompt">~ $</span> ${esc(line)}`, 'is-cmd');
      if (!line) return;
      history.push(line); hIndex = history.length;
      const [name, ...rest] = line.split(/\s+/);
      const fn = cmds[name.toLowerCase()];
      if (fn) fn(rest.join(' '));
      else print(`<span class="t-err">comando no encontrado:</span> ${esc(name)} — prueba <span class="t-cmd">help</span>`);
    };

    // Escribe un comando letra a letra y lo ejecuta
    const typeAndRun = (cmd) => new Promise((resolve) => {
      if (busy) { resolve(); return; }
      busy = true;
      input.value = '';
      let i = 0;
      const speed = reduce ? 0 : 55;
      const step = () => {
        input.value = cmd.slice(0, ++i);
        if (i < cmd.length) { setTimeout(step, speed); return; }
        setTimeout(() => { input.value = ''; run(cmd); busy = false; resolve(); }, reduce ? 0 : 200);
      };
      step();
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (busy) return;
      run(input.value);
      input.value = '';
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp' && history.length) {
        e.preventDefault(); hIndex = Math.max(0, hIndex - 1); input.value = history[hIndex];
      } else if (e.key === 'ArrowDown' && history.length) {
        e.preventDefault(); hIndex = Math.min(history.length, hIndex + 1); input.value = history[hIndex] || '';
      } else if (e.key === 'Tab' && input.value.trim()) {
        const v = input.value.trim().toLowerCase();
        const hit = Object.keys(cmds).find((k) => k.startsWith(v));
        if (hit) { e.preventDefault(); input.value = hit + ' '; }
      } else if (e.key === 'l' && e.ctrlKey) {
        e.preventDefault(); cmds.clear();
      }
    });

    body.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      if (!getSelection().toString()) input.focus({ preventScroll: true });
    });

    $$('[data-cmd]', term).forEach((b) => b.addEventListener('click', () => typeAndRun(b.dataset.cmd)));

    let booted = false;
    bootTerminal = async () => {
      if (booted) return;
      booted = true;
      const now = new Date().toLocaleString('es-ES', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
      print(`<span class="t-dim">Último inicio de sesión: ${now}</span>`);
      await typeAndRun('whoami');
      print('<span class="t-dim">Escribe</span> <span class="t-cmd">help</span> <span class="t-dim">o pulsa un comando de abajo ↓</span>');
    };
  }

  /* ---------- Marquesina que reacciona al scroll ---------- */
  const rows = $$('.marquee__row').map((row) => {
    const track = $('.marquee__track', row);
    const unit = track.innerHTML;
    let copies = 1;
    while (track.scrollWidth < innerWidth * 2.4 && copies < 12) { track.insertAdjacentHTML('beforeend', unit); copies++; }
    track.insertAdjacentHTML('beforeend', track.innerHTML); // duplicado para el bucle infinito
    return { track, x: 0, dir: Number(row.dataset.dir) || 1, half: track.scrollWidth / 2 };
  });
  addEventListener('resize', () => rows.forEach((r) => { r.half = r.track.scrollWidth / 2; }));
  let marqueeVisible = true;
  const marqueeEl = $('.marquee');
  if (marqueeEl) new IntersectionObserver(([e]) => { marqueeVisible = e.isIntersecting; }).observe(marqueeEl);

  let scrollDir = 1;
  function marqueeFrame(vel) {
    if (reduce || !marqueeVisible) return;
    if (Math.abs(vel) > 0.6) scrollDir = vel > 0 ? 1 : -1;
    const speed = 0.8 + Math.min(Math.abs(vel) * 0.35, 14);
    const skew = clamp(vel * -0.25, -7, 7);
    rows.forEach((r) => {
      r.x -= speed * r.dir * scrollDir;
      if (r.x <= -r.half) r.x += r.half;
      if (r.x > 0) r.x -= r.half;
      r.track.style.transform = `translate3d(${r.x}px,0,0) skewX(${skew}deg)`;
    });
  }

  /* ---------- Entradas al hacer scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  $$('[data-reveal], [data-split]').forEach((el) => io.observe(el));

  // Contadores
  const counterIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      counterIO.unobserve(e.target);
      const el = e.target;
      const end = Number(el.dataset.counter);
      const pad = Number(el.dataset.pad) || 0;
      if (reduce) return;
      const t0 = performance.now();
      const dur = 1600;
      const tick = (now) => {
        const p = clamp((now - t0) / dur, 0, 1);
        const v = Math.round(end * (1 - Math.pow(1 - p, 4)));
        el.textContent = String(v).padStart(pad, '0');
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  $$('[data-counter]').forEach((el) => counterIO.observe(el));

  // Frase que se ilumina palabra a palabra
  const hlEl = $('[data-highlight]');
  const hlWords = hlEl && !reduce ? splitText(hlEl, 'hl') : [];
  function highlightFrame() {
    if (!hlWords.length) return;
    const r = hlEl.getBoundingClientRect();
    const vh = innerHeight;
    if (r.bottom < 0 || r.top > vh) return;
    const p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.3), 0, 1);
    const n = hlWords.length;
    hlWords.forEach((w, i) => {
      const o = 0.14 + 0.86 * clamp(p * n * 1.15 - i, 0, 1);
      w.style.opacity = o.toFixed(3);
    });
  }

  /* ---------- Habilidades: filtros y burbuja ---------- */
  const skills = $$('.skill');
  const filters = $$('.filter');
  filters.forEach((b) => {
    const cat = b.dataset.filter;
    const n = cat === 'all' ? skills.length : skills.filter((s) => s.dataset.cat === cat).length;
    $('sup', b).textContent = String(n).padStart(2, '0');
    b.addEventListener('click', () => {
      if (b.getAttribute('aria-pressed') === 'true') return;
      filters.forEach((f) => f.setAttribute('aria-pressed', String(f === b)));
      skills.forEach((s) => s.classList.add('is-out'));
      setTimeout(() => {
        let idx = 0;
        skills.forEach((s) => {
          const show = cat === 'all' || s.dataset.cat === cat;
          s.hidden = !show;
          if (!show) return;
          $('.skill__idx', s).textContent = String(++idx).padStart(2, '0');
          setTimeout(() => s.classList.remove('is-out'), reduce ? 0 : idx * 55);
        });
      }, reduce ? 0 : 280);
    });
  });

  const preview = $('.preview');
  const previewIcon = preview && $('i', preview);
  const pv = { x: innerWidth / 2, y: innerHeight / 2, on: false };
  if (preview && fine) {
    const list = $('.skills');
    list.addEventListener('pointerenter', () => { pv.on = true; preview.classList.add('is-on'); });
    list.addEventListener('pointerleave', () => { pv.on = false; preview.classList.remove('is-on'); });
    skills.forEach((s) => s.addEventListener('pointerenter', () => {
      if (previewIcon.className === s.dataset.icon) return;
      previewIcon.className = s.dataset.icon;
      if (!reduce && previewIcon.animate) {
        previewIcon.animate([{ transform: 'scale(.3) rotate(-40deg)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 450, easing: 'cubic-bezier(.34,1.56,.64,1)' });
      }
    }));
  }
  function previewFrame() {
    if (!preview || !fine) return;
    const px = pv.x;
    pv.x = lerp(pv.x, mouse.x, 0.16);
    pv.y = lerp(pv.y, mouse.y, 0.16);
    preview.style.transform = `translate3d(${pv.x}px, ${pv.y}px, 0)`;
    preview.style.setProperty('--rot', `${clamp((pv.x - px) * 0.6, -25, 25)}deg`);
  }

  /* ---------- Tarjetas apiladas de trayectoria ---------- */
  const cards = $$('.xp');
  const expCards = $('.exp__cards');
  const expBar = $('.exp__progress');
  function stackFrame() {
    if (!cards.length) return;
    const vh = innerHeight;
    const wrapRect = expCards.getBoundingClientRect();
    if (wrapRect.bottom < 0 || wrapRect.top > vh) return;
    cards.forEach((card, i) => {
      const next = cards[i + 1];
      if (!next || reduce) { card.style.setProperty('--p', 0); return; }
      const a = card.getBoundingClientRect();
      const b = next.getBoundingClientRect();
      const p = clamp(1 - (b.top - a.top) / a.height, 0, 1);
      card.style.setProperty('--p', p.toFixed(3));
    });
    if (expBar) {
      const p = clamp((vh * 0.5 - wrapRect.top) / wrapRect.height, 0, 1);
      expBar.style.setProperty('--p', p.toFixed(3));
    }
  }

  /* ---------- Botones magnéticos ---------- */
  if (fine && !reduce) {
    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        el.style.transition = 'transform .25s cubic-bezier(.16,1,.3,1), color .45s, background-color .4s';
        el.style.transform = `translate(${x * 0.28}px, ${y * 0.38}px)`;
      });
      el.addEventListener('pointerleave', () => {
        el.style.transition = 'transform .8s cubic-bezier(.34,1.56,.64,1), color .45s, background-color .4s';
        el.style.transform = '';
      });
    });

    // Inclinación 3D de la tarjeta de código
    $$('[data-tilt]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--ry', `${x * 10}deg`);
        el.style.setProperty('--rx', `${y * -10}deg`);
      });
      el.addEventListener('pointerleave', () => {
        el.style.setProperty('--ry', '0deg');
        el.style.setProperty('--rx', '0deg');
      });
    });
  }

  /* ---------- Cursor ---------- */
  const cursor = $('.cursor');
  const cursorLabel = cursor && $('.cursor__label', cursor);
  const cur = { x: mouse.x, y: mouse.y };
  if (cursor && fine && !reduce) {
    document.addEventListener('pointerover', (e) => {
      const labelled = e.target.closest('[data-cursor]');
      const link = e.target.closest('a, button, input, [role="button"]');
      if (labelled && !e.target.closest('input, .term__chips, .term a')) {
        cursorLabel.textContent = labelled.dataset.cursor;
        cursor.classList.add('has-label'); cursor.classList.remove('is-link');
      } else if (link) {
        cursor.classList.add('is-link'); cursor.classList.remove('has-label');
      } else {
        cursor.classList.remove('is-link', 'has-label');
      }
    });
  }
  function cursorFrame() {
    if (!cursor || !fine || reduce) return;
    cursor.classList.toggle('is-on', mouse.active);
    cur.x = lerp(cur.x, mouse.x, 0.22);
    cur.y = lerp(cur.y, mouse.y, 0.22);
    cursor.style.transform = `translate3d(${cur.x}px, ${cur.y}px, 0)`;
  }

  /* ---------- Navegación ---------- */
  const nav = $('.nav');
  const burger = $('.nav__burger');
  const menu = $('#menu');
  const progress = $('.progress');
  const themed = $$('[data-theme]');
  const navLinks = $$('.nav__links a');
  const spySections = navLinks.map((a) => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
  let menuOpen = false;

  function setMenu(open) {
    menuOpen = open;
    root.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    menu.setAttribute('aria-hidden', String(!open));
    menu.inert = !open;
  }
  burger.addEventListener('click', () => setMenu(!menuOpen));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) { setMenu(false); burger.focus(); } });
  matchMedia('(min-width: 901px)').addEventListener('change', (e) => { if (e.matches && menuOpen) setMenu(false); });

  let lastY = scrollY;
  function navFrame(y) {
    nav.classList.toggle('is-scrolled', y > 20);
    if (!menuOpen) {
      if (y > lastY + 6 && y > innerHeight * 0.5) nav.classList.add('is-hidden');
      else if (y < lastY - 6 || y < 80) nav.classList.remove('is-hidden');
    }
    lastY = y;

    // Color de la barra según la sección que tiene debajo
    const probe = nav.offsetHeight / 2;
    let theme = 'light';
    for (const s of themed) {
      const r = s.getBoundingClientRect();
      if (r.top <= probe && r.bottom > probe) { theme = s.dataset.theme; break; }
    }
    nav.classList.toggle('is-dark', theme === 'dark');
    nav.classList.toggle('is-signal', theme === 'signal');

    // Enlace activo
    let active = null;
    spySections.forEach((s) => { if (s.getBoundingClientRect().top <= innerHeight * 0.4) active = s; });
    navLinks.forEach((a) => {
      const on = String(!!active && a.getAttribute('href') === `#${active.id}`);
      if (a.getAttribute('aria-current') !== on) a.setAttribute('aria-current', on);
    });

    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  }

  /* ---------- Copiar email ---------- */
  const toast = $('.toast');
  let toastT;
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(() => toast.classList.remove('is-on'), 2200);
  };
  $$('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    const text = b.dataset.copy === 'email' ? EMAIL : b.dataset.copy;
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.append(ta); ta.select();
      try { document.execCommand('copy'); } catch (err) { /* nada */ }
      ta.remove();
    }
    showToast('✓ Email copiado al portapapeles');
    b.textContent = '¡Copiado!';
    setTimeout(() => { b.textContent = 'Copiar'; }, 2000);
  }));

  /* ---------- Bucle principal ---------- */
  let prevY = scrollY;
  let vel = 0;
  let dirty = true;
  addEventListener('resize', () => { dirty = true; });
  function frame() {
    const y = scrollY;
    vel = lerp(vel, y - prevY, 0.2);
    if (y !== prevY) dirty = true;
    prevY = y;

    if (dirty) {
      dirty = false;
      navFrame(y);
      highlightFrame();
      stackFrame();
    }
    marqueeFrame(vel);
    if (field) field.frame();
    heroWeights();
    previewFrame();
    cursorFrame();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
