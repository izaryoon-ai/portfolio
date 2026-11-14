// Thin video-frame guides, scoped to media rather than the whole page.
const guidedSurfaces = document.querySelectorAll('.resume-film-cover, .resume-film-stage, .guided-video');
const guidePointers = matchMedia('(hover: hover) and (pointer: fine)');
for (const surface of guidedSurfaces) {
  surface.classList.add('has-video-guides');
  const overlay = document.createElement('span');
  overlay.className = 'video-guide-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  for (const name of ['frame','horizontal','vertical']) {
    const line = document.createElement('span');
    line.className = 'video-guide-' + name;
    overlay.append(line);
  }
  surface.append(overlay);
  let queued = false;
  let point = null;
  function draw() {
    queued = false;
    if (!point || !guidePointers.matches || !surface.isConnected) return;
    const rect = surface.getBoundingClientRect();
    const inset = Math.min(20, rect.width / 8, rect.height / 8);
    surface.style.setProperty('--guide-x', Math.max(inset, Math.min(rect.width-inset,point.x-rect.left)) + 'px');
    surface.style.setProperty('--guide-y', Math.max(inset, Math.min(rect.height-inset,point.y-rect.top)) + 'px');
    surface.classList.add('guides-active');
  }
  surface.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch' || !guidePointers.matches) return;
    point = {x:event.clientX,y:event.clientY};
    if (!queued) {queued = true;requestAnimationFrame(draw);}
  });
  function hide() {point=null;surface.classList.remove('guides-active');}
  surface.addEventListener('pointerleave', hide);
  surface.addEventListener('pointercancel', hide);
  document.addEventListener('visibilitychange', () => {if(document.hidden) hide();});
  window.addEventListener('scroll',hide,{passive:true});
}
