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

    // ===================== Gerador Procedural de Raios Reais Ramificados =====================
    function gerarCaminhoRaio(x1, y1, x2, y2, deslocamento, profundidade) {
        if (profundidade <= 0) {
            return `M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)} `;
        }

        const midX = (x1 + x2) / 2 + (Math.random() - 0.5) * deslocamento;
        const midY = (y1 + y2) / 2 + (Math.random() - 0.5) * deslocamento;

        let path = '';
        path += gerarCaminhoRaio(x1, y1, midX, midY, deslocamento * 0.55, profundidade - 1);
        path += gerarCaminhoRaio(midX, midY, x2, y2, deslocamento * 0.55, profundidade - 1);

        // Ramificações secundárias aleatórias (como descargas reais)
        if (profundidade >= 2 && Math.random() < 0.42) {
            const angulo = Math.atan2(y2 - y1, x2 - x1) + (Math.random() > 0.5 ? 0.55 : -0.55);
            const comp = Math.hypot(x2 - x1, y2 - y1) * (0.35 + Math.random() * 0.25);
            const branchX = midX + Math.cos(angulo) * comp;
            const branchY = midY + Math.sin(angulo) * comp;
            path += gerarCaminhoRaio(midX, midY, branchX, branchY, deslocamento * 0.35, profundidade - 2);
        }

        return path;
    }

    function dispararRaioProcedural(card) {
        if (!card) return;
        const anterior = card.querySelector('.lightning-svg-layer');
        if (anterior) anterior.remove();

        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('class', 'lightning-svg-layer');
        svg.setAttribute('viewBox', '0 0 290 360');
        svg.setAttribute('preserveAspectRatio', 'none');

        const filterId = `bolt-glow-${Math.floor(Math.random() * 100000)}`;
        const defs = document.createElementNS(svgNS, 'defs');
        defs.innerHTML = `
            <filter id="${filterId}" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="2.4" result="blur"/>
                <feMerge>
                    <feMergeNode in="blur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        `;
        svg.appendChild(defs);

        // Escolhe pontos de origem e destino discretos nas bordas do card
        const lado = Math.random();
        let x1, y1, x2, y2;
        if (lado < 0.5) {
            // Canto superior esquerdo para borda direita/inferior
            x1 = 10 + Math.random() * 60;
            y1 = 0;
            x2 = 220 + Math.random() * 70;
            y2 = 120 + Math.random() * 180;
        } else {
            // Canto superior direito para borda esquerda/inferior
            x1 = 220 + Math.random() * 65;
            y1 = 0;
            x2 = 5 + Math.random() * 75;
            y2 = 130 + Math.random() * 170;
        }

        const dPrincipal = gerarCaminhoRaio(x1, y1, x2, y2, 34, 4);

        // Halo externo ciano
        const halo = document.createElementNS(svgNS, 'path');
        halo.setAttribute('d', dPrincipal);
        halo.setAttribute('fill', 'none');
        halo.setAttribute('stroke', '#00d4ff');
        halo.setAttribute('stroke-width', '2.2');
        halo.setAttribute('stroke-opacity', '0.55');
        halo.setAttribute('stroke-linecap', 'round');
        halo.setAttribute('filter', `url(#${filterId})`);

        // Núcleo branco fino de alta tensão
        const nucleo = document.createElementNS(svgNS, 'path');
        nucleo.setAttribute('d', dPrincipal);
        nucleo.setAttribute('fill', 'none');
        nucleo.setAttribute('stroke', '#ffffff');
        nucleo.setAttribute('stroke-width', '0.95');
        nucleo.setAttribute('stroke-opacity', '0.9');
        nucleo.setAttribute('stroke-linecap', 'round');

        svg.appendChild(halo);
        svg.appendChild(nucleo);
        card.appendChild(svg);

        setTimeout(() => {
            if (svg.parentNode) svg.remove();
        }, 1200);
    }

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

    // ===================== Carrossel 3D com Giros Suaves + Raios Reais =====================
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
                void card.offsetWidth; // força reflow para reiniciar animação suavemente
                card.classList.add('card-front');

                if (direcao === 'next') {
                    card.classList.add('spin-next');
                    dispararRaioProcedural(card);
                } else if (direcao === 'prev') {
                    card.classList.add('spin-prev');
                    dispararRaioProcedural(card);
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
                cards.forEach((c) => {
                    c.classList.remove(
                        'card-front', 'card-back-right', 'card-back-left',
                        'card-hidden', 'pausado', 'spin-next', 'spin-prev'
                    );
                    const raio = c.querySelector('.lightning-svg-layer');
                    if (raio) raio.remove();
                });
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
