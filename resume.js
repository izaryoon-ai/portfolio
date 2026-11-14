// Shared cover -> black -> playback, and black -> cover on completion.
(() => {
  document.querySelectorAll('.resume-showreel').forEach(shell => {
    const cover = shell.querySelector('.resume-film-cover');
    const stage = shell.querySelector('.resume-film-stage');
    const player = stage?.querySelector('video');
    if (!cover || !stage) return;
    const frame = stage.querySelector('iframe');
    if (frame?.dataset.vimeoSrc) {
      const dimsPage = Boolean(shell.closest('#about-portfolio-film, .portfolio-film-page, .wake-production, .argent-production'));
      const clearDimming = () => shell.classList.remove('about-film-playing');
      let vimeo;
      cover.addEventListener('click', () => {
        cover.hidden = true;
        stage.hidden = false;
        frame.src = frame.dataset.vimeoSrc;
        frame.focus({preventScroll: true});
        if (!window.Vimeo?.Player) return;
        vimeo = new window.Vimeo.Player(frame);
        vimeo.on('playing', () => {
          if (dimsPage) shell.classList.add('about-film-playing');
        });
        vimeo.on('pause', clearDimming);
        vimeo.on('error', clearDimming);
        vimeo.on('ended', () => {
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
        frame.src = frame.dataset.src;
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
