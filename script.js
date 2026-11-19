document.addEventListener('DOMContentLoaded', () => {
    const items = Array.from(document.querySelectorAll('.item'));
    const navItems = Array.from(document.querySelectorAll('.nav-item'));
    const gridToggleBtns = document.querySelectorAll('.grid-toggle-btn');
    const voltarBtns = document.querySelectorAll('.btn-voltar');
    const menuMobileBtn = document.querySelector('.menu-mobile-btn');
    const navContent = document.querySelector('.nav-content');
    const searchInput = document.querySelector('.search-box input');

    let isGridMode = false;
    const itemStates = new Map();

    // ===================== Disparo da Fumaça Suave =====================
    function dispararFumacaTransicao(itemEl) {
        if (!itemEl || isGridMode) return;
        const wrapper = itemEl.querySelector('.cards-wrapper');
        if (!wrapper) return;

        wrapper.classList.remove('smoke-burst');
        void wrapper.offsetWidth;
        wrapper.classList.add('smoke-burst');
    }

    // ===================== Funções Globais de Avançar / Voltar Slide =====================
    function moverCardAtivo(direcao) {
        const activeItem = document.querySelector('.item.active') || items[0];
        if (!activeItem || isGridMode) return;

        const state = itemStates.get(activeItem);
        if (!state || state.cards.length <= 1) return;

        state.currentIndex = (state.currentIndex + direcao + state.cards.length) % state.cards.length;
        atualizarCarrossel(activeItem, true);
    }

    // ===================== Inicialização por Aba / Seção =====================
    items.forEach((item, itemIdx) => {
        const wrapper = item.querySelector('.cards-wrapper');
        const cards = wrapper ? Array.from(wrapper.querySelectorAll('.glass-card')) : [];
        const dotsContainer = item.querySelector('.pagination-dots') || document.querySelector('.pagination-dots');

        const state = {
            currentIndex: 0,
            cards,
            dots: [],
            wrapper
        };
        itemStates.set(item, state);

        // Cria bolinhas de paginação
        if (dotsContainer && cards.length > 0) {
            dotsContainer.innerHTML = '';
            cards.forEach((_, idx) => {
                const dot = document.createElement('span');
                dot.className = 'dot' + (idx === 0 ? ' active' : '');
                dot.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (state.currentIndex !== idx) {
                        state.currentIndex = idx;
                        atualizarCarrossel(item, true);
                    }
                });
                dotsContainer.appendChild(dot);
                state.dots.push(dot);
            });
        }

        // Clique nos cards laterais traz o card para frente sem bloquear links/botões internos
        cards.forEach((card, idx) => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('a, button, .btn-primary, .btn-glass')) return;
                if (isGridMode) return;
                if (state.currentIndex !== idx) {
                    state.currentIndex = idx;
                    atualizarCarrossel(item, true);
                }
            });
        });

        // Suporte a Swipe no Mobile
        if (wrapper) {
            let touchStartX = 0;
            let touchEndX = 0;

            wrapper.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });

            wrapper.addEventListener('touchend', (e) => {
                if (isGridMode || state.cards.length <= 1) return;
                touchEndX = e.changedTouches[0].screenX;
                const diff = touchStartX - touchEndX;

                if (Math.abs(diff) > 42) {
                    moverCardAtivo(diff > 0 ? 1 : -1);
                }
            }, { passive: true });
        }

        if (itemIdx === 0 && !document.querySelector('.item.active')) {
            item.classList.add('active');
        }

        atualizarCarrossel(item, false);
    });

    // ===================== Conserto Universal dos Botões Anterior / Próximo =====================
    // Funciona tanto se .controls estiver dentro de cada .item quanto fixo fora dele
    document.querySelectorAll('.controls').forEach((controlsBox) => {
        const botoes = controlsBox.querySelectorAll('button');
        if (botoes.length >= 2) {
            botoes[0].type = 'button';
            botoes[1].type = 'button';

            botoes[0].addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                moverCardAtivo(-1);
            });

            botoes[1].addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                moverCardAtivo(1);
            });
        }
    });

    // ===================== Botão Voltar (Capa / Histórico) =====================
    voltarBtns.forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const href = btn.getAttribute('href');
            if (!href || href === '#') {
                e.preventDefault();
                if (window.history.length > 1) {
                    window.history.back();
                } else {
                    window.location.href = 'index.html';
                }
            }
        });
    });

    // ===================== Atualiza Posições 3D dos Cards =====================
    function atualizarCarrossel(item, comFumaca = true) {
        const state = itemStates.get(item);
        if (!state || state.cards.length === 0) return;

        const total = state.cards.length;
        const activeIdx = state.currentIndex;
        const rightIdx = (activeIdx + 1) % total;
        const leftIdx = (activeIdx - 1 + total) % total;

        state.cards.forEach((card, idx) => {
            card.classList.remove('card-front', 'card-back-right', 'card-back-left', 'card-hidden');

            if (idx === activeIdx) {
                card.classList.add('card-front');
            } else if (total > 1 && idx === rightIdx) {
                card.classList.add('card-back-right');
            } else if (total > 2 && idx === leftIdx) {
                card.classList.add('card-back-left');
            } else {
                card.classList.add('card-hidden');
            }
        });

        // Se existir uma barra .pagination-dots global fora de .item, recria/sincroniza também
        const globalDotsContainer = document.querySelector('body > .controls-container .pagination-dots, .container > .controls-container .pagination-dots');
        if (globalDotsContainer) {
            globalDotsContainer.innerHTML = '';
            state.cards.forEach((_, idx) => {
                const dot = document.createElement('span');
                dot.className = 'dot' + (idx === activeIdx ? ' active' : '');
                dot.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (state.currentIndex !== idx) {
                        state.currentIndex = idx;
                        atualizarCarrossel(item, true);
                    }
                });
                globalDotsContainer.appendChild(dot);
            });
        } else {
            state.dots.forEach((dot, idx) => {
                dot.classList.toggle('active', idx === activeIdx);
            });
        }

        if (comFumaca) {
            dispararFumacaTransicao(item);
        }
    }

    // ===================== Navegação entre Setores / Abas da Navbar =====================
    navItems.forEach((nav, idx) => {
        nav.addEventListener('click', (e) => {
            const targetId = nav.getAttribute('data-target') || nav.getAttribute('href');
            let targetItem = null;

            if (targetId && targetId.startsWith('#') && targetId.length > 1) {
                targetItem = document.querySelector(targetId);
            } else if (items[idx]) {
                targetItem = items[idx];
            }

            if (targetItem) {
                e.preventDefault();
                items.forEach(it => it.classList.remove('active'));
                navItems.forEach(n => n.classList.remove('active'));

                targetItem.classList.add('active');
                nav.classList.add('active');

                atualizarCarrossel(targetItem, true);

                if (navContent && navContent.classList.contains('ativo')) {
                    navContent.classList.remove('ativo');
                }
            }
        });
    });

    // ===================== Alternar Modo Carrossel 3D / Modo Grade =====================
    gridToggleBtns.forEach(btn => {
        btn.type = 'button';
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            isGridMode = !isGridMode;
            document.querySelectorAll('.cards-wrapper').forEach(wrapper => {
                wrapper.classList.toggle('grid-mode', isGridMode);
            });

            if (!isGridMode) {
                const activeItem = document.querySelector('.item.active');
                if (activeItem) atualizarCarrossel(activeItem, true);
            }
        });
    });

    // ===================== Menu Mobile =====================
    if (menuMobileBtn && navContent) {
        menuMobileBtn.type = 'button';
        menuMobileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            navContent.classList.toggle('ativo');
        });

        document.addEventListener('click', (e) => {
            if (!navContent.contains(e.target) && !menuMobileBtn.contains(e.target)) {
                navContent.classList.remove('ativo');
            }
        });
    }

    // ===================== Busca em Tempo Real =====================
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const termo = e.target.value.trim().toLowerCase();
            const allCards = document.querySelectorAll('.glass-card');

            allCards.forEach(card => card.classList.remove('search-highlight'));
            if (!termo) return;

            let primeiroMatch = null;

            items.forEach((item, itemIdx) => {
                const state = itemStates.get(item);
                if (!state) return;

                state.cards.forEach((card, cardIdx) => {
                    const texto = card.innerText.toLowerCase();
                    if (texto.includes(termo)) {
                        card.classList.add('search-highlight');
                        if (!primeiroMatch) {
                            primeiroMatch = { item, itemIdx, cardIdx };
                        }
                    }
                });
            });

            if (primeiroMatch) {
                items.forEach(it => it.classList.remove('active'));
                navItems.forEach(n => n.classList.remove('active'));

                primeiroMatch.item.classList.add('active');
                if (navItems[primeiroMatch.itemIdx]) {
                    navItems[primeiroMatch.itemIdx].classList.add('active');
                }

                const state = itemStates.get(primeiroMatch.item);
                if (state && state.currentIndex !== primeiroMatch.cardIdx) {
                    state.currentIndex = primeiroMatch.cardIdx;
                    atualizarCarrossel(primeiroMatch.item, true);
                }
            }
        });
    }

    // ===================== Navegação por Teclado =====================
    document.addEventListener('keydown', (e) => {
        if (document.activeElement === searchInput || isGridMode) return;
        if (e.key === 'ArrowRight') moverCardAtivo(1);
        if (e.key === 'ArrowLeft') moverCardAtivo(-1);
    });
});
