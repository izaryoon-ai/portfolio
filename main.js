const video = document.querySelector('.hero-video');
const toggle = document.querySelector('.video-toggle');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
let userPaused = motion.matches;
let videoReady = false;
let heroVisible = true;
function sync() {
  toggle.textContent = video.paused ? '▶ PLAY' : 'Ⅱ PAUSE';
  toggle.setAttribute('aria-label', video.paused ? '배경 영상 재생' : '배경 영상 일시정지');
}
function revealVideo() {
  if (videoReady) document.body.classList.add('video-visible');
}
async function play() {
  if (!heroVisible || document.hidden) return;
  try { await video.play(); } catch { sync(); }
}
video.muted = true;
video.addEventListener('loadeddata', () => {videoReady = true; revealVideo();});
video.addEventListener('playing', () => {videoReady = true; revealVideo(); sync();});
video.addEventListener('play', sync);
video.addEventListener('pause', sync);
video.addEventListener('error', () => {toggle.textContent='영상 다시 재생'; toggle.setAttribute('aria-label','배경 영상 다시 재생');});
toggle.addEventListener('click', () => {userPaused = !video.paused; if(userPaused) video.pause(); else {if(video.error) video.load(); play();}});
// Show a decoded frame immediately; there is no opening logo or intro delay.
if (video.readyState >= 2) {videoReady = true; revealVideo();}
if (!userPaused) play();
const observer = new IntersectionObserver(entries => {
  heroVisible = entries[0].isIntersecting;
  document.body.classList.toggle('past-hero', !heroVisible);
  if(!heroVisible) video.pause(); else if(!userPaused) play();
}, {threshold:0.08});
observer.observe(document.querySelector('.hero'));
document.addEventListener('visibilitychange', () => {if(document.hidden) video.pause(); else if(!userPaused) play();});
const menu = document.querySelector('.site-menu');
const menuButton = document.querySelector('.menu-button');
function closeMenu(){menu.classList.remove('is-open');menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','메뉴 열기');}
menuButton.addEventListener('click',()=>{const open=menu.classList.toggle('is-open');menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'메뉴 닫기':'메뉴 열기');});
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
sync();

// Decode only visible covers; reduced-motion viewers see the still poster.
const coverObserver = new IntersectionObserver(entries => {
  for (const entry of entries) {
    const cover = entry.target;
    if (entry.isIntersecting && !motion.matches && !document.hidden) cover.play().catch(() => {});
    else cover.pause();
  }
}, {threshold:0.05});
document.querySelectorAll('.cover-video').forEach(cover => {
  cover.muted = true;
  if(motion.matches) {cover.autoplay = false; cover.pause();}
  coverObserver.observe(cover);
});


// Reveal the WORK heading and each project's text on entry.
(() => {
  const work = document.querySelector('.work-collection');
  if (!work || motion.matches || !('IntersectionObserver' in window) || !Element.prototype.animate) return;

  const pendingClass = 'work-reveal-pending';
  const groups = work.querySelectorAll('.work-heading, .project-feature-copy');
  const observer = new IntersectionObserver(entries => {
    for (const {target, isIntersecting} of entries) {
      if (!isIntersecting) continue;
      observer.unobserve(target);
      [...target.children].forEach((item, index) => {
        item.classList.remove(pendingClass);
        if (motion.matches || target.closest('a:focus-visible')) return;
        item.animate(
          [{opacity: 0, translate: '0 20px'}, {opacity: 1, translate: '0 0'}],
          {duration: 590, delay: index * 105, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards'}
        );
      });
    }
  }, {threshold: 0.1});

  groups.forEach(group => {
    [...group.children].forEach(item => item.classList.add(pendingClass));
    observer.observe(group);
  });

  work.addEventListener('focusin', event => {
    const copy = event.target.closest('.project-feature-link')?.querySelector('.project-feature-copy');
    if (!copy) return;
    observer.unobserve(copy);
    [...copy.children].forEach(item => {
      item.classList.remove(pendingClass);
      item.getAnimations().forEach(animation => animation.cancel());
    });
  });
})();
