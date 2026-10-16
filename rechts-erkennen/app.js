(function () {
  "use strict";
  var SYM = window.SYMBOLS || [], CATS = window.CATS || {}, SRC = window.SOURCES || {};
  var STATUS = { strafbar: "strafbar", kontext: "kontextabhängig", frei: "nicht strafbar" };

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function plain(s) { return String(s || "").replace(/<[^>]+>/g, ""); }
  function norm(s) { return plain(s).toLowerCase().replace(/[„“”"#'’\-–\s\/.]+/g, " ").trim(); }
  function badge(s) { return '<span class="status st-' + s + '">' + STATUS[s] + "</span>"; }
  function glyph(e, cls) {
    if (e.g) return '<span class="' + cls + '">' + (e.html ? e.g : esc(e.g)) + "</span>";
    var ini = e.n.replace(/[„“()]/g, "").split(/[\s\/-]+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join("");
    return '<span class="' + cls + ' noimg" title="Abbildung bei NinA NRW">' + esc(ini.toUpperCase()) + "</span>";
  }
  function srcLinks(keys) {
    return (keys || []).map(function (k) { var s = SRC[k]; return s ? '<a href="' + s.u + '" target="_blank" rel="noopener">' + esc(s.t) + "</a>" : ""; }).join("");
  }
  function stored(key, val) {
    try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) { return null; }
  }

  /* ---------- Suche ---------- */
  function search(q) {
    var nq = norm(q); if (!nq) return [];
    var out = [];
    SYM.forEach(function (e) {
      var g = norm(e.g), n = norm(e.n), k = norm(e.k), d = norm(e.d), raw = plain(e.g || "");
      var score = 0;
      if (raw && q.trim() === raw) score = 100;
      else if (g && g === nq) score = 90;
      else if (n === nq) score = 85;
      else if (n.indexOf(nq) === 0) score = 70;
      else if (n.indexOf(nq) > -1) score = 55;
      else if (g && g.indexOf(nq) > -1) score = 50;
      else if (k.indexOf(nq) > -1) score = 35;
      else if (nq.length > 2 && d.indexOf(nq) > -1) score = 20;
      if (score) out.push({ e: e, s: score });
    });
    return out.sort(function (a, b) { return b.s - a.s; }).map(function (x) { return x.e; });
  }

  /* ---------- Decoder (Startseite + Symbole) ---------- */
  document.querySelectorAll("[data-decoder]").forEach(function (box) {
    var input = box.querySelector("input"), res = box.querySelector(".dec-results");
    function run() {
      var q = input.value, hits = search(q).slice(0, 4);
      if (!q.trim()) { res.innerHTML = ""; return; }
      if (!hits.length) { res.innerHTML = '<p class="dec-empty">Nichts gefunden. Probiere eine Zahl, ein Emoji oder einen Begriff wie „Remigration“. Fehlt etwas? Schau bei <a href="https://nina-nrw.de/codes-und-symbole/" target="_blank" rel="noopener">NinA NRW</a> nach.</p>'; return; }
      res.innerHTML = hits.map(function (e) {
        return '<div class="dec-hit">' + glyph(e, "gl") + '<div><h4>' + esc(e.n) + badge(e.s) + "</h4><p>" + esc(e.d) + "</p></div></div>";
      }).join("");
    }
    input.addEventListener("input", run);
    box.querySelectorAll(".tries button").forEach(function (b) {
      b.addEventListener("click", function () { input.value = b.textContent; run(); input.focus(); });
    });
    if (input.value) run();
  });

  /* ---------- Symbol-Kartei ---------- */
  var grid = document.getElementById("symgrid");
  if (grid) {
    var state = { cat: "all", st: "all", q: "" };
    var catBox = document.getElementById("catchips"), stBox = document.getElementById("stchips"), q = document.getElementById("symq"), count = document.getElementById("symcount");
    var catsHtml = '<button class="chip" data-cat="all" aria-pressed="true">Alle</button>';
    Object.keys(CATS).forEach(function (k) { catsHtml += '<button class="chip" data-cat="' + k + '" aria-pressed="false">' + esc(CATS[k]) + "</button>"; });
    catBox.innerHTML = catsHtml;

    function render() {
      var list = state.q ? search(state.q) : SYM.slice();
      list = list.filter(function (e) { return (state.cat === "all" || e.c === state.cat) && (state.st === "all" || e.s === state.st); });
      count.textContent = list.length + (list.length === 1 ? " Eintrag" : " Einträge");
      if (!list.length) { grid.innerHTML = '<p class="dec-empty">Keine Treffer mit diesen Filtern.</p>'; return; }
      grid.innerHTML = list.map(function (e) {
        var i = SYM.indexOf(e);
        return '<button class="symcard" data-i="' + i + '" aria-haspopup="dialog">' +
          '<span class="sc-top"><span class="sc-cat">' + esc(CATS[e.c]) + "</span>" + badge(e.s) + "</span>" +
          glyph(e, "sc-gl") +
          '<span class="sc-name">' + esc(e.n) + "</span>" +
          '<span class="sc-k">' + esc(e.k || e.d.split(". ")[0] + ".") + "</span></button>";
      }).join("");
    }
    function setCat(c) {
      state.cat = CATS[c] ? c : "all";
      catBox.querySelectorAll(".chip").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.cat === state.cat); });
      render();
    }
    catBox.addEventListener("click", function (ev) { var b = ev.target.closest(".chip"); if (b) setCat(b.dataset.cat); });
    stBox.addEventListener("click", function (ev) {
      var b = ev.target.closest(".chip"); if (!b) return;
      state.st = b.dataset.st;
      stBox.querySelectorAll(".chip").forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
      render();
    });
    q.addEventListener("input", function () { state.q = q.value; render(); });

    var dlg = document.getElementById("symdlg");
    grid.addEventListener("click", function (ev) {
      var b = ev.target.closest(".symcard"); if (!b) return;
      var e = SYM[+b.dataset.i];
      dlg.querySelector(".dlg-body").innerHTML =
        '<div class="dlg-gl">' + glyph(e, "sc-gl big") + "</div>" +
        '<p class="label">' + esc(CATS[e.c]) + "</p>" +
        "<h3>" + esc(e.n) + "</h3>" + badge(e.s) +
        "<p>" + esc(e.d) + "</p>" +
        (e.g ? "" : '<p class="small">Wie das Zeichen aussieht, zeigt <a href="https://nina-nrw.de/codes-und-symbole/" target="_blank" rel="noopener">NinA NRW</a> mit Abbildung. Wir zeigen hier bewusst keine Nachbildung.</p>') +
        '<div class="srcs"><span>Quelle:</span>' + srcLinks(e.src) + "</div>";
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
    });
    dlg.addEventListener("click", function (ev) { if (ev.target === dlg || ev.target.closest("[data-close]")) dlg.close ? dlg.close() : dlg.removeAttribute("open"); });

    var h = (location.hash || "").replace("#", "");
    if (CATS[h]) setCat(h); else render();
    window.addEventListener("hashchange", function () { var c = location.hash.replace("#", ""); if (CATS[c]) setCat(c); });
  }

  /* ---------- Quiz ---------- */
  var quiz = document.getElementById("quiz");
  if (quiz) {
    var pool = SYM.filter(function (e) { return e.k; });
    var qs = [], qi = 0, right = 0;
    function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
    function start() {
      qs = shuffle(pool.slice()).slice(0, 6); qi = 0; right = 0; ask();
    }
    function ask() {
      if (qi >= qs.length) {
        var best = stored("rq-best"); best = best ? +best : 0;
        if (right > best) stored("rq-best", String(right));
        quiz.innerHTML = '<div class="qz-end"><p class="label">Ergebnis</p><p class="qz-score">' + right + " / " + qs.length + "</p><p>" +
          (right === qs.length ? "Alles erkannt. Stark." : right >= 4 ? "Gut erkannt. Die übrigen findest du in der Kartei oben." : "Einige Codes sind tückisch. Schau dir die Kartei oben noch einmal an.") +
          '</p><button class="btn" id="qz-again">Neue Runde</button></div>';
        document.getElementById("qz-again").addEventListener("click", start);
        return;
      }
      var e = qs[qi];
      var wrong = shuffle(pool.filter(function (x) { return x !== e && x.k !== e.k; })).slice(0, 3);
      var opts = shuffle([e].concat(wrong));
      quiz.innerHTML = '<div class="qz-q"><p class="label">Frage ' + (qi + 1) + " von " + qs.length + "</p>" +
        '<div class="qz-prompt">' + glyph(e, "qz-gl") + '<p>Wofür steht <strong>' + esc(e.n) + "</strong>?</p></div>" +
        '<div class="qz-opts">' + opts.map(function (o) { return '<button class="qz-opt" data-ok="' + (o === e) + '">' + esc(o.k) + "</button>"; }).join("") + "</div>" +
        '<p class="qz-fb" aria-live="polite"></p></div>';
      quiz.querySelectorAll(".qz-opt").forEach(function (b) {
        b.addEventListener("click", function () {
          var ok = b.dataset.ok === "true";
          if (ok) right++;
          quiz.querySelectorAll(".qz-opt").forEach(function (x) { x.disabled = true; if (x.dataset.ok === "true") x.classList.add("ok"); });
          if (!ok) b.classList.add("bad");
          var fb = quiz.querySelector(".qz-fb");
          fb.innerHTML = (ok ? "<strong>Richtig.</strong> " : "<strong>Nicht ganz.</strong> ") + esc(e.d) + ' <button class="btn ghost qz-next">Weiter</button>';
          fb.querySelector(".qz-next").addEventListener("click", function () { qi++; ask(); });
          fb.querySelector(".qz-next").focus();
        });
      });
    }
    start();
  }

  /* ---------- Tabs (Agenda / Propaganda) ---------- */
  document.querySelectorAll("[data-tabs]").forEach(function (box) {
    var tabs = box.querySelectorAll("[role=tab]"), panels = box.querySelectorAll("[role=tabpanel]");
    function show(i) {
      tabs.forEach(function (t, j) { t.setAttribute("aria-selected", i === j); t.tabIndex = i === j ? 0 : -1; });
      panels.forEach(function (p, j) { p.hidden = i !== j; });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { show(i); });
      t.addEventListener("keydown", function (ev) {
        var d = ev.key === "ArrowRight" || ev.key === "ArrowDown" ? 1 : ev.key === "ArrowLeft" || ev.key === "ArrowUp" ? -1 : 0;
        if (!d) return; ev.preventDefault();
        var n = (i + d + tabs.length) % tabs.length; show(n); tabs[n].focus();
      });
    });
    show(0);
  });

  /* ---------- Spektrum (Startseite) ---------- */
  var spec = document.getElementById("spectrum");
  if (spec) {
    var segs = spec.querySelectorAll(".sp-seg"), outs = spec.querySelectorAll(".sp-out");
    function pick(i) {
      segs.forEach(function (s, j) { s.setAttribute("aria-pressed", i === j); });
      outs.forEach(function (o, j) { o.hidden = i !== j; });
    }
    segs.forEach(function (s, i) { s.addEventListener("click", function () { pick(i); }); });
    pick(2);
  }

  /* ---------- Trichter (Propaganda) ---------- */
  var fun = document.getElementById("funnel");
  if (fun) {
    var steps = fun.querySelectorAll(".fn-step"), info = fun.querySelectorAll(".fn-info");
    function sel(i) {
      steps.forEach(function (s, j) { s.setAttribute("aria-pressed", i === j); });
      info.forEach(function (p, j) { p.hidden = i !== j; });
    }
    steps.forEach(function (s, i) { s.addEventListener("click", function () { sel(i); }); });
    sel(0);
  }

  /* ---------- Post-Check (Propaganda) ---------- */
  var post = document.getElementById("postcheck");
  if (post) {
    var spots = post.querySelectorAll(".hot"), panel = post.querySelector(".pc-explain"), found = post.querySelector(".pc-found");
    var seen = {};
    function update() { found.textContent = Object.keys(seen).length + " von " + spots.length + " Stellen gefunden"; }
    spots.forEach(function (s, i) {
      s.addEventListener("click", function () {
        spots.forEach(function (x) { x.classList.remove("active"); });
        s.classList.add("active", "seen"); seen[i] = 1; update();
        var tpl = document.getElementById(s.dataset.t);
        panel.innerHTML = tpl ? tpl.innerHTML : "";
      });
    });
    var reveal = post.querySelector(".pc-reveal");
    if (reveal) reveal.addEventListener("click", function () {
      spots.forEach(function (x, i) { x.classList.add("seen"); seen[i] = 1; }); update();
      post.classList.add("revealed");
    });
    update();
  }
})();
