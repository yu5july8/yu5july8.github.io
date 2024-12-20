// Initialize EmailJS with your user ID
emailjs.init('your_user_id'); // Replace 'your_user_id' with your EmailJS user ID

// Get references to the form and status message elements
const form = document.getElementById('emailForm');
const statusMessage = document.getElementById('statusMessage');

// Add an event listener for form submission
form.addEventListener('submit', (e) => {
    e.preventDefault(); // Prevent the default form submission behavior

    // Use EmailJS to send the form data
    emailjs.sendForm('your_service_id', 'your_template_id', form)
        .then(() => {
            statusMessage.textContent = "Email sent successfully!";
            statusMessage.style.color = "green";
            form.reset(); // Clear the form after a successful submission
        })
        .catch(() => {
            statusMessage.textContent = "Failed to send email. Please try again.";
            statusMessage.style.color = "red";
        });
});