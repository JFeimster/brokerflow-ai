/* ============================================================
   BrokerFlow AI — script.js
   Shared interactivity for index.html and agents.html
   ============================================================ */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    initYear();
    initMobileNav();
    initSmoothScroll();
    initRoiCalculator();
    initCtaTracking();
  });

  /* ---------- Footer year ---------- */
  function initYear() {
    var el = document.getElementById("year");
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ---------- Mobile nav toggle ---------- */
  function initMobileNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("primary-nav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    // Close the menu when a link is tapped (mobile)
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Smooth scroll for in-page anchors ---------- */
  function initSmoothScroll() {
    var prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener("click", function (e) {
        var targetId = this.getAttribute("href");
        if (targetId === "#" || targetId.length < 2) return;

        var target = document.querySelector(targetId);
        if (!target) return;

        e.preventDefault();
        target.scrollIntoView({
          behavior: prefersReduced ? "auto" : "smooth",
          block: "start",
        });
        // Update the URL without jumping
        history.replaceState(null, "", targetId);
      });
    });
  }

  /* ---------- ROI calculator ---------- */
  function initRoiCalculator() {
    var form = document.getElementById("roi-form");
    if (!form) return;

    var leadsEl = document.getElementById("leads");
    var tasksEl = document.getElementById("tasks");
    var minutesEl = document.getElementById("minutes");
    var hoursWeekEl = document.getElementById("hours-week");
    var hoursYearEl = document.getElementById("hours-year");

    function calculate() {
      var leads = toNumber(leadsEl.value);
      var tasks = toNumber(tasksEl.value);
      var minutes = toNumber(minutesEl.value);

      var minutesPerWeek = leads * tasks * minutes;
      var hoursPerWeek = minutesPerWeek / 60;
      var hoursPerYear = hoursPerWeek * 50; // ~50 working weeks

      hoursWeekEl.textContent = formatNumber(hoursPerWeek, 1);
      hoursYearEl.textContent = formatNumber(hoursPerYear, 0);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      calculate();
    });

    // Live update as the user types
    [leadsEl, tasksEl, minutesEl].forEach(function (input) {
      if (input) input.addEventListener("input", calculate);
    });

    // Initial render
    calculate();
  }

  /* ---------- CTA tracking hook ---------- */
  function initCtaTracking() {
    document.querySelectorAll('[data-cta]').forEach(function (btn) {
      btn.addEventListener("click", function () {
        var label = this.getAttribute("data-cta");
        // Replace with your analytics call (e.g., gtag, Plausible, PostHog).
        if (window.console && typeof console.info === "function") {
          console.info("[BrokerFlow] CTA clicked:", label);
        }
      });
    });
  }

  /* ---------- Helpers ---------- */
  function toNumber(value) {
    var n = parseFloat(value);
    return isNaN(n) || n < 0 ? 0 : n;
  }

  function formatNumber(value, decimals) {
    return Number(value).toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
})();