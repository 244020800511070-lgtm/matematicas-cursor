/**
 * Calculadora Matemática y Geométrica Futurista
 * Módulo principal: UI, validación, audio ligero, partículas e historial.
 */

(function () {
  "use strict";

  // --- Constantes ---
  const PI = Math.PI;
  const HISTORY_KEY = "futuro-calc-history";
  const MAX_HISTORY = 40;

  // --- Referencias DOM ---
  const elLoader = document.getElementById("app-loader");
  const elShell = document.getElementById("app-shell");
  const elCursorGlow = document.getElementById("cursor-glow");
  const elParticles = document.getElementById("particles-canvas");
  const elMathA = document.getElementById("math-a");
  const elMathB = document.getElementById("math-b");
  const elMathError = document.getElementById("math-error");
  const elMathResult = document.getElementById("math-result");
  const elMathResultValue = document.getElementById("math-result-value");
  const elHistoryList = document.getElementById("history-list");
  const elClearHistory = document.getElementById("clear-history");
  const elToggleGlass = document.getElementById("toggle-glass");
  const elGlassLabel = document.getElementById("glass-mode-label");

  /** Estado modo visual */
  let strongGlass = false;

  // ============================================
  // Operaciones matemáticas (funciones aisladas)
  // ============================================

  /**
   * @param {number} a
   * @param {number} b
   * @returns {number}
   */
  function addNumbers(a, b) {
    return a + b;
  }

  /**
   * @param {number} a
   * @param {number} b
   * @returns {number}
   */
  function subtractNumbers(a, b) {
    return a - b;
  }

  /**
   * @param {number} a
   * @param {number} b
   * @returns {number}
   */
  function multiplyNumbers(a, b) {
    return a * b;
  }

  /**
   * @param {number} a
   * @param {number} b
   * @returns {number}
   * @throws {Error} Si b es 0
   */
  function divideNumbers(a, b) {
    if (b === 0) {
      throw new Error("No se puede dividir entre cero.");
    }
    return a / b;
  }

  // ============================================
  // Geometría (funciones aisladas por figura)
  // ============================================

  /**
   * Área del círculo: A = π r²
   * @param {number} r
   * @returns {number}
   */
  function circleArea(r) {
    return PI * r * r;
  }

  /**
   * Perímetro del círculo: P = 2πr
   * @param {number} r
   * @returns {number}
   */
  function circlePerimeter(r) {
    return 2 * PI * r;
  }

  /**
   * Área del cuadrado: A = l²
   * @param {number} l
   * @returns {number}
   */
  function squareArea(l) {
    return l * l;
  }

  /**
   * Perímetro del cuadrado: P = 4l
   * @param {number} l
   * @returns {number}
   */
  function squarePerimeter(l) {
    return 4 * l;
  }

  /**
   * Área del rectángulo: A = b × h
   * @param {number} b
   * @param {number} h
   * @returns {number}
   */
  function rectangleArea(b, h) {
    return b * h;
  }

  /**
   * Perímetro del rectángulo: P = 2(b + h)
   * @param {number} b
   * @param {number} h
   * @returns {number}
   */
  function rectanglePerimeter(b, h) {
    return 2 * (b + h);
  }

  /**
   * Área del triángulo: A = (b × h) / 2
   * @param {number} base
   * @param {number} height
   * @returns {number}
   */
  function triangleArea(base, height) {
    return (base * height) / 2;
  }

  /**
   * Perímetro del triángulo: P = a + b + c
   * @param {number} sideA
   * @param {number} sideB
   * @param {number} sideC
   * @returns {number}
   */
  function trianglePerimeter(sideA, sideB, sideC) {
    return sideA + sideB + sideC;
  }

  // ============================================
  // Validación numérica
  // ============================================

  /**
   * Convierte y valida un número finito (acepta negativos si allowNegative).
   * @param {string} raw
   * @param {{ allowNegative?: boolean, label?: string }} [opts]
   * @returns {{ ok: true, value: number } | { ok: false, message: string }}
   */
  function parseValidatedNumber(raw, opts) {
    const allowNegative = opts && opts.allowNegative === true;
    const label = (opts && opts.label) || "El valor";

    if (raw === "" || raw === null || raw === undefined) {
      return { ok: false, message: `${label} no puede estar vacío.` };
    }

    const n = Number(raw);
    if (!Number.isFinite(n)) {
      return { ok: false, message: `${label} no es un número válido.` };
    }

    if (!allowNegative && n < 0) {
      return { ok: false, message: `${label} no puede ser negativo en este contexto.` };
    }

    return { ok: true, value: n };
  }

  /**
   * Valida que tres longitudes formen un triángulo (desigualdad triangular).
   */
  function validateTriangleSides(a, b, c) {
    if (a <= 0 || b <= 0 || c <= 0) {
      return { ok: false, message: "Los lados deben ser mayores que cero." };
    }
    if (a + b <= c || a + c <= b || b + c <= a) {
      return {
        ok: false,
        message: "Los tres lados no forman un triángulo válido (desigualdad triangular).",
      };
    }
    return { ok: true };
  }

  // ============================================
  // Formato y mensajes en UI
  // ============================================

  function formatNumber(n) {
    if (!Number.isFinite(n)) return "—";
    const abs = Math.abs(n);
    const decimals = abs >= 1e6 || (abs > 0 && abs < 1e-4) ? 6 : 4;
    let s = n.toFixed(decimals);
    s = s.replace(/\.?0+$/, "");
    return s;
  }

  function showMathError(message) {
    elMathError.textContent = message;
    elMathError.hidden = false;
  }

  function hideMathError() {
    elMathError.hidden = true;
    elMathError.textContent = "";
  }

  function flashResultBox() {
    elMathResult.classList.remove("result-box--flash");
    void elMathResult.offsetWidth;
    elMathResult.classList.add("result-box--flash");
  }

  function setGeoOutput(shape, html, variant) {
    const box = document.querySelector(`[data-output="${shape}"]`);
    if (!box) return;
    box.classList.remove("is-error", "is-success");
    if (variant === "error") box.classList.add("is-error");
    if (variant === "success") box.classList.add("is-success");
    box.innerHTML = html;
  }

  // ============================================
  // Historial (localStorage)
  // ============================================

  function loadHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  function saveHistory(items) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, MAX_HISTORY)));
    } catch {
      /* ignorar cuota llena */
    }
  }

  function renderHistory() {
    const items = loadHistory();
    elHistoryList.innerHTML = "";
    items.forEach(function (text) {
      const li = document.createElement("li");
      li.className = "history-item";
      li.innerHTML = text;
      elHistoryList.appendChild(li);
    });
  }

  /**
   * @param {string} entry HTML seguro (solo nuestros strings escapados)
   */
  function pushHistory(entry) {
    const items = loadHistory();
    items.unshift(entry);
    saveHistory(items);
    renderHistory();
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ============================================
  // Audio suave (Web Audio API, sin archivos)
  // ============================================

  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      audioCtx = new Ctx();
    }
    return audioCtx;
  }

  /** Pitido corto tipo interfaz sci-fi */
  function playSoftBeep(high) {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume().catch(function () {});
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = high ? 880 : 520;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  }

  // ============================================
  // Partículas (canvas)
  // ============================================

  function initParticles() {
    const canvas = elParticles;
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext("2d");
    let w = 0;
    let h = 0;
    const particles = [];

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }

    function spawn(count) {
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          r: Math.random() * 1.8 + 0.4,
          hue: Math.random() > 0.5 ? 180 : 290,
        });
      }
    }

    function step() {
      ctx.clearRect(0, 0, w, h);
      particles.forEach(function (p) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        g.addColorStop(0, `hsla(${p.hue}, 100%, 70%, 0.9)`);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 4, 0, PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(step);
    }

    resize();
    spawn(55);
    window.addEventListener("resize", resize);
    requestAnimationFrame(step);
  }

  // ============================================
  // Iluminación que sigue al ratón
  // ============================================

  function initCursorGlow() {
    if (!elCursorGlow) return;
    let raf = 0;
    window.addEventListener(
      "mousemove",
      function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = 0;
          const x = (e.clientX / window.innerWidth) * 100;
          const y = (e.clientY / window.innerHeight) * 100;
          elCursorGlow.style.setProperty("--mx", x + "%");
          elCursorGlow.style.setProperty("--my", y + "%");
        });
      },
      { passive: true }
    );
  }

  // ============================================
  // Loader inicial
  // ============================================

  function hideLoader() {
    if (!elLoader || !elShell) return;
    elLoader.classList.add("app-loader--done");
    elShell.classList.remove("app-shell--hidden");
  }

  // ============================================
  // Handlers: matemáticas
  // ============================================

  function runMathOperation(op) {
    playSoftBeep(true);
    hideMathError();

    const va = parseValidatedNumber(elMathA.value, { allowNegative: true, label: "Valor A" });
    const vb = parseValidatedNumber(elMathB.value, { allowNegative: true, label: "Valor B" });

    if (!va.ok) {
      showMathError(va.message);
      return;
    }
    if (!vb.ok) {
      showMathError(vb.message);
      return;
    }

    const a = va.value;
    const b = vb.value;
    let result;
    let label = "";

    try {
      switch (op) {
        case "add":
          result = addNumbers(a, b);
          label = "Suma";
          break;
        case "subtract":
          result = subtractNumbers(a, b);
          label = "Resta";
          break;
        case "multiply":
          result = multiplyNumbers(a, b);
          label = "Multiplicación";
          break;
        case "divide":
          result = divideNumbers(a, b);
          label = "División";
          break;
        default:
          showMathError("Operación no reconocida.");
          return;
      }
    } catch (err) {
      showMathError(err.message || "Error en la operación.");
      return;
    }

    elMathResultValue.textContent = formatNumber(result);
    flashResultBox();

    const hist = `<strong>${escapeHtml(label)}</strong>: ${escapeHtml(String(a))} y ${escapeHtml(
      String(b)
    )} → <strong>${escapeHtml(formatNumber(result))}</strong>`;
    pushHistory(hist);
  }

  // ============================================
  // Handlers: geometría
  // ============================================

  function calcCircle() {
    playSoftBeep(false);
    const r = parseValidatedNumber(document.getElementById("circle-r").value, {
      label: "Radio",
    });
    if (!r.ok) {
      setGeoOutput("circle", r.message, "error");
      return;
    }
    const A = circleArea(r.value);
    const P = circlePerimeter(r.value);
    setGeoOutput(
      "circle",
      `Área <strong>A = πr²</strong> ≈ <strong>${formatNumber(A)}</strong><br/>Perímetro <strong>P = 2πr</strong> ≈ <strong>${formatNumber(
        P
      )}</strong>`,
      "success"
    );
    pushHistory(
      `<strong>Círculo</strong> r=${escapeHtml(formatNumber(r.value))} → A=${escapeHtml(
        formatNumber(A)
      )}, P=${escapeHtml(formatNumber(P))}`
    );
  }

  function calcSquare() {
    playSoftBeep(false);
    const l = parseValidatedNumber(document.getElementById("square-l").value, { label: "Lado" });
    if (!l.ok) {
      setGeoOutput("square", l.message, "error");
      return;
    }
    if (l.value === 0) {
      setGeoOutput("square", "El lado debe ser mayor que cero.", "error");
      return;
    }
    const A = squareArea(l.value);
    const P = squarePerimeter(l.value);
    setGeoOutput(
      "square",
      `Área <strong>A = l²</strong> = <strong>${formatNumber(A)}</strong><br/>Perímetro <strong>P = 4l</strong> = <strong>${formatNumber(
        P
      )}</strong>`,
      "success"
    );
    pushHistory(
      `<strong>Cuadrado</strong> l=${escapeHtml(formatNumber(l.value))} → A=${escapeHtml(
        formatNumber(A)
      )}, P=${escapeHtml(formatNumber(P))}`
    );
  }

  function calcRectangle() {
    playSoftBeep(false);
    const b = parseValidatedNumber(document.getElementById("rect-b").value, { label: "Base" });
    const h = parseValidatedNumber(document.getElementById("rect-h").value, { label: "Altura" });
    if (!b.ok) {
      setGeoOutput("rectangle", b.message, "error");
      return;
    }
    if (!h.ok) {
      setGeoOutput("rectangle", h.message, "error");
      return;
    }
    if (b.value === 0 || h.value === 0) {
      setGeoOutput("rectangle", "Base y altura deben ser mayores que cero.", "error");
      return;
    }
    const A = rectangleArea(b.value, h.value);
    const P = rectanglePerimeter(b.value, h.value);
    setGeoOutput(
      "rectangle",
      `Área <strong>A = b×h</strong> = <strong>${formatNumber(A)}</strong><br/>Perímetro <strong>P = 2(b+h)</strong> = <strong>${formatNumber(
        P
      )}</strong>`,
      "success"
    );
    pushHistory(
      `<strong>Rectángulo</strong> b=${escapeHtml(formatNumber(b.value))}, h=${escapeHtml(
        formatNumber(h.value)
      )} → A=${escapeHtml(formatNumber(A))}, P=${escapeHtml(formatNumber(P))}`
    );
  }

  function calcTriangle() {
    playSoftBeep(false);
    const base = parseValidatedNumber(document.getElementById("tri-b").value, { label: "Base" });
    const height = parseValidatedNumber(document.getElementById("tri-h").value, { label: "Altura" });
    const sa = parseValidatedNumber(document.getElementById("tri-a").value, { label: "Lado a" });
    const sb = parseValidatedNumber(document.getElementById("tri-b2").value, { label: "Lado b" });
    const sc = parseValidatedNumber(document.getElementById("tri-c").value, { label: "Lado c" });

    const msgs = [];
    [base, height, sa, sb, sc].forEach(function (r) {
      if (!r.ok) msgs.push(r.message);
    });
    if (msgs.length) {
      setGeoOutput("triangle", msgs[0], "error");
      return;
    }

    if (base.value === 0 || height.value === 0) {
      setGeoOutput("triangle", "Base y altura deben ser mayores que cero para el área.", "error");
      return;
    }

    const triCheck = validateTriangleSides(sa.value, sb.value, sc.value);
    if (!triCheck.ok) {
      setGeoOutput("triangle", triCheck.message, "error");
      return;
    }

    const A = triangleArea(base.value, height.value);
    const P = trianglePerimeter(sa.value, sb.value, sc.value);

    setGeoOutput(
      "triangle",
      `Área <strong>A = (b×h)/2</strong> = <strong>${formatNumber(A)}</strong><br/>Perímetro <strong>P = a+b+c</strong> = <strong>${formatNumber(
        P
      )}</strong>`,
      "success"
    );
    pushHistory(
      `<strong>Triángulo</strong> A=${escapeHtml(formatNumber(A))}, P=${escapeHtml(formatNumber(P))}`
    );
  }

  // ============================================
  // Eventos globales
  // ============================================

  function bindMathButtons() {
    document.querySelectorAll("[data-op]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        runMathOperation(btn.getAttribute("data-op"));
      });
    });
  }

  function bindGeoButtons() {
    document.querySelectorAll("[data-calc]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const kind = btn.getAttribute("data-calc");
        if (kind === "circle") calcCircle();
        else if (kind === "square") calcSquare();
        else if (kind === "rectangle") calcRectangle();
        else if (kind === "triangle") calcTriangle();
      });
    });
  }

  function bindHistory() {
    elClearHistory.addEventListener("click", function () {
      playSoftBeep(false);
      saveHistory([]);
      renderHistory();
    });
  }

  function bindToggles() {
    elToggleGlass.addEventListener("click", function () {
      strongGlass = !strongGlass;
      document.body.classList.toggle("mode-strong-glass", strongGlass);
      elGlassLabel.textContent = strongGlass ? "Glass intenso" : "Neón + Glass";
      playSoftBeep(true);
    });
  }

  function init() {
    bindMathButtons();
    bindGeoButtons();
    bindHistory();
    bindToggles();
    initCursorGlow();
    initParticles();
    renderHistory();

    window.setTimeout(function () {
      hideLoader();
    }, 900);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
