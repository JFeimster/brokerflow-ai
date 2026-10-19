(function () {
  "use strict";
  const errors = { reviews: "", activity: "" };
  function update(resource, result) {
    if (!(resource in errors)) return;
    if (result.source === "live") errors[resource] = "";
    if (result.source === "live-error") {
      errors[resource] = resource === "activity" && result.error?.code === "audit_access_denied"
        ? "You can read reviews, but this organization has not granted permission to view review activity."
        : result.error?.message || "Live service unavailable.";
    }
  }
  window.BrokerFlowLiveState = {
    update,
    canWrite(workspace) { return workspace?.can_write === true; },
    resolveReviewTarget(id, reviews = [], live = false) { return reviews.find(item => item.id === id) || (live ? { id } : null); },
    get(resource) { return errors[resource] || ""; },
    set(resource, message) { if (resource in errors) errors[resource] = message || ""; },
    reset() { errors.reviews = ""; errors.activity = ""; }
  };
})();
