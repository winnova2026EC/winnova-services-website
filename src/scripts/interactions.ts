const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const easeOut = getComputedStyle(document.documentElement).getPropertyValue('--ease-out').trim();
document.addEventListener('pointerdown', () => { document.documentElement.dataset.input = 'pointer'; }, { passive: true });
document.addEventListener('keydown', () => { document.documentElement.dataset.input = 'keyboard'; });

const menuButton = document.querySelector<HTMLButtonElement>('.menu-toggle');
const mobileNav = document.querySelector<HTMLElement>('#mobile-nav');
let menuAnimation: Animation | undefined;
let menuOpen = false;
let menuVersion = 0;

async function setMenu(open: boolean, animate = false) {
  if (!menuButton || !mobileNav) return;
  const version = ++menuVersion;
  const wasHidden = mobileNav.hidden;
  const current = getComputedStyle(mobileNav);
  const from = { opacity: wasHidden ? '0' : current.opacity, transform: wasHidden ? 'translateY(-8px) scale(.97)' : current.transform };
  menuAnimation?.cancel();
  menuOpen = open;
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  mobileNav.inert = !open;
  if (!animate || reduceMotion.matches || typeof mobileNav.animate !== 'function') {
    mobileNav.hidden = !open;
    return;
  }
  mobileNav.hidden = false;
  menuAnimation = mobileNav.animate([from, { opacity: open ? 1 : 0, transform: open ? 'none' : 'translateY(-8px) scale(.97)' }], { duration: 200, easing: easeOut, fill: 'forwards' });
  try { await menuAnimation.finished; } catch { return; }
  if (version !== menuVersion) return;
  mobileNav.hidden = !open;
  menuAnimation.cancel();
  menuAnimation = undefined;
}
menuButton?.addEventListener('click', event => { void setMenu(!menuOpen, event.detail > 0); });
mobileNav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { void setMenu(false); }));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuOpen) { void setMenu(false); menuButton?.focus(); }
});
matchMedia('(min-width: 641px)').addEventListener('change', event => { if (event.matches) void setMenu(false); });

const choices = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-solution]'));
const panels = Array.from(document.querySelectorAll<HTMLElement>('[data-panel]'));
const runningPanels = new Map<HTMLElement, Animation>();
let selectedId = '';
let productVersion = 0;

function clearPanel(panel: HTMLElement) {
  panel.style.removeProperty('opacity');
  panel.style.removeProperty('transform');
  panel.inert = false;
}
async function setProduct(id: string, animate = false, force = false) {
  const next = panels.find(panel => panel.dataset.panel === id);
  if (!next || (!force && selectedId === id)) return;
  const previousIndex = panels.findIndex(panel => panel.dataset.panel === selectedId);
  const direction = panels.indexOf(next) >= previousIndex ? 1 : -1;
  const version = ++productVersion;
  selectedId = id;
  choices.forEach(choice => {
    const active = choice.dataset.solution === id;
    choice.classList.toggle('active', active);
    if (active) choice.setAttribute('aria-current', 'true');
    else choice.removeAttribute('aria-current');
  });
  const current = panels.find(panel => !panel.hidden);
  // Freeze the displayed frame before canceling so rapid changes never restart at zero.
  const visual = current ? getComputedStyle(current) : null;
  const from = { opacity: visual?.opacity ?? '1', transform: visual?.transform ?? 'none' };
  runningPanels.forEach(animation => animation.cancel());
  runningPanels.clear();
  if (!animate || typeof next.animate !== 'function') {
    panels.forEach(panel => { panel.hidden = panel !== next; clearPanel(panel); });
    return;
  }
  if (current) {
    current.style.opacity = from.opacity;
    current.style.transform = from.transform;
  }
  const reduced = reduceMotion.matches;
  if (current && current !== next) {
    current.inert = true;
    const exit = current.animate([from, { opacity: 0, transform: reduced ? 'none' : `translateX(${-direction * 8}px)` }], { duration: reduced ? 60 : 80, easing: easeOut, fill: 'forwards' });
    runningPanels.set(current, exit);
    try { await exit.finished; } catch { return; }
    if (version !== productVersion) return;
    current.hidden = true;
    exit.cancel();
    runningPanels.delete(current);
    clearPanel(current);
  }
  panels.forEach(panel => { if (panel !== next) { panel.hidden = true; clearPanel(panel); } });
  next.hidden = false;
  next.inert = false;
  const enter = next.animate([
    current === next ? from : { opacity: 0, transform: reduced ? 'none' : `translateX(${direction * 8}px)` },
    { opacity: 1, transform: 'none' },
  ], { duration: reduced ? 100 : 160, easing: easeOut, fill: 'forwards' });
  runningPanels.set(next, enter);
  try { await enter.finished; } catch { return; }
  if (version !== productVersion) return;
  clearPanel(next);
  enter.cancel();
  runningPanels.delete(next);
}
void setProduct(panels.some(panel => panel.dataset.panel === location.hash.slice(1)) ? location.hash.slice(1) : 'contable');
choices.forEach(choice => choice.addEventListener('click', event => {
  event.preventDefault();
  const id = choice.dataset.solution!;
  void setProduct(id, event.detail > 0);
  if (location.hash !== `#${id}`) history.pushState(null, '', `#${id}`);
}));
document.querySelectorAll<HTMLAnchorElement>('[data-hero-product]').forEach(link => link.addEventListener('click', () => {
  // Anchor jumps are immediate so their destination is visible before the browser scrolls.
  void setProduct(link.dataset.heroProduct!, false);
}));
window.addEventListener('hashchange', () => { void setProduct(location.hash.slice(1) || 'contable'); });

type DisclosureState = { detail: HTMLDetailsElement; content: HTMLElement; expanded: boolean; animation?: Animation; version: number };
const disclosures: DisclosureState[] = [];
function settleDisclosure(state: DisclosureState) {
  state.animation?.cancel();
  state.animation = undefined;
  state.detail.open = state.expanded;
  state.detail.dataset.expanded = String(state.expanded);
  state.detail.style.removeProperty('height');
  state.detail.style.removeProperty('overflow');
  state.content.inert = !state.expanded;
}
document.querySelectorAll<HTMLDetailsElement>('.module-list details').forEach(detail => {
  const summary = detail.querySelector('summary');
  const content = detail.querySelector<HTMLElement>('p');
  if (!summary || !content) return;
  const state: DisclosureState = { detail, content, expanded: detail.open, version: 0 };
  disclosures.push(state);
  summary.addEventListener('click', async event => {
    event.preventDefault();
    const version = ++state.version;
    state.expanded = !state.expanded;
    const startHeight = detail.getBoundingClientRect().height;
    state.animation?.cancel();
    if (event.detail === 0 || reduceMotion.matches || typeof detail.animate !== 'function') { settleDisclosure(state); return; }
    detail.dataset.expanded = String(state.expanded);
    content.inert = !state.expanded;
    detail.style.overflow = 'hidden';
    detail.style.removeProperty('height');
    detail.open = state.expanded;
    const endHeight = detail.getBoundingClientRect().height;
    detail.open = true;
    detail.style.height = `${startHeight}px`;
    state.animation = detail.animate([{ height: `${startHeight}px` }, { height: `${endHeight}px` }], { duration: 200, easing: easeOut, fill: 'forwards' });
    try { await state.animation.finished; } catch { return; }
    if (version === state.version) settleDisclosure(state);
  });
});

// One-time entrances for the brand illustration and the contact surface; body text stays still.
const revealAnimations = new Set<Animation>();
if ('IntersectionObserver' in window && !reduceMotion.matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      if (reduceMotion.matches || typeof entry.target.animate !== 'function') return;
      const animation = entry.target.animate([{ opacity: 0, transform: 'translateY(8px) scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 350, easing: easeOut });
      revealAnimations.add(animation);
      animation.finished.then(() => revealAnimations.delete(animation), () => revealAnimations.delete(animation));
    });
  }, { threshold: .15 });
  document.querySelectorAll('.about-brand, .contact-card').forEach(element => observer.observe(element));
}
reduceMotion.addEventListener('change', () => {
  void setProduct(selectedId, false, true);
  void setMenu(menuOpen);
  disclosures.forEach(state => { ++state.version; settleDisclosure(state); });
  revealAnimations.forEach(animation => animation.cancel());
  revealAnimations.clear();
});
window.addEventListener('resize', () => { disclosures.forEach(state => { if (state.animation) { ++state.version; settleDisclosure(state); } }); });
