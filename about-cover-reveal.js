// Reveal the About cover as uneven vertical panels, once on entry.
(() => {
 const shell=document.querySelector('#about-portfolio-film .resume-showreel, .portfolio-film-page .resume-showreel');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 if(!shell || reduced.matches || !('IntersectionObserver' in window)) return;
 const cover=shell.querySelector('.resume-film-cover'), img=cover?.querySelector('img');
 if(!img) return;
 const widths=[7,12,5,10,8,14,6,11,9,5,13];
 const layer=document.createElement('div');layer.className='about-cover-slices';layer.setAttribute('aria-hidden','true');
 let offset=0;
 widths.forEach((width,i)=>{
  const strip=document.createElement('div');strip.className='about-cover-slice';
  strip.style.cssText=`left:${offset}%;width:${width}%;--slice-delay:${i*65}ms`;
  const picture=cover.cloneNode(true);picture.removeAttribute('aria-controls');picture.removeAttribute('id');picture.tabIndex=-1;picture.classList.add('slice-cover-copy');
  picture.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
  const size=()=>{const rect=cover.getBoundingClientRect();picture.style.cssText=`position:absolute;width:${rect.width}px;height:${rect.height}px;left:${-offsetAtStart*rect.width/100}px;top:0;margin:0;opacity:1;transform:none;pointer-events:none`;};
  const offsetAtStart=offset;size();
  if('ResizeObserver' in window)new ResizeObserver(size).observe(shell);
  strip.append(picture);layer.append(strip);offset+=width;
 });
 shell.append(layer);shell.classList.add('cover-assembling');
 let timer;const finish=()=>{clearTimeout(timer);cover.style.transition='none';shell.classList.remove('cover-assembling');cover.getBoundingClientRect();requestAnimationFrame(()=>requestAnimationFrame(()=>{layer.remove();shell.classList.remove('cover-assembling-active');cover.style.removeProperty('transition');}));observer.disconnect();};
 const observer=new IntersectionObserver(entries=>{
  if(!entries.some(e=>e.isIntersecting))return;
  observer.disconnect();requestAnimationFrame(()=>shell.classList.add('cover-assembling-active'));
  timer=setTimeout(finish,1900);
 },{threshold:.15});observer.observe(shell);
 cover.addEventListener('click',finish,{once:true});
 cover.addEventListener('focus',finish,{once:true});
 reduced.addEventListener('change',e=>{if(e.matches)finish();});
})();
