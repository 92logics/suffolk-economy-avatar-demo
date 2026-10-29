(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var params = new URLSearchParams(location.search);
  var ATTRACT_MS = +params.get("attract") || 30000;   // idle time before attract loop
  var IDLE_MS = +params.get("idle") || 90000;         // inactivity before conversation reset
  var WARN_MS = Math.min(15000, Math.floor(IDLE_MS / 3));
  var engine = new AmbassadorEngine(SEAStore.kb());
  var session = SEAStore.newSession();
  var turns = 0, lastActivity = Date.now(), voiceOn = !params.has("mute"), speakingTimer = null;
  var avatar = $("avatar"), msgs = $("messages");

  var SUGGEST = [
    "What makes Suffolk a good place to invest?", "Tell me about the Port of Felixstowe", "What is Freeport East?",
    "Is there offshore wind in Suffolk?", "What free business support is there?", "Where can I study in Suffolk?",
    "What tech companies are here?", "Who are you?"
  ];
  // "Good place to invest" maps to Freeport East via synonyms; kept generic on purpose.

  function setState(s) { avatar.className = "avatar " + s; $("status").textContent = { idle: "Ready", listening: "Listening…", thinking: "Thinking…", speaking: "Speaking", waving: "Hello!" }[s] || s; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  function addMsg(role, text, res) {
    var div = document.createElement("div");
    div.className = "msg " + role + (res && res.type ? " " + res.type : "");
    var html = '<div class="bubble">' + esc(text) + "</div>";
    if (res && res.sources && res.sources.length) {
      html += '<div class="cites"><span class="cite-label">Source' + (res.sources.length > 1 ? "s" : "") + ":</span> " + res.sources.map(function (s, i) {
        return '<a class="cite" target="_blank" rel="noopener" href="' + esc(s.url) + '" data-block="' + esc(s.id) + '">[' + (i + 1) + "] " + esc(s.name) + "</a>" + (s.illustrative ? ' <span class="illus">illustrative</span>' : "");
      }).join(" ") + ' <span class="ver">content v' + esc(res.sources[0].version) + "</span></div>";
    }
    if (res && res.signpost) {
      html += '<div class="signpost">➜ <a href="' + esc(res.signpost.url) + '" ' + (res.signpost.url.charAt(0) === "#" ? "" : 'target="_blank" rel="noopener"') + ' data-signpost="' + esc(res.signpost.label) + '" data-block="' + esc(res.blockId) + '">' + esc(res.signpost.label) + "</a></div>";
    }
    if (res && res.related && res.related.length) {
      html += '<div class="related">Related: ' + res.related.map(function (r) { return '<button class="chip" data-ask="Tell me about ' + esc(r.title) + '">' + esc(r.title) + "</button>"; }).join(" ") + "</div>";
    }
    if (res && res.type === "unanswered") html += '<div class="related"><button class="chip" data-lead="1">Leave details for a follow-up</button></div>';
    div.innerHTML = html;
    msgs.appendChild(div); msgs.scrollTop = msgs.scrollHeight;
  }

  function speak(text) {
    $("captions").textContent = text;
    setState("speaking");
    clearTimeout(speakingTimer);
    var done = function () { setState("idle"); };
    if (voiceOn && "speechSynthesis" in window) {
      try {
        speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(text);
        u.lang = "en-GB"; u.rate = 1; u.pitch = 1;
        var v = speechSynthesis.getVoices().filter(function (x) { return /en-GB/i.test(x.lang); })[0];
        if (v) u.voice = v;
        u.onend = done; u.onerror = done;
        speechSynthesis.speak(u);
        speakingTimer = setTimeout(done, Math.min(30000, 1500 + text.length * 70)); // safety net
        return;
      } catch (e) {}
    }
    speakingTimer = setTimeout(done, Math.min(8000, 800 + text.length * 25));
  }

  function ask(q) {
    q = String(q || "").trim(); if (!q) return;
    activity(); hideAttract();
    addMsg("user", q);
    setState("thinking");
    var aud = $("audience").value;
    var res = engine.ask(q, aud);
    turns++;
    SEAStore.logQuestion({ session: session, q: q, type: res.type, topic: res.topic || "", blockId: res.blockId || "", audience: aud, turn: turns, flag: res.flag || "" });
    setTimeout(function () { addMsg("bot", res.text, res); speak(res.text); }, 250);
    $("q").value = "";
  }

  function renderSuggest() {
    $("suggest").innerHTML = SUGGEST.map(function (s) { return '<button class="chip" data-ask="' + esc(s) + '">' + esc(s) + "</button>"; }).join("");
  }

  // ---- Speech to text -------------------------------------------------
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition, rec = null, listening = false;
  if (!SR) { $("btnMic").title = "Voice input is not supported in this browser (try Chrome or Edge). You can type instead."; $("btnMic").classList.add("unsupported"); }
  $("btnMic").addEventListener("click", function () {
    activity(); hideAttract();
    if (!SR) { toast("Voice input isn't supported in this browser. Please type your question."); return; }
    if (listening && rec) { rec.stop(); return; }
    rec = new SR(); rec.lang = "en-GB"; rec.interimResults = true; rec.maxAlternatives = 3;
    rec.onstart = function () { listening = true; setState("listening"); $("btnMic").classList.add("on"); };
    rec.onresult = function (e) {
      var txt = ""; for (var i = e.resultIndex; i < e.results.length; i++) txt += e.results[i][0].transcript;
      $("q").value = txt; $("captions").textContent = "You: " + txt;
      if (e.results[e.results.length - 1].isFinal) ask(txt);
    };
    rec.onerror = function (e) { toast("Didn't catch that (" + e.error + "). Please try again or type."); };
    rec.onend = function () { listening = false; $("btnMic").classList.remove("on"); if (avatar.classList.contains("listening")) setState("idle"); };
    try { rec.start(); } catch (e) { toast("Microphone unavailable."); }
  });

  // ---- Events ------------------------------------------------------------
  $("askForm").addEventListener("submit", function (e) { e.preventDefault(); ask($("q").value); });
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-ask],[data-lead],[data-signpost],a.cite");
    if (!t) return;
    if (t.dataset.ask) { e.preventDefault(); ask(t.dataset.ask); }
    else if (t.dataset.lead) { e.preventDefault(); openLead("chat"); }
    else if (t.dataset.signpost) {
      SEAStore.logSignpost({ session: session, label: t.dataset.signpost, url: t.getAttribute("href"), blockId: t.dataset.block || "" });
      if (t.getAttribute("href") === "#lead") { e.preventDefault(); openLead("signpost"); }
    } else if (t.classList.contains("cite")) {
      SEAStore.logSignpost({ session: session, label: "source: " + t.textContent, url: t.getAttribute("href"), blockId: t.dataset.block || "" });
    }
  });
  $("btnVoice").addEventListener("click", function () {
    voiceOn = !voiceOn; this.setAttribute("aria-pressed", voiceOn); this.textContent = voiceOn ? "🔊 Voice on" : "🔇 Voice off";
    if (!voiceOn && "speechSynthesis" in window) speechSynthesis.cancel();
  });
  if (!voiceOn) { $("btnVoice").setAttribute("aria-pressed", "false"); $("btnVoice").textContent = "🔇 Voice off"; }
  $("btnText").addEventListener("click", function () { var on = document.body.classList.toggle("large"); this.setAttribute("aria-pressed", on); });
  $("btnContrast").addEventListener("click", function () { var on = document.body.classList.toggle("contrast"); this.setAttribute("aria-pressed", on); });
  $("btnKiosk").addEventListener("click", function () { setKiosk(!document.body.classList.contains("kiosk")); });
  function setKiosk(on) {
    document.body.classList.toggle("kiosk", on);
    $("btnKiosk").textContent = on ? "✕ Exit kiosk" : "⛶ Kiosk mode";
    try {
      if (on && document.documentElement.requestFullscreen && !document.fullscreenElement) document.documentElement.requestFullscreen().catch(function () {});
      if (!on && document.fullscreenElement) document.exitFullscreen();
    } catch (e) {}
  }
  if (params.has("kiosk")) setKiosk(true);

  // ---- Lead capture ------------------------------------------------------
  var dlg = $("leadDlg"), leadSource = "button";
  function openLead(src) { leadSource = src || "button"; $("leadErr").textContent = ""; $("leadForm").reset(); if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", ""); }
  $("btnLead").addEventListener("click", function () { activity(); openLead("button"); });
  $("leadCancel").addEventListener("click", function (e) { e.preventDefault(); dlg.close(); });
  $("leadForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target, err = [];
    var name = f.name.value.trim(), email = f.email.value.trim();
    if (!name) err.push("Please enter your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) err.push("Please enter a valid email.");
    if (!f.consent.checked) err.push("Please tick the consent box so we can contact you.");
    if (err.length) { $("leadErr").textContent = err.join(" "); return; }
    SEAStore.addLead({ name: name, company: f.company.value.trim(), email: email, interest: f.interest.value, consent: "yes", source: leadSource, session: session, audience: $("audience").value });
    dlg.close(); toast("Thank you, " + name + ". Your details have been saved for follow-up (demo: stored in this browser only).");
  });
  if (location.hash === "#lead") setTimeout(function () { openLead("qr"); }, 300);

  // ---- QR code -----------------------------------------------------------
  try {
    var url = new URL("lead.html?src=qr", location.href).href;
    var qr = qrcode(0, "M"); qr.addData(url); qr.make();
    $("qr").innerHTML = qr.createSvgTag({ cellSize: 3, margin: 2, scalable: true });
    $("qr").title = url; $("qr").dataset.url = url;
  } catch (e) { $("qr").textContent = "QR unavailable"; }

  // ---- Attract loop + idle reset ----------------------------------------
  var attractIdx = 0, attractTimer = null;
  function showAttract() {
    if (!$("attract").hidden) return;
    $("attract").hidden = false; setState("waving");
    var cycle = function () { $("attractPrompt").textContent = "“" + SUGGEST[attractIdx++ % SUGGEST.length] + "”"; };
    cycle(); attractTimer = setInterval(cycle, 4000);
  }
  function hideAttract() { if ($("attract").hidden) return; $("attract").hidden = true; clearInterval(attractTimer); setState("idle"); }
  function activity() { lastActivity = Date.now(); $("idleWarn").hidden = true; }
  function resetConversation() {
    msgs.innerHTML = ""; $("captions").textContent = ""; engine.reset(); turns = 0;
    session = SEAStore.newSession(); $("idleWarn").hidden = true;
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    if (dlg.open) dlg.close();
    greet();
  }
  ["pointerdown", "keydown", "touchstart"].forEach(function (ev) { document.addEventListener(ev, function () { activity(); hideAttract(); }, { passive: true }); });
  $("btnStay").addEventListener("click", activity);
  setInterval(function () {
    var idle = Date.now() - lastActivity;
    if (turns > 0) {
      if (idle > IDLE_MS) { resetConversation(); showAttract(); }
      else if (idle > IDLE_MS - WARN_MS) { $("idleWarn").hidden = false; $("idleCount").textContent = Math.ceil((IDLE_MS - idle) / 1000); }
    } else if (idle > ATTRACT_MS) showAttract();
  }, 500);

  function toast(t) { var el = $("toast"); el.textContent = t; el.hidden = false; clearTimeout(el._t); el._t = setTimeout(function () { el.hidden = true; }, 4500); }
  function greet() { addMsg("bot", "Hello! I'm a demo digital ambassador. Ask me about investing, working, studying or doing business in Suffolk. I only answer from approved content and show my sources.", null); }

  // Pick up admin edits made in another tab.
  window.addEventListener("storage", function (e) { if (e.key && e.key.indexOf("sea-demo.kb") === 0) engine.setBlocks(SEAStore.kb()); });

  renderSuggest(); greet(); setState("idle");
  window.__demo = { ask: ask, engine: engine, reset: resetConversation, state: function () { return { turns: turns, session: session, attract: !$("attract").hidden, kiosk: document.body.classList.contains("kiosk") }; } };
})();
