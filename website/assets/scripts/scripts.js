emailjs.init('feG2tqK-ZVbP0UPDQ');

const form = document.getElementById('emailForm');
const statusMessage = document.getElementById('statusMessage');

form.addEventListener('submit', (e) => {
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

document.addEventListener("DOMContentLoaded", () => {
    // Get modal elements
    const resumeModal = document.getElementById("resumeModal");
    const proposalModal = document.getElementById("proposalModal");
    const capstoneModal = document.getElementById("capstoneModal");

    // Get open buttons
    const resumeLink = document.getElementById("openResume");
    const proposalLink = document.getElementById("openProposal");
    const capstoneLink = document.getElementById("openCapstone");

    // Get close buttons
    const closeBtns = document.querySelectorAll(".close-btn");

    // Open modals
    resumeLink?.addEventListener("click", (e) => {
        e.preventDefault();
        resumeModal.style.display = "block";
    });

    proposalLink?.addEventListener("click", (e) => {
        e.preventDefault();
        proposalModal.style.display = "block";
    });

    capstoneLink?.addEventListener("click", (e) => {
        e.preventDefault();
        capstoneModal.style.display = "block";
    });

    // Close all modals
    closeBtns.forEach((btn) =>
        btn.addEventListener("click", () => {
            resumeModal.style.display = "none";
            proposalModal.style.display = "none";
            capstoneModal.style.display = "none";
        })
    );

    // Close on outside click
    window.addEventListener("click", (e) => {
        if (e.target === resumeModal) resumeModal.style.display = "none";
        if (e.target === proposalModal) proposalModal.style.display = "none";
        if (e.target === capstoneModal) capstoneModal.style.display = "none";
    });
});