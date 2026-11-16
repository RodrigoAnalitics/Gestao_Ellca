document.addEventListener('DOMContentLoaded', () => {
    const TEMPO_POR_CARD = 6000; // Deve ser igual à duração da animação CSS (6s = 6000ms)
    let estaPausado = false;
    let timerBorda = null;

    const navItems = Array.from(document.querySelectorAll('.nav-item'));
    const items = Array.from(document.querySelectorAll('.item'));
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
            const abaAtiva = obterAbaAtiva();
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

    // ===================== Helper: Retorna a Aba Ativa Atual =====================
    function obterAbaAtiva() {
        return document.querySelector('.item.active') || items[0] || null;
    }

    // ===================== Navegação entre Abas (Navbar) =====================
    function ativarAba(alvoIndex, alvoId) {
        let indexFinal = alvoIndex;

        // Se o link da navbar tiver href="#id" ou data-target="#id", busca a seção exata
        if (alvoId) {
            const idLimpo = alvoId.replace('#', '').trim();
            if (idLimpo) {
                const idxPorId = items.findIndex(sec => sec.id === idLimpo);
                if (idxPorId !== -1) {
                    indexFinal = idxPorId;
                }
            }
        }

        if (indexFinal < 0 || indexFinal >= items.length) return;

        navItems.forEach((n, i) => {
            n.classList.toggle('active', i === indexFinal);
        });

        items.forEach((sec, i) => {
            sec.classList.toggle('active', i === indexFinal);
        });

        // Fecha o menu hambúrguer no mobile após clicar
        if (navContent) {
            navContent.classList.remove('ativo');
        }

        resetarPausaEIniciarCiclo();
    }

    navItems.forEach((nav, index) => {
        // Remove qualquer onclick inline conflitante para evitar duplo disparo
        const onclickAttr = nav.getAttribute('onclick');
        let indexPorOnclick = null;
        if (onclickAttr) {
            const matchNum = onclickAttr.match(/\((\d+)\)/);
            if (matchNum) indexPorOnclick = parseInt(matchNum[1], 10);
            nav.removeAttribute('onclick');
        }

        nav.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const href = nav.getAttribute('href');
            const dataTarget = nav.getAttribute('data-target') || nav.getAttribute('data-tab');
            const targetId = (href && href.startsWith('#') && href.length > 1) ? href : dataTarget;
            const idxUsar = indexPorOnclick !== null ? indexPorOnclick : index;

            ativarAba(idxUsar, targetId);
        });
    });

    // ===================== Controle do Carrossel 3D por Seção =====================
    items.forEach((section) => {
        const cards = Array.from(section.querySelectorAll('.glass-card'));
        const dotsContainer = section.querySelector('.pagination-dots');
        let currentIndex = 0;

        if (cards.length === 0) return;

        // Cria bolinhas de paginação se ainda não existirem
        if (dotsContainer && dotsContainer.children.length === 0) {
            cards.forEach((_, idx) => {
                const dot = document.createElement('span');
                dot.classList.add('dot');
                if (idx === 0) dot.classList.add('active');
                dotsContainer.appendChild(dot);
            });
        }

        const dots = dotsContainer ? Array.from(dotsContainer.querySelectorAll('.dot')) : [];

        dots.forEach((dot, idx) => {
            dot.addEventListener('click', (e) => {
                e.stopPropagation();
                currentIndex = idx;
                atualizarCarrossel();
                resetarPausaEIniciarCiclo();
            });
        });

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

        // Métodos expostos na seção para Next, Preview e Ciclo Automático
        section._proximoCard = () => {
            currentIndex = (currentIndex + 1) % cards.length;
            atualizarCarrossel();
        };

        section._cardAnterior = () => {
            currentIndex = (currentIndex - 1 + cards.length) % cards.length;
            atualizarCarrossel();
        };

        // Inicializa o carrossel da seção
        atualizarCarrossel();

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
                        section._proximoCard();
                    } else {
                        section._cardAnterior();
                    }
                    resetarPausaEIniciarCiclo();
                }
            }, { passive: true });
        }
    });

    // ===================== Botões NEXT e PREVIEW (Prev) Universais =====================
    function irParaProximo() {
        const abaAtiva = obterAbaAtiva();
        if (abaAtiva && typeof abaAtiva._proximoCard === 'function') {
            abaAtiva._proximoCard();
            resetarPausaEIniciarCiclo();
        }
    }

    function irParaAnterior() {
        const abaAtiva = obterAbaAtiva();
        if (abaAtiva && typeof abaAtiva._cardAnterior === 'function') {
            abaAtiva._cardAnterior();
            resetarPausaEIniciarCiclo();
        }
    }

    // Expõe funções globais caso algum botão no HTML tenha onclick="nextSlide()" / "prevSlide()"
    window.nextSlide = irParaProximo;
    window.prevSlide = irParaAnterior;
    window.proximoSlide = irParaProximo;
    window.anteriorSlide = irParaAnterior;
    window.mudarAba = (idx) => ativarAba(idx, null);

    // Captura cliques em qualquer botão de controle (Next / Preview) dentro ou fora de .item
    document.querySelectorAll('.controls button, #next, #prev, .next, .prev').forEach((btn) => {
        // Remove onclick inline antigo para evitar pular 2 cards de uma vez
        btn.removeAttribute('onclick');

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const containerControles = btn.closest('.controls');
            const isPrev =
                btn.id === 'prev' ||
                btn.classList.contains('prev') ||
                btn.querySelector('.fa-chevron-left, .fa-arrow-left, .fa-angle-left') !== null ||
                (containerControles && btn === containerControles.querySelector('button:first-child'));

            if (isPrev) {
                irParaAnterior();
            } else {
                irParaProximo();
            }
        });
    });

    // ===================== Ciclo Automático Sincronizado com a Borda Neon (360°) =====================
    function avancarAutomaticamente() {
        if (estaPausado) return;

        const abaAtiva = obterAbaAtiva();
        if (!abaAtiva) return;

        const wrapper = abaAtiva.querySelector('.cards-wrapper');
        if (wrapper && wrapper.classList.contains('grid-mode')) return;

        if (typeof abaAtiva._proximoCard === 'function') {
            abaAtiva._proximoCard();
            iniciarTimerBorda();
        }
    }

    function iniciarTimerBorda() {
        clearTimeout(timerBorda);
        if (estaPausado) return;

        timerBorda = setTimeout(() => {
            if (!estaPausado) {
                avancarAutomaticamente();
            }
        }, TEMPO_POR_CARD);
    }

    function resetarPausaEIniciarCiclo() {
        estaPausado = false;
        document.querySelectorAll('.glass-card.pausado').forEach(c => c.classList.remove('pausado'));
        iniciarTimerBorda();
    }

    // Dispara exatamente quando a animação de 360° da borda termina
    document.addEventListener('animationend', (e) => {
        if (e.animationName === 'borderNeonSweep' && !estaPausado) {
            clearTimeout(timerBorda);
            avancarAutomaticamente();
        }
    });

    // ===================== Clique no Card Ativo: Pausa / Retoma Contador e Luz Neon =====================
    document.addEventListener('click', (e) => {
        const cardAtivo = e.target.closest('.glass-card.card-front');
        if (!cardAtivo) return;

        // Ignora cliques em botões ou links dentro do card
        if (e.target.closest('button, a')) return;

        const wrapper = cardAtivo.closest('.cards-wrapper');
        if (wrapper && wrapper.classList.contains('grid-mode')) return;

        estaPausado = !estaPausado;

        if (estaPausado) {
            cardAtivo.classList.add('pausado');
            clearTimeout(timerBorda);
        } else {
            cardAtivo.classList.remove('pausado');
            // Reinicia a animação da borda neon do zero ao retomar
            cardAtivo.classList.remove('card-front');
            void cardAtivo.offsetWidth;
            cardAtivo.classList.add('card-front');
            iniciarTimerBorda();
        }
    });

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

    // Inicia o ciclo automático ao abrir a página
    iniciarTimerBorda();
});
