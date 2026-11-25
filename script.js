(() => {
    const CONFIG = {
        autoplayMs: 6000,
        smokeDurationMs: 1050,
        swipeThresholdPx: 45
    };

    const itens = Array.from(document.querySelectorAll(".container .slide .item"));
    const prevBtn = document.querySelector(".controls .prev");
    const nextBtn = document.querySelector(".controls .next");
    const dotsContainer = document.querySelector(".pagination-dots");
    const gridToggleBtn = document.querySelector(".grid-toggle-btn");
    const searchInput = document.getElementById("cardSearch");

    const menuMobileBtn = document.querySelector(".menu-mobile-btn");
    const navContent = document.querySelector(".nav-content");
    const botoesVoltar = Array.from(document.querySelectorAll(".btn-voltar"));

    let indiceAtual = 0;
    let indiceCardAtivo = 0;
    let autoplayTimer = null;
    let smokeTimer = null;
    let modoGrade = false;

    const getWrapper = (itemEl) =>
        itemEl ? itemEl.querySelector(".cards-wrapper") : null;

    const getCards = (itemEl) =>
        itemEl ? Array.from(itemEl.querySelectorAll(".glass-card")) : [];

    function dispararFumaca(wrapperEl) {
        if (!wrapperEl || modoGrade) return;
        if (localStorage.getItem("ellca_effects") === "off") return;
        wrapperEl.classList.remove("smoke-burst");
        void wrapperEl.offsetWidth;
        wrapperEl.classList.add("smoke-burst");

        clearTimeout(smokeTimer);
        smokeTimer = setTimeout(() => {
            wrapperEl.classList.remove("smoke-burst");
        }, CONFIG.smokeDurationMs);
    }

    function aplicarModoGrade(itemEl) {
        const wrapper = getWrapper(itemEl);
        const cards = getCards(itemEl);
        if (!wrapper) return;

        if (modoGrade) {
            wrapper.classList.add("grid-mode");
            wrapper.classList.remove("smoke-burst");
            cards.forEach((card) => {
                card.classList.remove(
                    "card-front",
                    "card-back-left",
                    "card-back-right",
                    "card-hidden",
                    "pausado"
                );
            });
        } else {
            wrapper.classList.remove("grid-mode");
        }
    }

    function atualizarPosicoesCards(itemEl, comFumaca = false) {
        if (!itemEl) return;

        const cards = getCards(itemEl);
        const wrapper = getWrapper(itemEl);
        const total = cards.length;

        if (total === 0) return;

        if (indiceCardAtivo < 0 || indiceCardAtivo >= total) {
            indiceCardAtivo = 0;
        }

        if (modoGrade) {
            aplicarModoGrade(itemEl);
            return;
        }

        if (wrapper) {
            wrapper.classList.remove("grid-mode");
        }

        const prevIdx = (indiceCardAtivo - 1 + total) % total;
        const nextIdx = (indiceCardAtivo + 1) % total;

        cards.forEach((card, idx) => {
            card.classList.remove(
                "card-front",
                "card-back-left",
                "card-back-right",
                "card-hidden"
            );

            if (total === 1) {
                card.classList.add("card-front");
            } else if (idx === indiceCardAtivo) {
                card.classList.add("card-front");
            } else if (idx === prevIdx) {
                card.classList.add("card-back-left");
            } else if (idx === nextIdx) {
                card.classList.add("card-back-right");
            } else {
                card.classList.add("card-hidden");
            }
        });

        if (comFumaca) {
            dispararFumaca(wrapper);
        }
    }

    function construirDots(total) {
        if (!dotsContainer) return;
        dotsContainer.innerHTML = "";

        for (let i = 0; i < total; i++) {
            const dot = document.createElement("span");
            dot.classList.add("dot");
            dot.setAttribute("role", "button");
            dot.setAttribute("tabindex", "0");
            dot.setAttribute("aria-label", `Ir para item ${i + 1}`);

            if (i === indiceCardAtivo) {
                dot.classList.add("active");
            }

            const selecionarDot = () => {
                const itemAtivo = itens[indiceAtual] || document.querySelector(".item.active") || document.querySelector(".item");
                const cards = getCards(itemAtivo);
                if (cards.length > 0) {
                    indiceCardAtivo = i % cards.length;
                    atualizarPosicoesCards(itemAtivo, true);
                    atualizarEstadoDots(cards.length);
                    reiniciarAutoplay();
                }
            };

            dot.addEventListener("click", (e) => {
                e.stopPropagation();
                selecionarDot();
            });

            dot.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    selecionarDot();
                }
            });

            dotsContainer.appendChild(dot);
        }
    }

    function atualizarEstadoDots(totalCards) {
        if (!dotsContainer) return;
        const dots = Array.from(dotsContainer.querySelectorAll(".dot"));

        if (dots.length !== totalCards) {
            construirDots(totalCards);
            return;
        }

        dots.forEach((dot, idx) => {
            dot.classList.toggle("active", idx === indiceCardAtivo);
        });
    }

    function sincronizarItemAtivo(itemEl, comFumaca = false, resetarIndice = true) {
        const alvo = itemEl || itens[indiceAtual] || document.querySelector(".item");
        if (!alvo) return;

        const cards = getCards(alvo);
        if (resetarIndice || indiceCardAtivo >= cards.length) {
            indiceCardAtivo = 0;
        }

        construirDots(cards.length);
        atualizarPosicoesCards(alvo, comFumaca);
        vincularInteracoesCards(alvo);
    }

    function avancarCard(passo = 1, comFumaca = true) {
        const itemAtivo = itens[indiceAtual] || document.querySelector(".item.active") || document.querySelector(".item");
        const cards = getCards(itemAtivo);
        if (cards.length <= 1) return;

        indiceCardAtivo = (indiceCardAtivo + passo + cards.length) % cards.length;
        atualizarPosicoesCards(itemAtivo, comFumaca);
        atualizarEstadoDots(cards.length);
    }

    function mostrarSlide(novoIndice, comFumaca = true) {
        if (itens.length === 0) return;

        indiceAtual = (novoIndice + itens.length) % itens.length;

        itens.forEach((item, idx) => {
            item.classList.toggle("active", idx === indiceAtual);
        });

        sincronizarItemAtivo(itens[indiceAtual], comFumaca, true);
    }

    function iniciarAutoplay() {
        pararAutoplay();
        if (modoGrade) return;

        autoplayTimer = setInterval(() => {
            const itemAtivo = itens[indiceAtual] || document.querySelector(".item.active") || document.querySelector(".item");
            const frontCard = itemAtivo ? itemAtivo.querySelector(".glass-card.card-front") : null;
            if (frontCard && frontCard.classList.contains("pausado")) {
                return;
            }
            avancarCard(1, true);
        }, CONFIG.autoplayMs);
    }

    function pararAutoplay() {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
    }

    function reiniciarAutoplay() {
        iniciarAutoplay();
    }

    function vincularInteracoesCards(itemEl) {
        const cards = getCards(itemEl);

        cards.forEach((card, idx) => {
            if (card.dataset.jsBound === "true") return;
            card.dataset.jsBound = "true";

            card.addEventListener("click", (e) => {
                if (modoGrade) return;

                const clicouEmBotaoOuLink = e.target.closest("button, a, input, .actions, .btn-fav-card");
                if (clicouEmBotaoOuLink) return;

                if (card.classList.contains("card-back-right")) {
                    e.stopPropagation();
                    avancarCard(1, true);
                    reiniciarAutoplay();
                } else if (card.classList.contains("card-back-left")) {
                    e.stopPropagation();
                    avancarCard(-1, true);
                    reiniciarAutoplay();
                } else if (card.classList.contains("card-front")) {
                    card.classList.toggle("pausado");
                }
            });

            card.addEventListener("mouseenter", () => {
                if (!modoGrade && card.classList.contains("card-front")) {
                    pararAutoplay();
                }
            });

            card.addEventListener("mouseleave", () => {
                if (!modoGrade) {
                    iniciarAutoplay();
                }
            });

            if (card.dataset.index === undefined) {
                card.dataset.index = String(idx);
            }
        });
    }

    function configurarGestosToque() {
        const wrappers = Array.from(document.querySelectorAll(".cards-wrapper"));
        wrappers.forEach((wrapper) => {
            let startX = 0;
            let startY = 0;
            let tracking = false;

            wrapper.addEventListener(
                "touchstart",
                (e) => {
                    if (modoGrade || !e.touches || e.touches.length === 0) return;
                    startX = e.touches[0].clientX;
                    startY = e.touches[0].clientY;
                    tracking = true;
                },
                { passive: true }
            );

            wrapper.addEventListener(
                "touchend",
                (e) => {
                    if (!tracking || modoGrade || !e.changedTouches || e.changedTouches.length === 0) {
                        tracking = false;
                        return;
                    }
                    const endX = e.changedTouches[0].clientX;
                    const endY = e.changedTouches[0].clientY;
                    const dx = endX - startX;
                    const dy = endY - startY;
                    tracking = false;

                    if (Math.abs(dx) > CONFIG.swipeThresholdPx && Math.abs(dx) > Math.abs(dy)) {
                        if (dx < 0) {
                            avancarCard(1, true);
                        } else {
                            avancarCard(-1, true);
                        }
                        reiniciarAutoplay();
                    }
                },
                { passive: true }
            );
        });
    }

    function configurarControles() {
        if (nextBtn) {
            nextBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (itens.length > 1) {
                    mostrarSlide(indiceAtual + 1, true);
                } else {
                    avancarCard(1, true);
                }
                reiniciarAutoplay();
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (itens.length > 1) {
                    mostrarSlide(indiceAtual - 1, true);
                } else {
                    avancarCard(-1, true);
                }
                reiniciarAutoplay();
            });
        }

        document.addEventListener("keydown", (e) => {
            const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : "";
            if (tag === "input" || tag === "textarea") return;

            if (e.key === "ArrowRight") {
                avancarCard(1, true);
                reiniciarAutoplay();
            } else if (e.key === "ArrowLeft") {
                avancarCard(-1, true);
                reiniciarAutoplay();
            }
        });
    }

    function configurarModoGrade() {
        if (!gridToggleBtn) return;

        gridToggleBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            modoGrade = !modoGrade;
            gridToggleBtn.classList.toggle("ativo", modoGrade);

            const itemAtivo = itens[indiceAtual] || document.querySelector(".item.active") || document.querySelector(".item");
            if (modoGrade) {
                pararAutoplay();
                aplicarModoGrade(itemAtivo);
            } else {
                atualizarPosicoesCards(itemAtivo, true);
                iniciarAutoplay();
            }
        });
    }

    function configurarPesquisa() {
        if (!searchInput) return;

        searchInput.addEventListener("input", () => {
            const termo = searchInput.value.trim().toLowerCase();
            const itemAtivo = itens[indiceAtual] || document.querySelector(".item.active") || document.querySelector(".item");
            const cards = getCards(itemAtivo);

            if (!termo) {
                cards.forEach((c) => c.classList.remove("search-highlight"));
                return;
            }

            let encontrouIdx = -1;
            cards.forEach((card, idx) => {
                const textoCard = (
                    (card.getAttribute("data-title") || "") +
                    " " +
                    (card.textContent || "")
                ).toLowerCase();

                const bateu = textoCard.includes(termo);
                card.classList.toggle("search-highlight", bateu);
                if (bateu && encontrouIdx === -1) {
                    encontrouIdx = idx;
                }
            });

            if (encontrouIdx !== -1 && !modoGrade) {
                indiceCardAtivo = encontrouIdx;
                atualizarPosicoesCards(itemAtivo, false);
                atualizarEstadoDots(cards.length);
            }
        });

        searchInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                const termo = searchInput.value.trim().toLowerCase();
                if (termo && window.EllcaDashSearchGlobal) {
                    window.EllcaDashSearchGlobal(termo);
                }
            }
        });
    }

    function configurarMenuMobileEVoltar() {
        if (menuMobileBtn && navContent) {
            menuMobileBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                navContent.classList.toggle("ativo");
            });

            document.addEventListener("click", (e) => {
                if (
                    navContent.classList.contains("ativo") &&
                    !navContent.contains(e.target) &&
                    !menuMobileBtn.contains(e.target)
                ) {
                    navContent.classList.remove("ativo");
                }
            });
        }

        botoesVoltar.forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                const destino = btn.getAttribute("data-destino") || "home.html";
                window.location.href = destino;
            });
        });
    }

    function configurarMenuRecolhivel() {
        const navbar = document.querySelector(".navbar");
        if (!navbar) return;

        const estadoSalvo = sessionStorage.getItem("ellca_bars_collapsed");
        let collapsed = estadoSalvo !== null ? estadoSalvo === "true" : true;
        document.body.classList.toggle("bars-collapsed", collapsed);

        const btnLocal = document.getElementById("btnToggleBars");
        if (btnLocal) {
            const iconLocal = document.getElementById("iconToggleBars");
            const textLocal = document.getElementById("textToggleBars");
            btnLocal.classList.toggle("active-mode", !collapsed);
            if (iconLocal) iconLocal.className = collapsed ? "fa-solid fa-bars" : "fa-solid fa-eye-slash";
            if (textLocal) textLocal.textContent = collapsed ? "Mostrar Menu" : "Ocultar Menu";

            btnLocal.addEventListener("click", () => {
                setTimeout(() => {
                    const estadoAtual = document.body.classList.contains("bars-collapsed");
                    sessionStorage.setItem("ellca_bars_collapsed", String(estadoAtual));
                }, 0);
            });
            return;
        }

        if (document.getElementById("globalBtnToggleBars")) return;

        const btnGlobal = document.createElement("button");
        btnGlobal.type = "button";
        btnGlobal.id = "globalBtnToggleBars";
        btnGlobal.className = "global-menu-toggle-btn" + (!collapsed ? " active-mode" : "");
        btnGlobal.title = "Exibir ou ocultar menu superior e rodapé";
        btnGlobal.innerHTML = collapsed
            ? '<i class="fa-solid fa-bars"></i><span>Mostrar Menu</span>'
            : '<i class="fa-solid fa-eye-slash"></i><span>Ocultar Menu</span>';

        btnGlobal.addEventListener("click", () => {
            collapsed = !collapsed;
            sessionStorage.setItem("ellca_bars_collapsed", String(collapsed));
            document.body.classList.toggle("bars-collapsed", collapsed);
            btnGlobal.classList.toggle("active-mode", !collapsed);
            btnGlobal.innerHTML = collapsed
                ? '<i class="fa-solid fa-bars"></i><span>Mostrar Menu</span>'
                : '<i class="fa-solid fa-eye-slash"></i><span>Ocultar Menu</span>';
        });

        document.body.appendChild(btnGlobal);
    }

    function configurarAvatarUsuario() {
        const navLinks = document.querySelector(".nav-links");
        if (!navLinks || document.querySelector(".nav-user-wrap")) return;

        const nomeUsuario =
            sessionStorage.getItem("ellca_user_name") ||
            localStorage.getItem("ellca_user_name") ||
            "Rodrigo Lopes";

        const cargoUsuario =
            sessionStorage.getItem("ellca_user_role") ||
            localStorage.getItem("ellca_user_role") ||
            "Analista de Dados • BI";

        const fotoUsuario =
            sessionStorage.getItem("ellca_user_photo") ||
            localStorage.getItem("ellca_user_photo") ||
            "img/avatar_usuario.jpg";

        const iniciais = nomeUsuario
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((p) => p[0] || "")
            .join("")
            .toUpperCase() || "RL";

        const wrap = document.createElement("div");
        wrap.className = "nav-user-wrap";

        const avatar = document.createElement("div");
        avatar.className = "nav-user-avatar";
        avatar.title = nomeUsuario;

        const img = document.createElement("img");
        img.src = fotoUsuario;
        img.alt = nomeUsuario;
        img.addEventListener("error", () => {
            img.remove();
            avatar.textContent = iniciais;
        });
        avatar.appendChild(img);

        const effectsAtivo = localStorage.getItem("ellca_effects") !== "off";

        const popover = document.createElement("div");
        popover.className = "user-popover";
        popover.innerHTML = `
            <div class="user-popover-header">
                <strong>${nomeUsuario}</strong>
                <span>${cargoUsuario}</span>
            </div>
            <button type="button" class="user-popover-item" id="btnToggleEffects">
                <span><i class="fa-solid fa-wand-magic-sparkles"></i> Efeitos Visuais</span>
                <strong id="effectsStatusLabel">${effectsAtivo ? "ON" : "OFF"}</strong>
            </button>
            <button type="button" class="user-popover-item" id="btnLimparFavs">
                <span><i class="fa-solid fa-star"></i> Resetar Favoritos</span>
                <i class="fa-solid fa-rotate-left"></i>
            </button>
            <button type="button" class="user-popover-item danger" id="btnPopoverSair">
                <span><i class="fa-solid fa-right-from-bracket"></i> Encerrar Sessão</span>
            </button>
        `;

        avatar.addEventListener("click", (e) => {
            e.stopPropagation();
            popover.classList.toggle("open");
        });

        document.addEventListener("click", (e) => {
            if (!wrap.contains(e.target)) {
                popover.classList.remove("open");
            }
        });

        popover.querySelector("#btnToggleEffects").addEventListener("click", () => {
            const atual = localStorage.getItem("ellca_effects") !== "off";
            localStorage.setItem("ellca_effects", atual ? "off" : "on");
            popover.querySelector("#effectsStatusLabel").textContent = atual ? "OFF" : "ON";
        });

        popover.querySelector("#btnLimparFavs").addEventListener("click", () => {
            localStorage.removeItem("ellca_dash_favs");
            window.location.reload();
        });

        popover.querySelector("#btnPopoverSair").addEventListener("click", () => {
            sessionStorage.removeItem("ellca_auth");
            window.location.href = "login.html";
        });

        wrap.appendChild(avatar);
        wrap.appendChild(popover);
        navLinks.parentElement.insertBefore(wrap, navLinks);
    }

    function init() {
        const itemInicial = itens[0] || document.querySelector(".item.active") || document.querySelector(".item");
        if (itens.length > 0) {
            itens.forEach((item, idx) => item.classList.toggle("active", idx === 0));
        }

        configurarAvatarUsuario();
        configurarControles();
        configurarModoGrade();
        configurarPesquisa();
        configurarGestosToque();
        configurarMenuMobileEVoltar();
        configurarMenuRecolhivel();

        sincronizarItemAtivo(itemInicial, false, true);
        iniciarAutoplay();
    }

    window.EllcaCarrossel = {
        reSincronizarItem(itemEl, comFumaca = true, indiceInicial = 0) {
            const alvo = itemEl || itens[indiceAtual] || document.querySelector(".item.active") || document.querySelector(".item");
            indiceCardAtivo = indiceInicial;
            sincronizarItemAtivo(alvo, comFumaca, indiceInicial === 0);
            if (indiceInicial > 0) {
                atualizarPosicoesCards(alvo, comFumaca);
                atualizarEstadoDots(getCards(alvo).length);
            }
            reiniciarAutoplay();
        },
        irParaSlide(idx, comFumaca = true) {
            mostrarSlide(idx, comFumaca);
            reiniciarAutoplay();
        },
        irParaCard(idx, comFumaca = true) {
            const itemAtivo = itens[indiceAtual] || document.querySelector(".item.active") || document.querySelector(".item");
            const cards = getCards(itemAtivo);
            if (cards.length > 0) {
                indiceCardAtivo = idx % cards.length;
                atualizarPosicoesCards(itemAtivo, comFumaca);
                atualizarEstadoDots(cards.length);
                reiniciarAutoplay();
            }
        },
        obterIndiceAtual() {
            return indiceCardAtivo;
        }
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
