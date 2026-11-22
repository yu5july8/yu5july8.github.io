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
  // Dark mode, text enlargement, reading speed,
  // sentence navigation, and 10-word highlighting
  // ======================================================
  const darkModeButton = $("#dark-mode-toggle");
  const increaseTextButton = $("#increase-text");
  const resetTextButton = $("#reset-text");
  const readPageButton = $("#read-page");
  const stopReadingButton = $("#stop-reading");
  const previousSentenceButton = $("#previous-sentence");
  const nextSentenceButton = $("#next-sentence");
  const speechRateInput = $("#speech-rate");
  const speechRateValue = $("#speech-rate-value");
  const accessibilityStatus = $("#accessibility-status");
  const mainContent = $("#main");

  const textSizes = ["100%", "125%", "150%", "175%", "200%"];
  const wordsPerChunk = 10;

  let textSizeIndex = 0;
  let speechRate = 1;
  let speechSentences = [];
  let currentSentenceIndex = 0;
  let currentChunkIndex = 0;
  let currentSpeech = null;
  let speechRunId = 0;
  let isReading = false;

  const isJapanese =
    document.documentElement.lang.toLowerCase().startsWith("ja");

  const messages = isJapanese
    ? {
        increaseText: "文字を大きくする",
        maximumText: "最大の文字サイズです",
        textSize: size => `文字サイズを${size}に設定しました。`,
        darkModeOn: "ダークモードをオンにしました。",
        darkModeOff: "ダークモードをオフにしました。",
        rateChanged: rate => `読み上げ速度を${rate}倍に設定しました。`,
        readingStarted: "ページの読み上げを開始しました。",
        readingStopped: "読み上げを停止しました。",
        readingFinished: "ページの読み上げが終了しました。",
        previousSentence: "前の文を読み上げます。",
        nextSentence: "次の文を読み上げます。",
        firstSentence: "最初の文です。",
        lastSentence: "最後の文です。",
        noContent: "読み上げるコンテンツがありません。",
        speechError: "ページを読み上げることができませんでした。"
      }
    : {
        increaseText: "Increase text size",
        maximumText: "Maximum text size reached",
        textSize: size => `Text size set to ${size}.`,
        darkModeOn: "Dark mode enabled.",
        darkModeOff: "Dark mode disabled.",
        rateChanged: rate => `Reading speed set to ${rate} times.`,
        readingStarted: "Reading the page aloud.",
        readingStopped: "Reading stopped.",
        readingFinished: "Finished reading the page.",
        previousSentence: "Reading the previous sentence.",
        nextSentence: "Reading the next sentence.",
        firstSentence: "You are at the first sentence.",
        lastSentence: "You are at the last sentence.",
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
  // Dark mode
  // ------------------------------------------------------
  function applyDarkMode(enabled, announce = true) {
    document.documentElement.classList.toggle("dark-mode", enabled);

    if (darkModeButton) {
      darkModeButton.setAttribute("aria-checked", String(enabled));
    }

    try {
      localStorage.setItem("preferredDarkMode", String(enabled));
    } catch (error) {
      // Dark mode still works for the current page.
    }

    if (announce) {
      announceStatus(
        enabled ? messages.darkModeOn : messages.darkModeOff
      );
    }
  }

  let initialDarkMode = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

  try {
    const savedDarkMode = localStorage.getItem("preferredDarkMode");

    if (savedDarkMode !== null) {
      initialDarkMode = savedDarkMode === "true";
    }
  } catch (error) {
    // Use the operating-system preference.
  }

  applyDarkMode(initialDarkMode, false);

  darkModeButton?.addEventListener("click", () => {
    const enabled =
      darkModeButton.getAttribute("aria-checked") !== "true";

    applyDarkMode(enabled);
  });

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
  // Reading-speed control
  // ------------------------------------------------------
  try {
    const savedSpeechRate = Number.parseFloat(
      localStorage.getItem("preferredSpeechRate")
    );

    if (
      Number.isFinite(savedSpeechRate) &&
      savedSpeechRate >= 0.5 &&
      savedSpeechRate <= 2
    ) {
      speechRate = savedSpeechRate;
    }
  } catch (error) {
    // Use the default reading speed.
  }

  function displaySpeechRate() {
    if (speechRateInput) {
      speechRateInput.value = String(speechRate);
    }

    if (speechRateValue) {
      speechRateValue.value = `${speechRate}×`;
      speechRateValue.textContent = `${speechRate}×`;
    }
  }

  displaySpeechRate();

  speechRateInput?.addEventListener("input", () => {
    speechRate = Number.parseFloat(speechRateInput.value);
    displaySpeechRate();

    try {
      localStorage.setItem(
        "preferredSpeechRate",
        String(speechRate)
      );
    } catch (error) {
      // The selected rate still works for this page.
    }
  });

  speechRateInput?.addEventListener("change", () => {
    announceStatus(messages.rateChanged(speechRate));

    if (isReading) {
      restartCurrentChunk();
    }
  });

  // ------------------------------------------------------
  // Prepare words and sentences for highlighting
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
    if (
      !mainContent ||
      mainContent.dataset.speechPrepared === "true"
    ) {
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
        Array.from(segmenter.segment(text)).forEach(segment => {
          if (segment.isWordLike) {
            const word = document.createElement("span");
            word.className = "speech-word";
            word.textContent = segment.segment;
            fragment.appendChild(word);
            previousWord = word;
          } else if (previousWord) {
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
            fragment.appendChild(document.createTextNode(part));
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

  function createSentenceGroups(words) {
    const sentences = [];
    let sentenceWords = [];

    words.forEach(word => {
      sentenceWords.push(word);

      const text = word.textContent.trim();
      const endsSentence =
        /[.!?。！？]["'”’)\]]*$/.test(text);

      if (endsSentence) {
        sentences.push(sentenceWords);
        sentenceWords = [];
      }
    });

    if (sentenceWords.length) {
      sentences.push(sentenceWords);
    }

    return sentences.map(sentence => {
      const chunks = [];

      for (
        let index = 0;
        index < sentence.length;
        index += wordsPerChunk
      ) {
        chunks.push(
          sentence.slice(index, index + wordsPerChunk)
        );
      }

      return chunks;
    });
  }

  // ------------------------------------------------------
  // Highlight management
  // ------------------------------------------------------
  function clearSpeechHighlight() {
    if (!mainContent) return;

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
  // Text-to-speech controls
  // ------------------------------------------------------
  function updateSpeechControls() {
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

    if (previousSentenceButton) {
      previousSentenceButton.disabled =
        !isReading || currentSentenceIndex <= 0;
    }

    if (nextSentenceButton) {
      nextSentenceButton.disabled =
        !isReading ||
        currentSentenceIndex >= speechSentences.length - 1;
    }
  }

  function finishReading(message) {
    currentSpeech = null;
    speechSentences = [];
    currentSentenceIndex = 0;
    currentChunkIndex = 0;
    isReading = false;

    clearSpeechHighlight();
    updateSpeechControls();

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

  function speakCurrentChunk(runId) {
    if (runId !== speechRunId || !isReading) {
      return;
    }

    const sentence = speechSentences[currentSentenceIndex];

    if (!sentence) {
      finishReading(messages.readingFinished);
      return;
    }

    if (currentChunkIndex >= sentence.length) {
      currentSentenceIndex += 1;
      currentChunkIndex = 0;

      if (currentSentenceIndex >= speechSentences.length) {
        finishReading(messages.readingFinished);
        return;
      }

      updateSpeechControls();
      speakCurrentChunk(runId);
      return;
    }

    const chunk = sentence[currentChunkIndex];
    const chunkText = chunk
      .map(word => word.textContent)
      .join("")
      .trim();

    if (!chunkText) {
      currentChunkIndex += 1;
      speakCurrentChunk(runId);
      return;
    }

    highlightChunk(chunk);
    updateSpeechControls();

    currentSpeech = new SpeechSynthesisUtterance(chunkText);
    currentSpeech.lang =
      document.documentElement.lang || "en";
    currentSpeech.rate = speechRate;
    currentSpeech.pitch = 1;

    currentSpeech.addEventListener("end", () => {
      if (runId !== speechRunId || !isReading) return;

      currentChunkIndex += 1;
      speakCurrentChunk(runId);
    });

    currentSpeech.addEventListener("error", event => {
      if (runId !== speechRunId) return;

      if (event.error !== "canceled") {
        finishReading(messages.speechError);
      }
    });

    window.speechSynthesis.speak(currentSpeech);
  }

  function restartCurrentChunk() {
    if (!isReading) return;

    speechRunId += 1;
    window.speechSynthesis.cancel();

    const runId = speechRunId;
    window.setTimeout(() => speakCurrentChunk(runId), 50);
  }

  function moveToSentence(direction) {
    if (!isReading) return;

    const nextIndex = currentSentenceIndex + direction;

    if (nextIndex < 0) {
      announceStatus(messages.firstSentence);
      return;
    }

    if (nextIndex >= speechSentences.length) {
      announceStatus(messages.lastSentence);
      return;
    }

    speechRunId += 1;
    window.speechSynthesis.cancel();

    currentSentenceIndex = nextIndex;
    currentChunkIndex = 0;

    updateSpeechControls();
    announceStatus(
      direction < 0
        ? messages.previousSentence
        : messages.nextSentence
    );

    const runId = speechRunId;
    window.setTimeout(() => speakCurrentChunk(runId), 50);
  }

  if (
    "speechSynthesis" in window &&
    readPageButton &&
    stopReadingButton &&
    mainContent
  ) {
    updateSpeechControls();

    readPageButton.addEventListener("click", () => {
      stopReading(false);

      const words = getVisibleWords();

      if (!words.length) {
        announceStatus(messages.noContent);
        return;
      }

      speechSentences = createSentenceGroups(words);
      currentSentenceIndex = 0;
      currentChunkIndex = 0;
      isReading = true;

      const runId = ++speechRunId;

      updateSpeechControls();
      announceStatus(messages.readingStarted);
      speakCurrentChunk(runId);
    });

    previousSentenceButton?.addEventListener("click", () => {
      moveToSentence(-1);
    });

    nextSentenceButton?.addEventListener("click", () => {
      moveToSentence(1);
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
    previousSentenceButton?.setAttribute("hidden", "");
    nextSentenceButton?.setAttribute("hidden", "");
    speechRateInput?.setAttribute("disabled", "");
  }
});