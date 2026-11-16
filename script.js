document.addEventListener('DOMContentLoaded', () => {
    const TEMPO_POR_CARD = 6000; // Deve ser igual à duração da animação CSS (6s = 6000ms)
    let estaPausado = false;
    let timerBorda = null;

    const btnVoltar = document.getElementById('btnVoltar') || document.querySelector('.btn-voltar');
    const menuMobileBtn = document.querySelector('.menu-mobile-btn');
    const navContent = document.querySelector('.nav-content');
    const gridToggleBtn = document.querySelector('.grid-toggle-btn');
    const searchInput = document.getElementById('cardSearch') || document.querySelector('.search-box input');

    // ===================== Botão Voltar (Canto Superior Direito) =====================
    if (btnVoltar) {
        btnVoltar.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (window.history.length > 1 && document.referrer !== '') {
                window.history.back();
            } else {
                window.location.href = 'index.html';
            }
        });
    }

    // ===================== Helpers =====================
    function obterAbas() {
        return Array.from(document.querySelectorAll('.item'));
    }

    function obterAbaAtiva() {
        const abas = obterAbas();
        return document.querySelector('.item.active') || abas[0] || null;
    }

    function normalizarTexto(txt) {
        return (txt || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
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
                    icone.classList.toggle('fa-table-cells');
                    icone.classList.toggle('fa-clone');
                }
            }
        });
    }

    // ===================== Navegação da Navbar =====================
    document.querySelectorAll('.navbar .nav-item').forEach((link) => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');

            if (href && href !== '#' && !href.startsWith('#')) {
                return;
            }

            e.preventDefault();
            document.querySelectorAll('.navbar .nav-item').forEach(n => n.classList.remove('active'));
            link.classList.add('active');

            if (navContent) navContent.classList.remove('ativo');

            const abaAtiva = obterAbaAtiva();
            if (abaAtiva && typeof abaAtiva._irParaCard === 'function') {
                abaAtiva._irParaCard(0);
            }
            resetarPausaEIniciarCiclo();
        });
    });

    // ===================== Controle do Carrossel 3D por Seção =====================
    obterAbas().forEach((section) => {
        const cards = Array.from(section.querySelectorAll('.glass-card'));
        const dotsContainer = section.querySelector('.pagination-dots') || document.querySelector('.pagination-dots');
        let currentIndex = 0;

        if (cards.length === 0) return;

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

        section._irParaCard = (indiceCard) => {
            if (indiceCard >= 0 && indiceCard < cards.length) {
                currentIndex = indiceCard;
                atualizarCarrossel();
            }
        };

        atualizarCarrossel();

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
            cardAtivo.classList.remove('card-front');
            void cardAtivo.offsetWidth;
            cardAtivo.classList.add('card-front');
            iniciarTimerBorda();
        }
    }

    // ===================== Delegação Global de Cliques =====================
    document.addEventListener('click', (e) => {
        const btnControle = e.target.closest('.controls button, .next, .prev');
        if (btnControle) {
            e.preventDefault();
            e.stopPropagation();

            if (btnControle.classList.contains('prev')) {
                irParaAnterior();
            } else {
                irParaProximo();
            }
            return;
        }

        const cardAtivo = e.target.closest('.glass-card.card-front');
        if (cardAtivo) {
            if (e.target.closest('button, a')) return;
            alternarPausaCardAtivo();
        }
    });

    // ===================== Controle pelo Teclado (Setas + Barra de Espaço) =====================
    document.addEventListener('keydown', (e) => {
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
            if (tagAtiva === 'button' || tagAtiva === 'a') return;
            if (!emModoGrade) {
                e.preventDefault();
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

    document.addEventListener('animationend', (e) => {
        if (e.animationName === 'borderNeonSweep' && !estaPausado) {
            clearTimeout(timerBorda);
            avancarAutomaticamente();
        }
    });

    // ===================== Pesquisa Inteligente (#cardSearch) =====================
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const termo = normalizarTexto(e.target.value);
            const abaAtiva = obterAbaAtiva();
            if (!abaAtiva) return;

            const cardsDaAba = Array.from(abaAtiva.querySelectorAll('.glass-card'));
            const wrapper = abaAtiva.querySelector('.cards-wrapper');
            const emGrade = wrapper && wrapper.classList.contains('grid-mode');
            let primeiroIndiceEncontrado = -1;

            cardsDaAba.forEach((card, idx) => {
                card.classList.remove('search-highlight');

                if (!termo) {
                    card.style.removeProperty('display');
                    return;
                }

                const textoCompleto = normalizarTexto(
                    card.textContent + ' ' + (card.getAttribute('data-title') || '')
                );
                const encontrou = textoCompleto.includes(termo);

                if (encontrou) {
                    card.classList.add('search-highlight');
                    if (emGrade) {
                        card.style.removeProperty('display');
                    }
                    if (primeiroIndiceEncontrado === -1) {
                        primeiroIndiceEncontrado = idx;
                    }
                } else if (emGrade) {
                    card.style.setProperty('display', 'none', 'important');
                }
            });

            if (!termo) {
                resetarPausaEIniciarCiclo();
                return;
            }

            if (primeiroIndiceEncontrado !== -1 && typeof abaAtiva._irParaCard === 'function') {
                abaAtiva._irParaCard(primeiroIndiceEncontrado);

                const cardEncontrado = cardsDaAba[primeiroIndiceEncontrado];
                if (cardEncontrado) {
                    estaPausado = true;
                    clearTimeout(timerBorda);
                    cardEncontrado.classList.add('pausado');
                }
            }
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchInput.blur();
                if (navContent && navContent.classList.contains('ativo')) {
                    navContent.classList.remove('ativo');
                }
            }
        });
    }

    iniciarTimerBorda();
});
