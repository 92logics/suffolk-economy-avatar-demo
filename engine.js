/* In-browser retrieval engine for the demo ambassador.
 * BM25 over approved content blocks + guardrails. No network, no LLM, no keys.
 * Production design (see README) swaps the "compose" step for a grounded LLM
 * call that is only given the retrieved approved passages.
 */
(function (root) {
  var STOP = ("a an the and or of to in on for with at by from is are was were be been it its this that these those " +
    "i me my we our you your he she they them their there here what which who whom whose when where why how " +
    "do does did can could would should will shall may might must about tell please any some more much many " +
    "into over than then so if as not no yes hi hello hey also just get got have has had am us let know " +
    "want like need find looking interested info information give show").split(" ");
  var STOPSET = {}; STOP.forEach(function (w) { STOPSET[w] = 1; });

  // Light synonym expansion so visitors' wording reaches approved content.
  var SYN = {
    port: ["felixstowe", "container", "shipping"], ports: ["port"], shipping: ["port", "container"],
    tax: ["freeport", "relief", "incentives"], incentive: ["freeport", "incentives"], incentives: ["freeport"],
    invest: ["investment", "freeport"], investing: ["investment", "freeport", "invest"], investor: ["investment", "freeport"],
    wind: ["offshore", "renewable"], renewable: ["offshore", "wind", "energy"], renewables: ["renewable", "offshore"],
    green: ["clean", "renewable", "energy"], energy: ["clean", "power"], nuclear: ["sizewell"],
    study: ["university", "college"], degree: ["university"], uni: ["university"], students: ["university", "college"],
    student: ["university", "college", "students"], skills: ["college", "university", "training"], jobs: ["workforce", "skills"],
    grant: ["grants", "funding", "support"], grants: ["funding", "growth", "hub"], funding: ["grants", "growth", "hub"],
    advice: ["support", "growth", "hub"], startup: ["start", "business", "support"], help: ["support"],
    tech: ["technology", "digital", "adastral"], technology: ["adastral", "tech"], telecoms: ["adastral", "bt"],
    farming: ["agriculture", "crops"], farm: ["agriculture", "farming"], food: ["agrifood", "agriculture"], beer: ["brewery"],
    horse: ["horseracing", "newmarket"], horses: ["horseracing", "newmarket"], racing: ["horseracing", "newmarket"],
    people: ["population"], live: ["quality", "life"], tourism: ["visitor", "culture"], festival: ["culture"],
    road: ["transport"], rail: ["transport"], train: ["rail", "transport"], london: ["connectivity"], warehouse: ["logistics"]
  };

  // Place words that appear everywhere and cannot ground an answer on their own.
  var GENERIC = {}; "suffolk ipswich lowestoft bury st edmunds county council east anglia anglian area region uk england britain town towns local".split(" ").forEach(function (w) { GENERIC[w] = 1; });
  function stem(w) {
    if (w.length > 5 && /ies$/.test(w)) return w.slice(0, -3) + "y";
    if (w.length > 4 && /(ing|ers)$/.test(w)) return w.slice(0, -3);
    if (w.length > 4 && /s$/.test(w) && !/ss$/.test(w)) return w.slice(0, -1);
    return w;
  }
  function tokens(text) {
    return (String(text || "").toLowerCase().replace(/[’']/g, "").match(/[a-z0-9]+/g) || [])
      .filter(function (w) { return !STOPSET[w] && w.length > 1; });
  }
  function expand(toks) {
    var out = toks.slice();
    toks.forEach(function (t) { (SYN[t] || []).forEach(function (s) { out.push(s); }); });
    return out.map(stem);
  }

  // ---- Guardrails -------------------------------------------------------
  var ABUSE = /\b(f+u+c+k+\w*|shit\w*|bitch\w*|bastard|cunt\w*|wank\w*|twat|dickhead|slut|whore|retard\w*|nigg\w*|paki|kill yourself|kys)\b/i;
  var POLITICAL = /\b(vote|voting|election|elections|ballot|labour|tory|tories|conservatives?|lib ?dems?|liberal democrats?|reform uk|green party|brexit|prime minister|starmer|farage|immigra\w*|asylum|migrants?|left wing|right wing|politic\w*)\b/i;
  var OPINION = /\b(do you think|your opinion|good or bad|is it (good|bad|worth)|should (i|we|they|the government)|better than|worse than|best place in|which party)\b/i;
  var PERSONAL = /\b(my (bank|password|card|national insurance|medical|health)|social security|passport number)\b/i;

  var SMALLTALK = [
    { re: /^\s*(hi|hello|hey|good (morning|afternoon|evening)|hiya)\b[\s!.]*$/i, a: "Hello! I'm a demonstration digital ambassador for investing and doing business in Suffolk. Ask me about the ports, clean energy, skills, business support or the tech cluster." },
    { re: /\b(thank(s| you)|cheers|ta)\b/i, a: "You're welcome. If you'd like someone to follow up, you can leave your details with the form or scan the QR code." },
    { re: /^\s*(bye|goodbye|see you)\b/i, a: "Thanks for stopping by. Enjoy the event!" },
    { re: /\b(how are you)\b/i, a: "I'm running well, thanks for asking. What would you like to know about Suffolk's economy?" }
  ];

  var AUDIENCE = {
    general: { label: "Member of the public", lead: "", tail: "" },
    investor: { label: "Investor", lead: "From an investment point of view: ", tail: " An investment contact can follow up if you leave your details." },
    business: { label: "Business", lead: "For businesses: ", tail: " Free business advice is also available through the New Anglia Growth Hub." },
    student: { label: "Student", lead: "For students and early-career visitors: ", tail: " Ask me about the University of Suffolk and local colleges." },
    partner: { label: "Partner organisation", lead: "For partner organisations: ", tail: " Partner content can be added to the knowledge base through the admin view." }
  };

  var IDENTITY = /\b(who|what) are you\b|\bare you (a |an )?(real|human|robot|bot|ai|person)\b|\bwho (made|built) you\b/i;
  var FOLLOWUP = /^(tell me more|more|more please|go on|and\??|what else|anything else|more detail\w*|elaborate)\W*$/i;
  var PRONOUN = /\b(it|its|there|that|this|they|them|those|these)\b/i;

  function Engine(blocks, opts) {
    opts = opts || {};
    this.threshold = opts.threshold || 3.0;
    this.k1 = 1.4; this.b = 0.6;
    this.setBlocks(blocks || []);
    this.context = { lastTokens: [], lastBlockId: null, turns: 0, servedMore: {} };
  }
  Engine.prototype.setBlocks = function (blocks) {
    this.blocks = blocks;
    this.active = blocks.filter(function (b) { return b.status !== "blocked"; });
    var self = this, df = {}, total = 0;
    this.docs = this.active.map(function (b) {
      var toks = [].concat(
        expand(tokens(b.title)), expand(tokens(b.title)), // title weighted x2
        expand(tokens(b.keywords)), expand(tokens(b.keywords)),
        tokens(b.text).map(stem), tokens(b.more).map(stem));
      var tf = {}; toks.forEach(function (t) { tf[t] = (tf[t] || 0) + 1; });
      Object.keys(tf).forEach(function (t) { df[t] = (df[t] || 0) + 1; });
      total += toks.length;
      return { block: b, tf: tf, len: toks.length };
    });
    this.df = df; this.N = this.docs.length; this.avgLen = this.N ? total / this.N : 1;
  };
  Engine.prototype.score = function (qTokens) {
    var self = this, uniq = {};
    qTokens.forEach(function (t) { uniq[t] = (uniq[t] || 0) + 1; });
    return this.docs.map(function (d) {
      var s = 0;
      Object.keys(uniq).forEach(function (t) {
        var f = d.tf[t]; if (!f) return;
        var idf = Math.log(1 + (self.N - self.df[t] + 0.5) / (self.df[t] + 0.5));
        s += idf * (f * (self.k1 + 1)) / (f + self.k1 * (1 - self.b + self.b * d.len / self.avgLen));
      });
      var prio = { 1: 0.9, 2: 1.0, 3: 1.1 }[d.block.priority || 2] || 1;
      return { block: d.block, score: s * prio };
    }).sort(function (a, b) { return b.score - a.score; });
  };
  Engine.prototype.reset = function () { this.context = { lastTokens: [], lastBlockId: null, turns: 0, servedMore: {} }; };

  Engine.prototype.ask = function (question, audience) {
    var q = String(question || "").trim();
    var aud = AUDIENCE[audience] || AUDIENCE.general;
    this.context.turns++;
    if (!q) return { type: "empty", text: "Please ask me a question about Suffolk's economy.", sources: [] };
    if (ABUSE.test(q)) return { type: "moderated", text: "I'd like to keep our conversation respectful. I can help with questions about investing, working or studying in Suffolk.", sources: [], flag: "abuse" };
    if (PERSONAL.test(q)) return { type: "moderated", text: "Please don't share personal or financial details with me. For a follow-up, use the contact form and a member of the team will be in touch.", sources: [], flag: "personal" };
    if (POLITICAL.test(q) || OPINION.test(q)) return { type: "moderated", text: "I stay neutral and don't give political views or personal opinions. I can share approved, factual information about Suffolk's economy, investment, skills and business support.", sources: [], flag: "political_or_opinion" };
    if (IDENTITY.test(q)) { var me = this.find("about-demo"); if (me && me.status !== "blocked") return this.wrap(me, me.text, AUDIENCE.general, "answer", []); }
    for (var i = 0; i < SMALLTALK.length; i++) if (SMALLTALK[i].re.test(q)) return { type: "smalltalk", text: SMALLTALK[i].a, sources: [] };

    // Follow-up: "tell me more" continues the last topic.
    if (FOLLOWUP.test(q) && this.context.lastBlockId) {
      var last = this.find(this.context.lastBlockId);
      if (last && last.status !== "blocked") {
        if (last.more && !this.context.servedMore[last.id]) {
          this.context.servedMore[last.id] = 1;
          return this.wrap(last, last.more, aud, "followup", []);
        }
        var nextRes = this.score(this.context.lastTokens).filter(function (r) { return r.block.id !== last.id && r.score >= 1; })[0];
        if (nextRes) return this.answerFrom(nextRes, aud, this.context.lastTokens, "followup");
        return { type: "unanswered", text: "That's everything I have in my approved content on that topic. You can leave your details if you'd like a specialist to follow up.", sources: [] };
      }
    }
    var qt = expand(tokens(q));
    var useCtx = (qt.length <= 3 || PRONOUN.test(q)) && this.context.lastTokens.length;
    var scored = this.score(qt);
    if (useCtx) {
      var withCtx = this.score(qt.concat(this.context.lastTokens));
      if (!scored[0] || scored[0].score < this.threshold) scored = withCtx;
    }
    var top = scored[0];
    var raw = tokens(q);
    if (top && raw.length) {
      var d = this.docFor(top.block.id), hit = 0, specific = 0;
      raw.forEach(function (t) {
        var cands = [stem(t)].concat((SYN[t] || []).map(stem));
        var ok = cands.some(function (c) { return d.tf[c]; });
        if (ok) { hit++; if (!GENERIC[t]) specific++; }
      });
      var cov = hit / raw.length;
      if (cov < (useCtx ? 0.5 : 0.6) || specific === 0) top = null;
    }
    if (!top || top.score < this.threshold) {
      return { type: "unanswered", text: "I'm sorry, I don't have approved information on that, so I won't guess. I can tell you about Suffolk's ports, Freeport East, clean energy, the tech cluster, skills or free business support. Or leave your details and the team can follow up.", sources: [], question: q };
    }
    return this.answerFrom(top, aud, qt, "answer", scored);
  };
  Engine.prototype.answerFrom = function (res, aud, qt, type, scored) {
    this.context.lastTokens = qt.slice(0, 12);
    var b = res.block;
    var related = (scored || []).filter(function (r) { return r.block.id !== b.id && r.score >= Math.max(2.2, res.score * 0.6); }).slice(0, 1)
      .map(function (r) { return { id: r.block.id, title: r.block.title }; });
    var out = this.wrap(b, b.text, aud, type, related);
    out.score = Math.round(res.score * 100) / 100;
    return out;
  };
  Engine.prototype.wrap = function (b, body, aud, type, related) {
    this.context.lastBlockId = b.id;
    var text = aud.lead + body + (type === "answer" ? aud.tail : "");
    return {
      type: type, text: text, topic: b.topic, blockId: b.id, related: related || [],
      sources: [b.source].concat(b.source2 ? [b.source2] : []).map(function (src) {
        return { id: b.id, title: b.title, name: src.name, url: src.url, version: b.version || 1, illustrative: !!b.illustrative };
      }),
      signpost: b.signpost || null
    };
  };
  Engine.prototype.docFor = function (id) { return this.docs.filter(function (d) { return d.block.id === id; })[0]; };
  Engine.prototype.find = function (id) { return this.blocks.filter(function (b) { return b.id === id; })[0]; };

  Engine.tokens = tokens; Engine.AUDIENCE = AUDIENCE;
  root.AmbassadorEngine = Engine;
  if (typeof module === "object" && module.exports) module.exports = Engine;
})(typeof window !== "undefined" ? window : globalThis);
