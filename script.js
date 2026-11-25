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

                const clicouEmBotaoOuLink = e.target.closest("button, a, input, .actions");
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

    function configurarAvatarUsuario() {
        const navLinks = document.querySelector(".nav-links");
        if (!navLinks || document.querySelector(".nav-user-avatar")) return;

        const nomeUsuario =
            sessionStorage.getItem("ellca_user_name") ||
            localStorage.getItem("ellca_user_name") ||
            "Rodrigo Lopes";

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
        navLinks.parentElement.insertBefore(avatar, navLinks);
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

        sincronizarItemAtivo(itemInicial, false, true);
        iniciarAutoplay();
    }

    window.EllcaCarrossel = {
        reSincronizarItem(itemEl, comFumaca = true) {
            const alvo = itemEl || itens[indiceAtual] || document.querySelector(".item.active") || document.querySelector(".item");
            sincronizarItemAtivo(alvo, comFumaca, true);
            reiniciarAutoplay();
        },
        irParaSlide(idx, comFumaca = true) {
            mostrarSlide(idx, comFumaca);
            reiniciarAutoplay();
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
