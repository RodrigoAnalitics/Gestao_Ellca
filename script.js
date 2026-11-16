document.addEventListener('DOMContentLoaded', () => {
    const TEMPO_POR_CARD = 6000; // Deve ser igual à duração da animação CSS (6s = 6000ms)
    let estaPausado = false;
    let timerBorda = null;

    const menuMobileBtn = document.querySelector('.menu-mobile-btn');
    const navContent = document.querySelector('.nav-content');
    const gridToggleBtn = document.querySelector('.grid-toggle-btn');
    const searchInput = document.querySelector('.search-box input');

    // ===================== Helpers de Seleção Dinâmica =====================
    function obterAbas() {
        return Array.from(document.querySelectorAll('.item'));
    }

    function obterLinksNav() {
        return Array.from(document.querySelectorAll('.navbar .nav-item, .nav-links a, .nav-links button, .nav-item'));
    }

    function obterAbaAtiva() {
        const abas = obterAbas();
        return document.querySelector('.item.active') || abas[0] || null;
    }

    // ===================== Menu Mobile =====================
    if (menuMobileBtn && navContent) {
        menuMobileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            navContent.classList.toggle('ativo');
        });
    }

    // ===================== Alternar Modo Grade / Carrossel =====================
    if (gridToggleBtn) {
        gridToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
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

    // ===================== Navegação Inteligente entre Abas (Navbar) =====================
    function normalizarTexto(txt) {
        return (txt || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    }

    function ativarAbaPorElementoOuIndice(navEl, indexFallback) {
        const abas = obterAbas();
        const links = obterLinksNav();
        if (abas.length === 0) return;

        let indexFinal = -1;

        if (navEl) {
            // 1. Tenta por href="#id" ou data-target / data-tab / data-slide
            const alvoAttr =
                navEl.getAttribute('data-target') ||
                navEl.getAttribute('data-tab') ||
                navEl.getAttribute('data-slide') ||
                navEl.getAttribute('href');

            if (alvoAttr && alvoAttr !== '#' && !alvoAttr.startsWith('javascript')) {
                // Se for um número puro no atributo
                if (/^\d+$/.test(alvoAttr.trim())) {
                    indexFinal = parseInt(alvoAttr.trim(), 10);
                } else {
                    const idLimpo = alvoAttr.replace('#', '').trim();
                    indexFinal = abas.findIndex(sec =>
                        sec.id === idLimpo ||
                        sec.getAttribute('data-category') === idLimpo ||
                        sec.getAttribute('data-tab') === idLimpo
                    );
                }
            }

            // 2. Se não achou por ID, tenta pelo texto do botão comparado ao .topic ou .title da seção
            if (indexFinal === -1) {
                const textoNav = normalizarTexto(navEl.textContent);
                if (textoNav) {
                    indexFinal = abas.findIndex(sec => {
                        const topic = normalizarTexto(sec.querySelector('.topic')?.textContent);
                        const title = normalizarTexto(sec.querySelector('.title')?.textContent);
                        return (topic && topic.includes(textoNav)) || (title && title.includes(textoNav));
                    });
                }
            }
        }

        // 3. Fallback pela posição do botão no menu
        if (indexFinal === -1 && typeof indexFallback === 'number') {
            indexFinal = indexFallback;
        }

        if (indexFinal < 0 || indexFinal >= abas.length) return;

        // Atualiza classe active nos links da navbar
        links.forEach((link, i) => {
            if (navEl) {
                link.classList.toggle('active', link === navEl);
            } else {
                link.classList.toggle('active', i === indexFinal);
            }
        });

        // Exibe a seção escolhida e oculta as demais
        abas.forEach((sec, i) => {
            if (i === indexFinal) {
                sec.classList.add('active');
                sec.style.display = 'block';
            } else {
                sec.classList.remove('active');
                sec.style.display = 'none';
            }
        });

        // Fecha o menu hambúrguer no mobile
        if (navContent) {
            navContent.classList.remove('ativo');
        }

        resetarPausaEIniciarCiclo();
    }

    // Limpa atributos onclick antigos dos links da navbar para não bloquearem
    obterLinksNav().forEach((link) => {
        if (link.hasAttribute('onclick')) {
            const onclickVal = link.getAttribute('onclick');
            const match = onclickVal.match(/\((\d+)\)/);
            if (match && !link.hasAttribute('data-slide')) {
                link.setAttribute('data-slide', match[1]);
            }
            link.removeAttribute('onclick');
        }
    });

    // ===================== Controle do Carrossel 3D por Seção =====================
    obterAbas().forEach((section) => {
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

        section._proximoCard = () => {
            currentIndex = (currentIndex + 1) % cards.length;
            atualizarCarrossel();
        };

        section._cardAnterior = () => {
            currentIndex = (currentIndex - 1 + cards.length) % cards.length;
            atualizarCarrossel();
        };

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

    // ===================== Funções de Navegação e Pausa =====================
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

    function alternarPausaCardAtivo() {
        const abaAtiva = obterAbaAtiva();
        if (!abaAtiva) return;

        const wrapper = abaAtiva.querySelector('.cards-wrapper');
        if (wrapper && wrapper.classList.contains('grid-mode')) return;

        const cardAtivo = abaAtiva.querySelector('.glass-card.card-front');
        if (!cardAtivo) return;

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
    }

    // Expõe funções globais caso algum HTML externo chame diretamente
    window.nextSlide = irParaProximo;
    window.prevSlide = irParaAnterior;
    window.proximoSlide = irParaProximo;
    window.anteriorSlide = irParaAnterior;
    window.mudarAba = (idx) => ativarAbaPorElementoOuIndice(null, idx);

    // ===================== Delegação Global de Cliques (Navbar, Controles e Card Ativo) =====================
    document.addEventListener('click', (e) => {
        // 1. Cliques nos botões do menu Navbar
        const navClicado = e.target.closest('.navbar .nav-item, .nav-links a, .nav-links button, .nav-item');
        if (navClicado) {
            // Se for um link externo real (ex: https://... ou outra página .html), deixa navegar
            const href = navClicado.getAttribute('href');
            if (href && (href.startsWith('http') || href.endsWith('.html'))) {
                return;
            }

            e.preventDefault();
            e.stopPropagation();
            const todosLinks = obterLinksNav();
            const idx = todosLinks.indexOf(navClicado);
            ativarAbaPorElementoOuIndice(navClicado, idx);
            return;
        }

        // 2. Cliques nos botões Next e Preview (Prev)
        const btnControle = e.target.closest('.controls button, #next, #prev, .next, .prev');
        if (btnControle) {
            e.preventDefault();
            e.stopPropagation();

            const containerControles = btnControle.closest('.controls');
            const isPrev =
                btnControle.id === 'prev' ||
                btnControle.classList.contains('prev') ||
                btnControle.querySelector('.fa-chevron-left, .fa-arrow-left, .fa-angle-left') !== null ||
                (containerControles && btnControle === containerControles.querySelector('button:first-child'));

            if (isPrev) {
                irParaAnterior();
            } else {
                irParaProximo();
            }
            return;
        }

        // 3. Clique no Card Ativo para Pausar / Retomar o contador e a borda neon
        const cardAtivo = e.target.closest('.glass-card.card-front');
        if (cardAtivo) {
            if (e.target.closest('button, a')) return; // Não intercepta botões internos do card
            alternarPausaCardAtivo();
        }
    });

    // ===================== Controle pelo Teclado (Setas + Barra de Espaço) =====================
    document.addEventListener('keydown', (e) => {
        // Não interfere enquanto o usuário digita na barra de busca ou em algum campo de texto
        const tagAtiva = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        if (tagAtiva === 'input' || tagAtiva === 'textarea' || document.activeElement?.isContentEditable) {
            return;
        }

        const abaAtiva = obterAbaAtiva();
        const wrapper = abaAtiva?.querySelector('.cards-wrapper');
        const emModoGrade = wrapper && wrapper.classList.contains('grid-mode');

        if (e.key === 'ArrowRight') {
            if (!emModoGrade) {
                e.preventDefault();
                irParaProximo();
            }
        } else if (e.key === 'ArrowLeft') {
            if (!emModoGrade) {
                e.preventDefault();
                irParaAnterior();
            }
        } else if (e.code === 'Space' || e.key === ' ') {
            // Evita acionar se o foco estiver em um botão da página
            if (tagAtiva === 'button' || tagAtiva === 'a') return;
            if (!emModoGrade) {
                e.preventDefault(); // Evita rolar a página para baixo
                alternarPausaCardAtivo();
            }
        }
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
