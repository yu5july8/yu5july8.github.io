// Initialize EmailJS
emailjs.init('user_abc123xyz'); // Replace with your actual user ID

// Form and status message references
const form = document.getElementById('emailForm');
const statusMessage = document.getElementById('statusMessage');

// Form submission handler
form.addEventListener('submit', (e) => {
    e.preventDefault(); // Prevent default form submission

    // Use EmailJS to send the form data
    emailjs.sendForm('service_xyz', 'template_abc', form) // Replace with actual IDs
        .then(() => {
            statusMessage.textContent = "Email sent successfully!";
            statusMessage.style.color = "green";
            form.reset(); // Clear form on success
        })
        .catch((error) => {
            console.error('EmailJS Error:', error); // Log error for debugging
            statusMessage.textContent = "Failed to send email. Please try again.";
            statusMessage.style.color = "red";
        });
});
