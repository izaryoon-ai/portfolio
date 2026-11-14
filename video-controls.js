(() => {
  const icons = {
    play:'<path d="M8 5l10 7-10 7z" fill="currentColor" stroke="none"/>',
    pause:'<path d="M8 5v14M16 5v14"/>',
    sound:'<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 8a6 6 0 010 8M20 5a10 10 0 010 14"/>',
    mute:'<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/>',
    expand:'<path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/>',
    shrink:'<path d="M3 8h5V3M16 3v5h5M3 16h5v5M16 21v-5h5"/>'
  };
  const svg = name => '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="square" stroke-linejoin="miter">'+icons[name]+'</svg>';
  const format = seconds => {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const n = Math.floor(seconds);
    return n >= 3600 ? Math.floor(n/3600)+':'+String(Math.floor(n/60)%60).padStart(2,'0')+':'+String(n%60).padStart(2,'0') : Math.floor(n/60)+':'+String(n%60).padStart(2,'0');
  };
  document.querySelectorAll('.resume-film-stage, .guided-video, .film-hover-preview').forEach(shell => {
    const video = shell.querySelector('video');
    if (!video || shell.querySelector('.player-toolbar')) return;
    const bar = document.createElement('div');
    bar.className = 'player-toolbar';
    bar.setAttribute('role','group');
    bar.setAttribute('aria-label','영상 재생 컨트롤');
    function button(name, label) {
      const el = document.createElement('button');
      el.type='button';el.className='player-action';
      el.innerHTML=svg(name);el.setAttribute('aria-label',label);el.title=label;
      return el;
    }
    const play=button('play','재생');
    const elapsed=document.createElement('span');elapsed.className='player-time player-elapsed';elapsed.textContent='0:00';elapsed.setAttribute('aria-hidden','true');
    const progressCell=document.createElement('div');progressCell.className='player-progress-cell';
    const seek=document.createElement('input');seek.type='range';seek.className='player-progress';seek.min='0';seek.max='100';seek.step='0.1';seek.value='0';seek.disabled=true;seek.setAttribute('aria-label','재생 위치');
    progressCell.append(seek);
    const total=document.createElement('span');total.className='player-time player-total';total.textContent='0:00';total.setAttribute('aria-label','전체 재생 시간');
    const sound=button('sound','음소거');
    const full=button('expand','전체 화면');
    bar.append(play,elapsed,progressCell,total,sound,full);
    const status=document.createElement('span');status.className='player-status';status.setAttribute('role','status');status.hidden=true;
    shell.append(bar,status);shell.classList.add('has-custom-player');
    // Keep the HTML native controls as the no-JS fallback; replace after setup.
    video.controls=false;
    let idleTimer;
    let seeking=false;
    let lastPosition=0;
    const isFullscreen = () => document.fullscreenElement===shell || document.webkitFullscreenElement===shell || video.webkitDisplayingFullscreen;
    function hideControls() {
      clearTimeout(idleTimer);
      if (video.paused || video.ended || seeking) return;
      if (shell.classList.contains('controls-keyboard') && bar.contains(document.activeElement)) return;
      shell.classList.add('controls-idle');
    }
    function showControls() {
      shell.classList.remove('controls-idle');
      clearTimeout(idleTimer);
      if(!video.paused && !video.ended) idleTimer=setTimeout(hideControls,1600);
    }
    function message(text='') {status.textContent=text;status.hidden=!text;}
    function update() {
      const duration=video.duration;
      const ready=Number.isFinite(duration) && duration>0;
      elapsed.textContent=format(video.currentTime);
      total.textContent=ready?format(duration):'0:00';
      seek.disabled=!ready;
      seek.max=ready?String(duration):'100';
      if(!seeking) seek.value=String(ready?Math.min(video.currentTime,duration):0);
      seek.style.setProperty('--progress',ready?Math.min(100,Math.max(0,video.currentTime/duration*100))+'%':'0%');
      seek.setAttribute('aria-valuetext',format(video.currentTime)+' / '+format(duration));
      const paused=video.paused || video.ended;
      play.innerHTML=svg(paused?'play':'pause');
      play.setAttribute('aria-label',paused?'재생':'일시정지');play.title=paused?'재생':'일시정지';
      const silent=video.muted || video.volume===0;
      sound.innerHTML=svg(silent?'mute':'sound');sound.setAttribute('aria-label',silent?'소리 켜기':'음소거');sound.title=silent?'소리 켜기':'음소거';sound.setAttribute('aria-pressed',String(silent));
      shell.classList.toggle('player-paused',paused);
    }
    async function toggle() {
      showControls();
      if(video.paused || video.ended){
        if(video.ended) video.currentTime=0;
        try{await video.play();message();}catch{message('재생 버튼을 다시 눌러주세요.');}
      }else video.pause();
    }
    play.addEventListener('click',toggle);
    video.addEventListener('click',toggle);
    sound.addEventListener('click',()=>{const silent=video.muted || video.volume===0;if(silent && video.volume===0) video.volume=1;video.muted=!silent;showControls();});
    seek.addEventListener('input',()=>{
      if(!Number.isFinite(video.duration))return;
      seeking=true;lastPosition=Math.max(0,Math.min(Number(seek.value),video.duration));
      video.currentTime=lastPosition;
      elapsed.textContent=format(lastPosition);seek.style.setProperty('--progress',(lastPosition/video.duration*100)+'%');
      seek.setAttribute('aria-valuetext',format(lastPosition)+' / '+format(video.duration));showControls();
    });
    seek.addEventListener('change',()=>{seeking=false;update();});
    seek.addEventListener('blur',()=>{seeking=false;update();});
    if(!shell.requestFullscreen && !video.webkitEnterFullscreen) full.hidden=true;
    full.addEventListener('click',async()=>{
      try{
        if(document.fullscreenElement) await document.exitFullscreen();
        else if(shell.requestFullscreen) await shell.requestFullscreen();
        else if(video.webkitEnterFullscreen) video.webkitEnterFullscreen();
      }catch{message('현재 환경에서는 전체 화면을 사용할 수 없습니다.');}
      showControls();
    });
    document.addEventListener('fullscreenchange',()=>{const active=isFullscreen();full.innerHTML=svg(active?'shrink':'expand');full.setAttribute('aria-label',active?'전체 화면 종료':'전체 화면');full.title=active?'전체 화면 종료':'전체 화면';showControls();});
    for(const event of ['loadedmetadata','durationchange','timeupdate','volumechange','seeked','emptied']) video.addEventListener(event,update);
    video.addEventListener('play',()=>{update();hideControls();});
    for(const event of ['pause','ended']) video.addEventListener(event,()=>{update();showControls();});
    video.addEventListener('waiting',()=>message('영상 로딩 중…'));
    video.addEventListener('playing',()=>message());
    video.addEventListener('canplay',()=>message());
    video.addEventListener('error',()=>{message('영상을 불러올 수 없습니다.');showControls();});
    shell.addEventListener('pointermove',showControls,{passive:true});
    shell.addEventListener('pointerenter',showControls,{passive:true});
    shell.addEventListener('pointerleave',hideControls,{passive:true});
    shell.addEventListener('pointerdown',()=>{shell.classList.remove('controls-keyboard');showControls();},{passive:true});
    document.addEventListener('keydown',event=>{if(event.key==='Tab') shell.classList.add('controls-keyboard');});
    bar.addEventListener('focusin',()=>{if(shell.classList.contains('controls-keyboard')) showControls();});
    bar.addEventListener('focusout',()=>{setTimeout(()=>{if(!bar.contains(document.activeElement)) showControls();},0);});
    seek.addEventListener('pointerdown',()=>{seeking=true;showControls();});
    document.addEventListener('pointerup',()=>{if(seeking){seeking=false;update();showControls();}},{passive:true});
    video.addEventListener('keydown',event=>{
      const key=event.key.toLowerCase();
      if(key===' ' || key==='k'){event.preventDefault();toggle();}
      else if((key==='arrowleft'||key==='arrowright') && Number.isFinite(video.duration)){event.preventDefault();video.currentTime=Math.max(0,Math.min(video.duration,video.currentTime+(key==='arrowleft'?-5:5)));showControls();}
      else if(key==='m'){event.preventDefault();sound.click();}
      else if(key==='f'){event.preventDefault();full.click();}
    });
    update();
  });
})();
