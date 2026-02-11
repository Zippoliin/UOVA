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

// ====== Elements ======
const hero = document.querySelector('.hero');
const eggWrap = document.getElementById('eggWrap');

const eggWhole = document.getElementById('eggWhole');
const crackSvg = document.getElementById('crackSvg');
const crackPaths = crackSvg.querySelectorAll('.crack-path');
const fragments = document.getElementById('fragments');

const shellLeft = document.getElementById('shellLeft');
const shellRight = document.getElementById('shellRight');
const inside = document.getElementById('inside');

const map = document.getElementById('map');
const cards = document.getElementById('cards');

const stickyCta = document.getElementById('stickyCta');
const orderSection = document.getElementById('ordina');

// ====== Scroll: 3 steps ======
// Step 1 (0..~0.33): frantuma (cracks + chips + shake)
// Step 2 (~0.33..~0.66): apre poco
// Step 3 (~0.66..1): si separa + reveal interno
let lastStickyState = false;

function update() {
  const rect = hero.getBoundingClientRect();
  const vh = window.innerHeight;

  // progress 0..1 over first ~105vh of scroll inside hero (more room for 3 phases)
  const end = vh * 1.05;
  const t = clamp((0 - rect.top) / end, 0, 1);

  const p1 = clamp(t / 0.33, 0, 1);
  const p2 = clamp((t - 0.33) / 0.33, 0, 1);
  const p3 = clamp((t - 0.66) / 0.34, 0, 1);

  // ----- STEP 1: realistic cracking + fragments -----
  const crackOn = smoothstep(0.05, 0.95, p1);
  crackSvg.style.opacity = String(clamp(crackOn * 1.1, 0, 1));

  // Animate crack drawing
  const dash = 1000;
  const dashOffset = (1 - crackOn) * dash;
  crackPaths.forEach((p) => (p.style.strokeDashoffset = String(dashOffset)));

  // Chips appear mid-step and fly a bit
  const chipOn = smoothstep(0.22, 0.95, p1);
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

  // Shake only during step 1 (dies out near the end)
  const shakeAmp = (1 - p1) * 1.8;
  const shakeX = Math.sin(p1 * 18) * shakeAmp;
  const shakeY = Math.cos(p1 * 15) * shakeAmp;
  const shakeR = Math.sin(p1 * 22) * shakeAmp * 0.9;
  eggWhole.style.setProperty('--shakeX', shakeX.toFixed(2));
  eggWhole.style.setProperty('--shakeY', shakeY.toFixed(2));
  eggWhole.style.setProperty('--shakeR', shakeR.toFixed(2));

  // Fade whole egg as we finish step 1
  const wholeOpacity = 1 - smoothstep(0.70, 1.00, p1);
  eggWhole.style.opacity = String(clamp(wholeOpacity, 0, 1));

  // ----- STEP 2-3: shells appear and open -----
  const shellsOpacity = smoothstep(0.55, 0.95, p1);
  shellLeft.style.opacity = String(shellsOpacity);
  shellRight.style.opacity = String(shellsOpacity);

  // Step 2: open a little
  const openSmall = p2;
  const x2 = lerp(0, 22, openSmall);
  const y2 = lerp(0, -7, openSmall);
  const r2 = lerp(0, 10, openSmall);

  // Step 3: separate wide
  const sep = p3;
  const x3 = lerp(0, 210, sep);
  const y3 = lerp(0, -42, sep);
  const r3 = lerp(0, 18, sep);

  const leftX = -(x2 + x3);
  const rightX = (x2 + x3);
  const liftY = (y2 + y3);

  shellLeft.style.transform  = `translateX(${leftX}px) translateY(${liftY}px) rotate(${-r2 - r3}deg)`;
  shellRight.style.transform = `translateX(${rightX}px) translateY(${liftY}px) rotate(${r2 + r3}deg)`;

  // Hide cracks/chips once step 2 starts (clean reveal)
  const fadeAfterCrack = 1 - smoothstep(0.00, 0.35, p2);
  crackSvg.style.opacity = String(clamp(crackOn * fadeAfterCrack, 0, 1));
  fragments.style.opacity = String(clamp(chipOn * fadeAfterCrack, 0, 1));

  // ----- STEP 3: reveal inside -----
  const insideOn = smoothstep(0.10, 0.42, p3);
  inside.style.opacity = String(insideOn);
  inside.style.transform = `translateY(${lerp(10, 0, insideOn)}px) scale(${lerp(0.98, 1, insideOn)})`;

  // Reveal map + cards near the end of step 3
  const reveal = smoothstep(0.52, 0.90, p3);
  map.style.opacity = String(reveal);
  map.style.transform = `translateY(${lerp(8, 0, reveal)}px)`;

  cards.style.opacity = String(reveal);
  cards.style.transform = `translateX(-50%) translateY(${lerp(10, 0, reveal)}px) scale(${lerp(0.985, 1, reveal)})`;
  cards.style.pointerEvents = reveal > 0.15 ? 'auto' : 'none';

  // Sticky CTA: show after hero; hide near order section
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

// ====== Navigation cards ======
function goToTarget(sel) {
  const el = document.querySelector(sel);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.querySelectorAll('.card').forEach((card) => {
  const target = card.getAttribute('data-target');
  const name = card.getAttribute('data-track') || 'nav_card';
  card.addEventListener('click', () => {
    track('nav_click', { name, target });
    goToTarget(target);
  });
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      track('nav_click', { name, target });
      goToTarget(target);
    }
  });
});

// Track all simple links with data-track
document.querySelectorAll('[data-track]').forEach((el) => {
  el.addEventListener('click', () => {
    const name = el.getAttribute('data-track');
    track('click', { name });
  });
});

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

packSelect.addEventListener('change', (e) => {
  setPack(e.target.value, 'select');
});

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

  // Mailto fallback: change "ORDINI_EMAIL" with your mailbox
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
