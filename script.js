document.addEventListener('DOMContentLoaded', () => {
    // ===================== Elementos Principais =====================
    const cardsWrapper = document.querySelector('.cards-wrapper');
    const cards = Array.from(document.querySelectorAll('.glass-card'));
    const prevBtn = document.querySelector('.controls .prev');
    const nextBtn = document.querySelector('.controls .next');
    const paginationContainer = document.querySelector('.pagination-dots');
    const gridToggleBtn = document.querySelector('.grid-toggle-btn');
    const searchInput = document.getElementById('cardSearch');
    const menuMobileBtn = document.querySelector('.menu-mobile-btn');
    const navContent = document.querySelector('.nav-content');

    let currentIndex = 0;
    let autoSlideInterval = null;
    let isPaused = false;
    let isManualPaused = false; // Controlado pela tecla Space no desktop
    let isGridMode = false;

    const isDesktop = () => window.innerWidth > 768;

    // ===================== Botão Voltar (Desktop e Mobile) =====================
    document.querySelectorAll('.btn-voltar').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const destino = btn.getAttribute('data-destino');
            if (destino) {
                window.location.href = destino;
            } else if (window.history.length > 1 && document.referrer !== '') {
                window.history.back();
            } else {
                window.location.href = 'index.html';
            }
        });
    });

    // ===================== Menu Mobile (Hambúrguer) =====================
    if (menuMobileBtn && navContent) {
        menuMobileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            navContent.classList.toggle('ativo');

            const icon = menuMobileBtn.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars', !navContent.classList.contains('ativo'));
                icon.classList.toggle('fa-xmark', navContent.classList.contains('ativo'));
            }
        });

        document.addEventListener('click', (e) => {
            if (!navContent.contains(e.target) && !menuMobileBtn.contains(e.target)) {
                navContent.classList.remove('ativo');
                const icon = menuMobileBtn.querySelector('i');
                if (icon) {
                    icon.classList.add('fa-bars');
                    icon.classList.remove('fa-xmark');
                }
            }
        });
    }

    // ===================== Paginação (Bolinhas) =====================
    function criarBolinhas() {
        if (!paginationContainer || cards.length === 0) return;
        paginationContainer.innerHTML = '';

        cards.forEach((_, index) => {
            const dot = document.createElement('span');
            dot.classList.add('dot');
            if (index === currentIndex) dot.classList.add('active');

            dot.addEventListener('click', () => {
                if (index === currentIndex) return;
                const direcao = index > currentIndex ? 'next' : 'prev';
                currentIndex = index;
                atualizarCarrossel(direcao);
                reiniciarAutoSlide();
            });

            paginationContainer.appendChild(dot);
        });
    }

    function atualizarBolinhas() {
        if (!paginationContainer) return;
        const dots = paginationContainer.querySelectorAll('.dot');
        dots.forEach((dot, idx) => {
            dot.classList.toggle('active', idx === currentIndex);
        });
    }

    // ===================== Carrossel 3D com Giro Sofisticado (Desktop) / Focus Depth (Mobile) =====================
    function atualizarCarrossel(direcao = null) {
        if (cards.length === 0) return;
        const total = cards.length;
        const pausadoAtual = isPaused || isManualPaused;

        cards.forEach((card, index) => {
            card.classList.remove(
                'card-front',
                'card-back-right',
                'card-back-left',
                'card-hidden',
                'pausado',
                'spin-next',
                'spin-prev'
            );

            if (isGridMode) return;

            if (index === currentIndex) {
                void card.offsetWidth; // reinicia a animação de giro e brilho especular
                card.classList.add('card-front');

                if (direcao === 'next') {
                    card.classList.add('spin-next');
                } else if (direcao === 'prev') {
                    card.classList.add('spin-prev');
                }

                if (pausadoAtual) card.classList.add('pausado');
            } else if (index === (currentIndex + 1) % total) {
                card.classList.add('card-back-right');
            } else if (index === (currentIndex - 1 + total) % total) {
                card.classList.add('card-back-left');
            } else {
                card.classList.add('card-hidden');
            }
        });

        atualizarBolinhas();
    }

    function proximoCard() {
        if (cards.length === 0 || isGridMode) return;
        currentIndex = (currentIndex + 1) % cards.length;
        atualizarCarrossel('next');
    }

    function cardAnterior() {
        if (cards.length === 0 || isGridMode) return;
        currentIndex = (currentIndex - 1 + cards.length) % cards.length;
        atualizarCarrossel('prev');
    }

    // ===================== Auto-Slide & Pausa (Hover + Tecla Space) =====================
    function iniciarAutoSlide() {
        pararAutoSlide();
        if (isGridMode || cards.length <= 1) return;

        autoSlideInterval = setInterval(() => {
            if (!isPaused && !isManualPaused && !isGridMode) {
                proximoCard();
            }
        }, 6000);
    }

    function pararAutoSlide() {
        if (autoSlideInterval) {
            clearInterval(autoSlideInterval);
            autoSlideInterval = null;
        }
    }

    function reiniciarAutoSlide() {
        isPaused = false;
        isManualPaused = false;
        iniciarAutoSlide();
    }

    function alternarPausaManual() {
        if (!isDesktop() || isGridMode || cards.length <= 1) return;
        isManualPaused = !isManualPaused;

        const cardAtivo = cards[currentIndex];
        if (cardAtivo) {
            cardAtivo.classList.toggle('pausado', isManualPaused || isPaused);
        }

        if (!isManualPaused) {
            iniciarAutoSlide();
        }
    }

    cards.forEach((card, index) => {
        card.addEventListener('mouseenter', () => {
            if (card.classList.contains('card-front') && !isGridMode) {
                isPaused = true;
                card.classList.add('pausado');
            }
        });

        card.addEventListener('mouseleave', () => {
            if (!isGridMode) {
                isPaused = false;
                if (!isManualPaused) {
                    card.classList.remove('pausado');
                }
            }
        });

        card.addEventListener('click', (e) => {
            if (isGridMode) return;
            if (e.target.closest('a, button')) return;

            if (index !== currentIndex) {
                const direcao = card.classList.contains('card-back-left') ? 'prev' : 'next';
                currentIndex = index;
                atualizarCarrossel(direcao);
                reiniciarAutoSlide();
            }
        });
    });

    // ===================== Botões Anterior / Próximo & Teclado =====================
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            proximoCard();
            reiniciarAutoSlide();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            cardAnterior();
            reiniciarAutoSlide();
        });
    }

    document.addEventListener('keydown', (e) => {
        const tagAtiva = document.activeElement?.tagName;
        if (tagAtiva === 'INPUT' || tagAtiva === 'TEXTAREA' || isGridMode) return;

        if (e.code === 'Space' || e.key === ' ') {
            if (isDesktop()) {
                e.preventDefault();
                alternarPausaManual();
            }
        } else if (e.key === 'ArrowRight') {
            proximoCard();
            reiniciarAutoSlide();
        } else if (e.key === 'ArrowLeft') {
            cardAnterior();
            reiniciarAutoSlide();
        }
    });

    // ===================== Suporte a Swipe (Toque no Celular) =====================
    if (cardsWrapper) {
        let touchStartX = 0;
        let touchEndX = 0;

        cardsWrapper.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        cardsWrapper.addEventListener('touchend', (e) => {
            if (isGridMode) return;
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;

            if (Math.abs(diff) > 45) {
                if (diff > 0) {
                    proximoCard();
                } else {
                    cardAnterior();
                }
                reiniciarAutoSlide();
            }
        }, { passive: true });
    }

    // ===================== Modo Grade (Grid Toggle) =====================
    if (gridToggleBtn && cardsWrapper) {
        gridToggleBtn.addEventListener('click', () => {
            isGridMode = !isGridMode;
            cardsWrapper.classList.toggle('grid-mode', isGridMode);

            const icon = gridToggleBtn.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-table-cells', !isGridMode);
                icon.classList.toggle('fa-layer-group', isGridMode);
            }

            if (isGridMode) {
                pararAutoSlide();
                cards.forEach((c) => c.classList.remove(
                    'card-front', 'card-back-right', 'card-back-left',
                    'card-hidden', 'pausado', 'spin-next', 'spin-prev'
                ));
            } else {
                atualizarCarrossel();
                reiniciarAutoSlide();
            }
        });
    }

    // ===================== Pesquisa de Módulos =====================
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const termo = searchInput.value.trim().toLowerCase();

            if (!termo) {
                cards.forEach((c) => c.classList.remove('search-highlight'));
                return;
            }

            let primeiroMatch = -1;

            cards.forEach((card, index) => {
                const titulo = (card.getAttribute('data-title') || '').toLowerCase();
                const h3 = (card.querySelector('h3')?.textContent || '').toLowerCase();
                const desc = (card.querySelector('.card-desc')?.textContent || '').toLowerCase();

                const encontrou = titulo.includes(termo) || h3.includes(termo) || desc.includes(termo);
                card.classList.toggle('search-highlight', encontrou);

                if (encontrou && primeiroMatch === -1) {
                    primeiroMatch = index;
                }
            });

            if (primeiroMatch !== -1 && !isGridMode && primeiroMatch !== currentIndex) {
                const direcao = primeiroMatch > currentIndex ? 'next' : 'prev';
                currentIndex = primeiroMatch;
                atualizarCarrossel(direcao);
            }
        });
    }

    // ===================== Botões ACESSAR e DETALHES dos Cards =====================
    document.querySelectorAll('.glass-card .btn-primary').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const link = btn.querySelector('a');
            if (link && e.target !== link && !link.contains(e.target)) {
                const href = link.getAttribute('href');
                const target = link.getAttribute('target');
                if (href && href !== '#') {
                    if (target === '_blank') {
                        window.open(href, '_blank', 'noopener,noreferrer');
                    } else {
                        window.location.href = href;
                    }
                }
            }
        });
    });

    document.querySelectorAll('.glass-card .btn-glass').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const card = btn.closest('.glass-card');
            const titulo = card?.querySelector('h3')?.textContent?.trim() || 'Módulo';
            const descricao = card?.querySelector('.card-desc')?.textContent?.trim() || '';
            alert(`${titulo}\n\n${descricao}`);
        });
    });

    // ===================== Inicialização =====================
    criarBolinhas();
    atualizarCarrossel();
    iniciarAutoSlide();
});
