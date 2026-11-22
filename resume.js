// Shared cover -> black -> playback, and black -> cover on completion.
(() => {

// Keep the existing player mounted so rotation does not restart playback.
function enableLandscapePlayback(stage) {
  const landscape = matchMedia('(orientation: landscape) and (pointer: coarse) and (max-height: 600px)');
  const shell = stage.closest('.resume-showreel');
  let playing = false;
  let nativeFullscreen = false;

  function update() {
    const expanded = landscape.matches && !stage.hidden && !nativeFullscreen &&
      !document.fullscreenElement && (playing || shell.classList.contains('landscape-playback'));
    shell.classList.toggle('landscape-playback', expanded);
  }
  landscape.addEventListener('change', update);
  document.addEventListener('fullscreenchange', update);
  return {
    play() { playing = true; update(); },
    pause() { playing = false; update(); },
    stop() { playing = false; shell.classList.remove('landscape-playback'); },
    fullscreen(active) { nativeFullscreen = active; update(); }
  };
}

let youtubeAPI;
function loadYouTubeAPI() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!youtubeAPI) {
    youtubeAPI = new Promise((resolve, reject) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        resolve(window.YT);
        previous?.();
      };
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.addEventListener('error', reject, {once: true});
      document.head.append(script);
    });
  }
  return youtubeAPI;
}

  document.querySelectorAll('.resume-showreel').forEach(shell => {
    const cover = shell.querySelector('.resume-film-cover');
    const stage = shell.querySelector('.resume-film-stage');
    const player = stage?.querySelector('video');
    if (!cover || !stage) return;
    const landscape = enableLandscapePlayback(stage);
    const frame = stage.querySelector('iframe');
    if (frame?.dataset.vimeoSrc) {
      const dimsPage = Boolean(shell.closest('#about-portfolio-film, .portfolio-film-page, .wake-production, .argent-production'));
      const clearDimming = () => shell.classList.remove('about-film-playing');
      let vimeo;
      cover.addEventListener('click', () => {
        cover.hidden = true;
        stage.hidden = false;
        const source = new URL(frame.dataset.vimeoSrc);
        source.searchParams.set('muted', '0');
        source.searchParams.set('playsinline', '1');
        frame.src = source.href;
        frame.focus({preventScroll: true});
        if (!window.Vimeo?.Player) return;
        vimeo = new window.Vimeo.Player(frame);
        const activePlayer = vimeo;
        activePlayer.setMuted(false).catch(() => {});
        activePlayer.getVolume().then(volume => {
          if (volume === 0) return activePlayer.setVolume(1);
        }).catch(() => {});
        vimeo.on('playing', () => {
          landscape.play();
          if (dimsPage) shell.classList.add('about-film-playing');
        });
        vimeo.on('pause', () => { clearDimming(); landscape.pause(); });
        vimeo.on('fullscreenchange', ({ fullscreen }) => landscape.fullscreen(fullscreen));
        vimeo.on('error', () => { clearDimming(); landscape.stop(); });
        vimeo.on('ended', () => {
          landscape.stop();
          clearDimming();
          stage.hidden = true;
          cover.hidden = false;
          const finished = vimeo;
          finished.destroy().catch(() => {}).finally(() => {
            if (!frame.isConnected) stage.prepend(frame);
            frame.removeAttribute('src');
            cover.disabled = false;
          });
          cover.disabled = true;
        });
      });
      return;
    }

    if (!player && frame) {
      let opening = false;
      cover.addEventListener('click', async () => {
        if (opening) return;
        opening = true;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        shell.classList.add('film-starting');
        cover.classList.add('is-opening');
        await new Promise(resolve => setTimeout(resolve, reduced ? 0 : 440));
        cover.hidden = true;
        stage.hidden = false;
        stage.getBoundingClientRect();
        const source = new URL(frame.dataset.src, location.href);
        const isYouTube = /(^|\.)youtube(?:-nocookie)?\.com$/.test(source.hostname);
        if (isYouTube) {
          source.searchParams.set('enablejsapi', '1');
          source.searchParams.set('playsinline', '1');
          if (location.origin !== 'null') source.searchParams.set('origin', location.origin);
        }
        frame.src = source.href;
        if (isYouTube) {
          loadYouTubeAPI().then(YT => {
            new YT.Player(frame, {events: {
              onReady: ({target}) => target.unMute(),
              onStateChange: ({data}) => {
                if (data === YT.PlayerState.PLAYING) landscape.play();
                if (data === YT.PlayerState.PAUSED) landscape.pause();
                if (data === YT.PlayerState.ENDED) landscape.stop();
              },
              onError: () => landscape.stop()
            }});
          }).catch(() => {});
        }
        let revealed = false;
        const reveal = () => {
          if (revealed) return;
          revealed = true;
          shell.classList.add('film-ready');
          setTimeout(() => shell.classList.remove('film-starting','film-ready'), reduced ? 0 : 700);
        };
        frame.addEventListener('load', reveal, {once:true});
        setTimeout(reveal, 1800);
      });
      return;
    }
    if (!player) return;
    player.addEventListener('playing', landscape.play);
    player.addEventListener('pause', landscape.pause);
    for (const event of ['ended', 'error', 'emptied']) {
      player.addEventListener(event, landscape.stop);
    }
    player.addEventListener('webkitbeginfullscreen', () => landscape.fullscreen(true));
    player.addEventListener('webkitendfullscreen', () => landscape.fullscreen(false));
    if (shell.closest('#about-portfolio-film, .wake-production')) {
      const brightenPage = () => shell.classList.remove('about-film-playing');
      player.addEventListener('playing', () => {
        if (!stage.hidden && !player.paused) shell.classList.add('about-film-playing');
      });
      for (const event of ['pause', 'ended', 'error', 'emptied']) {
        player.addEventListener(event, brightenPage);
      }
    }
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let opening = false, returnTimer, startTimer, sequence = 0;
    const clearReturn = () => {
      clearTimeout(returnTimer);
      cover.classList.remove('cover-returning');
      shell.classList.remove('film-returning');
    };
    const revealFilm = () => {
      if (!shell.classList.contains('film-starting')) return;
      shell.classList.add('film-ready');
      clearTimeout(startTimer);
      startTimer = setTimeout(() => {
        shell.classList.remove('film-starting', 'film-ready');
        opening = false;
      }, preference.matches ? 0 : 700);
    };
    player.addEventListener('playing', revealFilm);
    player.addEventListener('error', revealFilm);
    cover.addEventListener('animationend', event => {
      if (event.target === cover && event.animationName === 'film-cover-return') clearReturn();
    });
    cover.addEventListener('click', async () => {
      if (opening) return;
      opening = true;
      const token = ++sequence;
      clearReturn();
      clearTimeout(startTimer);
      shell.classList.add('film-starting');
      cover.classList.add('is-opening');
      await new Promise(resolve => setTimeout(resolve, preference.matches ? 0 : 440));
      if (token !== sequence) return;
      cover.querySelector('video')?.pause();
      cover.hidden = true;
      stage.hidden = false;
      stage.getBoundingClientRect(); // Commit the black frame before enabling the video fade.
      player.focus({preventScroll:true});
      try {
        player.muted = false;
        if (player.volume === 0) player.volume = 1;
        await player.play();
        if (token === sequence && player.readyState >= 2) revealFilm();
      } catch {
        // Restore visible controls when browser playback needs another user gesture.
        if (token === sequence) revealFilm();
      }
    });
    player.addEventListener('ended', () => {
      ++sequence;
      opening = false;
      clearTimeout(startTimer);
      const returnFocus = stage.contains(document.activeElement);
      if (document.fullscreenElement === stage && document.exitFullscreen) document.exitFullscreen().catch(() => {});
      player.pause();
      clearReturn();
      shell.classList.remove('film-starting', 'film-ready');
      shell.classList.add('film-returning');
      cover.classList.add('cover-returning');
      stage.hidden = true;
      cover.hidden = false;
      cover.classList.remove('is-opening');
      returnTimer = setTimeout(clearReturn, 1200);
      cover.querySelector('video')?.play().catch(() => {});
      player.currentTime = 0;
      if (returnFocus) cover.focus({preventScroll:true});
    });
  });
})();
