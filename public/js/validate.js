document.addEventListener('DOMContentLoaded', function() {
    // Admin form validation
    const adminForms = document.querySelectorAll('.admin-form form');
    
    adminForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            let isValid = true;
            const requiredFields = form.querySelectorAll('[required]');
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    field.style.border = '2px solid #e74c3c';
                    isValid = false;
                    
                    // Add error message if not exists
                    if (!field.nextElementSibling?.classList.contains('error-message')) {
                        const errorMsg = document.createElement('span');
                        errorMsg.className = 'error-message';
                        errorMsg.textContent = 'This field is required';
                        errorMsg.style.color = '#e74c3c';
                        errorMsg.style.fontSize = '0.8rem';
                        errorMsg.style.marginTop = '5px';
                        errorMsg.style.display = 'block';
                        field.parentNode.insertBefore(errorMsg, field.nextSibling);
                    }
                } else {
                    field.style.border = '';
                    if (field.nextElementSibling?.classList.contains('error-message')) {
                        field.nextElementSibling.remove();
                    }
                }
            });
            
            // Date validation
            const dateField = form.querySelector('input[type="date"]');
            if (dateField && new Date(dateField.value) < new Date()) {
                alert('Event date must be in the future');
                isValid = false;
            }
            
            if (!isValid) {
                e.preventDefault();
                window.scrollTo({
                    top: form.querySelector('[required]:invalid').offsetTop - 100,
                    behavior: 'smooth'
                });
            }
        });
    });
});