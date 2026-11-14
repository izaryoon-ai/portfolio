(() => {
  document.querySelectorAll('video.poster-tone-pending').forEach(video => {
    const clear = () => {
      video.classList.remove('poster-tone-pending');
      video.closest('.film-hover-preview')?.classList.add('has-started');
    };
    video.addEventListener('play', clear, {once:true});
    if (!video.paused || video.currentTime > 0) clear();
  });
})();
