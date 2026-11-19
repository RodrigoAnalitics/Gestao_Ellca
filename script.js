document.addEventListener('DOMContentLoaded', () => {
    const items = document.querySelectorAll('.item');
    const navItems = document.querySelectorAll('.nav-item');
    const gridToggleBtns = document.querySelectorAll('.grid-toggle-btn');
    const menuMobileBtn = document.querySelector('.menu-mobile-btn');
    const navContent = document.querySelector('.nav-content');
    const searchInput = document.querySelector('.search-box input');

    let isGridMode = false;
    const itemStates = new Map();

    // ===================== Disparo da Fumaça Hollywoodiana =====================
    function dispararFumacaTransicao(itemEl) {
        if (!itemEl || isGridMode) return;
        const wrapper = itemEl.querySelector('.cards-wrapper');
        if (!wrapper) return;

        wrapper.classList.remove('smoke-burst');
        void wrapper.offsetWidth; // Reinicia o ciclo da animação instantaneamente
        wrapper.classList.add('smoke-burst');
    }

    // ===================== Inicialização por Aba / Seção =====================
    items.forEach((item, itemIdx) => {
        const wrapper = item.querySelector('.cards-wrapper');
        const cards = wrapper ? Array.from(wrapper.querySelectorAll('.glass-card')) : [];
        const dotsContainer = item.querySelector('.pagination-dots');
        const prevBtn = item.querySelector('.controls button:first-child');
        const nextBtn = item.querySelector('.controls button:last-child');

        const state = {
            currentIndex: 0,
            cards,
            dots: [],
            wrapper
        };
        itemStates.set(item, state);

        // Cria as bolinhas de paginação dinamicamente conforme a quantidade de cards
        if (dotsContainer && cards.length > 0) {
            dotsContainer.innerHTML = '';
            cards.forEach((_, idx) => {
                const dot = document.createElement('span');
                dot.className = 'dot' + (idx === 0 ? ' active' : '');
                dot.addEventListener('click', (e) => {
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

        // Botões Anterior e Próximo
        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (state.cards.length <= 1) return;
                state.currentIndex = (state.currentIndex - 1 + state.cards.length) % state.cards.length;
                atualizarCarrossel(item, true);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (state.cards.length <= 1) return;
                state.currentIndex = (state.currentIndex + 1) % state.cards.length;
                atualizarCarrossel(item, true);
            });
        }

        // Clique nos cards laterais traz o card para frente
        cards.forEach((card, idx) => {
            card.addEventListener('click', (e) => {
                if (isGridMode) return;
                if (e.target.closest('a, button')) return;
                if (state.currentIndex !== idx) {
                    state.currentIndex = idx;
                    atualizarCarrossel(item, true);
                }
            });
        });

        // Suporte a Swipe (arrastar dedo no mobile)
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
                    if (diff > 0) {
                        state.currentIndex = (state.currentIndex + 1) % state.cards.length;
                    } else {
                        state.currentIndex = (state.currentIndex - 1 + state.cards.length) % state.cards.length;
                    }
                    atualizarCarrossel(item, true);
                }
            }, { passive: true });
        }

        // Define primeira seção como ativa caso nenhuma tenha .active no HTML
        if (itemIdx === 0 && !document.querySelector('.item.active')) {
            item.classList.add('active');
        }

        atualizarCarrossel(item, false);
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

        state.dots.forEach((dot, idx) => {
            dot.classList.toggle('active', idx === activeIdx);
        });

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
        btn.addEventListener('click', () => {
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
        menuMobileBtn.addEventListener('click', (e) => {
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

    // ===================== Navegação por Teclado (Setas Esquerda/Direita) =====================
    document.addEventListener('keydown', (e) => {
        if (document.activeElement === searchInput || isGridMode) return;
        const activeItem = document.querySelector('.item.active');
        if (!activeItem) return;

        const state = itemStates.get(activeItem);
        if (!state || state.cards.length <= 1) return;

        if (e.key === 'ArrowRight') {
            state.currentIndex = (state.currentIndex + 1) % state.cards.length;
            atualizarCarrossel(activeItem, true);
        } else if (e.key === 'ArrowLeft') {
            state.currentIndex = (state.currentIndex - 1 + state.cards.length) % state.cards.length;
            atualizarCarrossel(activeItem, true);
        }
    });
});
