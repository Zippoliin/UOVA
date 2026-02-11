// ====== Tiny tracker (no dependencies) ======
function track(eventName, payload = {}) {
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, ...payload });
  } catch (_) {}
  console.log('[track]', eventName, payload);
}

// ====== Helpers ======
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

// ====== Audio (no external files) ======
// Note: browsers require a user gesture to start audio. We provide a toggle.
let audioCtx = null;
let audioEnabled = false;

function ensureAudio() {
  if (audioCtx) return audioCtx;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  audioCtx = new Ctx();
  return audioCtx;
}

function setAudio(on) {
  const ctx = ensureAudio();
  audioEnabled = !!on && !!ctx;
  const btn = document.getElementById('soundToggle');
  if (btn) btn.setAttribute('aria-pressed', audioEnabled ? 'true' : 'false');
  if (audioEnabled && ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  track('audio_toggle', { on: audioEnabled });
}

function playCrack() {
  if (!audioEnabled) return;
  const ctx = ensureAudio(); if (!ctx) return;
  const t0 = ctx.currentTime;

  // noise burst
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.25, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 1.8);

  const src = ctx.createBufferSource(); src.buffer = buffer;

  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2200; bp.Q.value = 1.2;
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 700;

  const gain = ctx.createGain(); gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(0.38, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);

  // subtle low thump
  const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.setValueAtTime(110, t0);
  const g2 = ctx.createGain(); g2.gain.setValueAtTime(0.0001, t0);
  g2.gain.exponentialRampToValueAtTime(0.20, t0 + 0.008);
  g2.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);

  src.connect(bp); bp.connect(hp); hp.connect(gain); gain.connect(ctx.destination);
  osc.connect(g2); g2.connect(ctx.destination);

  src.start(t0); osc.start(t0);
  src.stop(t0 + 0.22); osc.stop(t0 + 0.14);
}

function playDrop() {
  if (!audioEnabled) return;
  const ctx = ensureAudio(); if (!ctx) return;
  const t0 = ctx.currentTime;

  // quick "plop": sine sweep + soft noise
  const osc = ctx.createOscillator(); osc.type = 'sine';
  osc.frequency.setValueAtTime(220, t0);
  osc.frequency.exponentialRampToValueAtTime(90, t0 + 0.12);

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.35, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.20);

  const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.18, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2.2);
  const src = ctx.createBufferSource(); src.buffer = buffer;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;

  src.connect(lp); lp.connect(g);
  osc.connect(g);
  g.connect(ctx.destination);

  osc.start(t0); src.start(t0);
  osc.stop(t0 + 0.22); src.stop(t0 + 0.20);
}

// Toggle button
const soundBtn = document.getElementById('soundToggle');
if (soundBtn) {
  soundBtn.addEventListener('click', () => setAudio(!audioEnabled));
}

// ====== Elements ======
const hero = document.querySelector('.hero');

const eggWhole = document.getElementById('eggWhole');
const crackSvg = document.getElementById('crackSvg');
const crackPaths = crackSvg.querySelectorAll('.crack-path');
const fragments = document.getElementById('fragments');

const shellTop = document.getElementById('shellTop');
const shellBottom = document.getElementById('shellBottom');
const inside = document.getElementById('inside');

const pan = document.getElementById('pan');
const panEgg = document.getElementById('panEgg');

const map = document.getElementById('map');
const stickyCta = document.getElementById('stickyCta');
const orderSection = document.getElementById('ordina');

// ====== Navigation via arrow labels ======
function goToTarget(sel) {
  const el = document.querySelector(sel);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
document.querySelectorAll('.arrow-link').forEach((t) => {
  const target = t.getAttribute('data-target');
  t.addEventListener('click', () => { track('nav_click', { source: 'arrows', target }); goToTarget(target); });
  t.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      track('nav_click', { source: 'arrows', target });
      goToTarget(target);
    }
  });
});

// Track all simple links with data-track
document.querySelectorAll('[data-track]').forEach((el) => {
  el.addEventListener('click', () => track('click', { name: el.getAttribute('data-track') }));
});

// ====== Scroll: 3 steps ======
let lastStickyState = false;
let crackPlayed = false;
let dropPlayed = false;

function update() {
  const rect = hero.getBoundingClientRect();
  const vh = window.innerHeight;

  // progress 0..1 over first ~110vh inside hero
  const end = vh * 1.10;
  const t = clamp((0 - rect.top) / end, 0, 1);

  // 3 steps
  const p1 = clamp(t / 0.33, 0, 1);          // crack
  const p2 = clamp((t - 0.33) / 0.33, 0, 1); // open a little
  const p3 = clamp((t - 0.66) / 0.34, 0, 1); // open wide + pan + drop

  // ----- STEP 1: crack draws L->R (dash) + fade in -----
  const crackOn = smoothstep(0.10, 0.95, p1);
  crackSvg.style.opacity = String(clamp(crackOn * 1.05, 0, 1));

  const dash = 1000;
  const dashOffset = (1 - crackOn) * dash;
  crackPaths.forEach((p) => (p.style.strokeDashoffset = String(dashOffset)));

  // Crack sound once, around mid of step 1
  if (!crackPlayed && crackOn > 0.55) {
    crackPlayed = true;
    playCrack();
  }
  if (t < 0.05) crackPlayed = false; // reset if user goes back up

  // Chips + shake
  const chipOn = smoothstep(0.25, 0.95, p1);
  fragments.style.opacity = String(clamp(chipOn * 1.05, 0, 1));
  fragments.querySelectorAll('.frag').forEach((frag) => {
    const fx = parseFloat(frag.style.getPropertyValue('--fx') || '0');
    const fy = parseFloat(frag.style.getPropertyValue('--fy') || '0');
    const fr = parseFloat(frag.style.getPropertyValue('--fr') || '0');
    const fs = parseFloat(frag.style.getPropertyValue('--fs') || '1');
    const k = chipOn;
    frag.style.transform =
      `translate(calc(-50% + ${fx * k}px), calc(-50% + ${fy * k}px)) rotate(${fr * k}deg) scale(${lerp(0.7, fs, k)})`;
  });

  const shakeAmp = (1 - p1) * 1.6;
  const shakeX = Math.sin(p1 * 18) * shakeAmp;
  const shakeY = Math.cos(p1 * 14) * shakeAmp;
  const shakeR = Math.sin(p1 * 20) * shakeAmp * 0.85;
  eggWhole.style.setProperty('--shakeX', shakeX.toFixed(2));
  eggWhole.style.setProperty('--shakeY', shakeY.toFixed(2));
  eggWhole.style.setProperty('--shakeR', shakeR.toFixed(2));

  // Whole egg fades out towards end of step 1
  const wholeOpacity = 1 - smoothstep(0.72, 1.00, p1);
  eggWhole.style.opacity = String(clamp(wholeOpacity, 0, 1));

  // ----- Shells appear as whole fades -----
  const shellsOpacity = smoothstep(0.55, 0.95, p1);
  shellTop.style.opacity = String(shellsOpacity);
  shellBottom.style.opacity = String(shellsOpacity);

  // ----- STEP 2: open a little (top up, bottom down) -----
  const openSmall = p2;
  const y2 = lerp(0, -14, openSmall);
  const r2 = lerp(0, 7, openSmall);

  // ----- STEP 3: open wide -----
  const sep = p3;
  const y3 = lerp(0, -70, sep);
  const r3 = lerp(0, 14, sep);

  const topY = y2 + y3;
  const botY = -(y2 + y3) * 0.62; // bottom doesn't go as far
  shellTop.style.transform = `translateY(${topY}px) rotate(${-r2 - r3}deg)`;
  shellBottom.style.transform = `translateY(${botY}px) rotate(${r2 + r3}deg)`;

  // hide cracks/chips once step2 begins (clean)
  const fadeAfterCrack = 1 - smoothstep(0.00, 0.35, p2);
  crackSvg.style.opacity = String(clamp(crackOn * fadeAfterCrack, 0, 1));
  fragments.style.opacity = String(clamp(chipOn * fadeAfterCrack, 0, 1));

  // ----- STEP 3: show inside briefly then drop -----
  const insideOn = smoothstep(0.10, 0.34, p3);
  inside.style.opacity = String(insideOn);
  inside.style.transform = `translateY(${lerp(12, 0, insideOn)}px) scale(${lerp(0.985, 1, insideOn)})`;

  // Pan enters from bottom
  const panOn = smoothstep(0.18, 0.55, p3);
  pan.style.opacity = String(panOn);
  pan.style.transform = `translateX(-50%) translateY(${lerp(130, 0, panOn)}px)`;

  // Egg drop: inside falls into pan, then pan egg appears
  const dropT = smoothstep(0.56, 0.82, p3);
  const falling = dropT > 0.01;

  if (falling) {
    const fallY = lerp(0, 175, dropT);
    const squish = 1 - Math.abs(dropT - 0.55) * 0.5;
    inside.style.transform = `translateY(${fallY}px) scale(${lerp(1, 0.92, dropT)} , ${lerp(1, 1.10, dropT)})`;
    inside.style.opacity = String(clamp(1 - smoothstep(0.78, 0.90, p3), 0, 1));
  }

  // Drop sound once around landing
  if (!dropPlayed && p3 > 0.74) {
    dropPlayed = true;
    playDrop();
  }
  if (t < 0.62) dropPlayed = false;

  const panEggOn = smoothstep(0.76, 0.92, p3);
  panEgg.style.opacity = String(panEggOn);
  panEgg.style.transform = `scale(${lerp(0.985, 1.0, panEggOn)})`;

  // Reveal arrows near end
  const reveal = smoothstep(0.64, 0.92, p3);
  map.style.opacity = String(reveal);
  map.style.transform = `translateY(${lerp(10, 0, reveal)}px)`;

  // Sticky CTA
  const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
  const heroBottom = hero.offsetTop + hero.offsetHeight;
  const orderTop = orderSection.offsetTop;
  const nearOrder = scrollY + vh > orderTop + 120;

  const shouldShowSticky = scrollY > (heroBottom - vh * 0.65) && !nearOrder;
  if (shouldShowSticky !== lastStickyState) {
    lastStickyState = shouldShowSticky;
    stickyCta.classList.toggle('is-on', shouldShowSticky);
    stickyCta.setAttribute('aria-hidden', shouldShowSticky ? 'false' : 'true');
    if (shouldShowSticky) track('sticky_shown');
  }

  requestAnimationFrame(update);
}
requestAnimationFrame(update);

// ====== Packaging quick select -> updates form selection ======
const packInput = document.getElementById('packInput');
const packSelect = document.getElementById('packSelect');
const choices = Array.from(document.querySelectorAll('.choice'));

function setPack(value, source = 'unknown') {
  const v = String(value);
  packInput.value = v;
  packSelect.value = v;
  choices.forEach((c) => c.classList.toggle('active', c.dataset.pack === v));
  track('pack_selected', { pack: v, source });
}
document.querySelectorAll('[data-pack]').forEach((el) => {
  el.addEventListener('click', () => {
    const pack = el.getAttribute('data-pack');
    setPack(pack, el.classList.contains('choice') ? 'choice' : 'pack_section');
  });
});
packSelect.addEventListener('change', (e) => setPack(e.target.value, 'select'));
setPack(packInput.value, 'init');

// ====== FAQ accordion ======
document.querySelectorAll('.faq__q').forEach((btn) => {
  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    const ans = btn.nextElementSibling;
    btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    if (ans) ans.hidden = expanded;
    track('faq_toggle', { expanded: !expanded, question: btn.textContent.trim().slice(0, 60) });
  });
});

// ====== Modal ======
const modal = document.getElementById('modal');
const modalText = document.getElementById('modalText');
const mailtoLink = document.getElementById('mailtoLink');

function openModal(text, mailtoHref) {
  modalText.textContent = text;
  mailtoLink.href = mailtoHref || '#';
  modal.classList.add('is-on');
  modal.setAttribute('aria-hidden', 'false');
  track('modal_open');
}
function closeModal() {
  modal.classList.remove('is-on');
  modal.setAttribute('aria-hidden', 'true');
  track('modal_close');
}
modal.addEventListener('click', (e) => {
  const close = e.target && e.target.getAttribute && e.target.getAttribute('data-close');
  if (close) closeModal();
});

// ====== Preorder form submit ======
const form = document.getElementById('preorderForm');
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const fd = new FormData(form);
  const name = String(fd.get('name') || '').trim();
  const contact = String(fd.get('contact') || '').trim();
  const qty = String(fd.get('qty') || '1').trim();
  const pack = String(fd.get('packSelect') || fd.get('pack') || '11').trim();
  const note = String(fd.get('note') || '').trim();

  const payload = { name, contact, qty, pack, note, ts: Date.now() };

  try {
    const key = 'uova_preorders';
    const arr = JSON.parse(localStorage.getItem(key) || '[]');
    arr.unshift(payload);
    localStorage.setItem(key, JSON.stringify(arr.slice(0, 20)));
  } catch (_) {}

  track('preorder_submit', { pack, qty });

  const to = 'ORDINI_EMAIL@example.com';
  const subject = encodeURIComponent(`Pre-ordine uova — confezione ${pack} (x${qty})`);
  const body = encodeURIComponent(
    `Nome: ${name}\nContatto: ${contact}\nConfezione: ${pack}\nQuantità: ${qty}\nNote: ${note || '-'}\n\n(Inviato dal sito)`
  );
  const mailtoHref = `mailto:${to}?subject=${subject}&body=${body}`;

  openModal(
    `Perfetto ${name}. Hai scelto ${qty} confezione/e da ${pack}. Ti ricontatteremo su: ${contact}.`,
    mailtoHref
  );

  form.reset();
  form.querySelector('[name="qty"]').value = '1';
  setPack(pack, 'submit_keep');
});

// Footer year
document.getElementById('year').textContent = new Date().getFullYear();
