(function () {
  "use strict";
  const prefix = "brokerflow-pending-operation:";
  async function fingerprint(payload) {
    const bytes = new TextEncoder().encode(JSON.stringify(payload));
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  }
  function read(scope) {
    try { return JSON.parse(sessionStorage.getItem(prefix + scope) || "{}"); }
    catch { return {}; }
  }
  async function key(scope, payload) {
    const hash = await fingerprint(payload);
    const entries = read(scope);
    if (entries[hash]) return entries[hash];
    entries[hash] = crypto.randomUUID();
    const recent = Object.entries(entries).slice(-20);
    sessionStorage.setItem(prefix + scope, JSON.stringify(Object.fromEntries(recent)));
    return entries[hash];
  }
  async function complete(scope, payload) {
    const hash = await fingerprint(payload);
    const entries = read(scope);
    delete entries[hash];
    if (Object.keys(entries).length) sessionStorage.setItem(prefix + scope, JSON.stringify(entries));
    else sessionStorage.removeItem(prefix + scope);
  }
  window.BrokerFlowIdempotency = { key, complete };
})();
