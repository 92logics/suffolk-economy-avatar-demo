(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s === undefined || s === null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function toast(t) { var el = $("toast"); el.textContent = t; el.hidden = false; clearTimeout(el._t); el._t = setTimeout(function () { el.hidden = true; }, 3500); }
  function today() { return new Date().toISOString().slice(0, 10); }

  document.querySelectorAll("[data-tab]").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll("[data-tab]").forEach(function (x) { x.setAttribute("aria-selected", x === b); });
      document.querySelectorAll(".tabpanel").forEach(function (p) { p.hidden = p.id !== "tab-" + b.dataset.tab; });
      render();
    });
  });

  function renderKb() {
    var kb = SEAStore.kb();
    $("kbTable").innerHTML = "<table><thead><tr><th>Block</th><th>Topic</th><th>Source</th><th>Priority</th><th>Version</th><th>Updated</th><th>Status</th><th>Actions</th></tr></thead><tbody>" +
      kb.map(function (b) {
        return '<tr class="' + (b.status === "blocked" ? "blocked" : "") + '" data-id="' + esc(b.id) + '"><td><b>' + esc(b.title) + "</b><br><small>" + esc(b.id) + (b.illustrative ? " · illustrative" : "") + "</small></td><td>" + esc(b.topic) +
          '</td><td><a href="' + esc(b.source.url) + '" target="_blank" rel="noopener">' + esc(b.source.name) + "</a></td>" +
          '<td><select data-act="prio">' + [3, 2, 1].map(function (p) { return "<option" + (+b.priority === p ? " selected" : "") + ">" + p + "</option>"; }).join("") + "</select></td>" +
          "<td>v" + esc(b.version) + "</td><td>" + esc(b.updated) + '</td><td class="status-cell"><span class="badge ' + (b.status === "blocked" ? "no" : "ok") + '">' + esc(b.status) + "</span></td>" +
          '<td class="actions"><button class="secondary" data-act="toggle">' + (b.status === "blocked" ? "Unblock" : "Block") + '</button> <button class="secondary" data-act="edit">Edit</button> <button class="danger" data-act="remove">Remove</button></td></tr>';
      }).join("") + "</tbody></table>";
  }
  $("kbTable").addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-act]"); if (!btn) return;
    var id = btn.closest("tr").dataset.id, kb = SEAStore.kb(), b = kb.filter(function (x) { return x.id === id; })[0]; if (!b) return;
    if (btn.dataset.act === "toggle") {
      b.status = b.status === "blocked" ? "approved" : "blocked"; b.version++; b.updated = today();
      SEAStore.saveKb(kb, b.status === "blocked" ? "block" : "unblock", id, b.title); toast((b.status === "blocked" ? "Blocked: " : "Approved: ") + b.title);
    } else if (btn.dataset.act === "remove") {
      if (!confirm("Remove '" + b.title + "' from the knowledge base?")) return;
      SEAStore.saveKb(kb.filter(function (x) { return x.id !== id; }), "remove", id, b.title); toast("Removed: " + b.title);
    } else if (btn.dataset.act === "edit") {
      var f = $("blockForm"); f.id.value = b.id; f.topic.value = b.topic; f.title.value = b.title; f.keywords.value = b.keywords || ""; f.text.value = b.text;
      f.sourceName.value = b.source.name; f.sourceUrl.value = b.source.url; f.signLabel.value = (b.signpost || {}).label || ""; f.signUrl.value = (b.signpost && /^https?:/.test(b.signpost.url)) ? b.signpost.url : ""; f.priority.value = b.priority || 2;
      f.scrollIntoView({ behavior: "smooth" });
    }
    renderKb();
  });
  $("kbTable").addEventListener("change", function (e) {
    if (e.target.dataset.act !== "prio") return;
    var id = e.target.closest("tr").dataset.id, kb = SEAStore.kb(), b = kb.filter(function (x) { return x.id === id; })[0];
    b.priority = +e.target.value; b.version++; b.updated = today(); SEAStore.saveKb(kb, "priority", id, "priority " + b.priority); renderKb();
  });
  $("blockForm").addEventListener("submit", function (e) {
    e.preventDefault(); var f = e.target, kb = SEAStore.kb(), id = f.id.value.trim().toLowerCase();
    if (!/^[a-z0-9\-]+$/.test(id)) { $("formMsg").textContent = "Id must use lowercase letters, numbers and dashes."; return; }
    var existing = kb.filter(function (x) { return x.id === id; })[0];
    var b = existing || { id: id, version: 0, status: "approved" };
    b.topic = f.topic.value.trim(); b.title = f.title.value.trim(); b.keywords = f.keywords.value.trim(); b.text = f.text.value.trim();
    b.source = { name: f.sourceName.value.trim(), url: f.sourceUrl.value.trim() };
    b.signpost = f.signLabel.value.trim() && f.signUrl.value.trim() ? { label: f.signLabel.value.trim(), url: f.signUrl.value.trim() } : null;
    b.priority = +f.priority.value; b.version = (b.version || 0) + 1; b.updated = today(); b.approvedBy = "Demo admin";
    if (!existing) kb.push(b);
    SEAStore.saveKb(kb, existing ? "edit" : "add", id, b.title + " (v" + b.version + ")");
    f.reset(); $("formMsg").textContent = (existing ? "Updated " : "Added ") + b.title + " as v" + b.version + ". The ambassador will use it straight away."; renderKb();
  });
  $("btnBlockDomain").addEventListener("click", function () {
    var d = $("blockDomain").value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, ""); if (!d) return;
    var kb = SEAStore.kb(), n = 0;
    kb.forEach(function (b) { if (b.status !== "blocked" && ((b.source && b.source.url.toLowerCase().indexOf(d) >= 0) || (b.source2 && b.source2.url.toLowerCase().indexOf(d) >= 0))) { b.status = "blocked"; b.version++; b.updated = today(); n++; } });
    SEAStore.saveKb(kb, "emergency_block_domain", d, n + " block(s) blocked");
    $("blockMsg").textContent = n + " block(s) from " + d + " blocked at " + new Date().toLocaleTimeString() + "."; renderKb();
  });
  $("btnRestore").addEventListener("click", function () { if (confirm("Restore the approved baseline? Your edits will be replaced.")) { SEAStore.resetKb(); renderKb(); toast("Baseline restored"); } });
  $("btnExportKb").addEventListener("click", function () { SEAStore.download("approved-content.json", JSON.stringify(SEAStore.kb(), null, 2), "application/json"); });

  var LEAD_COLS = ["t", "name", "company", "email", "interest", "consent", "source", "audience", "session"];
  function renderLeads() {
    var l = SEAStore.leads();
    $("leadsTable").innerHTML = l.length ? "<table><thead><tr><th>When</th><th>Name</th><th>Company</th><th>Email</th><th>Interest</th><th>Consent</th><th>Source</th></tr></thead><tbody>" +
      l.slice().reverse().map(function (r) { return "<tr><td>" + esc(r.t.replace("T", " ").slice(0, 16)) + "</td><td>" + esc(r.name) + "</td><td>" + esc(r.company) + "</td><td>" + esc(r.email) + "</td><td>" + esc(r.interest) + "</td><td>" + esc(r.consent) + "</td><td>" + esc(r.source) + "</td></tr>"; }).join("") + "</tbody></table>"
      : '<p class="small">No leads yet. Use “Leave your details” or the QR form on the ambassador.</p>';
  }
  $("btnLeadsCsv").addEventListener("click", function () { SEAStore.download("leads-" + today() + ".csv", SEAStore.toCSV(SEAStore.leads(), LEAD_COLS)); });
  $("btnLeadsClear").addEventListener("click", function () { if (confirm("Delete all demo leads?")) { SEAStore.clearLeads(); renderLeads(); } });

  function counts(arr, key) { var c = {}; arr.forEach(function (x) { var k = typeof key === "function" ? key(x) : x[key]; if (k) c[k] = (c[k] || 0) + 1; }); return Object.keys(c).map(function (k) { return [k, c[k]]; }).sort(function (a, b) { return b[1] - a[1]; }); }
  function bars(list, max) { if (!list.length) return '<p class="small">No data yet.</p>'; var m = list[0][1]; return "<table>" + list.slice(0, max || 10).map(function (r) { return "<tr><td>" + esc(r[0]) + '</td><td style="width:45%"><span class="bar" style="width:' + Math.max(4, Math.round(100 * r[1] / m)) + '%"></span> ' + r[1] + "</td></tr>"; }).join("") + "</table>"; }
  function renderAnalytics() {
    var a = SEAStore.analytics(), q = a.questions, answered = q.filter(function (x) { return x.type === "answer" || x.type === "followup"; }).length;
    var unans = q.filter(function (x) { return x.type === "unanswered"; }), mod = q.filter(function (x) { return x.type === "moderated"; }).length;
    var bySession = counts(q, "session"), avg = bySession.length ? (q.length / bySession.length).toFixed(1) : "0";
    var card = function (label, val) { return '<div class="card"><b>' + esc(val) + "</b>" + esc(label) + "</div>"; };
    $("cards").innerHTML = card("Sessions", a.sessions) + card("Questions asked", q.length) + card("Answered from approved content", q.length ? Math.round(100 * answered / q.length) + "%" : "–") +
      card("Unanswered", unans.length) + card("Moderated / declined", mod) + card("Avg questions per conversation", avg) + card("Signpost & source clicks", a.signposts.length) + card("Leads captured", SEAStore.leads().length);
    $("topTopics").innerHTML = bars(counts(q, "topic"));
    $("audiences").innerHTML = bars(counts(q, "audience"));
    $("signposts").innerHTML = bars(counts(a.signposts, "label"));
    $("unanswered").innerHTML = bars(counts(unans, function (x) { return x.q.toLowerCase(); }), 15);
    $("recentQ").innerHTML = q.length ? "<table><thead><tr><th>When</th><th>Question</th><th>Result</th><th>Topic</th><th>Audience</th></tr></thead><tbody>" + q.slice(-25).reverse().map(function (r) {
      return "<tr><td>" + esc(r.t.replace("T", " ").slice(0, 16)) + "</td><td>" + esc(r.q) + "</td><td>" + esc(r.type) + (r.flag ? " (" + esc(r.flag) + ")" : "") + "</td><td>" + esc(r.topic) + "</td><td>" + esc(r.audience) + "</td></tr>"; }).join("") + "</tbody></table>" : '<p class="small">No questions yet.</p>';
  }
  $("btnQCsv").addEventListener("click", function () { SEAStore.download("questions-" + today() + ".csv", SEAStore.toCSV(SEAStore.analytics().questions, ["t", "session", "turn", "q", "type", "flag", "topic", "blockId", "audience"])); });
  $("btnAnClear").addEventListener("click", function () { if (confirm("Reset analytics?")) { SEAStore.clearAnalytics(); renderAnalytics(); } });

  function renderAudit() {
    var l = SEAStore.auditLog();
    $("auditTable").innerHTML = l.length ? "<table><thead><tr><th>When (UTC)</th><th>Action</th><th>Block / item</th><th>Detail</th></tr></thead><tbody>" + l.map(function (r) { return "<tr><td>" + esc(r.t.replace("T", " ").slice(0, 19)) + "</td><td>" + esc(r.action) + "</td><td>" + esc(r.id) + "</td><td>" + esc(r.detail) + "</td></tr>"; }).join("") + "</tbody></table>" : '<p class="small">No changes yet.</p>';
  }
  function render() { renderKb(); renderLeads(); renderAnalytics(); renderAudit(); }
  if (location.hash) { var t = document.querySelector('[data-tab="' + location.hash.slice(1) + '"]'); if (t) t.click(); }
  render();
})();
