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

    // ======================================================
  // 5) ACCESSIBLE PHOTO LIGHTBOX
  // ======================================================
  const photoDialog = $("#photo-lightbox");
  const photoDialogImage = $("#photo-lightbox-image");
  const photoDialogCaption = $("#photo-lightbox-caption");
  const photoDialogClose = $("#photo-lightbox-close");
  const photoButtons = $$(".photo-button");

  if (
    photoDialog &&
    photoDialogImage &&
    photoDialogCaption &&
    photoDialogClose
  ) {
    let lastPhotoButton = null;

    photoButtons.forEach(button => {
      button.addEventListener("click", () => {
        const thumbnail = $("img", button);
        const fullImage = button.dataset.full || thumbnail?.src;
        const caption = button.dataset.caption || "";
        const alternativeText = thumbnail?.alt || caption || "Enlarged photo";

        lastPhotoButton = button;
        photoDialogImage.src = fullImage;
        photoDialogImage.alt = alternativeText;
        photoDialogCaption.textContent = caption;

        photoDialog.showModal();
        photoDialogClose.focus();
      });
    });

    photoDialogClose.addEventListener("click", () => {
      photoDialog.close();
    });

    photoDialog.addEventListener("click", event => {
      if (event.target === photoDialog) {
        photoDialog.close();
      }
    });

    photoDialog.addEventListener("close", () => {
      photoDialogImage.src = "";
      photoDialogImage.alt = "";
      photoDialogCaption.textContent = "";

      if (lastPhotoButton) {
        lastPhotoButton.focus();
      }
    });
  }

    // ======================================================
  // 6) ACCESSIBILITY TOOLS: TEXT SIZE AND READ ALOUD
  // ======================================================
  const increaseTextButton = $("#increase-text");
  const resetTextButton = $("#reset-text");
  const readPageButton = $("#read-page");
  const stopReadingButton = $("#stop-reading");
  const accessibilityStatus = $("#accessibility-status");
  const mainContent = $("#main");

  const textSizes = ["100%", "125%", "150%", "175%", "200%"];
  let textSizeIndex = 0;
  let currentSpeech = null;

  function announceStatus(message) {
    if (!accessibilityStatus) return;

    accessibilityStatus.textContent = "";

    window.setTimeout(() => {
      accessibilityStatus.textContent = message;
    }, 50);
  }

  // ------------------------------------------------------
  // Text-size controls
  // ------------------------------------------------------
  function applyTextSize(announce = true) {
    const size = textSizes[textSizeIndex];

    document.documentElement.style.setProperty(
      "--user-font-size",
      size
    );

    if (increaseTextButton) {
      const maximumReached =
        textSizeIndex === textSizes.length - 1;

      increaseTextButton.disabled = maximumReached;

      increaseTextButton.setAttribute(
        "aria-label",
        maximumReached
          ? "Maximum text size reached"
          : "Increase text size"
      );
    }

    try {
      localStorage.setItem(
        "preferredTextSizeIndex",
        String(textSizeIndex)
      );
    } catch (error) {
      // The preference still works for the current page.
    }

    if (announce) {
      announceStatus(`Text size set to ${size}.`);
    }
  }

  // Restore the selected size when visitors change pages.
  try {
    const savedTextSize = Number.parseInt(
      localStorage.getItem("preferredTextSizeIndex"),
      10
    );

    if (
      Number.isInteger(savedTextSize) &&
      savedTextSize >= 0 &&
      savedTextSize < textSizes.length
    ) {
      textSizeIndex = savedTextSize;
    }
  } catch (error) {
    // Use the default size when storage is unavailable.
  }

  if (increaseTextButton && resetTextButton) {
    applyTextSize(false);

    increaseTextButton.addEventListener("click", () => {
      if (textSizeIndex < textSizes.length - 1) {
        textSizeIndex += 1;
        applyTextSize();
      }
    });

    resetTextButton.addEventListener("click", () => {
      textSizeIndex = 0;
      applyTextSize();
    });
  }

  // ------------------------------------------------------
  // Read-aloud controls
  // ------------------------------------------------------
  function updateSpeechControls(isReading) {
    if (readPageButton) {
      readPageButton.disabled = isReading;
      readPageButton.setAttribute(
        "aria-pressed",
        String(isReading)
      );
    }

    if (stopReadingButton) {
      stopReadingButton.disabled = !isReading;
    }
  }

  function stopReading(announce = true) {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    currentSpeech = null;
    updateSpeechControls(false);

    if (announce) {
      announceStatus("Reading stopped.");
    }
  }

  if (
    "speechSynthesis" in window &&
    readPageButton &&
    stopReadingButton &&
    mainContent
  ) {
    updateSpeechControls(false);

    readPageButton.addEventListener("click", () => {
      // Stop an existing utterance without announcing it.
      stopReading(false);

      const pageText = mainContent.innerText
        .replace(/\s+/g, " ")
        .trim();

      if (!pageText) {
        announceStatus("No page content is available to read.");
        return;
      }

      currentSpeech = new SpeechSynthesisUtterance(pageText);
      currentSpeech.lang =
        document.documentElement.lang || "en";
      currentSpeech.rate = 1;
      currentSpeech.pitch = 1;

      currentSpeech.addEventListener("end", () => {
        currentSpeech = null;
        updateSpeechControls(false);
        announceStatus("Reading finished.");
      });

      currentSpeech.addEventListener("error", event => {
        currentSpeech = null;
        updateSpeechControls(false);

        if (event.error !== "canceled") {
          announceStatus("The page could not be read aloud.");
        }
      });

      updateSpeechControls(true);
      announceStatus("Reading the page aloud.");

      window.speechSynthesis.speak(currentSpeech);
    });

    stopReadingButton.addEventListener("click", () => {
      stopReading(true);
      readPageButton.focus();
    });

    window.addEventListener("pagehide", () => {
      stopReading(false);
    });
  } else {
    // Hide speech controls if the browser lacks speech synthesis.
    readPageButton?.setAttribute("hidden", "");
    stopReadingButton?.setAttribute("hidden", "");
  }
});