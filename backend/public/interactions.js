(() => {
  'use strict';
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const canAnimate = () => !motion.matches && !document.hidden;
  document.documentElement.classList.add('js');

  const menu = document.getElementById('primary-nav');
  const burger = document.getElementById('burger');
  const compactNav = window.matchMedia('(max-width: 1100px)');
  function closeMenu(returnFocus = false) {
    menu.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open navigation');
    if (returnFocus) burger.focus();
  }
  burger.hidden = false;
  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') !== 'true';
    menu.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });
  menu.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') closeMenu(true);
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.nav-in')) closeMenu();
  });
  compactNav.addEventListener('change', () => closeMenu());

  const hero = document.querySelector('.hero');
  const matrix = document.querySelector('.matrix');
  const playButton = document.getElementById('play-walkthrough');
  const result = document.querySelector('.preview-result');
  const cursor = document.querySelector('.evaluation-cursor');
  const comment = document.querySelector('.comment-copy');
  const feedback = comment.textContent;
  let walkthroughTimers = [];
  let typingFrame = 0;
  let playing = false;
  let previewVisible = !('IntersectionObserver' in window);
  const previewInUse = () => Boolean(matrix.querySelector(':focus-visible'));
  const schedule = (callback, delay) => walkthroughTimers.push(setTimeout(callback, delay));
  function stopWalkthrough() {
    cancelAnimationFrame(typingFrame);
    walkthroughTimers.forEach(clearTimeout);
    walkthroughTimers = [];
    playing = false;
    typingFrame = 0;
    matrix.classList.remove('is-playing');
    cursor.classList.remove('is-visible', 'is-clicking');
    comment.textContent = feedback;
    document.querySelectorAll('.is-marking').forEach(element => element.classList.remove('is-marking'));
  }
  function selectRating(button, index, announce = true) {
    const question = button.closest('.demo-q');
    question.querySelectorAll('.rate-pill').forEach(rating => {
      const selected = rating === button;
      rating.classList.toggle('selected', selected);
      rating.classList.remove('is-chosen');
      rating.setAttribute('aria-pressed', String(selected));
    });
    if (canAnimate()) {
      void button.offsetWidth;
      button.classList.add('is-chosen');
    }
    if (announce) result.textContent = `Example Q${index + 2}: ${button.textContent} out of 5 selected. Your changes are not saved.`;
  }
  function moveCursor(target, x = .5, y = .5) {
    const box = matrix.getBoundingClientRect();
    const destination = target.getBoundingClientRect();
    cursor.style.transform = `translate(${destination.left - box.left + destination.width * x}px, ${destination.top - box.top + destination.height * y}px)`;
  }
  function clickRating(button, index) {
    cursor.classList.remove('is-clicking');
    void cursor.offsetWidth;
    cursor.classList.add('is-clicking');
    selectRating(button, index, false);
  }
  function playWalkthrough(force = false) {
    stopWalkthrough();
    if (!canAnimate() || !previewVisible || (!force && previewInUse())) return;
    playing = true;
    const automaticMessage = 'Animated example. Try the ratings; your changes are not saved.';
    if (result.textContent !== automaticMessage) result.textContent = automaticMessage;
    matrix.classList.add('is-playing');
    const questions = [...document.querySelectorAll('.demo-q')];
    const first = questions[0].querySelectorAll('.rate-pill')[3];
    const second = questions[1].querySelectorAll('.rate-pill')[1];
    comment.textContent = '';
    // Each cycle clears the illustrative ratings, then visibly selects them.
    questions.forEach(question => question.querySelectorAll('.rate-pill').forEach(button => {
      button.classList.remove('selected', 'is-chosen');
      button.setAttribute('aria-pressed', 'false');
    }));
    cursor.classList.add('is-resetting');
    moveCursor(questions[0], .8, .05);
    void cursor.offsetWidth;
    cursor.classList.remove('is-resetting');
    schedule(() => cursor.classList.add('is-visible'), 120);
    schedule(() => { questions[0].classList.add('is-marking'); moveCursor(first); }, 350);
    schedule(() => clickRating(first, 0), 1100);
    schedule(() => {
      questions[0].classList.remove('is-marking');
      questions[1].classList.add('is-marking');
      cursor.classList.remove('is-clicking');
      moveCursor(second);
    }, 1900);
    schedule(() => clickRating(second, 1), 2700);
    schedule(() => {
      questions[1].classList.remove('is-marking');
      cursor.classList.remove('is-clicking');
      document.querySelector('.demo-comment').classList.add('is-marking');
      moveCursor(comment, .12, .5);
    }, 3400);
    schedule(() => {
      cursor.classList.add('is-clicking');
      const started = performance.now();
      let written = -1;
      function typeFeedback(now) {
        const length = Math.min(Math.floor((now - started) / 28), feedback.length);
        if (length !== written) {
          comment.textContent = feedback.slice(0, length);
          written = length;
        }
        if (length < feedback.length) typingFrame = requestAnimationFrame(typeFeedback);
      }
      typingFrame = requestAnimationFrame(typeFeedback);
    }, 4200);
    schedule(() => {
      cursor.classList.remove('is-visible', 'is-clicking');
      document.querySelector('.demo-comment').classList.remove('is-marking');
    }, 6100);
    schedule(() => playWalkthrough(force), 7800);
  }
  playButton.hidden = false;
  playButton.addEventListener('click', () => playWalkthrough(true));
  function resumePreview() {
    if (canAnimate() && previewVisible && !previewInUse() && !playing) {
      walkthroughTimers.forEach(clearTimeout);
      walkthroughTimers = [];
      schedule(() => playWalkthrough(), 700);
    }
  }
  matrix.addEventListener('focusin', stopWalkthrough);
  matrix.addEventListener('focusout', () => queueMicrotask(resumePreview));
  function syncMotion() {
    document.documentElement.classList.toggle('motion-paused', !canAnimate());
    if (!canAnimate()) stopWalkthrough();
    else resumePreview();
  }
  syncMotion();
  motion.addEventListener('change', () => {
    syncMotion();
    document.querySelectorAll('[data-count]').forEach(number => { number.textContent = number.dataset.count; });
  });
  document.addEventListener('visibilitychange', syncMotion);

  // A local, illustrative assessment: nothing is posted to the live system.
  document.querySelectorAll('.demo-q').forEach((question, index) => {
    const label = question.querySelector('p');
    label.id = `preview-question-${index + 1}`;
    question.querySelector('.rate-row').setAttribute('aria-labelledby', label.id);
    question.querySelectorAll('.rate-pill').forEach(button => {
      button.addEventListener('click', () => {
        stopWalkthrough();
        selectRating(button, index);
        schedule(resumePreview, 4500);
      });
      button.addEventListener('animationend', () => button.classList.remove('is-chosen'));
    });
  });

  const slides = [
    { src: 'images/admin_home.png', title: 'Admin dashboard', desc: 'Course-scoped setup, progress tracking, and data exports at a glance.' },
    { src: 'images/assessor_home.png', title: 'Assessor workspace', desc: 'Granular rubric grading with group and individual evaluation tracking.' },
    { src: 'images/student_home.png', title: 'Student portal', desc: 'Self, peer, and group assessment in one dedicated view.' }
  ];
  let requestedIndex = 0;
  let displayedIndex = 0;
  let requestId = 0;
  const carousel = document.getElementById('screenshot-carousel');
  const image = document.getElementById('carousel-img');
  const title = document.getElementById('carousel-title');
  const description = document.getElementById('carousel-desc');
  const previous = document.getElementById('carousel-prev');
  const next = document.getElementById('carousel-next');
  const portalSelector = document.querySelector('.portal-selector');
  const portalButtons = [...portalSelector.querySelectorAll('button')];
  portalSelector.hidden = false;
  previous.hidden = next.hidden = false;
  title.textContent = `${slides[0].title} (1 of ${slides.length})`;
  function changeSlide(direction, directIndex) {
    requestedIndex = directIndex ?? (requestedIndex + direction + slides.length) % slides.length;
    const index = requestedIndex;
    const ticket = ++requestId;
    const slide = slides[index];
    const preload = new Image();
    carousel.setAttribute('aria-busy', 'true');
    preload.onload = () => {
      if (ticket !== requestId) return;
      image.classList.remove('slide-enter');
      image.src = slide.src;
      displayedIndex = index;
      image.alt = slide.title;
      title.textContent = `${slide.title} (${index + 1} of ${slides.length})`;
      description.textContent = slide.desc;
      portalButtons.forEach((button, buttonIndex) => button.setAttribute('aria-pressed', String(buttonIndex === index)));
      carousel.removeAttribute('aria-busy');
      if (canAnimate()) {
        // Restart the finite transition, even when navigating quickly.
        void image.offsetWidth;
        image.classList.add('slide-enter');
      }
    };
    preload.onerror = () => {
      if (ticket !== requestId) return;
      carousel.removeAttribute('aria-busy');
      requestedIndex = displayedIndex;
      description.textContent = 'This screenshot could not be loaded. Please try another.';
    };
    preload.src = slide.src;
  }
  previous.addEventListener('click', () => changeSlide(-1));
  next.addEventListener('click', () => changeSlide(1));
  portalButtons.forEach(button => button.addEventListener('click', () => changeSlide(0, Number(button.dataset.slide))));
  carousel.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      changeSlide(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });
  image.addEventListener('animationend', () => image.classList.remove('slide-enter'));
  // Horizontal swipes change portals while vertical gestures retain normal scrolling.
  let swipeStart = null;
  const carouselImage = carousel.querySelector('.carousel-image');
  carouselImage.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' || event.target.closest('button')) return;
    swipeStart = { x: event.clientX, y: event.clientY };
  });
  carouselImage.addEventListener('pointerup', event => {
    if (!swipeStart) return;
    const dx = event.clientX - swipeStart.x;
    const dy = event.clientY - swipeStart.y;
    swipeStart = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.3) changeSlide(dx < 0 ? 1 : -1);
  });
  carouselImage.addEventListener('pointercancel', () => { swipeStart = null; });

  const expandButton = document.getElementById('expand-screenshot');
  const screenshotDialog = document.getElementById('screenshot-dialog');
  expandButton.hidden = false;
  expandButton.addEventListener('click', () => {
    const enlarged = document.getElementById('enlarged-screenshot');
    enlarged.src = image.src;
    enlarged.alt = image.alt;
    document.getElementById('screenshot-dialog-title').textContent = image.alt;
    screenshotDialog.showModal();
  });
  document.getElementById('close-screenshot').addEventListener('click', () => screenshotDialog.close());
  screenshotDialog.addEventListener('click', event => {
    if (event.target !== screenshotDialog) return;
    const box = screenshotDialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) screenshotDialog.close();
  });
  screenshotDialog.addEventListener('close', () => expandButton.focus());

  if (!('IntersectionObserver' in window)) { resumePreview(); return; }
  // A shared entrance vocabulary with short, bounded stagger across related objects.
  const heroObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      hero.classList.toggle('ambient-running', entry.isIntersecting);
      if (entry.isIntersecting) {
        if (canAnimate()) {
          hero.classList.add('is-arriving');
        }
      }
    });
  }, { threshold: .25 });
  heroObserver.observe(hero);
  const navLinks = [...menu.querySelectorAll('a[href^="#"]')];
  const visibleSections = new Set();
  const navObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) visibleSections.add(entry.target);
      else visibleSections.delete(entry.target);
    });
    const current = [...visibleSections].sort((a, b) => Math.abs(a.getBoundingClientRect().top - 160) - Math.abs(b.getBoundingClientRect().top - 160))[0];
    navLinks.forEach(link => {
      if (current && link.hash === `#${current.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-20% 0px -55% 0px', threshold: 0 });
  navLinks.forEach(link => {
    const section = document.getElementById(link.hash.slice(1));
    if (section) navObserver.observe(section);
  });
  navObserver.observe(hero);
  const previewObserver = new IntersectionObserver(entries => {
    previewVisible = entries[0].isIntersecting;
    if (previewVisible) resumePreview();
    else stopWalkthrough();
  }, { threshold: .25 });
  previewObserver.observe(matrix);
  let previewWidth = matrix.offsetWidth;
  if ('ResizeObserver' in window) new ResizeObserver(() => {
    if (matrix.offsetWidth === previewWidth) return;
    previewWidth = matrix.offsetWidth;
    stopWalkthrough();
    resumePreview();
  }).observe(matrix);
  const ambientObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.target.classList.toggle('ambient-running', entry.isIntersecting));
  }, { threshold: .1 });
  document.querySelectorAll('.flow').forEach(element => ambientObserver.observe(element));
  function countUp(number) {
    if (!canAnimate()) return;
    const target = Number(number.dataset.count);
    const started = performance.now();
    function frame(now) {
      if (!canAnimate()) { number.textContent = target; return; }
      const progress = Math.min((now - started) / 850, 1);
      number.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  const arrivalObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      if (canAnimate()) entry.target.classList.add('is-arriving');
      const number = entry.target.querySelector('[data-count]');
      if (number) countUp(number);
      arrivalObserver.unobserve(entry.target);
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.feat, .pains, .flow, .stats, .roadmap-grid').forEach(group => {
    [...group.children].forEach((item, index) => item.style.setProperty('--stagger', `${Math.min(index * 65, 260)}ms`));
  });
  document.querySelectorAll('.sec-head, .pain, .card, .flow, .stat, .milestone, .quote, .roadmap-card, .carousel-container, .cta-card, .tag-group, .evidence-layout').forEach(element => {
    element.classList.add('motion-item');
    element.addEventListener('animationend', event => {
      if (event.target === element) element.classList.remove('is-arriving');
    });
    arrivalObserver.observe(element);
  });

  const milestones = [...document.querySelectorAll('.milestone')];
  const timelineLinks = [...document.querySelectorAll('.milestone-nav a')];
  const timelineObserver = new IntersectionObserver(entries => {
    const current = entries.filter(entry => entry.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
    if (!current) return;
    const year = current.target.querySelector('time').dateTime;
    milestones.forEach(milestone => milestone.classList.toggle('is-current', milestone === current.target));
    timelineLinks.forEach(link => {
      if (link.textContent === year) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-20% 0px -45% 0px', threshold: 0 });
  milestones.forEach(milestone => timelineObserver.observe(milestone));
})();
