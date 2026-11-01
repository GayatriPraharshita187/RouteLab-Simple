/* ============================================
   RouteLab-Simple | app.js
   Navigation, scroll behavior, mobile menu
   ============================================ */

(function () {
    'use strict';

    /* ---------- Navbar scroll effect ---------- */
    const navbar = document.getElementById('navbar');

    function handleScroll() {
        if (window.scrollY > 30) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    /* ---------- Mobile nav toggle ---------- */
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');

    navToggle.addEventListener('click', function () {
        navToggle.classList.toggle('open');
        navLinks.classList.toggle('open');
    });

    /* ---------- Close mobile menu on link click ---------- */
    const linkElements = navLinks.querySelectorAll('.nav-link');
    linkElements.forEach(function (link) {
        link.addEventListener('click', function () {
            navToggle.classList.remove('open');
            navLinks.classList.remove('open');
        });
    });

    /* ---------- Active link tracking via IntersectionObserver ---------- */
    const sections = document.querySelectorAll('section[id]');
    const navLinkMap = {};

    linkElements.forEach(function (link) {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
            navLinkMap[href.substring(1)] = link;
        }
    });

    const observerOptions = {
        rootMargin: '-40% 0px -55% 0px',
    };

    const sectionObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                linkElements.forEach(function (l) { l.classList.remove('active'); });
                if (navLinkMap[id]) {
                    navLinkMap[id].classList.add('active');
                }
            }
        });
    }, observerOptions);

    sections.forEach(function (section) {
        sectionObserver.observe(section);
    });

    /* ---------- Explore Simulator button ---------- */
    /* The button is an anchor tag so it handles navigation natively,
       but we log interaction for completeness. */
    const exploreBtn = document.querySelector('.btn-lg');
    if (exploreBtn) {
        exploreBtn.addEventListener('click', function () {
            console.log('[RouteLab] Navigating to Network Builder...');
        });
    }

    /* ---------- Algorithm card smooth scroll feedback ---------- */
    const algoCards = document.querySelectorAll('.algo-card');
    algoCards.forEach(function (card) {
        card.addEventListener('click', function () {
            const target = card.getAttribute('href');
            console.log('[RouteLab] Scrolling to algorithm:', target);
        });
    });

    console.log('[RouteLab-Simple] App initialized.');
})();
