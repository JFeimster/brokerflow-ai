(function () {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const content = $("#page-content");
  const titles = { dashboard: "Overview", "review-queue": "Review queue", deals: "Deals & pipeline", activity: "Automation activity", partners: "Partners", integrations: "Integrations", settings: "Settings" };
  let currentRoute = routeFromPath();
  let datasets = {};
  let dealFilter = "all";
  let reviewFilter = "All items";
  let reviewSearch = "";
  let reviewSearchTimer = null;
  let activityFilter = "All activity";
  let sourceMode = "sample";
  let liveError = "";
  const liveState = window.BrokerFlowLiveState;
  let liveSession = null;
  let liveReviewCounts = null;
  let liveActivityTotal = null;
  let baseDataLoaded = false;
  let activityWorkspaceId = null;
  let reviewQueryKey = null;
  let reviewQueryGeneration = 0;
  let reviewLoadingGeneration = null;
  let reviewNextCursor = null;
  let reviewTotalCount = 0;
  let reviewPageLoading = false;
  let reviewAppendError = "";
  const money = value => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  function routeFromPath() { const route = location.pathname.replace(/^\/app\/?/, "").replace(/\/$/, ""); return titles[route] ? route : "dashboard"; }
  async function init() {
    const stored = localStorage.getItem("brokerflow-settings");
    if (stored) { try { window.brokerSettings = JSON.parse(stored); } catch (_) { window.brokerSettings = {}; } }
    $$("[data-route]").forEach(link => link.addEventListener("click", event => { event.preventDefault(); navigate(link.dataset.route); }));
    $("#menu-toggle").addEventListener("click", () => toggleMobile(true));
    $("#mobile-scrim").addEventListener("click", () => toggleMobile(false));
    document.addEventListener("click", onGlobalClick);
    document.addEventListener("keydown", event => { if (event.key === "Escape") { closeModal(); toggleMobile(false); } });
    window.addEventListener("popstate", () => { currentRoute = routeFromPath(); render(); });
    try {
      await window.BrokerFlowAuth.init();
      if (window.BrokerFlowAuth.config.mode === "live") {
        sourceMode = "live";
        if (await window.BrokerFlowAuth.token()) {
          liveSession = await window.BrokerFlowAuth.request("/api/console/session");
          window.BrokerFlowSession = { ...liveSession, workspace: null };
        }
      }
    } catch (error) { sourceMode = "live"; window.BROKERFLOW_FORCE_LIVE = true; liveError = error.message || "Live service unavailable."; }
    if (sourceMode === "live") window.BROKERFLOW_FORCE_LIVE = true;
    await render();
  }
  async function loadReviewPage(cursor, append, generation = reviewQueryGeneration) {
    if (generation !== reviewQueryGeneration || (append && reviewPageLoading)) return;
    reviewPageLoading = true;
    reviewLoadingGeneration = generation;
    const result = await window.BrokerFlowData.get("reviews", { cursor, priority: reviewFilter, search: reviewSearch });
    if (generation !== reviewQueryGeneration) return;
    if (result.source === "live-error") {
      if (append) reviewAppendError = result.error?.message || "Additional reviews could not be loaded.";
      else {
        liveState.update("reviews", result);
        datasets.reviews = [];
      }
      reviewPageLoading = false;
      reviewLoadingGeneration = null;
      return;
    }
    reviewAppendError = "";
    liveState.update("reviews", result);
    if (result.source === "live") {
      const rows = result.data || [];
      datasets.reviews = append ? [...datasets.reviews, ...rows.filter(row => !datasets.reviews.some(existing => existing.id === row.id))] : rows;
      liveReviewCounts = result.counts;
      reviewTotalCount = result.totalCount;
      reviewNextCursor = result.nextCursor;
    } else {
      datasets.reviews = result.data || [];
      liveReviewCounts = null;
      reviewNextCursor = null;
      reviewTotalCount = datasets.reviews.length;
    }
    reviewPageLoading = false;
    reviewLoadingGeneration = null;
  }
  async function loadData({ refresh = false } = {}) {
    if (!baseDataLoaded || refresh) {
      await Promise.all(["deals", "partners", "integrations"].map(async resource => {
        const result = await window.BrokerFlowData.get(resource);
        datasets[resource] = result.data;
      }));
      baseDataLoaded = true;
    }
    if (sourceMode !== "live") {
      if (!datasets.reviews || refresh) {
        const [reviews, activity] = await Promise.all([window.BrokerFlowData.get("reviews"), window.BrokerFlowData.get("activity")]);
        datasets.reviews = reviews.data;
        datasets.activity = activity.data;
      }
      return;
    }
    const workspaceId = window.BrokerFlowSession?.workspace?.id || null;
    if (!workspaceId) {
      datasets.reviews = [];
      datasets.activity = [];
      liveReviewCounts = null;
      reviewNextCursor = null;
      reviewTotalCount = 0;
      reviewAppendError = "";
      reviewQueryKey = null;
      reviewQueryGeneration++;
      return;
    }
    if (refresh || activityWorkspaceId !== workspaceId) {
      const result = await window.BrokerFlowData.get("activity");
      datasets.activity = result.data;
      if (result.source === "live") liveActivityTotal = result.totalCount;
      liveState.update("activity", result);
      activityWorkspaceId = workspaceId;
    }
    const queryKey = JSON.stringify([workspaceId, reviewFilter, reviewSearch]);
    if (refresh || reviewQueryKey !== queryKey) {
      reviewQueryKey = queryKey;
      reviewQueryGeneration++;
      reviewAppendError = "";
      reviewNextCursor = null;
      reviewTotalCount = 0;
      liveReviewCounts = null;
      datasets.reviews = [];
      await loadReviewPage(null, false, reviewQueryGeneration);
    }
  }
  async function loadMoreReviews() {
    if (reviewNextCursor === null || reviewPageLoading) return;
    const pending = loadReviewPage(reviewNextCursor, true, reviewQueryGeneration);
    render();
    await pending;
    await render();
  }
  function navigate(route) {
    if (!titles[route]) return;
    if (reviewSearchTimer) clearTimeout(reviewSearchTimer);
    currentRoute = route; history.pushState({}, "", "/app/" + route); render(); toggleMobile(false); window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function render(options = {}) {
    await loadData(options);
    $("#breadcrumb-current").textContent = titles[currentRoute];
    $$("[data-route]").forEach(link => link.classList.toggle("active", link.dataset.route === currentRoute));
    const views = { dashboard: dashboardView, "review-queue": reviewView, deals: dealsView, activity: activityView, partners: partnersView, integrations: integrationsView, settings: settingsView };
    const liveScreen = sourceMode === "live" && ["review-queue", "activity"].includes(currentRoute);
    content.innerHTML = (liveScreen ? liveWorkspacePanel() : "") + (sourceMode === "live" && currentRoute === "dashboard" ? liveOverviewNote() : "") + views[currentRoute]();
    $("#queue-count").textContent = sourceMode === "live" ? (window.BrokerFlowSession?.workspace ? (liveReviewCounts?.open ?? "—") : "—") : datasets.reviews.filter(row => row.status !== "Done").length || "0";
    const badge = $(".demo-badge"); if (badge) { badge.textContent = sourceMode === "live" ? (liveSession?.user?.email || "LIVE WORKSPACE") : "SAMPLE WORKSPACE"; badge.classList.toggle("live-badge", sourceMode === "live"); }
    if (sourceMode === "live") {
      const who=liveSession?.user?.email||"Not signed in", org=window.BrokerFlowSession?.workspace?.name||"Organization not selected";
      const profile=$(".profile-button strong"), profileRole=$(".profile-button small"), profileAvatar=$(".profile-avatar"), smallAvatar=$(".avatar-small"), orgName=$(".workspace-copy strong"), orgSub=$(".workspace-copy small"), footer=$(".app-footer");
      if(profile)profile.textContent=who;if(profileRole)profileRole.textContent=window.BrokerFlowSession?.workspace?.role||"Live access";if(profileAvatar)profileAvatar.textContent=who.slice(0,2).toUpperCase();if(smallAvatar)smallAvatar.textContent=who.slice(0,2).toUpperCase();if(orgName)orgName.textContent=org;if(orgSub)orgSub.textContent=window.BrokerFlowSession?.workspace?"Authorized organization":"Choose organization";if(footer)footer.lastElementChild.textContent="Live review data · broker decisions remain human-controlled";
    }
    bindViewEvents();
  }
  function liveWorkspacePanel() {
    if (!liveSession) return `<section class="live-callout"><strong>Live review service</strong><p>${esc(liveError || "Sign in with an invited broker account to load private review data.")}</p><button class="button button-primary" data-action="sign-in">Sign in with email</button><span>Live mode never uses sample reviews.</span></section>`;
    const choices = liveSession.workspaces || [];
    if (!window.BrokerFlowSession?.workspace) return `<section class="live-callout"><strong>Select an authorized organization</strong><p>Review data is isolated by organization. Choose the organization you were authorized to access.</p>${choices.length ? `<label>Organization <select id="live-org-select"><option value="">Select organization</option>${choices.map(w=>`<option value="${esc(w.id)}">${esc(w.name)} · ${esc(w.role)}</option>`).join("")}</select></label><button class="button button-primary" data-action="select-workspace">Open workspace</button>` : `<p>No organization has the required BrokerFlow review permissions. Ask an organization owner to provision a scoped review permission.</p>`}</section>`;
    const workspace = window.BrokerFlowSession.workspace;
    return `<section class="live-callout compact"><strong>${esc(workspace.name)}</strong><span>Authenticated live data · statuses track broker workflow only</span><button class="text-button" data-action="sign-out">Sign out</button></section>`;
  }
  function liveOverviewNote(){return `<div class="live-callout"><strong>Review metrics are live; other console sections remain sample data.</strong><p>Choose an organization from Review queue to load its authorized review count. The pipeline, partner, integration, and workflow metrics below are labeled sample data.</p></div>`;}
  const initials = (name, value, color) => `<span class="entity-avatar ${color || "blue"}">${esc(value || name.split(/\s+/).map(part => part[0]).slice(0, 2).join(""))}</span>`;
  const statusPill = status => `<span class="status-pill ${String(status).toLowerCase().replace(/[^a-z]+/g, "-")}"><i></i>${esc(status)}</span>`;
  function pageHeading(eyebrow, title, subtitle, action = "") { return `<div class="page-heading"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="page-subtitle">${subtitle}</p></div>${action}</div>`; }
  function dashboardView() {
    const deals = datasets.deals, reviews = datasets.reviews;
    if (sourceMode === "live") {
      const open = reviews.filter(row=>row.status!=="reviewed");
      const rows = deals.slice(0,4).map(deal=>`<tr><td>${esc(deal.company)}</td><td>${esc(deal.stage)}</td><td>${money(deal.amount)}</td></tr>`).join("");
      const queue = open.slice(0,3).map(row=>`<button class="queue-row" type="button" data-open-review="${esc(row.id)}">${initials(row.company,row.initials,row.color)}<span class="queue-copy"><strong>${esc(row.company)}</strong><small>${esc(row.reason)} · ${esc(row.time)}</small></span></button>`).join("") || `<p class="empty-state">No open reviews in the selected organization.</p>`;
      return `<div class="live-callout"><strong>Live review queue · ${liveReviewCounts?.open??"—"} open</strong><p>The deals and partner sections below remain sample data until their services are integrated.</p></div><div class="dashboard-grid"><section class="panel"><div class="panel-heading"><div><h2>Organization review queue</h2><p>Live, organization-scoped review records</p></div><button class="text-button" data-route-button="review-queue">Open queue →</button></div><div class="queue-list">${queue}</div></section><section class="panel"><div class="panel-heading"><div><h2>Sample pipeline</h2><p>Demonstration records only</p></div></div><div class="table-wrap"><table><thead><tr><th>BUSINESS</th><th>STAGE</th><th>REQUESTED</th></tr></thead><tbody>${rows}</tbody></table></div></section></div>`;
    }
    const rows = deals.slice(0, 4).map(deal => `<tr data-searchable="${esc((deal.company + " " + deal.id + " " + deal.stage).toLowerCase())}"><td><div class="table-entity">${initials(deal.company, deal.initials, deal.color)}<span><strong>${esc(deal.company)}</strong><small>${esc(deal.id)} · ${esc(deal.product)}</small></span></div></td><td>${esc(deal.stage)}</td><td class="amount-cell">${money(deal.amount)}</td><td>${esc(deal.age)}</td><td>${statusPill(deal.stage === "Needs review" ? "Needs review" : "In progress")}</td></tr>`).join("");
    const queue = reviews.slice(0, 3).map(row => `<button class="queue-row" type="button" data-open-review="${esc(row.id)}"><span class="priority-marker ${row.priority.toLowerCase()}"></span>${initials(row.company, row.initials, row.color)}<span class="queue-copy"><strong>${esc(row.company)}</strong><small>${esc(row.reason)} · ${esc(row.time)}</small></span><span class="queue-arrow">›</span></button>`).join("");
    return `${pageHeading("SUNDAY, OCTOBER 11, 2026", "Good morning, Jordan", "Here’s the latest across your broker workspace.", `<button class="button button-quiet" data-action="export-sample">↓ <span>Export overview</span></button>`)}<div class="metric-grid"><article class="metric"><div class="metric-top"><span>Active deals</span><span class="metric-icon">◇</span></div><strong>24</strong><small><b class="positive">↑ 8.2%</b> <span>vs. last month</span></small><div class="sparkline"><i style="height:30%"></i><i style="height:43%"></i><i style="height:35%"></i><i style="height:55%"></i><i style="height:46%"></i><i style="height:72%"></i><i style="height:63%"></i><i style="height:88%"></i></div></article><article class="metric"><div class="metric-top"><span>In review queue</span><span class="metric-icon amber-icon">☷</span></div><strong>${reviews.length}</strong><small><b class="attention">2 high priority</b> <span>· sample queue</span></small><div class="metric-track"><i style="width:52%"></i></div></article><article class="metric"><div class="metric-top"><span>Pipeline value</span><span class="metric-icon">⌁</span></div><strong>$1.24M</strong><small><b class="positive">↑ 12.4%</b> <span>vs. last month</span></small><div class="metric-track cyan-track"><i style="width:68%"></i></div></article><article class="metric"><div class="metric-top"><span>Automations today</span><span class="metric-icon">↻</span></div><strong>18</strong><small><b class="neutral">16 completed</b> <span>· 2 need review</span></small><div class="metric-track green-track"><i style="width:86%"></i></div></article></div><div class="dashboard-grid"><section class="panel pipeline-panel"><div class="panel-heading"><div><h2>Pipeline overview</h2><p>Deal stages and requested amount · sample data</p></div><button class="text-button" data-route-button="deals">View pipeline <span>→</span></button></div><div class="pipeline-chart"><div class="chart-axis"><span>$400k</span><span>$300k</span><span>$200k</span><span>$100k</span><span>$0</span></div><div class="chart-area"><div class="chart-grid-lines"><i></i><i></i><i></i><i></i></div><div class="chart-bars"><div><i style="height:68%"></i><span>Intake</span></div><div><i style="height:43%"></i><span>Documents</span></div><div><i style="height:83%"></i><span>Review</span></div><div><i style="height:55%"></i><span>Matching</span></div><div><i style="height:31%"></i><span>In progress</span></div></div></div></div><div class="chart-legend"><span><i class="legend-dot"></i>Requested amount</span><span>6 sample deals shown</span></div></section><section class="panel queue-panel"><div class="panel-heading"><div><h2>Needs your attention</h2><p>Broker review remains in your hands</p></div><button class="icon-button small-icon" data-route-button="review-queue" aria-label="View review queue">→</button></div><div class="queue-list">${queue}</div><button class="panel-link" data-route-button="review-queue">Open review queue <span>→</span></button></section></div><section class="panel deals-panel"><div class="panel-heading"><div><h2>Recent deals</h2><p>Latest updates from your sample workspace</p></div><button class="text-button" data-route-button="deals">All deals <span>→</span></button></div><div class="table-wrap"><table><thead><tr><th>BUSINESS</th><th>STAGE</th><th>REQUESTED</th><th>UPDATED</th><th>STATUS</th></tr></thead><tbody>${rows}</tbody></table></div></section><div class="data-note">◌ &nbsp;You’re viewing illustrative sample data. Connect an authenticated data source to load your workspace.</div>`;
  }
  function reviewView() {
    const openReviews = datasets.reviews.filter(item => sourceMode === "live" ? item.status !== "reviewed" : item.status !== "Done");
    const highCount = sourceMode === "live" ? (liveReviewCounts?.high_priority||0) : openReviews.filter(item => item.priority === "High").length;
    const standardCount = openReviews.filter(item => item.priority !== "High").length;
    const doneCount = sourceMode === "live" ? (liveReviewCounts?.reviewed||0) : datasets.reviews.filter(item => item.status === "Done").length;
    const live = sourceMode === "live";
    const filtered = live ? datasets.reviews : datasets.reviews.filter(item => item.status !== "Done" && (reviewFilter === "All items" || item.priority === reviewFilter || item.reason === reviewFilter));
    const rows = filtered.map(item => `<article class="review-item" data-searchable="${esc((item.company+" "+item.request+" "+item.reason+" "+item.id).toLowerCase())}"><div class="review-priority ${item.priority.toLowerCase()}"></div>${initials(item.company, item.initials, item.color)}<div class="review-main"><div class="review-titleline"><h3>${esc(item.company)}</h3><span class="review-id">${esc(item.id)}</span></div><p>${esc(item.reason)} · ${esc(item.request)}</p><div class="review-meta"><span>◷ ${esc(item.time)}</span><span>Assigned to ${esc(item.owner)}</span></div></div><div class="review-side"><strong>${money(item.amount)}</strong><small>${esc(item.contact)}</small><button class="button button-outline button-sm" data-open-review="${esc(item.id)}">Review details</button></div></article>`).join("") || `<div class="empty-state">${sourceMode === "live" ? "No reviews match this filter." : "No sample items match this filter."}</div>`;
    const canWrite = live && liveState.canWrite(window.BrokerFlowSession?.workspace);
    const summary = live && window.BrokerFlowSession?.workspace ? `<div class="queue-summary"><div><strong>${liveReviewCounts?.open??"—"}</strong><small>Open reviews</small></div><div><strong>${liveReviewCounts?.high_priority??"—"}</strong><small>High priority</small></div><div><strong>${liveReviewCounts?.reviewed??"—"}</strong><small>Reviewed</small></div><div class="summary-note">Live organization data</div></div>` : `<div class="queue-summary"><div><span class="summary-dot high-dot"></span><strong>${highCount}</strong><small>High priority</small></div><div><span class="summary-dot normal-dot"></span><strong>${standardCount}</strong><small>Standard review</small></div><div><span class="summary-dot done-dot"></span><strong>${doneCount}</strong><small>Completed today</small></div><div class="summary-note">All records on this page are illustrative sample data.</div></div>`;
    const pagination = live && reviewNextCursor !== null ? `<div class="table-bottom"><span>Showing ${datasets.reviews.length} of ${reviewTotalCount} matching reviews</span><button class="button button-quiet" data-action="load-more-reviews" ${reviewPageLoading ? "disabled" : ""}>${reviewPageLoading ? "Loading…" : "Load more reviews"}</button></div>` : live && window.BrokerFlowSession?.workspace ? `<div class="table-bottom"><span>Showing ${datasets.reviews.length} of ${reviewTotalCount} matching reviews</span></div>` : "";
    const paginationError = live && reviewAppendError && window.BrokerFlowSession?.workspace ? `<p class="page-footnote" role="alert">Could not load more reviews: ${esc(reviewAppendError)}. The reviews already loaded remain available; retry Load more reviews.</p>` : "";
    const headingActions = live ? `${canWrite ? `<button class="button button-primary" data-action="new-review">＋ <span>New review</span></button>` : ""}<button class="button button-quiet" data-action="refresh">↻ <span>Refresh</span></button>` : `<button class="button button-quiet" data-action="refresh">↻ <span>Refresh</span></button>`;
    return `${pageHeading(live ? "LIVE BROKER WORKSPACE" : "BROKER WORKSPACE", "Review queue", "These are operational review statuses. Lending decisions remain with your team.", headingActions)}${summary}<div class="toolbar"><div class="filter-tabs" role="tablist" aria-label="Filter review items">${["All items", "High", "Normal", "Low"].map(label => `<button role="tab" aria-selected="${reviewFilter === label}" class="filter-tab ${reviewFilter === label ? "selected" : ""}" data-review-filter="${label}">${label}</button>`).join("")}</div><label class="search-field"><span>⌕</span><input type="search" placeholder="Search queue" value="${esc(reviewSearch)}" data-local-search="review" aria-label="Search queue" maxlength="80" /></label></div><div class="review-list">${live && !window.BrokerFlowSession?.workspace ? `<div class="empty-state">Choose an authorized organization to view its review queue.</div>` : live && liveState.get("reviews") ? `<div class="empty-state" role="alert">Live review data could not be loaded. ${esc(liveState.get("reviews"))}</div>` : rows}${pagination}${paginationError}</div><p class="page-footnote">Review tools organize supplied information. They do not establish borrower eligibility, approval, or funding.</p>`;
  }
  function dealsView() {
    const stages = [{ key: "all", label: "All deals" }, { key: "intake", label: "Intake" }, { key: "documents", label: "Documents" }, { key: "review", label: "Review" }, { key: "matching", label: "Lender matching" }];
    const filtered = datasets.deals.filter(item => dealFilter === "all" || item.stageKey === dealFilter);
    const rows = filtered.map(item => `<tr data-searchable="${esc((item.company + " " + item.id + " " + item.contact + " " + item.product).toLowerCase())}"><td><div class="table-entity">${initials(item.company, item.initials, item.color)}<span><strong>${esc(item.company)}</strong><small>${esc(item.id)} · ${esc(item.contact)}</small></span></div></td><td><span class="stage-label"><i class="stage-dot ${item.stageKey}"></i>${esc(item.stage)}</span></td><td><span class="product-label">${esc(item.product)}</span></td><td class="amount-cell">${money(item.amount)}</td><td>${esc(item.owner)}</td><td>${esc(item.age)}</td><td><button class="row-more" data-open-deal="${esc(item.id)}" aria-label="View ${esc(item.id)} details">···</button></td></tr>`).join("");
    return `${pageHeading("BROKER WORKSPACE", "Deals & pipeline", "Track operational progress and requested amounts across active deal records.", `<button class="button button-primary" data-action="new-deal">＋ <span>New deal</span></button>`)}<div class="deal-highlights"><div><span>Open deals</span><strong>24</strong><small>Sample workspace</small></div><div><span>Requested amount</span><strong>$1.24M</strong><small>Across active records</small></div><div><span>Awaiting broker review</span><strong>4</strong><small>Review queue</small></div><div><span>Next follow-up</span><strong>Today</strong><small>2 sample reminders</small></div></div><section class="panel data-table-panel"><div class="toolbar table-toolbar"><div class="filter-tabs" role="tablist" aria-label="Filter deal stages">${stages.map(stage => `<button role="tab" aria-selected="${dealFilter === stage.key}" class="filter-tab ${dealFilter === stage.key ? "selected" : ""}" data-deal-filter="${stage.key}">${stage.label}</button>`).join("")}</div><label class="search-field"><span>⌕</span><input type="search" placeholder="Search deals" data-local-search="deals" aria-label="Search deals" /></label></div><div class="table-wrap"><table><thead><tr><th>BUSINESS</th><th>STAGE</th><th>PRODUCT</th><th>REQUESTED</th><th>OWNER</th><th>UPDATED</th><th></th></tr></thead><tbody>${rows}</tbody></table></div><div class="table-bottom"><span>Showing ${filtered.length} sample records</span><span>Last updated just now</span></div></section><p class="page-footnote">Pipeline stages describe workflow progress. They do not indicate borrower qualification, lender approval, or funding.</p>`;
  }
  function activityView() {
    const filtered = datasets.activity.filter(item => activityFilter === "All activity" || item.type === activityFilter.toLowerCase());
    const groups = filtered.map(item => `<article class="activity-row"><span class="activity-icon ${item.color}">${item.icon}</span><div class="activity-copy"><strong>${esc(item.title)}</strong><p>${esc(item.description)}</p></div><div class="activity-status">${statusPill(item.status)}</div><time>${esc(item.time)}</time>${sourceMode === "live" ? `<button class="row-more" data-open-review="${esc(item.review_id)}" aria-label="Open related review">↗</button>` : `<button class="row-more" data-action="activity-detail" aria-label="View activity details">···</button>`}</article>`).join("") || `<div class="empty-state">${sourceMode === "live" ? "No review activity has been recorded." : "No sample activity matches this filter."}</div>`;
    const live = sourceMode === "live";
    return `${pageHeading(live ? "LIVE REVIEW LEDGER" : "WORKFLOW MONITOR", "Automation activity", live ? "Recorded review creation and broker state changes. Events do not imply external delivery." : "Review workflow events and broker follow-up status. Sample log only; no external actions are sent.", `<button class="button button-quiet" data-action="refresh">↻ <span>Refresh log</span></button>`)}<div class="activity-stats"><div><span class="activity-stat-icon green-icon">✓</span><span><strong>${live ? datasets.activity.filter(x=>x.event_type==="review_marked_reviewed").length : 16}</strong><small>${live ? "Marked reviewed in current page" : "Completed today"}</small></span></div><div><span class="activity-stat-icon amber-icon">◷</span><span><strong>${live ? datasets.activity.filter(x=>x.new_status!=="reviewed").length : 2}</strong><small>${live ? "Open review events in current page" : "Waiting for review"}</small></span></div><div><span class="activity-stat-icon blue-icon">↻</span><span><strong>${live ? (liveActivityTotal??0) : 18}</strong><small>${live ? "Total recorded review events" : "Events today"}</small></span></div></div><section class="panel activity-panel"><div class="panel-heading activity-heading"><div><h2>Recent events</h2><p>${live ? "Durable organization-scoped review events" : "Sample activity · Sunday, October 11"}</p></div><div class="filter-select-wrap"><select id="activity-filter" aria-label="Filter activity">${(live ? ["All activity","Review"] : ["All activity", "Referral", "Documents", "Review", "Partners", "Routing", "Follow-up"]).map(x => `<option ${activityFilter.toLowerCase() === x.toLowerCase() ? "selected" : ""}>${x}</option>`).join("")}</select></div></div><div class="activity-list">${live && !window.BrokerFlowSession?.workspace ? `<div class="empty-state">Choose an authorized organization to view activity.</div>` : live && liveState.get("activity") ? `<div class="empty-state" role="alert">Live activity could not be loaded. ${esc(liveState.get("activity"))}</div>` : groups}</div></section>`;
  }
  function partnersView() {
    const rows = datasets.partners.map(item => `<tr data-searchable="${esc((item.name + " " + item.type + " " + item.status).toLowerCase())}"><td><div class="table-entity">${initials(item.name, item.initials, item.color)}<span><strong>${esc(item.name)}</strong><small>${esc(item.type)}</small></span></div></td><td>${statusPill(item.status)}</td><td><strong>${item.referrals}</strong><span class="muted-cell"> referrals</span></td><td>${esc(item.last)}</td><td><button class="row-action" data-open-partner="${esc(item.name)}">View partner</button></td></tr>`).join("");
    return `${pageHeading("RELATIONSHIP MANAGEMENT", "Partners", "Keep referral relationships and onboarding work visible to your team.", `<button class="button button-primary" data-action="add-partner">＋ <span>Add partner</span></button>`)}<div class="partner-summary"><div><span>Tracked partners</span><strong>${datasets.partners.length}</strong></div><div><span>Active relationships</span><strong>${datasets.partners.filter(x => x.status === "Active").length}</strong></div><div><span>Sample referrals</span><strong>29</strong></div><div class="partner-summary-note">Counts are illustrative and do not represent live CRM data.</div></div><section class="panel data-table-panel"><div class="panel-heading"><div><h2>Partner directory</h2><p>Sample relationship records</p></div><label class="search-field"><span>⌕</span><input type="search" placeholder="Search partners" data-local-search="partners" aria-label="Search partners" /></label></div><div class="table-wrap"><table><thead><tr><th>PARTNER</th><th>STATUS</th><th>REFERRALS</th><th>LAST ACTIVITY</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
  }
  function integrationsView() {
    const cards = datasets.integrations.map(item => `<article class="integration-row"><span class="integration-logo ${item.color}">${esc(item.initials)}</span><div class="integration-copy"><h3>${esc(item.name)}<span class="integration-type">${esc(item.type)}</span></h3><p>${esc(item.detail)}</p></div><div class="integration-right">${statusPill(item.status)}<button class="button button-outline button-sm" data-integration="${esc(item.name)}">${item.status === "Not connected" ? "Connect" : "Set up"}</button></div></article>`).join("");
    return `${pageHeading("WORKSPACE CONNECTIONS", "Integrations", "Connect your tools when an authenticated workspace is configured. These controls are demo-only today.", "")}<div class="integration-callout"><span class="callout-icon">⌘</span><div><strong>Your workflow data stays under your control</strong><p>BrokerFlow can prepare CRM-ready records and workflow payloads. No connection is active in this sample workspace.</p></div><span class="callout-lock">◈ &nbsp;No active connections</span></div><h2 class="subsection-title">Available connections</h2><div class="integration-list">${cards}</div><div class="integration-note"><span>i</span><p>Configuring a connector here only previews the setup flow. It does not authenticate, sync records, or send data.</p></div>`;
  }
  function settingsView() {
    const settings = window.brokerSettings || {};
    return `${pageHeading("WORKSPACE PREFERENCES", "Settings", "Manage local display preferences for this sample console.", `<button class="button button-primary" data-action="save-settings">Save changes</button>`)}<div class="settings-layout"><nav class="settings-nav"><a class="selected" href="#profile">Workspace profile</a><a href="#notifications">Notifications</a><a href="#workflow">Workflow defaults</a><a href="#privacy">Privacy &amp; access</a></nav><div class="settings-sections"><section class="panel settings-panel" id="profile"><div class="settings-panel-heading"><h2>Workspace profile</h2><p>These example details are stored only in this browser.</p></div><div class="settings-form"><label>Workspace name<input name="workspaceName" value="${esc(settings.workspaceName || "Moonshine Capital")}" /></label><label>Timezone<select name="timezone"><option>Eastern Time (US &amp; Canada)</option><option ${settings.timezone === "Central Time (US & Canada)" ? "selected" : ""}>Central Time (US &amp; Canada)</option><option ${settings.timezone === "Pacific Time (US & Canada)" ? "selected" : ""}>Pacific Time (US &amp; Canada)</option></select></label><label>Default currency<select name="currency"><option>USD — US Dollar</option></select></label></div></section><section class="panel settings-panel" id="notifications"><div class="settings-panel-heading"><h2>Notifications</h2><p>Local display preferences only. No notifications are sent.</p></div>${toggleRow("reviewAlerts", "Review queue reminders", "Show a reminder when sample items need broker review", settings.reviewAlerts !== false)}${toggleRow("dailyDigest", "Daily activity digest", "Display the daily sample activity summary", settings.dailyDigest !== false)}</section><section class="panel settings-panel" id="workflow"><div class="settings-panel-heading"><h2>Workflow defaults</h2><p>Human review remains in control of lending decisions and external submissions.</p></div>${toggleRow("humanReview", "Human review checkpoints", "Keep a broker review step in operational workflows", settings.humanReview !== false)}${toggleRow("sampleLabels", "Show sample data labels", "Clearly mark illustrative records in the console", settings.sampleLabels !== false)}</section><section class="panel privacy-panel" id="privacy"><span class="shield-mark">✓</span><div><strong>Decision boundary</strong><p>This console does not approve, decline, qualify, guarantee, underwrite, or fund borrowers. External submissions and sensitive record handling require authorized systems and human oversight.</p></div></section></div></div>`;
  }
  function toggleRow(name, title, description, checked) { return `<label class="setting-toggle"><span><strong>${title}</strong><small>${description}</small></span><input type="checkbox" name="${name}" ${checked ? "checked" : ""}><i></i></label>`; }
  function bindViewEvents() {
    $$('[data-route-button]').forEach(button => button.addEventListener("click", () => navigate(button.dataset.routeButton)));
    $$('[data-review-filter]').forEach(button => button.addEventListener("click", () => { reviewFilter = button.dataset.reviewFilter; render(); }));
    $$('[data-deal-filter]').forEach(button => button.addEventListener("click", () => { dealFilter = button.dataset.dealFilter; render(); }));
    const activitySelect = $("#activity-filter"); if (activitySelect) activitySelect.addEventListener("change", () => { activityFilter = activitySelect.value; render(); });
    $$('[data-local-search]').forEach(input => input.addEventListener("input", () => {
      if (input.dataset.localSearch === "review" && sourceMode === "live") {
        if (reviewSearchTimer) clearTimeout(reviewSearchTimer);
        const value = input.value.slice(0, 80);
        reviewSearchTimer = setTimeout(() => { reviewSearch = value.trim(); reviewQueryKey = null; render(); }, 300);
        return;
      }
      const term = input.value.trim().toLowerCase();
      $$('[data-searchable]').forEach(row => { row.hidden = !row.dataset.searchable.includes(term); });
    }));
    $$('[data-open-review]').forEach(button => button.addEventListener("click", () => openReview(button.dataset.openReview)));
    $$('[data-open-deal]').forEach(button => button.addEventListener("click", () => openDeal(button.dataset.openDeal)));
    $$('[data-open-partner]').forEach(button => button.addEventListener("click", () => openPartner(button.dataset.openPartner)));
    $$('[data-integration]').forEach(button => button.addEventListener("click", () => openIntegration(button.dataset.integration)));
    const save = $('[data-action="save-settings"]'); if (save) save.addEventListener("click", saveSettings);
    $$('[data-action]').forEach(button => button.addEventListener("click", () => handleAction(button.dataset.action)));
  }
  function onGlobalClick(event) { const button = event.target.closest("[data-modal]"); if (button) showModal(button.dataset.modal); }
  function toggleMobile(open) { $("#sidebar").classList.toggle("mobile-open", open); $("#mobile-scrim").classList.toggle("visible", open); document.body.classList.toggle("menu-open", open); }
  function toast(message) { const region = $("#toast-region"); const item = document.createElement("div"); item.className = "toast"; item.textContent = message; region.append(item); setTimeout(() => item.remove(), 3200); }
  function modal(title, body, footer = "") { const old = $("#active-modal"); if (old) old.remove(); document.body.insertAdjacentHTML("beforeend", `<div class="modal-backdrop" id="active-modal" role="presentation"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-heading"><h2 id="modal-title">${title}</h2><button class="icon-button" data-close-modal aria-label="Close dialog">×</button></div><div class="modal-content">${body}</div>${footer ? `<div class="modal-footer">${footer}</div>` : ""}</section></div>`); $("#active-modal").addEventListener("click", event => { if (event.target.id === "active-modal" || event.target.closest("[data-close-modal]")) return closeModal(); const action = event.target.closest("[data-action]"); if (action) handleAction(action.dataset.action); }); }
  function closeModal() { const active = $("#active-modal"); if (active) active.remove(); }
  function showModal(type) {
    if (sourceMode === "live" && type === "workspace") return modal("Organization", `<p class="modal-copy">Review records are scoped to an organization selected from your verified membership and explicit BrokerFlow permissions.</p><div class="modal-detail"><span>Current organization</span><strong>${esc(window.BrokerFlowSession?.workspace?.name||"Not selected")}</strong></div>`, `<button class="button button-primary" data-close-modal>Done</button>`);
    if (sourceMode === "live" && type === "profile") return modal("Authenticated session", `<div class="modal-detail"><span>Signed in as</span><strong>${esc(liveSession?.user?.email||"Not signed in")}</strong></div><div class="modal-detail"><span>Organization</span><strong>${esc(window.BrokerFlowSession?.workspace?.name||"Not selected")}</strong></div>`, `<button class="button button-quiet" data-close-modal>Close</button><button class="button button-primary" data-action="sign-out">Sign out</button>`);
    if (type === "notifications") return modal("Notifications", `<div class="modal-empty"><span>♧</span><strong>You’re all caught up</strong><p>Sample workspace notifications will appear here. No notifications are connected.</p></div>`);
    if (type === "workspace") return modal("Workspace", `<p class="modal-copy">This demo is showing one illustrative workspace. Workspace switching requires an authenticated account.</p><div class="modal-detail"><span>Current workspace</span><strong>Moonshine Capital · Sample</strong></div>`, `<button class="button button-primary" data-close-modal>Done</button>`);
    modal("Demo workspace", `<p class="modal-copy">This is a preview workspace using illustrative records. Account actions and borrower data are not connected.</p><div class="modal-detail"><span>Signed in as</span><strong>Jordan Feimster</strong></div><div class="modal-detail"><span>Workspace</span><strong>Moonshine Capital · Demo</strong></div>`, `<button class="button button-primary" data-close-modal>Done</button>`);
  }
  function openReview(id) {
    const row = liveState.resolveReviewTarget(id, datasets.reviews, sourceMode === "live");
    if (sourceMode === "live") { openLiveReview(row || { id }); return; }
    if (!row) return;
    modal(`Review item <span class="modal-id">${esc(row.id)}</span>`, `<div class="detail-entity">${initials(row.company, row.initials, row.color)}<div><strong>${esc(row.company)}</strong><small>${esc(row.contact)} · Sample record</small></div><strong class="detail-amount">${money(row.amount)}</strong></div><div class="detail-section"><span>REVIEW REASON</span><strong>${esc(row.reason)}</strong><p>${esc(row.detail)}</p></div><div class="detail-grid"><div><span>Request type</span><strong>${esc(row.request)}</strong></div><div><span>Priority</span><strong>${esc(row.priority)}</strong></div><div><span>Assigned to</span><strong>${esc(row.owner)}</strong></div><div><span>Received</span><strong>${esc(row.time)}</strong></div></div><div class="modal-disclaimer">Sample interaction only. No borrower decision, message, or external workflow action will be performed.</div>`, `<button class="button button-quiet" data-close-modal>Close</button><button class="button button-primary" data-demo-complete="${esc(id)}">Mark reviewed in this demo</button>`);
    const complete = $('[data-demo-complete]'); complete.addEventListener("click", () => { row.status = "Done"; closeModal(); toast("Marked reviewed in this demo only."); render(); });
  }
  async function openLiveReview(row) {
    try {
      const org = window.BrokerFlowSession.workspace.id;
      const result = await window.BrokerFlowAuth.request(`/api/console/review?id=${encodeURIComponent(row.id)}&organization_id=${encodeURIComponent(org)}`);
      const item = result.item;
      const company = row.company || item.business_name || item.requester_name || "Review request";
      const priority = row.priority || ({same_day:"High",high:"High",normal:"Normal",low:"Low"})[item.urgency] || "Normal";
      const actions = result.permitted_actions || [];
      const actionButtons = actions.map(action => `<button class="button button-primary" data-live-review-action="${esc(action)}" data-review-id="${esc(item.id)}" data-version="${item.version}">${action === "start_review" ? "Start review" : action === "request_information" ? "Request information" : "Mark reviewed"}</button>`).join("");
      const context = Object.entries(item.scenario || {}).filter(([key])=>["monthly_revenue","annual_revenue","time_in_business_months","credit_score_range","recommended_review_path","notes"].includes(key)).map(([key,value])=>`<div><span>${esc(key.replaceAll("_"," "))}</span><strong>${esc(value)}</strong></div>`).join("");
      const history = (result.activity||[]).map(event=>`<p>${esc(event.event_type.replaceAll("_"," "))} · ${new Date(event.created_at).toLocaleString()} · ${esc(event.actor_user_id||event.actor_source)}${event.note ? " · "+esc(event.note):""}</p>`).join("") || (result.activity_access === false ? "<p>You do not have permission to view review history.</p>" : "<p>No review events recorded.</p>");
      modal(`Review <span class="modal-id">${esc(item.review_request_id)}</span>`, `<div class="detail-entity">${initials(company,row.initials,row.color || "teal")}<div><strong>${esc(company)}</strong><small>${esc(item.borrower_type)} · ${esc(item.status.replaceAll("_"," "))}</small></div><strong class="detail-amount">${money(Number(item.requested_amount))}</strong></div><div class="detail-grid"><div><span>Purpose</span><strong>${esc(item.loan_purpose.replaceAll("_"," "))}</strong></div><div><span>Priority</span><strong>${esc(priority)}</strong></div><div><span>Received</span><strong>${new Date(item.created_at).toLocaleString()}</strong></div><div><span>Version</span><strong>${item.version}</strong></div>${context}</div><div class="detail-section"><span>Review activity</span>${history}</div><div class="modal-disclaimer">Operational status only. No borrower qualification, approval, denial, underwriting, pricing, funding, communication, or lender submission occurs here.</div>`, `<button class="button button-quiet" data-close-modal>Close</button>${actionButtons}`);
      $$('[data-live-review-action]').forEach(button=>button.addEventListener("click",()=>submitLiveAction(button,row)));
    } catch (error) { liveState.set("reviews",error.message); toast(error.message); }
  }
  async function submitLiveAction(button,row) {
    const action=button.dataset.liveReviewAction;
    const note=action==="request_information"?prompt("Enter the information being requested (500 characters maximum):"):"";
    if(action==="request_information"&&!note?.trim())return;
    button.disabled=true;
    const payload = { organization_id:window.BrokerFlowSession.workspace.id, review_id:button.dataset.reviewId, action, note, expected_version:Number(button.dataset.version) };
    const scope = `review-action:${payload.review_id}:${action}:${payload.expected_version}`;
    try {
      const key = await window.BrokerFlowIdempotency.key(scope, payload);
      await window.BrokerFlowAuth.request("/api/console/review-action",{method:"POST",body:JSON.stringify({...payload,idempotency_key:key})});
      await window.BrokerFlowIdempotency.complete(scope, payload);
      closeModal(); toast("Review status saved."); await render({refresh:true});
    }
    catch(error){button.disabled=false;toast(error.message||"Unable to save review action.");}
  }
  function createLiveReview() {
    if(!liveSession?.user||!window.BrokerFlowSession?.workspace){toast("Sign in and choose an authorized organization first.");return;}
    if(!liveState.canWrite(window.BrokerFlowSession.workspace)){toast("This organization is read-only for your account.");return;}
    modal("Create human review request",`<p class="modal-copy">This creates an operational review task. It does not make a lending decision.</p><label class="modal-field">Business name<input id="new-review-business" maxlength="160" required /></label><label class="modal-field">Borrower type<select id="new-review-type"><option value="business">Business</option><option value="commercial_borrower">Commercial borrower</option><option value="individual">Individual</option><option value="real_estate_investor">Real estate investor</option></select></label><label class="modal-field">Loan purpose<select id="new-review-purpose"><option value="business_working_capital">Business working capital</option><option value="equipment_financing">Equipment financing</option><option value="commercial_real_estate">Commercial real estate</option><option value="debt_consolidation">Debt consolidation</option><option value="other">Other</option></select></label><label class="modal-field">Requested amount<input id="new-review-amount" type="number" min="1" max="1000000000" required /></label><label class="modal-field">State<input id="new-review-state" maxlength="2" required /></label><label class="modal-field">Priority<select id="new-review-urgency"><option value="normal">Normal</option><option value="high">High</option><option value="same_day">Same day</option><option value="low">Low</option></select></label>`, `<button class="button button-quiet" data-close-modal>Cancel</button><button class="button button-primary" id="submit-new-review">Create review</button>`);
    $("#submit-new-review").addEventListener("click",async event=>{
      const b=event.currentTarget; b.disabled=true;
      const business=$("#new-review-business").value.trim(), amount=Number($("#new-review-amount").value), state=$("#new-review-state").value.trim().toUpperCase();
      if(!business||business.length>160||!Number.isFinite(amount)||amount<=0||state.length!==2){b.disabled=false;toast("Enter a business name up to 160 characters, positive amount, and two-letter state.");return;}
      const payload={organization_id:window.BrokerFlowSession.workspace.id,source:"internal_tool",action_type:"lender_match_review",requester_name:liveSession.user.email||"Authorized broker",borrower_type:$("#new-review-type").value,business_name:business,loan_purpose:$("#new-review-purpose").value,requested_amount:amount,state,urgency:$("#new-review-urgency").value,human_review_required:true};
      const scope=`review-create:${payload.organization_id}`;
      try{
        const key=await window.BrokerFlowIdempotency.key(scope,payload);
        await window.BrokerFlowAuth.request("/api/console/reviews",{method:"POST",headers:{"Idempotency-Key":key},body:JSON.stringify(payload)});
        await window.BrokerFlowIdempotency.complete(scope,payload);
        closeModal();toast("Review request created.");await render({refresh:true});
      }catch(error){b.disabled=false;toast(error.message||"Unable to create review.");}
    });
  }
  function openDeal(id) { const deal = datasets.deals.find(item => item.id === id); if (!deal) return; modal(`Deal <span class="modal-id">${esc(deal.id)}</span>`, `<div class="detail-entity">${initials(deal.company, deal.initials, deal.color)}<div><strong>${esc(deal.company)}</strong><small>${esc(deal.contact)} · Sample record</small></div><strong class="detail-amount">${money(deal.amount)}</strong></div><div class="detail-grid"><div><span>Workflow stage</span><strong>${esc(deal.stage)}</strong></div><div><span>Product</span><strong>${esc(deal.product)}</strong></div><div><span>Owner</span><strong>${esc(deal.owner)}</strong></div><div><span>Source</span><strong>${esc(deal.source)}</strong></div></div><div class="detail-section"><span>NEXT STEP</span><strong>${esc(deal.risk)}</strong><p>Use your authorized CRM or workflow system to take external action.</p></div><div class="modal-disclaimer">Sample record. Requested amount and workflow status do not indicate eligibility or approval.</div>`, `<button class="button button-primary" data-close-modal>Done</button>`); }
  function openPartner(name) { const partner = datasets.partners.find(item => item.name === name); if (!partner) return; modal(esc(partner.name), `<div class="detail-entity">${initials(partner.name, partner.initials, partner.color)}<div><strong>${esc(partner.type)}</strong><small>Sample partner record</small></div>${statusPill(partner.status)}</div><div class="detail-grid"><div><span>Recorded referrals</span><strong>${partner.referrals}</strong></div><div><span>Last activity</span><strong>${esc(partner.last)}</strong></div></div><div class="modal-disclaimer">Counts are illustrative. Partner attribution and compensation require verified records and human review.</div>`, `<button class="button button-primary" data-close-modal>Done</button>`); }
  function openIntegration(name) { modal(`Set up ${esc(name)}`, `<p class="modal-copy">This connector is shown as a setup preview. Authentication, data mapping and sync are not available in this sample console.</p><label class="modal-field">Connection label<input value="${esc(name)} workspace" /></label><div class="modal-disclaimer">Saving this preview will not connect an account, transmit records, or create credentials.</div>`, `<button class="button button-quiet" data-close-modal>Cancel</button><button class="button button-primary" data-demo-integration="${esc(name)}">Save preview</button>`); $('[data-demo-integration]').addEventListener("click", () => { const input = $(".modal-field input"); const saved = JSON.parse(localStorage.getItem("brokerflow-integration-previews") || "{}"); saved[name] = input.value.trim(); localStorage.setItem("brokerflow-integration-previews", JSON.stringify(saved)); closeModal(); toast(`${name} setup preview saved in this browser. No connection was made.`); }); }
  function handleAction(action) {
    if (action === "sign-in") { const email=prompt("Enter your invited broker email address:"); if(!email)return; window.BrokerFlowAuth.login(email.trim()).then(()=>toast("Sign-in link sent. Open it in this browser to continue.")).catch(error=>toast(error.message)); return; }
    if (action === "sign-out") { window.BrokerFlowAuth.signOut(); return; }
    if (action === "select-workspace") { const id=$("#live-org-select")?.value;const workspace=liveSession?.workspaces?.find(item=>item.id===id);if(!workspace){toast("Choose an organization you are authorized to access.");return;}window.BrokerFlowSession={...liveSession,workspace};liveError="";liveState.reset();render();return; }
    if (action === "new-review") { createLiveReview(); return; }
    if (action === "load-more-reviews") { loadMoreReviews(); return; }
    if (action === "refresh") { render({ refresh: true }).then(()=>toast(sourceMode === "live" ? "Live review data refreshed." : "Sample workspace refreshed.")); return; }
    if (action === "export-sample") { const csv = ["Deal,ID,Stage,Requested amount", ...datasets.deals.map(d => `"${d.company}",${d.id},"${d.stage}",${d.amount}`)].join("\n"); const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); link.download = "brokerflow-sample-overview.csv"; link.click(); URL.revokeObjectURL(link.href); toast("Sample overview exported."); return; }
    const details = { "new-deal": ["New deal", "<p class='modal-copy'>Deal creation is a preview in this sample workspace. No CRM record will be created.</p><label class='modal-field'>Business name<input placeholder='Enter a business name' /></label><label class='modal-field'>Requested amount<input type='number' min='0' placeholder='e.g. 125000' /></label>"], "add-partner": ["Add partner", "<p class='modal-copy'>Partner entry is a preview in this sample workspace. No CRM record will be created.</p><label class='modal-field'>Partner name<input placeholder='Enter partner name' /></label><label class='modal-field'>Partner type<select><option>Accounting firm</option><option>Business advisory</option><option>Commercial real estate</option><option>Other</option></select></label>"], "activity-detail": ["Sample workflow event", "<p class='modal-copy'>This is an illustrative activity record. No external workflow ran from this screen.</p>"] };
    if (details[action]) modal(details[action][0], details[action][1], `<button class="button button-quiet" data-close-modal>Cancel</button><button class="button button-primary" data-preview-save>Save preview</button>`);
    const preview = $('[data-preview-save]'); if (preview) preview.addEventListener("click", () => {
      if (action === "new-deal") {
        const business = $(".modal-field input[placeholder='Enter a business name']").value.trim();
        const amount = Number($(".modal-field input[type='number']").value);
        if (!business || !Number.isFinite(amount) || amount <= 0) { toast("Enter a business name and a positive requested amount."); return; }
        const item = { id: `BF-${String(Date.now()).slice(-4)}`, company: business, contact: "New sample contact", initials: business.split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase(), amount, product: "Working capital", stage: "Intake", stageKey: "intake", age: "Just now", owner: "Jordan F.", source: "Created in demo", risk: "Intake in progress", color: "teal" };
        window.BrokerFlowData.sample.deals.unshift(item);
        closeModal(); navigate("deals"); toast("Sample deal added to this browser session. No CRM record was created."); return;
      }
      if (action === "add-partner") {
        const name = $(".modal-field input[placeholder='Enter partner name']").value.trim();
        if (!name) { toast("Enter a partner name to add a sample record."); return; }
        const item = { name, initials: name.split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase(), type: $(".modal-field select").value, referrals: 0, status: "Onboarding", last: "Just now", color: "teal" };
        window.BrokerFlowData.sample.partners.unshift(item);
        closeModal(); navigate("partners"); toast("Sample partner added to this browser session. No CRM record was created."); return;
      }
      closeModal(); toast("No backend action was performed.");
    });
  }
  function saveSettings() { const form = $(".settings-sections"); const result = {}; $$('input[name], select[name]', form).forEach(field => { result[field.name] = field.type === "checkbox" ? field.checked : field.value; }); localStorage.setItem("brokerflow-settings", JSON.stringify(result)); window.brokerSettings = result; toast("Display preferences saved in this browser."); }
  init();
})();
