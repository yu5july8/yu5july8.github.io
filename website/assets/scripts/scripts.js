// === EmailJS Initialization ===
emailjs.init('feG2tqK-ZVbP0UPDQ');

// === Form Submission ===
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById('emailForm');
    const statusMessage = document.getElementById('statusMessage');

    form?.addEventListener('submit', (e) => {
        e.preventDefault();

        emailjs.sendForm("service_0gz5i1o", "template_8xlq9gz", form)
            .then(() => {
                statusMessage.textContent = "Email sent successfully!";
                statusMessage.style.color = "green";
                form.reset();
            })
            .catch((error) => {
                console.error('EmailJS Error:', error);
                statusMessage.textContent = "Failed to send email. Please try again.";
                statusMessage.style.color = "red";
            });
    });

    // === Modal Elements ===
    const resumeModal = document.getElementById("resumeModal");
    const capstoneModal = document.getElementById("capstoneModal");
    const proposalModal = document.getElementById("proposalModal");

    const resumeLink = document.getElementById("openResume");
    const capstoneLink = document.getElementById("openCapstone");
    const proposalLink = document.getElementById("openProposal");

    const closeBtns = document.querySelectorAll(".close-btn");

    // === Open Modal Handlers ===
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

    // === Close Modal (X button) ===
    closeBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            resumeModal.style.display = "none";
            capstoneModal.style.display = "none";
            proposalModal.style.display = "none";
        });
    });

    // === Close Modal on outside click ===
    window.addEventListener("click", (e) => {
        if (e.target === resumeModal) resumeModal.style.display = "none";
        if (e.target === capstoneModal) capstoneModal.style.display = "none";
        if (e.target === proposalModal) proposalModal.style.display = "none";
    });
});