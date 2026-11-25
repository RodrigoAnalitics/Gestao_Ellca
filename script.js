// ===================== PROTEÇÃO DE ROTA (EXIGE LOGIN) =====================
if (sessionStorage.getItem('ellca_auth') !== 'true') {
    window.location.replace('login.html');
}

document.addEventListener('DOMContentLoaded', () => {
    // ===================== CONTROLE DE SESSÃO, PERFIL E LOGOUT =====================
    const nomeUsuarioLogado = sessionStorage.getItem('ellca_user_name') || 'Colaborador';
    let setoresPermitidos = ['todos'];
    try {
        setoresPermitidos = JSON.parse(sessionStorage.getItem('ellca_user_setores') || '["todos"]');
    } catch (err) {
        setoresPermitidos = ['todos'];
    }

    const acessoTotal = setoresPermitidos.includes('todos');

    function realizarLogout(e) {
        if (e) e.preventDefault();
        sessionStorage.removeItem('ellca_auth');
        sessionStorage.removeItem('ellca_user_name');
        sessionStorage.removeItem('ellca_user_setores');
        window.location.replace('login.html');
    }

    function renderizarBarraUsuario() {
        const footerBar = document.querySelector('.footer-bar');
        const navContentEl = document.querySelector('.nav-content');

        // 1. Desktop: adiciona no rodapé (.footer-bar)
        if (footerBar) {
            const userBadgeHTML = `
                <span class="separator">|</span>
                <div class="footer-info" style="color: #cbd5e1;">
                    <i class="fas fa-user-shield" style="color: var(--primary);"></i>
                    <span>Olá, <strong>${nomeUsuarioLogado}</strong></span>
                </div>
                <button type="button" id="btnLogoutDesktop" class="footer-btn" title="Encerrar Sessão" style="
                    border-color: rgba(239, 68, 68, 0.45); color: #fca5a5; margin-left: 4px;
                ">
                    <i class="fas fa-sign-out-alt"></i> Sair
                </button>
            `;
            footerBar.insertAdjacentHTML('beforeend', userBadgeHTML);
            document.getElementById('btnLogoutDesktop')?.addEventListener('click', realizarLogout);
        }

        // 2. Mobile: adiciona dentro do menu hambúrguer (.nav-content)
        if (navContentEl) {
            const mobileUserBox = document.createElement('div');
            mobileUserBox.className = 'mobile-user-session-bar';
            mobileUserBox.style.cssText = `
                display: none;
                width: 100%;
                align-items: center;
                justify-content: space-between;
                padding: 10px 14px;
                border-radius: 10px;
                background: linear-gradient(135deg, rgba(12, 36, 84, 0.45) 0%, rgba(4, 8, 18, 0.65) 100%);
                border: 1px solid rgba(0, 212, 255, 0.25);
                font-size: 11px;
                color: #cbd5e1;
            `;
            mobileUserBox.innerHTML = `
                <span><i class="fas fa-user-shield" style="color: var(--primary); margin-right: 6px;"></i>Olá, <strong>${nomeUsuarioLogado}</strong></span>
                <button type="button" id="btnLogoutMobile" style="
                    background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.5);
                    color: #fca5a5; padding: 4px 10px; border-radius: 6px; font-size: 10px;
                    font-weight: 700; cursor: pointer; text-transform: uppercase;
                "><i class="fas fa-sign-out-alt"></i> Sair</button>
            `;
            navContentEl.appendChild(mobileUserBox);
            document.getElementById('btnLogoutMobile')?.addEventListener('click', realizarLogout);

            const ajustarVisibilidadeUserMobile = () => {
                mobileUserBox.style.display = window.innerWidth <= 768 ? 'flex' : 'none';
            };
            ajustarVisibilidadeUserMobile();
            window.addEventListener('resize', ajustarVisibilidadeUserMobile);
        }
    }

    renderizarBarraUsuario();

    // ===================== FILTRAGEM DE CARDS POR SETOR =====================
    const pathAtual = window.location.pathname.toLowerCase();
    const isPaginaHome = pathAtual.endsWith('home.html') || pathAtual === '/' || pathAtual.endsWith('/');

    if (!acessoTotal) {
        const permitidosLower = setoresPermitidos.map(s => s.trim().toLowerCase());
        const cards = document.querySelectorAll('.cards-wrapper .glass-card');

        cards.forEach(card => {
            const setorAttr = (card.getAttribute('data-setor') || '').trim().toLowerCase();

            // Na Home, só filtra cards que exigem permissão específica (ex: data-setor="gerencial")
            if (isPaginaHome && !setorAttr) return;

            const tituloCard = (card.querySelector('h3')?.textContent || '')
                .trim()
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '');

            const temPermissao =
                permitidosLower.includes(setorAttr) ||
                permitidosLower.includes(tituloCard) ||
                (setorAttr === 'almoxarifado_epi' && permitidosLower.includes('almoxarifado'));

            if (!temPermissao) {
                card.remove();
            }
        });

        // Reorganiza o data-index (0, 1, 2...) dos cards restantes para o carrossel 3D funcionar perfeitamente
        document.querySelectorAll('.cards-wrapper .glass-card').forEach((card, novoIdx) => {
            card.setAttribute('data-index', novoIdx);
        });
    }

    // Garante que a seção principal (.item) esteja sempre visível
    const items = Array.from(document.querySelectorAll('.item'));
    const navItems = Array.from(document.querySelectorAll('.nav-item'));

    if (items.length > 0 && !document.querySelector('.item.active')) {
        items[0].style.display = '';
        items[0].classList.add('active');
    }

    // ===================== ELEMENTOS E VARIÁVEIS DO CARROSSEL =====================
    const gridToggleBtns = document.querySelectorAll('.grid-toggle-btn');
    const menuMobileBtn = document.querySelector('.menu-mobile-btn');
    const navContent = document.querySelector('.nav-content');
    const searchInput = document.querySelector('.search-box input');

    let isGridMode = false;
    let isPaused = false;
    let autoPlayTimer = null;
    const TEMPO_LUZ_CARD = 6000;

    const itemStates = new Map();

    // Garante que links externos abram em nova aba e links internos na mesma aba (mesmo clicando na borda do botão)
    document.querySelectorAll('.btn-primary a, a.btn-primary').forEach(link => {
        const href = link.getAttribute('href') || '';
        if (href.startsWith('http')) {
            link.setAttribute('target', '_blank');
        } else {
            link.setAttribute('target', '_self');
        }
    });

    document.addEventListener('click', (e) => {
        const primaryBtn = e.target.closest('.btn-primary');
        if (!primaryBtn) return;

        const link = primaryBtn.tagName === 'A' ? primaryBtn : primaryBtn.querySelector('a');
        if (!link) return;

        const href = link.getAttribute('href');
        if (!href || href === '#' || href.startsWith('javascript:')) return;

        e.preventDefault();
        e.stopPropagation();

        if (href.startsWith('http')) {
            window.open(href, '_blank', 'noopener');
        } else {
            window.location.assign(href);
        }
    }, true);

    // ===================== Disparo da Fumaça Suave =====================
    function dispararFumacaTransicao(itemEl) {
        if (!itemEl || isGridMode) return;
        const wrapper = itemEl.querySelector('.cards-wrapper');
        if (!wrapper) return;

        wrapper.classList.remove('smoke-burst');
        void wrapper.offsetWidth;
        wrapper.classList.add('smoke-burst');
    }

    // ===================== Controle do Ciclo Automático =====================
    function iniciarCicloAutomatico() {
        clearTimeout(autoPlayTimer);
        if (isPaused || isGridMode) return;

        const activeItem = document.querySelector('.item.active') || items[0];
        if (!activeItem) return;

        const state = itemStates.get(activeItem);
        if (!state || state.cards.length <= 1) return;

        autoPlayTimer = setTimeout(() => {
            if (!isPaused && !isGridMode) {
                moverCardAtivo(1);
            }
        }, TEMPO_LUZ_CARD);
    }

    // ===================== Tecla Space Pausa / Retoma o Card e a Luz =====================
    function alternarPausaCard() {
        if (isGridMode) return;
        const activeItem = document.querySelector('.item.active') || items[0];
        if (!activeItem) return;

        const frontCard = activeItem.querySelector('.glass-card.card-front');
        if (!frontCard) return;

        isPaused = !isPaused;

        if (isPaused) {
            clearTimeout(autoPlayTimer);
            frontCard.classList.add('pausado');
        } else {
            frontCard.classList.remove('pausado');
            frontCard.style.animation = 'none';
            void frontCard.offsetWidth;
            frontCard.style.animation = '';
            iniciarCicloAutomatico();
        }
    }

    // ===================== Avançar / Voltar Slide =====================
    function moverCardAtivo(direcao) {
        const activeItem = document.querySelector('.item.active') || items[0];
        if (!activeItem || isGridMode) return;

        const state = itemStates.get(activeItem);
        if (!state || state.cards.length <= 1) return;

        isPaused = false;
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

        if (dotsContainer && cards.length > 0) {
            dotsContainer.innerHTML = '';
            cards.forEach((_, idx) => {
                const dot = document.createElement('span');
                dot.className = 'dot' + (idx === 0 ? ' active' : '');
                dot.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (state.currentIndex !== idx) {
                        isPaused = false;
                        state.currentIndex = idx;
                        atualizarCarrossel(item, true);
                    }
                });
                dotsContainer.appendChild(dot);
                state.dots.push(dot);
            });
        }

        cards.forEach((card, idx) => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('a, button, .btn-primary, .btn-glass')) return;
                if (isGridMode) return;
                if (state.currentIndex !== idx) {
                    isPaused = false;
                    state.currentIndex = idx;
                    atualizarCarrossel(item, true);
                }
            });
        });

        // Suporte a Swipe Touch no Mobile
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

                if (Math.abs(diff) > 38) {
                    moverCardAtivo(diff > 0 ? 1 : -1);
                }
            }, { passive: true });
        }

        if (itemIdx === 0 && !document.querySelector('.item.active')) {
            item.style.display = '';
            item.classList.add('active');
        }

        atualizarCarrossel(item, false);
    });

    // ===================== Botões Anterior / Próximo =====================
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

    // ===================== Clique na Logo Leva para a Capa (index.html) =====================
    document.querySelectorAll('.navbar .logo-img, .navbar .logo, .navbar a:has(.logo-img)').forEach((logoEl) => {
        logoEl.style.cursor = 'pointer';
        logoEl.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            window.location.assign('index.html');
        }, true);
    });

    // ===================== Botão Voltar / Home da Navbar =====================
    document.addEventListener('click', (e) => {
        if (e.target.closest('.logo-img, .logo, a:has(.logo-img)')) return;

        const voltarBtn = e.target.closest('.btn-voltar');
        if (voltarBtn) {
            e.preventDefault();
            e.stopPropagation();
            const destino = voltarBtn.getAttribute('data-destino') || 'home.html';
            window.location.assign(destino);
        }
    }, true);

    // ===================== Botão de Detalhes dos Cards (.btn-glass) =====================
    function abrirDetalhesCard(card, btn) {
        if (!card) return;

        const linkEl = btn.tagName === 'A' ? btn : btn.querySelector('a');
        if (linkEl) {
            const href = linkEl.getAttribute('href');
            if (href && href !== '#' && !href.startsWith('javascript:')) {
                window.location.href = href;
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

        let dynamicModal = document.getElementById('ellcaDynamicDetailModal');
        if (!dynamicModal) {
            dynamicModal = document.createElement('div');
            dynamicModal.id = 'ellcaDynamicDetailModal';
            dynamicModal.style.cssText = `
                position: fixed; inset: 0; z-index: 9999;
                background: rgba(2, 5, 12, 0.78);
                backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
                display: flex; align-items: center; justify-content: center;
                padding: 16px; opacity: 0; transition: opacity 0.25s ease;
            `;
            dynamicModal.innerHTML = `
                <div id="ellcaDynamicModalBox" style="
                    width: 100%; max-width: 440px; border-radius: 18px; padding: 22px;
                    background: linear-gradient(150deg, rgba(4, 8, 18, 0.94) 0%, rgba(12, 38, 88, 0.90) 100%);
                    border: 1px solid rgba(36, 102, 212, 0.72);
                    box-shadow: 0 25px 60px rgba(0,0,0,0.88), 0 0 32px rgba(14, 52, 122, 0.45);
                    color: #fff; position: relative;
                ">
                    <button type="button" id="ellcaCloseModalBtn" style="
                        position: absolute; top: 14px; right: 14px; width: 30px; height: 30px;
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
                    <h3 id="ellcaModalTitle" style="font-size: 17px; font-weight: 800; margin-bottom: 10px; color: #fff;"></h3>
                    <p id="ellcaModalDesc" style="font-size: 12px; line-height: 1.55; color: #cbd5e1; margin-bottom: 16px;"></p>
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
            actionLink.target = linkAcesso.startsWith('http') ? '_blank' : '_self';
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

    // ===================== Atualiza Posições 3D & Passagem Automática =====================
    function atualizarCarrossel(item, comFumaca = true) {
        const state = itemStates.get(item);
        if (!state || state.cards.length === 0) return;

        const total = state.cards.length;
        const activeIdx = state.currentIndex;
        const rightIdx = (activeIdx + 1) % total;
        const leftIdx = (activeIdx - 1 + total) % total;

        state.cards.forEach((card, idx) => {
            card.classList.remove('card-front', 'card-back-right', 'card-back-left', 'card-hidden', 'pausado');

            if (idx === activeIdx) {
                void card.offsetWidth;
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
                        isPaused = false;
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

        if (item.classList.contains('active')) {
            iniciarCicloAutomatico();
        }
    }

    // ===================== Botão Modo Grade =====================
    gridToggleBtns.forEach(btn => {
        btn.type = 'button';
        const icon = btn.querySelector('i');
        const originalIconClasses = icon ? icon.className : '';

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            isGridMode = !isGridMode;
            isPaused = false;

            gridToggleBtns.forEach(b => {
                b.classList.toggle('ativo', isGridMode);
                const ic = b.querySelector('i');
                if (!ic) return;

                if (isGridMode) {
                    ic.className = 'fas fa-layer-group';
                    b.title = 'Voltar para Modo Carrossel';
                } else {
                    ic.className = originalIconClasses || 'fas fa-th-large';
                    b.title = 'Alternar para Modo Grade';
                }
            });

            document.querySelectorAll('.cards-wrapper').forEach(wrapper => {
                wrapper.classList.toggle('grid-mode', isGridMode);
            });

            if (isGridMode) {
                clearTimeout(autoPlayTimer);
            } else {
                const activeItem = document.querySelector('.item.active');
                if (activeItem) atualizarCarrossel(activeItem, true);
            }
        });
    });

    // ===================== Botão Hambúrguer do Menu Mobile =====================
    function atualizarIconeHamburguer(aberto) {
        if (!menuMobileBtn) return;
        const icon = menuMobileBtn.querySelector('i');
        if (!icon) return;

        if (aberto) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-xmark', 'fa-times');
        } else {
            icon.classList.remove('fa-xmark', 'fa-times');
            icon.classList.add('fa-bars');
        }
    }

    if (menuMobileBtn && navContent) {
        menuMobileBtn.type = 'button';
        menuMobileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const estaAtivo = navContent.classList.toggle('ativo');
            atualizarIconeHamburguer(estaAtivo);
        });

        document.addEventListener('click', (e) => {
            if (navContent.classList.contains('ativo') &&
                !navContent.contains(e.target) &&
                !menuMobileBtn.contains(e.target)) {
                navContent.classList.remove('ativo');
                atualizarIconeHamburguer(false);
            }
        });
    }

    // ===================== Busca em Tempo Real (Nos Cards Permitidos) =====================
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
                isPaused = false;
                const state = itemStates.get(primeiroMatch.item);
                if (state && state.currentIndex !== primeiroMatch.cardIdx) {
                    state.currentIndex = primeiroMatch.cardIdx;
                    atualizarCarrossel(primeiroMatch.item, true);
                }
            }
        });
    }

    // ===================== Navegação por Teclado (Setas, Space e Esc) =====================
    document.addEventListener('keydown', (e) => {
        if (document.activeElement === searchInput ||
            ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
            return;
        }

        if (e.code === 'Space' || e.key === ' ') {
            e.preventDefault();
            alternarPausaCard();
            return;
        }

        if (isGridMode) return;

        if (e.key === 'ArrowRight') {
            e.preventDefault();
            moverCardAtivo(1);
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            moverCardAtivo(-1);
        } else if (e.key === 'Escape') {
            const m = document.getElementById('ellcaDynamicDetailModal');
            if (m && m.style.display === 'flex') {
                m.style.opacity = '0';
                setTimeout(() => { m.style.display = 'none'; }, 220);
            }
        }
    });

    // Inicia o ciclo automático ao carregar
    iniciarCicloAutomatico();
});


// ===================== AVATAR DO USUÁRIO LOGADO NA NAVBAR (SOMENTE FOTO) =====================
(function renderizarUsuarioNavbar() {
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks || document.getElementById('navUserAvatar')) return;

    const PERFIS_ELLCA = {
        'rodrigo':    { nome: 'Rodrigo Lopes',       cargo: 'Analista de Dados',       foto: 'organograma/Rodrigo Lopes.jpeg' },
        'jean':       { nome: 'Jean Francisquini',   cargo: 'Gerente de Contrato',     foto: 'organograma/Jean.jpg' },
        'arioston':   { nome: 'Arioston Paixão',     cargo: 'Gerente Operacional',     foto: 'organograma/Arioston.jpg' },
        'jhonattan':  { nome: 'Jhonattan Alencar',   cargo: 'Coordenador Operacional', foto: 'organograma/Jhonattan.jpg' },
        'fabio':      { nome: 'Fabio Lima',          cargo: 'Líder de Projeto',        foto: 'organograma/Fabio de Lima.jpeg' },
        'jadison':    { nome: 'Jadison Santos',      cargo: 'Supervisor Operacional',  foto: 'organograma/Jadison.jpg' },
        'lillianne':  { nome: 'Lillianne Lima',      cargo: 'Técnica de Segurança',    foto: 'organograma/Lilianne.jpg' },
        'adriana':    { nome: 'Adriana Souza',       cargo: 'Sup. Almoxarifado',       foto: 'organograma/Adriana.jpg' },
        'alex':       { nome: 'Alex Caldeira',       cargo: 'Supervisor de Frota',     foto: 'organograma/Alex.jpg' },
        'jacqueline': { nome: 'Jacqueline Pimentel', cargo: 'Infraestrutura',          foto: 'organograma/Jacqueline.jpg' },
        'suellem':    { nome: 'Suellem Nunes',       cargo: 'Backoffice',              foto: 'organograma/Suellem.jpg' },
        'vanessa':    { nome: 'Vanessa Soares',      cargo: 'Departamento Pessoal',    foto: 'organograma/Vanessa.jpg' },
        'vinicius':   { nome: 'Vinicius Alves',      cargo: 'Eng. de Segurança',       foto: '' },
        'endel':      { nome: 'Endel Amaral',        cargo: 'Analista de TI',          foto: '' },
        'eduarda':    { nome: 'Eduarda Ribeiro',     cargo: 'Analista de RH',          foto: '' }
    };

    const rawUser =
        sessionStorage.getItem('ellca_user_name') ||
        localStorage.getItem('usuarioLogado') ||
        sessionStorage.getItem('usuarioLogado') ||
        localStorage.getItem('ellca_user') ||
        'Rodrigo Lopes';

    const chaveBusca = rawUser.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const perfilEncontrado = Object.entries(PERFIS_ELLCA).find(([chave]) => chaveBusca.includes(chave));

    const dadosUsuario = perfilEncontrado
        ? perfilEncontrado[1]
        : { nome: rawUser.split('@')[0], cargo: 'Colaborador Ellca', foto: '' };

    const iniciais = dadosUsuario.nome
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(p => p[0].toUpperCase())
        .join('');

    const avatar = document.createElement('div');
    avatar.id = 'navUserAvatar';
    avatar.className = 'nav-user-avatar';
    avatar.title = `${dadosUsuario.nome} • ${dadosUsuario.cargo}`;
    avatar.innerHTML = dadosUsuario.foto
        ? `<img src="${dadosUsuario.foto}" alt="" onerror="this.parentElement.textContent='${iniciais}';">`
        : iniciais;

    navLinks.insertBefore(avatar, navLinks.firstChild);
})();
