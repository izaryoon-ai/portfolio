// About-only staggered text reveal; WHAT I DO replays in order each time it opens.
(() => {
  const root = document.querySelector('.about-profile');
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!root || preference.matches || !('IntersectionObserver' in window)) return;
  const targets = [...root.querySelectorAll('h1, h2, h3, h4, p, .profile-identity, .career-role')]
    .filter(el => !el.closest('.profile-whatido'));
  const disclosures = [...root.querySelectorAll('.profile-whatido')];
  const items = disclosures.flatMap(detail => [...detail.querySelectorAll('.whatido-item')]);
  const all = [...targets, ...items];
  let observer;
  const show = el => el.classList.add('is-revealed');
  try {
    observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting)
        .sort((a, b) => targets.indexOf(a.target) - targets.indexOf(b.target));
      visible.forEach((entry, index) => {
        entry.target.style.setProperty('--reveal-delay', `${Math.min(index * 110, 660)}ms`);
        show(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -12px 0px' });
    targets.forEach(el => { el.classList.add('motion-reveal'); observer.observe(el); });
    items.forEach(el => el.classList.add('motion-reveal'));
    disclosures.forEach(detail => {
      const revealItems = () => {
        const rows = [...detail.querySelectorAll('.whatido-item')];
        rows.forEach((el, index) => {
          el.classList.remove('is-revealed');
          el.style.setProperty('--reveal-delay', `${index * 140}ms`);
        });
        if (!detail.open) return;
        requestAnimationFrame(() => requestAnimationFrame(() => {
          if (detail.open) rows.forEach(show);
        }));
      };
      detail.addEventListener('toggle', revealItems);
      if (detail.open) revealItems();
    });
    root.addEventListener('focusin', event => {
      const el = event.target.closest('.motion-reveal');
      if (el) { el.style.setProperty('--reveal-delay', '0ms'); show(el); observer.unobserve(el); }
    });
    preference.addEventListener('change', event => {
      if (event.matches) {
        all.forEach(el => { el.style.setProperty('--reveal-delay', '0ms'); show(el); });
        observer.disconnect();
      }
    });
  } catch (_) {
    all.forEach(el => el.classList.remove('motion-reveal'));
    observer?.disconnect();
  }
})();
