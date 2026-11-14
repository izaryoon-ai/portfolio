(() => {
  const page = document.querySelector('.project-full-cover .project-case');
  if (!page || !('IntersectionObserver' in window) || !Element.prototype.animate) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const intro = page.querySelector('.project-intro');
  const work = page.querySelector('.project-work-group');
  if (!intro || !work) return;

  let frame = 0;
  function updateIntro() {
    frame = 0;
    if (motion.matches) {
      intro.style.removeProperty('--intro-visibility');
      return;
    }
    const bounds = intro.getBoundingClientRect();
    const progress = Math.max(0, -bounds.top) / Math.max(bounds.height, 1);
    const visibility = Math.max(0, Math.min(1, (0.9 - progress) / 0.68));
    intro.style.setProperty('--intro-visibility', visibility.toFixed(3));
  }
  function scheduleIntro() {
    if (!frame) frame = requestAnimationFrame(updateIntro);
  }
  addEventListener('scroll', scheduleIntro, { passive: true });
  addEventListener('resize', scheduleIntro);
  motion.addEventListener('change', updateIntro);
  updateIntro();

  const blocks = work.querySelectorAll(
    '.project-work-label, .project-work-nav, .project-work-group h2, .mabi-entry-heading, .case-story-row > :is(h3,h4), ' +
    '.case-story-row > div > p, .mabi-media-column > h4, .resume-showreel, ' +
    '.production-figure, .research-detail, .open-process > li, .wake-facial-summary, ' +
    '.facial-pipeline-track > h4, .pipeline-result, .facial-asset-credits'
  );
  const observer = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting);
    visible.forEach(({target}, index) => {
      observer.unobserve(target);
      if (motion.matches || target.matches(':focus-within')) return;
      target.animate(
        [{opacity: 0, translate: '0 22px'}, {opacity: 1, translate: '0 0'}],
        {duration: 590, delay: Math.min(index * 75, 225), easing: 'cubic-bezier(.2,.75,.25,1)', fill: 'backwards'}
      );
    });
  }, {threshold: 0, rootMargin: '0px 0px -55px 0px'});
  blocks.forEach(block => observer.observe(block));
})();
