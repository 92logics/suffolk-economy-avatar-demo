/* Local-only persistence for the demo (browser localStorage). No data leaves the device. */
(function (root) {
  var P = "sea-demo.";
  function get(k, d) { try { var v = localStorage.getItem(P + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function set(k, v) { try { localStorage.setItem(P + k, JSON.stringify(v)); } catch (e) {} }
  function now() { return new Date().toISOString(); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  var Store = {
    kb: function () {
      var kb = get("kb", null);
      if (!kb) { kb = Store.baseline(); set("kb", kb); }
      return kb;
    },
    baseline: function () {
      return clone(root.KB_BASELINE).map(function (b) {
        b.status = "approved"; b.version = 1; b.updated = "2026-10-29"; b.approvedBy = "92 Logics demo editor"; return b;
      });
    },
    saveKb: function (kb, action, id, detail) { set("kb", kb); Store.audit(action, id, detail); },
    resetKb: function () { set("kb", Store.baseline()); Store.audit("restore_baseline", "*", "All blocks restored to approved baseline v1"); },
    audit: function (action, id, detail) {
      var a = get("audit", []); a.unshift({ t: now(), action: action, id: id || "", detail: detail || "" });
      set("audit", a.slice(0, 500));
    },
    auditLog: function () { return get("audit", []); },
    leads: function () { return get("leads", []); },
    addLead: function (lead) { var l = get("leads", []); lead.t = now(); l.push(lead); set("leads", l); return l.length; },
    clearLeads: function () { set("leads", []); Store.audit("clear_leads", "*", "All demo leads deleted"); },
    analytics: function () { return get("analytics", { sessions: 0, questions: [], signposts: [] }); },
    newSession: function () { var a = Store.analytics(); a.sessions++; set("analytics", a); return "s" + a.sessions + "-" + Date.now().toString(36); },
    logQuestion: function (rec) { var a = Store.analytics(); rec.t = now(); a.questions.push(rec); a.questions = a.questions.slice(-3000); set("analytics", a); },
    logSignpost: function (rec) { var a = Store.analytics(); rec.t = now(); a.signposts.push(rec); a.signposts = a.signposts.slice(-3000); set("analytics", a); },
    clearAnalytics: function () { set("analytics", { sessions: 0, questions: [], signposts: [] }); Store.audit("clear_analytics", "*", "Analytics reset"); },
    toCSV: function (rows, cols) {
      function cell(v) {
        v = v === undefined || v === null ? "" : String(v);
        if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; // guard against spreadsheet formula injection
        return '"' + v.replace(/"/g, '""') + '"';
      }
      return [cols.map(cell).join(",")].concat(rows.map(function (r) { return cols.map(function (c) { return cell(r[c]); }).join(","); })).join("\r\n");
    },
    download: function (name, text, type) {
      var blob = new Blob([text], { type: type || "text/csv;charset=utf-8" });
      var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
      document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    }
  };
  root.SEAStore = Store;
})(window);
