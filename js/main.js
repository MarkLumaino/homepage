const header = document.querySelector('.site-header');
const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('#site-nav');
const backTop = document.querySelector('.back-top');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Mobile menu: aria-expanded is the single source of truth that the CSS reads.
const setMenu = (open) => {
  if (!siteNav || !menuToggle) return;
  siteNav.classList.toggle('is-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
};

menuToggle?.addEventListener('click', () => setMenu(!siteNav.classList.contains('is-open')));
siteNav?.addEventListener('click', (event) => {
  if (event.target.closest('a')) setMenu(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || !siteNav?.classList.contains('is-open')) return;
  setMenu(false);
  menuToggle.focus();
});
document.addEventListener('click', (event) => {
  if (siteNav?.classList.contains('is-open') && !header.contains(event.target)) setMenu(false);
});

// Mark the nav link for the section in view. The hero has no link, so reaching it clears them all.
const navLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')];
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((link) => {
      if (link.getAttribute('href') === `#${entry.target.id}`) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  });
}, { rootMargin: '-35% 0px -55% 0px' });
document.querySelectorAll('main section[id]').forEach((section) => sectionObserver.observe(section));

const onScroll = () => {
  header?.classList.toggle('is-stuck', window.scrollY > 8);
  backTop?.classList.toggle('visible', window.scrollY > 600);
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();
backTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: prefersReducedMotion.matches ? 'auto' : 'smooth' }));

// Copy email: idle → copied | failed → idle, announced through the live region.
const copyKey = /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘C' : 'Ctrl+C';
document.querySelectorAll('[data-copy]').forEach((button) => {
  const wrapper = button.closest('.email-copy');
  const status = wrapper.querySelector('[aria-live]');
  let resetTimer;
  const setState = (state, label, message) => {
    wrapper.dataset.state = state;
    button.textContent = label;
    status.textContent = message;
  };
  button.addEventListener('click', async () => {
    clearTimeout(resetTimer);
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      setState('copied', 'Copied', 'Email address copied');
    } catch {
      window.getSelection().selectAllChildren(wrapper.querySelector('.email-link'));
      setState('failed', `Press ${copyKey}`, `Copy failed. The address is selected; press ${copyKey} to copy it.`);
    }
    resetTimer = setTimeout(() => setState('idle', 'Copy', ''), 2400);
  });
});

// Phones show the case studies as a swipeable row: make it keyboard-scrollable and keep the counter in sync.
const caseList = document.querySelector('.case-list');
const caseIndex = document.querySelector('[data-case-index]');
if (caseList && caseIndex) {
  const phone = window.matchMedia('(max-width: 639.98px)');
  const cards = [...caseList.children];
  const syncScroller = () => {
    if (phone.matches) caseList.setAttribute('tabindex', '0');
    else caseList.removeAttribute('tabindex');
  };
  phone.addEventListener('change', syncScroller);
  syncScroller();
  const caseObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      // isIntersecting is also true for the next card peeking in, so require the threshold itself.
      if (entry.intersectionRatio >= 0.6) caseIndex.textContent = String(cards.indexOf(entry.target) + 1).padStart(2, '0');
    });
  }, { root: caseList, threshold: 0.6 });
  cards.forEach((card) => caseObserver.observe(card));
}

// Content stays visible without JavaScript; elements are only hidden once we can reveal them.
const revealTargets = document.querySelectorAll('[data-reveal]');
if ('IntersectionObserver' in window && revealTargets.length) {
  document.documentElement.classList.add('reveal-ready');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-inview');
      revealObserver.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
  revealTargets.forEach((target) => revealObserver.observe(target));
}
