// scripts.js
document.addEventListener("DOMContentLoaded", () => {
  // ---------- tiny helpers ----------
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const FOCUSABLE =
    'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  // ======================================================
  // 1) ACCESSIBLE MODALS (CV / Capstone / Proposal)
  // ======================================================
  const modalMap = {
    resume:   { modal: $("#resumeModal"),   triggers: [$("#openResume")] },
    capstone: { modal: $("#capstoneModal"), triggers: [$("#openCapstone"), $("#openCapstone2"), $("#openCapstoneImg")] },
    proposal: { modal: $("#proposalModal"), triggers: [$("#openProposal")] }
  };

  let activeModal = null;
  let lastOpener  = null;

  function lockBody(locked) {
    document.body.style.overflow = locked ? "hidden" : "";
  }

  function trapFocus(e, container) {
    const nodes = $$(FOCUSABLE, container).filter(el =>
      el.offsetParent !== null || el === document.activeElement
    );
    if (!nodes.length) return;
    const first = nodes[0];
    const last  = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function openModal(modalEl, opener) {
    if (!modalEl) return;
    // show + lock
    modalEl.classList.add("open");
    lockBody(true);
    activeModal = modalEl;
    lastOpener  = opener || document.activeElement;

    // focus into dialog
    const box = modalEl.querySelector(".modal-content");
    if (box) { box.setAttribute("tabindex", "-1"); box.focus(); }

    // prevent clicks inside box from closing (we close only on backdrop)
    if (box && !box._hasStopper) {
      box.addEventListener("click", e => e.stopPropagation());
      box._hasStopper = true;
    }

    // close handlers
    modalEl.addEventListener("click", backdropClose); // overlay click
    document.addEventListener("keydown", escClose);   // Esc + focus trap
    document.addEventListener("keydown", tabTrap);    // Tab trap
  }

  function closeModal() {
    if (!activeModal) return;
    activeModal.classList.remove("open");
    lockBody(false);

    activeModal.removeEventListener("click", backdropClose);
    document.removeEventListener("keydown", escClose);
    document.removeEventListener("keydown", tabTrap);

    // return focus
    if (lastOpener && typeof lastOpener.focus === "function") lastOpener.focus();
    activeModal = null;
  }

  function backdropClose(e) {
    if (e.currentTarget === activeModal) closeModal();
  }
  function escClose(e) {
    if (e.key === "Escape") closeModal();
  }
  function tabTrap(e) {
    if (e.key !== "Tab" || !activeModal) return;
    const box = activeModal.querySelector(".modal-content") || activeModal;
    trapFocus(e, box);
  }

  // wire triggers
  Object.values(modalMap).forEach(({ modal, triggers }) => {
    (triggers || []).filter(Boolean).forEach(btn => {
      btn.addEventListener("click", (e) => { e.preventDefault(); openModal(modal, btn); });
    });
  });

  // wire close buttons
  $$(".modal .close-btn").forEach(btn => btn.addEventListener("click", closeModal));

  // ======================================================
  // 2) ACCORDION (years) — single-open with ARIA + hidden
  // ======================================================
  const accBtns = $$(".accordion-btn");
  accBtns.forEach((btn, i) => {
    const panel = btn.nextElementSibling;
    if (!panel) return;

    // ensure IDs/attributes
    if (!btn.id) btn.id = `accordion-btn-${i+1}`;
    if (!panel.id) panel.id = `accordion-panel-${i+1}`;
    btn.setAttribute("aria-controls", panel.id);
    btn.setAttribute("aria-expanded", "false");
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-labelledby", btn.id);
    panel.hidden = true;

    btn.addEventListener("click", () => {
      const isOpen = btn.getAttribute("aria-expanded") === "true";

      // close others
      accBtns.forEach(other => {
        if (other === btn) return;
        other.setAttribute("aria-expanded", "false");
        other.classList.remove("active");
        const p = other.nextElementSibling;
        if (p) p.hidden = true;
      });

      // toggle current
      btn.setAttribute("aria-expanded", String(!isOpen));
      btn.classList.toggle("active", !isOpen);
      panel.hidden = isOpen;
    });
  });

  // ======================================================
  // 3) PROGRESS BAR (decorative)
  // ======================================================
  const progressBar = $("#progress-bar");
  if (progressBar) {
    progressBar.setAttribute("aria-hidden", "true");
    window.addEventListener("scroll", () => {
      const top = document.documentElement.scrollTop || document.body.scrollTop;
      const max = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      progressBar.style.width = (max > 0 ? (top / max) * 100 : 0) + "%";
    });
  }

  // ======================================================
  // 4) RESPONSIVE NAV (hamburger) with ARIA
  // ======================================================
  const navToggle = $("#nav-toggle");
  const navLinks  = $("#nav-links");

  function openNav() {
    navLinks.classList.add("open");
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "Close navigation");
    navToggle.textContent = "✖";
  }
  function closeNav() {
    navLinks.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open navigation");
    navToggle.textContent = "☰";
  }

  if (navToggle && navLinks) {
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open navigation");

    navToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.contains("open");
      isOpen ? closeNav() : openNav();
    });

    // if viewport jumps to desktop, reset mobile menu
    const MQ = window.matchMedia("(min-width: 769px)");
    const mqHandler = () => { if (MQ.matches) closeNav(); };
    MQ.addEventListener ? MQ.addEventListener("change", mqHandler) : MQ.addListener(mqHandler);
  }
});