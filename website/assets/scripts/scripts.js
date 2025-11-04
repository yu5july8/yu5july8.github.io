document.addEventListener("DOMContentLoaded", () => {
  // =========================
  // Helpers
  // =========================
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const FOCUSABLE =
    'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  const main = $("#main") || document.body;

  // Progressive enhancement for inert
  const setInert = (isInert) => {
    if ("inert" in HTMLElement.prototype) {
      main.inert = isInert;
    } else {
      // Fallback: hide from AT while modal is open
      main.setAttribute("aria-hidden", isInert ? "true" : "false");
    }
    document.body.style.overflow = isInert ? "hidden" : "";
  };

  // Focus trap utility
  function trapFocus(container, e) {
    const focusables = $$(FOCUSABLE, container).filter(el => el.offsetParent !== null || el === document.activeElement);
    if (!focusables.length) return;
    const first = focusables[0];
    const last  = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  // =========================
  // Modals (resume / capstone / proposal)
  // =========================
  const modals = {
    resume: { modal: $("#resumeModal"), openers: [$("#openResume")] },
    capstone: { modal: $("#capstoneModal"), openers: [$("#openCapstone"), $("#openCapstone2"), $("#openCapstoneImg")] },
    proposal: { modal: $("#proposalModal"), openers: [$("#openProposal")] }
  };

  let lastOpener = null;

  function openModal(modalEl, openerBtn) {
    if (!modalEl) return;
    lastOpener = openerBtn || document.activeElement;
    modalEl.style.display = "block";
    setInert(true);

    // Move focus into dialog content
    const dialog = modalEl.querySelector(".modal-content");
    if (dialog) {
      dialog.setAttribute("tabindex", "-1");
      dialog.focus();
    }

    // Mark expanded if opener has aria-expanded (optional)
    if (openerBtn && openerBtn.hasAttribute("aria-expanded")) {
      openerBtn.setAttribute("aria-expanded", "true");
    }

    // Key handling: Esc + focus trap
    function onKey(e) {
      if (e.key === "Escape") {
        closeModal(modalEl);
      } else if (e.key === "Tab") {
        trapFocus(dialog || modalEl, e);
      }
    }
    modalEl._onKey = onKey; // store to remove later
    document.addEventListener("keydown", onKey);

    // Click outside to close
    function onOutside(e) {
      if (e.target === modalEl) closeModal(modalEl);
    }
    modalEl._onOutside = onOutside;
    window.addEventListener("click", onOutside);
  }

  function closeModal(modalEl) {
    if (!modalEl) return;
    modalEl.style.display = "none";
    setInert(false);

    // Restore focus to whichever opener launched it
    if (lastOpener && typeof lastOpener.focus === "function") {
      lastOpener.focus();
    }

    // If opener had aria-expanded, reset
    if (lastOpener && lastOpener.hasAttribute("aria-expanded")) {
      lastOpener.setAttribute("aria-expanded", "false");
    }

    // Remove listeners
    document.removeEventListener("keydown", modalEl._onKey || (()=>{}));
    window.removeEventListener("click", modalEl._onOutside || (()=>{}));
    delete modalEl._onKey;
    delete modalEl._onOutside;
  }

  // Wire openers
  Object.values(modals).forEach(({ modal, openers }) => {
    openers.filter(Boolean).forEach(opener => {
      opener.addEventListener("click", (e) => {
        e.preventDefault();
        openModal(modal, opener);
      });
    });
  });

  // Wire close buttons
  $$(".close-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const modal = btn.closest(".modal");
      closeModal(modal);
    });
  });

  // =========================
  // Accordion (years)
  // =========================
  const accBtns = $$(".accordion-btn");
  accBtns.forEach((btn, i) => {
    // Ensure each button controls the next panel with an ID
    let panel = btn.nextElementSibling;
    if (!panel) return;

    if (!panel.id) panel.id = `accordion-panel-${i+1}`;
    btn.setAttribute("aria-controls", panel.id);
    btn.setAttribute("aria-expanded", "false");
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-labelledby", btn.id || `accordion-btn-${i+1}`);
    if (!btn.id) btn.id = `accordion-btn-${i+1}`;

    // Start collapsed
    panel.hidden = true;

    btn.addEventListener("click", () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";

      // Close others
      accBtns.forEach(otherBtn => {
        if (otherBtn !== btn) {
          otherBtn.classList.remove("active");
          otherBtn.setAttribute("aria-expanded", "false");
          const p = otherBtn.nextElementSibling;
          if (p) p.hidden = true;
        }
      });

      // Toggle current
      btn.setAttribute("aria-expanded", String(!expanded));
      btn.classList.toggle("active", !expanded);
      panel.hidden = expanded;
    });
  });

  // =========================
  // Scroll Progress Bar (hide from AT)
  // =========================
  const progressBar = $("#progress-bar");
  if (progressBar) {
    progressBar.setAttribute("aria-hidden", "true"); // decorative
    window.addEventListener("scroll", () => {
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      progressBar.style.width = scrolled + "%";
    });
  }

  // =========================
  // Responsive Navigation
  // =========================
  const navToggle = $("#nav-toggle");
  const navLinks  = $("#nav-links");

  function closeNav() {
    if (!navToggle || !navLinks) return;
    navLinks.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open navigation");
    navToggle.textContent = "☰";
  }

  function openNav() {
    if (!navToggle || !navLinks) return;
    navLinks.classList.add("open");
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "Close navigation");
    navToggle.textContent = "✖";
  }

  if (navToggle && navLinks) {
    // Initialize ARIA
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open navigation");

    navToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.contains("open");
      isOpen ? closeNav() : openNav();
    });

    // Close the mobile menu if viewport jumps to desktop
    const MQ = window.matchMedia("(min-width: 769px)");
    const onChange = () => {
      if (MQ.matches) closeNav();
    };
    MQ.addEventListener ? MQ.addEventListener("change", onChange) : MQ.addListener(onChange);
  }
});