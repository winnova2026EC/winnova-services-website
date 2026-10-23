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
