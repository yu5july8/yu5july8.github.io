// Initialize EmailJS
emailjs.init('service_0gz5i1o');

// Form and status message references
const form = document.getElementById('emailForm');
const statusMessage = document.getElementById('statusMessage');

// Form submission handler
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
    }

    emailjs.sendForm('your_service_id', 'your_template_id', form)
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
