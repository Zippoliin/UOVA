// ====== Small tracker (no dependencies) ======
function track(eventName, payload = {}) {
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, ...payload });
  } catch (_) {}
  // Also visible while developing
  console.log('[track]', eventName, payload);
}

// ====== Scroll-driven egg opening ======
const hero = document.querySelector('.hero');
const wholeEgg = document.getElementById('wholeEgg');
const shellLeft = document.getElementById('shellLeft');
const shellRight = document.getElementById('shellRight');
const inside = document.getElementById('inside');
const map = document.getElementById('map');
const cards = document.getElementById('cards');

const stickyCta = document.getElementById('stickyCta');
const orderSection = document.getElementById('ordina');

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;

let lastStickyState = false;

function update() {
  const rect = hero.getBoundingClientRect();
  const vh = window.innerHeight;

  // progress 0..1 during ~95vh of scroll inside hero
  const end = vh * 0.95;
  const traveled = clamp((0 - rect.top) / end, 0, 1);
  const t = traveled;

  // Whole egg fade out
  const wholeOpacity = 1 - clamp((t - 0.14) / 0.18, 0, 1);
  wholeEgg.style.opacity = wholeOpacity.toFixed(3);

  // Shells visible with fade
  const shellsOn =
    clamp((t - 0.14) / 0.12, 0, 1) * (1 - clamp((t - 0.74) / 0.16, 0, 1));

  // Opening
  const open = clamp((t - 0.18) / 0.50, 0, 1);

  // Shell transforms
  const x = lerp(0, 150, open);
  const y = lerp(0, -35, open);
  const rotL = lerp(0, -24, open);
  const rotR = lerp(0, 24, open);

  shellLeft.style.transform = `translateX(${-x}px) translateY(${y}px) rotate(${rotL}deg)`;
  shellRight.style.transform = `translateX(${x}px) translateY(${y}px) rotate(${rotR}deg)`;

  // Inside appears
  const insideOn = clamp((t - 0.22) / 0.20, 0, 1);
  inside.style.opacity = insideOn.toFixed(3);
  inside.style.transform = `translateY(${lerp(10, 0, insideOn)}px) scale(${lerp(0.98, 1, insideOn)})`;

  // Shells fade out after open completed
  const shellsFade = 1 - clamp((t - 0.72) / 0.12, 0, 1);
  const shellOpacity = (shellsOn * shellsFade).toFixed(3);
  shellLeft.style.opacity = shellOpacity;
  shellRight.style.opacity = shellOpacity;

  // Reveal arrows + nav cards
  const reveal = clamp((t - 0.70) / 0.18, 0, 1);
  map.style.opacity = reveal.toFixed(3);
  map.style.transform = `translateY(${lerp(8, 0, reveal)}px)`;

  cards.style.opacity = reveal.toFixed(3);
  cards.style.transform = `translateX(-50%) translateY(${lerp(10, 0, reveal)}px) scale(${lerp(0.98, 1, reveal)})`;
  cards.style.pointerEvents = reveal > 0.15 ? 'auto' : 'none';

  // Sticky CTA logic (show after leaving hero; hide near order section)
  const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
  const heroBottom = hero.offsetTop + hero.offsetHeight;
  const orderTop = orderSection.offsetTop;
  const nearOrder = scrollY + vh > orderTop + 120; // hide as you approach the order section

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

// Default active pack (matches HTML)
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

// ====== Modal helpers ======
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

// ====== Preorder form submit (with elegant confirmation) ======
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

  // Save locally (handy while prototyping)
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

  // Reset soft: keep pack selection
  form.reset();
  form.querySelector('[name="qty"]').value = '1';
  setPack(pack, 'submit_keep');
});

// Footer year
document.getElementById('year').textContent = new Date().getFullYear();
