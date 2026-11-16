document.addEventListener('DOMContentLoaded', () => {
    const TEMPO_POR_CARD = 6000; // Deve ser igual à duração da animação CSS (6s = 6000ms)
    let timerAutomatico = null;
    let estaPausado = false;

    const navItems = document.querySelectorAll('.nav-item');
    const items = document.querySelectorAll('.item');
    const menuMobileBtn = document.querySelector('.menu-mobile-btn');
    const navContent = document.querySelector('.nav-content');
    const gridToggleBtn = document.querySelector('.grid-toggle-btn');
    const searchInput = document.querySelector('.search-box input');

    // ===================== Menu Mobile =====================
    if (menuMobileBtn && navContent) {
        menuMobileBtn.addEventListener('click', () => {
            navContent.classList.toggle('ativo');
        });
    }

    // ===================== Alternar Modo Grade / Carrossel =====================
    if (gridToggleBtn) {
        gridToggleBtn.addEventListener('click', () => {
            const abaAtiva = document.querySelector('.item.active');
            if (!abaAtiva) return;

            const wrapper = abaAtiva.querySelector('.cards-wrapper');
            if (wrapper) {
                wrapper.classList.toggle('grid-mode');
                const icone = gridToggleBtn.querySelector('i');
                if (icone) {
                    icone.classList.toggle('fa-th-large');
                    icone.classList.toggle('fa-clone');
                }
            }
        });
    }

    // ===================== Navegação entre Abas (Navbar) =====================
    navItems.forEach((nav, index) => {
        nav.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(n => n.classList.remove('active'));
            items.forEach(item => item.classList.remove('active'));

            nav.classList.add('active');
            if (items[index]) {
                items[index].classList.add('active');
            }

            if (navContent) navContent.classList.remove('ativo');
            resetarPausaEReiniciarTimer();
        });
    });

    // ===================== Controle do Carrossel 3D por Seção =====================
    items.forEach((section) => {
        const cards = Array.from(section.querySelectorAll('.glass-card'));
        const prevBtn = section.querySelector('.controls button:first-child');
        const nextBtn = section.querySelector('.controls button:last-child');
        const dotsContainer = section.querySelector('.pagination-dots');
        let currentIndex = 0;

        if (cards.length === 0) return;

        // Cria bolinhas de paginação se o container estiver vazio
        if (dotsContainer && dotsContainer.children.length === 0) {
            cards.forEach((_, idx) => {
                const dot = document.createElement('span');
                dot.classList.add('dot');
                if (idx === 0) dot.classList.add('active');
                dot.addEventListener('click', () => {
                    currentIndex = idx;
                    atualizarCarrossel();
                    resetarPausaEReiniciarTimer();
                });
                dotsContainer.appendChild(dot);
            });
        }

        const dots = dotsContainer ? Array.from(dotsContainer.querySelectorAll('.dot')) : [];

        function atualizarCarrossel() {
            const total = cards.length;
            cards.forEach((card, i) => {
                card.classList.remove('card-front', 'card-back-right', 'card-back-left', 'card-hidden', 'pausado');

                if (i === currentIndex) {
                    card.classList.add('card-front');
                } else if (i === (currentIndex + 1) % total) {
                    card.classList.add('card-back-right');
                } else if (i === (currentIndex - 1 + total) % total) {
                    card.classList.add('card-back-left');
                } else {
                    card.classList.add('card-hidden');
                }
            });

            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === currentIndex);
            });
        }

        // Inicializa o carrossel da seção
        atualizarCarrossel();

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                currentIndex = (currentIndex + 1) % cards.length;
                atualizarCarrossel();
                resetarPausaEReiniciarTimer();
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                currentIndex = (currentIndex - 1 + cards.length) % cards.length;
                atualizarCarrossel();
                resetarPausaEReiniciarTimer();
            });
        }

        // Suporte a Swipe (Arrastar o dedo no Mobile)
        let touchStartX = 0;
        const wrapper = section.querySelector('.cards-wrapper');
        if (wrapper) {
            wrapper.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });

            wrapper.addEventListener('touchend', (e) => {
                if (wrapper.classList.contains('grid-mode')) return;
                const touchEndX = e.changedTouches[0].screenX;
                const diff = touchStartX - touchEndX;

                if (Math.abs(diff) > 45) {
                    if (diff > 0) {
                        currentIndex = (currentIndex + 1) % cards.length;
                    } else {
                        currentIndex = (currentIndex - 1 + cards.length) % cards.length;
                    }
                    atualizarCarrossel();
                    resetarPausaEReiniciarTimer();
                }
            }, { passive: true });
        }
    });

    // ===================== Clique no Card Ativo: Pausa / Retoma Contador e Luz Neon =====================
    document.addEventListener('click', (e) => {
        const cardAtivo = e.target.closest('.glass-card.card-front');
        if (!cardAtivo) return;

        // Ignora se o usuário clicou em um botão ou link dentro do card
        if (e.target.closest('button, a')) return;

        // Ignora se estiver no modo grade
        const wrapper = cardAtivo.closest('.cards-wrapper');
        if (wrapper && wrapper.classList.contains('grid-mode')) return;

        estaPausado = !estaPausado;

        if (estaPausado) {
            cardAtivo.classList.add('pausado');
            clearInterval(timerAutomatico);
        } else {
            cardAtivo.classList.remove('pausado');
            iniciarTimerAutomatico();
        }
    });

    // ===================== Ciclo Automático Sincronizado com a Borda Neon =====================
    function avancarCardAutomatico() {
        if (estaPausado) return;

        const abaAtiva = document.querySelector('.item.active');
        if (!abaAtiva) return;

        const wrapper = abaAtiva.querySelector('.cards-wrapper');
        if (wrapper && wrapper.classList.contains('grid-mode')) return;

        const btnNext = abaAtiva.querySelector('.controls button:last-child');
        if (btnNext) {
            btnNext.click();
        }
    }

    function iniciarTimerAutomatico() {
        clearInterval(timerAutomatico);
        timerAutomatico = setInterval(avancarCardAutomatico, TEMPO_POR_CARD);
    }

    function resetarPausaEReiniciarTimer() {
        estaPausado = false;
        document.querySelectorAll('.glass-card.pausado').forEach(c => c.classList.remove('pausado'));
        reiniciarAnimacaoBordaAtiva();
        iniciarTimerAutomatico();
    }

    // Reinicia o feixe neon do zero (0deg) sempre que um novo card entra em foco
    function reiniciarAnimacaoBordaAtiva() {
        const cardFront = document.querySelector('.item.active .glass-card.card-front');
        if (!cardFront) return;
        cardFront.style.animation = 'none';
        void cardFront.offsetWidth; // Força reflow para reiniciar @keyframes
        cardFront.style.animation = '';
    }

    // ===================== Busca Rápida nos Cards =====================
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const termo = e.target.value.toLowerCase().trim();
            const todosCards = document.querySelectorAll('.glass-card');

            todosCards.forEach(card => {
                card.classList.remove('search-highlight');
                if (termo.length > 1 && card.textContent.toLowerCase().includes(termo)) {
                    card.classList.add('search-highlight');
                }
            });
        });
    }

    // Inicia o ciclo automático ao carregar a página
    iniciarTimerAutomatico();
});
