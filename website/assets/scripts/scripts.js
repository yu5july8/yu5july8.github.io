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
