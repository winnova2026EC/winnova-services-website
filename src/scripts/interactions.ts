const menuButton = document.querySelector<HTMLButtonElement>('.menu-toggle');
const mobileNav = document.querySelector<HTMLElement>('#mobile-nav');
let menuOpen = false;

function setMenu(open: boolean) {
  if (!menuButton || !mobileNav) return;
  menuOpen = open;
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  mobileNav.inert = !open;
  mobileNav.hidden = !open;
  if (open) {
    mobileNav.classList.remove('animate-fade-down');
    void mobileNav.offsetWidth;
    mobileNav.classList.add('animate-fade-down');
  }
}

menuButton?.addEventListener('click', () => setMenu(!menuOpen));
mobileNav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuOpen) {
    setMenu(false);
    menuButton?.focus();
  }
});
matchMedia('(min-width: 641px)').addEventListener('change', event => {
  if (event.matches) setMenu(false);
});

const choices = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-solution]'));
const panels = Array.from(document.querySelectorAll<HTMLElement>('[data-panel]'));
let selectedId = '';

function setProduct(id: string) {
  const next = panels.find(panel => panel.dataset.panel === id);
  if (!next || selectedId === id) return;
  selectedId = id;

  choices.forEach(choice => {
    const active = choice.dataset.solution === id;
    choice.classList.toggle('active', active);
    if (active) choice.setAttribute('aria-current', 'true');
    else choice.removeAttribute('aria-current');
  });

  panels.forEach(panel => {
    panel.hidden = panel !== next;
    panel.inert = panel !== next;
  });
  next.classList.remove('animate-fade');
  void next.offsetWidth;
  next.classList.add('animate-fade');
}

setProduct(panels.some(panel => panel.dataset.panel === location.hash.slice(1)) ? location.hash.slice(1) : 'contable');

choices.forEach(choice => choice.addEventListener('click', event => {
  event.preventDefault();
  const id = choice.dataset.solution!;
  setProduct(id);
  if (location.hash !== `#${id}`) history.pushState(null, '', `#${id}`);
}));

document.querySelectorAll<HTMLAnchorElement>('[data-hero-product]').forEach(link => {
  link.addEventListener('click', () => setProduct(link.dataset.heroProduct!));
});

window.addEventListener('hashchange', () => setProduct(location.hash.slice(1) || 'contable'));

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) return;
      observer.unobserve(entry.target);
      entry.target.classList.add('animate-fade-up');
    });
  }, { threshold: .15 });

  document.querySelectorAll('.about-brand, .contact-card').forEach(element => observer.observe(element));
}
