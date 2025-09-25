// Initialize EmailJS
emailjs.init('feG2tqK-ZVbP0UPDQ');

// Form and status message references
const form = document.getElementById('emailForm');
const statusMessage = document.getElementById('statusMessage');

// Form submission handler
form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Use sendForm to pass form data directly
    emailjs.sendForm("service_0gz5i1o", "template_8xlq9gz", emailForm)
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

    // Get open buttons
    const resumeLink = document.getElementById("resumeLink");
    const proposalLink = document.getElementById("proposalLink");

    // Get close buttons
    const closeBtns = document.querySelectorAll(".close-btn");

    // Open Resume Modal
    resumeLink.addEventListener("click", (e) => {
        e.preventDefault();
        resumeModal.style.display = "block";
    });

    // Open Proposal Modal
    proposalLink.addEventListener("click", (e) => {
        e.preventDefault();
        proposalModal.style.display = "block";
    });

    // Close Modals
    closeBtns.forEach((btn) =>
        btn.addEventListener("click", () => {
            resumeModal.style.display = "none";
            proposalModal.style.display = "none";
            capstoneModal.style.display = "none";
        })
    );

    // Close modal on outside click
    window.addEventListener("click", (e) => {
        if (e.target === resumeModal) {
            resumeModal.style.display = "none";
        }
        if (e.target === proposalModal) {
            proposalModal.style.display = "none";
        }
        if (e.target === captionModal) {
            captionModal.style.display = "none";
        }
    });
});
