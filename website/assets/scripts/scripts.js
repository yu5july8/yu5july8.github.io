

document.addEventListener("DOMContentLoaded", () => {

    // === Modal Elements ===
    const resumeModal = document.getElementById("resumeModal");
    const capstoneModal = document.getElementById("capstoneModal");
    const proposalModal = document.getElementById("proposalModal");

    const resumeLink = document.getElementById("openResume");
    const capstoneLink = document.getElementById("openCapstone");
    const proposalLink = document.getElementById("openProposal");
    const closeBtns = document.querySelectorAll(".close-btn");

    // === Open Modals ===
    resumeLink?.addEventListener("click", (e) => {
        e.preventDefault();
        resumeModal.style.display = "block";
    });

    capstoneLink?.addEventListener("click", (e) => {
        e.preventDefault();
        capstoneModal.style.display = "block";
    });

    proposalLink?.addEventListener("click", (e) => {
        e.preventDefault();
        proposalModal.style.display = "block";
    });

    // === Close Modals ===
    closeBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            [resumeModal, capstoneModal, proposalModal].forEach(modal => {
                if (modal) modal.style.display = "none";
            });
        });
    });

    // === Accordion grouped by year ===
    const accBtns = document.querySelectorAll(".accordion-btn");
    accBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            const expanded = btn.getAttribute("aria-expanded") === "true";
            btn.setAttribute("aria-expanded", !expanded);

            // Close other panels
            accBtns.forEach((otherBtn) => {
                if (otherBtn !== btn) {
                    otherBtn.classList.remove("active");
                    otherBtn.setAttribute("aria-expanded", "false");
                    const otherPanel = otherBtn.nextElementSibling;
                    if (otherPanel) otherPanel.style.display = "none";
                }
            });

            // Toggle current panel
            const panel = btn.nextElementSibling;
            if (panel) {
                if (panel.style.display === "block") {
                    panel.style.display = "none";
                    btn.classList.remove("active");
                } else {
                    panel.style.display = "block";
                    btn.classList.add("active");
                }
            }
        });
    });

    // === Close Modal when clicking outside ===
    window.addEventListener("click", (e) => {
        [resumeModal, capstoneModal, proposalModal].forEach((modal) => {
            if (e.target === modal) modal.style.display = "none";
        });
    });
});