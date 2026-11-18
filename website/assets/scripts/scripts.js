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
  // 6) ACCESSIBILITY TOOLS
  // Text enlargement and chunked read-aloud highlighting
  // ======================================================
  const increaseTextButton = $("#increase-text");
  const resetTextButton = $("#reset-text");
  const readPageButton = $("#read-page");
  const stopReadingButton = $("#stop-reading");
  const accessibilityStatus = $("#accessibility-status");
  const mainContent = $("#main");

  const textSizes = ["100%", "125%", "150%", "175%", "200%"];
  const wordsPerChunk = 10;

  let textSizeIndex = 0;
  let currentSpeech = null;
  let currentChunks = [];
  let currentChunkIndex = 0;
  let speechRunId = 0;

  const isJapanese =
    document.documentElement.lang.toLowerCase().startsWith("ja");

  const messages = isJapanese
    ? {
        increaseText: "文字を大きくする",
        maximumText: "最大の文字サイズです",
        textSize: size => `文字サイズを${size}に設定しました。`,
        readingStarted: "ページの読み上げを開始しました。",
        readingStopped: "読み上げを停止しました。",
        readingFinished: "ページの読み上げが終了しました。",
        noContent: "読み上げるコンテンツがありません。",
        speechError: "ページを読み上げることができませんでした。"
      }
    : {
        increaseText: "Increase text size",
        maximumText: "Maximum text size reached",
        textSize: size => `Text size set to ${size}.`,
        readingStarted: "Reading the page aloud.",
        readingStopped: "Reading stopped.",
        readingFinished: "Finished reading the page.",
        noContent: "No page content is available to read.",
        speechError: "The page could not be read aloud."
      };

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
          ? messages.maximumText
          : messages.increaseText
      );
    }

    try {
      localStorage.setItem(
        "preferredTextSizeIndex",
        String(textSizeIndex)
      );
    } catch (error) {
      // Text enlargement still works for the current page.
    }

    if (announce) {
      announceStatus(messages.textSize(size));
    }
  }

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
    // Use the default text size.
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
  // Prepare words for highlighting
  // ------------------------------------------------------
  function shouldSkipTextNode(node) {
    const parent = node.parentElement;

    if (!parent || !node.textContent.trim()) {
      return true;
    }

    return Boolean(
      parent.closest(
        [
          "script",
          "style",
          "noscript",
          "iframe",
          "embed",
          "button",
          "svg",
          "[hidden]",
          "[aria-hidden='true']",
          ".visually-hidden"
        ].join(",")
      )
    );
  }

  function wrapReadableText() {
    if (!mainContent || mainContent.dataset.speechPrepared === "true") {
      return;
    }

    const locale = document.documentElement.lang || "en";
    const segmenter =
      "Segmenter" in Intl
        ? new Intl.Segmenter(locale, { granularity: "word" })
        : null;

    const walker = document.createTreeWalker(
      mainContent,
      NodeFilter.SHOW_TEXT
    );

    const textNodes = [];

    while (walker.nextNode()) {
      if (!shouldSkipTextNode(walker.currentNode)) {
        textNodes.push(walker.currentNode);
      }
    }

    textNodes.forEach(node => {
      const text = node.textContent;
      const fragment = document.createDocumentFragment();
      let previousWord = null;

      if (segmenter) {
        const segments = Array.from(segmenter.segment(text));

        segments.forEach(segment => {
          if (segment.isWordLike) {
            const word = document.createElement("span");

            word.className = "speech-word";
            word.textContent = segment.segment;

            fragment.appendChild(word);
            previousWord = word;
          } else if (previousWord) {
            /*
             * Attach punctuation and spaces to the preceding
             * word so that speech retains natural punctuation.
             */
            previousWord.textContent += segment.segment;
          } else {
            fragment.appendChild(
              document.createTextNode(segment.segment)
            );
          }
        });
      } else {
        const parts = text.match(/\S+\s*|\s+/g) || [];

        parts.forEach(part => {
          if (/\S/.test(part)) {
            const word = document.createElement("span");

            word.className = "speech-word";
            word.textContent = part;

            fragment.appendChild(word);
          } else {
            fragment.appendChild(
              document.createTextNode(part)
            );
          }
        });
      }

      node.replaceWith(fragment);
    });

    mainContent.dataset.speechPrepared = "true";
  }

  function getVisibleWords() {
    wrapReadableText();

    return $$(".speech-word", mainContent).filter(word => {
      const style = window.getComputedStyle(word);

      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        word.getClientRects().length > 0
      );
    });
  }

  function createSpeechChunks(words) {
    const chunks = [];

    for (let index = 0; index < words.length; index += wordsPerChunk) {
      chunks.push(words.slice(index, index + wordsPerChunk));
    }

    return chunks;
  }

  // ------------------------------------------------------
  // Highlight management
  // ------------------------------------------------------
  function clearSpeechHighlight() {
    $$(".speech-highlight", mainContent).forEach(word => {
      word.classList.remove("speech-highlight");
    });
  }

  function highlightChunk(chunk) {
    clearSpeechHighlight();

    chunk.forEach(word => {
      word.classList.add("speech-highlight");
    });

    const firstWord = chunk[0];

    if (!firstWord) return;

    const rectangle = firstWord.getBoundingClientRect();
    const outsideViewport =
      rectangle.top < 80 ||
      rectangle.bottom > window.innerHeight - 40;

    if (outsideViewport) {
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      firstWord.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "center"
      });
    }
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

  function finishReading(message) {
    currentSpeech = null;
    currentChunks = [];
    currentChunkIndex = 0;

    clearSpeechHighlight();
    updateSpeechControls(false);

    if (message) {
      announceStatus(message);
    }
  }

  function stopReading(announce = true) {
    speechRunId += 1;

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    finishReading(
      announce ? messages.readingStopped : ""
    );
  }

  function speakNextChunk(runId) {
    if (runId !== speechRunId) {
      return;
    }

    if (currentChunkIndex >= currentChunks.length) {
      finishReading(messages.readingFinished);
      return;
    }

    const chunk = currentChunks[currentChunkIndex];
    const chunkText = chunk
      .map(word => word.textContent)
      .join("")
      .trim();

    if (!chunkText) {
      currentChunkIndex += 1;
      speakNextChunk(runId);
      return;
    }

    highlightChunk(chunk);

    currentSpeech = new SpeechSynthesisUtterance(chunkText);
    currentSpeech.lang =
      document.documentElement.lang || "en";
    currentSpeech.rate = 1;
    currentSpeech.pitch = 1;

    currentSpeech.addEventListener("end", () => {
      if (runId !== speechRunId) return;

      currentChunkIndex += 1;
      speakNextChunk(runId);
    });

    currentSpeech.addEventListener("error", event => {
      if (runId !== speechRunId) return;

      if (event.error !== "canceled") {
        finishReading(messages.speechError);
      }
    });

    window.speechSynthesis.speak(currentSpeech);
  }

  if (
    "speechSynthesis" in window &&
    readPageButton &&
    stopReadingButton &&
    mainContent
  ) {
    updateSpeechControls(false);

    readPageButton.addEventListener("click", () => {
      stopReading(false);

      const words = getVisibleWords();

      if (!words.length) {
        announceStatus(messages.noContent);
        return;
      }

      currentChunks = createSpeechChunks(words);
      currentChunkIndex = 0;

      const runId = ++speechRunId;

      updateSpeechControls(true);
      announceStatus(messages.readingStarted);
      speakNextChunk(runId);
    });

    stopReadingButton.addEventListener("click", () => {
      stopReading(true);
      readPageButton.focus();
    });

    window.addEventListener("pagehide", () => {
      stopReading(false);
    });
  } else {
    readPageButton?.setAttribute("hidden", "");
    stopReadingButton?.setAttribute("hidden", "");
  }
});