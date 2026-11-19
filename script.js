document.addEventListener('DOMContentLoaded', () => {
    const items = Array.from(document.querySelectorAll('.item'));
    const navItems = Array.from(document.querySelectorAll('.nav-item'));
    const gridToggleBtns = document.querySelectorAll('.grid-toggle-btn');
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

    // ===================== BOTÃO HOME DA NAVBAR -> VAI PARA home.html =====================
    function irParaHome(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        window.location.href = 'home.html';
    }

    // Vincula a todos os possíveis botões/links de Home na Navbar
    const homeSelectors = [
        '.navbar .btn-voltar',
        '.navbar .btn-home',
        '.navbar [data-action="home"]',
        '.navbar a[href="home.html"]',
        '.navbar a[href="./home.html"]',
        '.navbar a[href="index.html"]',
        '.navbar button:has(.fa-home, .fa-house)',
        '.navbar a:has(.fa-home, .fa-house)'
    ];

    document.querySelectorAll(homeSelectors.join(', ')).forEach((el) => {
        if (el.tagName === 'BUTTON') el.type = 'button';
        el.addEventListener('click', irParaHome);
    });

    // Garante também caso algum .nav-item tenha texto "HOME" ou "INÍCIO"
    navItems.forEach((nav) => {
        const texto = nav.textContent.trim().toUpperCase();
        const href = nav.getAttribute('href');
        if (texto === 'HOME' || texto === 'INÍCIO' || href === 'home.html') {
            nav.addEventListener('click', irParaHome);
        }
    });

    // ===================== BOTÃO DE DETALHES DOS CARDS (.btn-glass) =====================
    function abrirDetalhesCard(card, btn) {
        if (!card) return;

        const linkEl = btn.tagName === 'A' ? btn : btn.querySelector('a');
        if (linkEl) {
            const href = linkEl.getAttribute('href');
            if (href && href !== '#' && !href.startsWith('javascript:')) {
                window.open(href, linkEl.getAttribute('target') || '_self');
                return;
            }
        }

        const titulo = card.querySelector('h3')?.innerText?.trim() || 'Detalhes do Painel';
        const badge = card.querySelector('.badge')?.innerText?.trim() || 'BI & Analytics';
        const descricao = btn.getAttribute('data-detalhes') ||
                          card.getAttribute('data-detalhes') ||
                          card.querySelector('.card-desc')?.innerText?.trim() ||
                          'Painel analítico integrado ao portal corporativo.';
        const kpis = Array.from(card.querySelectorAll('.kpi-mini span')).map(el => el.innerText.trim());
        const primaryAnchor = card.querySelector('.btn-primary a') || card.querySelector('.btn-primary');
        const linkAcesso = primaryAnchor?.getAttribute('href') || '';
        const targetAcesso = primaryAnchor?.getAttribute('target') || '_blank';

        const modalExistente = document.querySelector('#modalDetalhes, #detailsModal, .modal-detalhes, .modal-overlay');
        if (modalExistente) {
            const mTitle = modalExistente.querySelector('#modalTitle, .modal-title, h2, h3');
            const mDesc = modalExistente.querySelector('#modalDesc, .modal-desc, p');
            const mBadge = modalExistente.querySelector('#modalBadge, .modal-badge');
            const mLink = modalExistente.querySelector('#modalLink, .modal-link, a.btn-primary');

            if (mTitle) mTitle.innerText = titulo;
            if (mDesc) mDesc.innerText = descricao;
            if (mBadge) mBadge.innerText = badge;
            if (mLink && linkAcesso) mLink.setAttribute('href', linkAcesso);

            modalExistente.style.display = 'flex';
            modalExistente.classList.add('ativo', 'active', 'show');
            return;
        }

        let dynamicModal = document.getElementById('ellcaDynamicDetailModal');
        if (!dynamicModal) {
            dynamicModal = document.createElement('div');
            dynamicModal.id = 'ellcaDynamicDetailModal';
            dynamicModal.style.cssText = `
                position: fixed; inset: 0; z-index: 9999;
                background: rgba(2, 5, 12, 0.78);
                backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
                display: flex; align-items: center; justify-content: center;
                padding: 20px; opacity: 0; transition: opacity 0.25s ease;
            `;
            dynamicModal.innerHTML = `
                <div id="ellcaDynamicModalBox" style="
                    width: 100%; max-width: 440px; border-radius: 18px; padding: 24px;
                    background: linear-gradient(150deg, rgba(4, 8, 18, 0.94) 0%, rgba(12, 38, 88, 0.90) 100%);
                    border: 1px solid rgba(36, 102, 212, 0.72);
                    box-shadow: 0 25px 60px rgba(0,0,0,0.88), 0 0 32px rgba(14, 52, 122, 0.45);
                    color: #fff; position: relative;
                ">
                    <button type="button" id="ellcaCloseModalBtn" style="
                        position: absolute; top: 16px; right: 16px; width: 30px; height: 30px;
                        border-radius: 50%; border: 1px solid rgba(255,255,255,0.25);
                        background: rgba(255,255,255,0.08); color: #fff; cursor: pointer;
                        font-size: 14px; display: flex; align-items: center; justify-content: center;
                    ">&times;</button>
                    <span id="ellcaModalBadge" style="
                        display: inline-block; font-size: 9px; font-weight: 800; letter-spacing: 1.5px;
                        text-transform: uppercase; padding: 4px 10px; border-radius: 50px;
                        background: rgba(16, 62, 145, 0.45); color: #7ab8ff;
                        border: 1px solid rgba(64, 132, 240, 0.45); margin-bottom: 10px;
                    "></span>
                    <h3 id="ellcaModalTitle" style="font-size: 18px; font-weight: 800; margin-bottom: 10px; color: #fff;"></h3>
                    <p id="ellcaModalDesc" style="font-size: 12.5px; line-height: 1.6; color: #cbd5e1; margin-bottom: 16px;"></p>
                    <div id="ellcaModalKpis" style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px;"></div>
                    <div style="display: flex; gap: 10px;">
                        <a id="ellcaModalActionLink" href="#" target="_blank" style="
                            flex: 1; text-align: center; padding: 10px; border-radius: 8px;
                            background: linear-gradient(90deg, #00d4ff, #008ebf); color: #000;
                            font-size: 11px; font-weight: 800; text-transform: uppercase;
                        ">Acessar Painel</a>
                        <button type="button" id="ellcaModalCancelBtn" style="
                            padding: 10px 16px; border-radius: 8px; border: 1px solid rgba(64, 132, 240, 0.45);
                            background: rgba(12, 36, 84, 0.35); color: #cbd5e1; font-size: 11px; font-weight: 600;
                            text-transform: uppercase; cursor: pointer;
                        ">Fechar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(dynamicModal);

            const fechar = () => {
                dynamicModal.style.opacity = '0';
                setTimeout(() => { dynamicModal.style.display = 'none'; }, 220);
            };
            dynamicModal.querySelector('#ellcaCloseModalBtn').addEventListener('click', fechar);
            dynamicModal.querySelector('#ellcaModalCancelBtn').addEventListener('click', fechar);
            dynamicModal.addEventListener('click', (ev) => {
                if (ev.target === dynamicModal) fechar();
            });
        }

        dynamicModal.querySelector('#ellcaModalBadge').innerText = badge;
        dynamicModal.querySelector('#ellcaModalTitle').innerText = titulo;
        dynamicModal.querySelector('#ellcaModalDesc').innerText = descricao;

        const kpisBox = dynamicModal.querySelector('#ellcaModalKpis');
        kpisBox.innerHTML = kpis.map(k => `
            <span style="
                font-size: 10px; font-weight: 600; padding: 4px 10px; border-radius: 6px;
                background: rgba(12, 36, 84, 0.45); border: 1px solid rgba(46, 115, 225, 0.42);
                color: #7ab8ff;
            ">${k}</span>
        `).join('');

        const actionLink = dynamicModal.querySelector('#ellcaModalActionLink');
        if (linkAcesso && linkAcesso !== '#') {
            actionLink.style.display = 'block';
            actionLink.href = linkAcesso;
            actionLink.target = targetAcesso;
        } else {
            actionLink.style.display = 'none';
        }

        dynamicModal.style.display = 'flex';
        requestAnimationFrame(() => { dynamicModal.style.opacity = '1'; });
    }

    document.addEventListener('click', (e) => {
        const detailBtn = e.target.closest('.btn-glass');
        if (!detailBtn) return;
        if (detailBtn.hasAttribute('onclick')) return;

        e.preventDefault();
        e.stopPropagation();
        const card = detailBtn.closest('.glass-card');
        abrirDetalhesCard(card, detailBtn);
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
            const texto = nav.textContent.trim().toUpperCase();
            if (texto === 'HOME' || texto === 'INÍCIO' || nav.getAttribute('href') === 'home.html') {
                return;
            }

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
        if (e.key === 'Escape') {
            const m = document.getElementById('ellcaDynamicDetailModal');
            if (m && m.style.display === 'flex') {
                m.style.opacity = '0';
                setTimeout(() => { m.style.display = 'none'; }, 220);
            }
        }
    });
});
