const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduceMotion && 'IntersectionObserver' in window) {
  const cards = Array.from(
    document.querySelectorAll<HTMLElement>('.editorial-card, .project-card'),
  );
  const foldY = window.innerHeight * 0.96;

  const belowFold = cards.filter((el) => {
    const rect = el.getBoundingClientRect();
    return rect.top >= foldY;
  });

  if (belowFold.length > 0) {
    belowFold.forEach((el) => el.classList.add('scroll-reveal-ready'));

    const observer = new IntersectionObserver(
      (entries) => {
        let batchDelay = 0;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const target = entry.target as HTMLElement;
          if (batchDelay > 0) {
            target.style.transitionDelay = `${Math.min(batchDelay, 180)}ms`;
          }
          batchDelay += 45;
          target.classList.add('is-revealed');
          observer.unobserve(target);
        }
      },
      {
        rootMargin: '0px 0px -30px 0px',
        threshold: 0.04,
      },
    );

    belowFold.forEach((el) => observer.observe(el));
  }
}
