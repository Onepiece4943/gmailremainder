document.addEventListener('DOMContentLoaded', function() {
    // Initialize EmailJS with your public key
    emailjs.init('koYeCLDpNj_kQccdj'); // Replace with your actual EmailJS public key
    
    // Initialize flatpickr for datetime input
    flatpickr("#reminder-time", {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
        minDate: "today",
        time_24hr: true,
        minuteIncrement: 1
    });
    
    const form = document.getElementById('reminder-form');
    const submitBtn = document.getElementById('submit-btn');
    const statusMessage = document.getElementById('status-message');
    const remindersList = document.getElementById('reminders-list');
    
    // Load saved reminders from localStorage
    loadReminders();
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const name = document.getElementById('name').value;
        const taskName = document.getElementById('task-name').value;
        const description = document.getElementById('description').value;
        const reminderTime = document.getElementById('reminder-time').value;
        const email = document.getElementById('email').value;
        
        // Validate reminder time is in the future
        const now = new Date();
        const reminderDate = new Date(reminderTime);
        
        if (reminderDate <= now) {
            showStatusMessage('Please select a future time for the reminder', 'error');
            return;
        }
        
        // Change button state to loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="btn-text">Setting Reminder...</span><i class="fas fa-spinner fa-spin"></i>';
        
        // Create reminder object
        const reminder = {
            id: Date.now().toString(),
            name: name,
            taskName: taskName,
            description: description,
            reminderTime: reminderTime,
            email: email,
            sent: false
        };
        
        // Save reminder to localStorage
        saveReminder(reminder);
        
        // Schedule the email
        scheduleReminder(reminder);
        
        // Show success message
        showStatusMessage('Reminder set successfully! You will receive an email at the specified time.', 'success');
        
        // Reset form
        form.reset();
        
        // Change button back to normal
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="btn-text">Set Reminder</span><i class="fas fa-bell"></i>';
        
        // Reload reminders list
        loadReminders();
    });
    
    // Function to save reminder to localStorage
    function saveReminder(reminder) {
        let reminders = JSON.parse(localStorage.getItem('reminders')) || [];
        reminders.push(reminder);
        localStorage.setItem('reminders', JSON.stringify(reminders));
    }
    
    // Function to load reminders from localStorage
    function loadReminders() {
        const reminders = JSON.parse(localStorage.getItem('reminders')) || [];
        remindersList.innerHTML = '';
        
        if (reminders.length === 0) {
            remindersList.innerHTML = '<p style="text-align: center; color: var(--gray-color);">No active reminders</p>';
            return;
        }
        
        reminders.forEach(reminder => {
            if (!reminder.sent) {
                const reminderItem = document.createElement('div');
                reminderItem.className = 'reminder-item';
                reminderItem.innerHTML = `
                    <div class="reminder-info">
                        <div class="reminder-task">${reminder.taskName}</div>
                        <div class="reminder-time">${formatDateTime(reminder.reminderTime)}</div>
                    </div>
                    <button class="delete-reminder" data-id="${reminder.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                `;
                remindersList.appendChild(reminderItem);
            }
        });
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-reminder').forEach(button => {
            button.addEventListener('click', function() {
                deleteReminder(this.getAttribute('data-id'));
            });
        });
    }
    
    // Function to delete a reminder
    function deleteReminder(id) {
        let reminders = JSON.parse(localStorage.getItem('reminders')) || [];
        reminders = reminders.filter(reminder => reminder.id !== id);
        localStorage.setItem('reminders', JSON.stringify(reminders));
        loadReminders();
    }
    
    // Function to schedule all reminders (run on page load)
    function scheduleAllReminders() {
        const reminders = JSON.parse(localStorage.getItem('reminders')) || [];
        reminders.forEach(reminder => {
            if (!reminder.sent) {
                scheduleReminder(reminder);
            }
        });
    }
    
    // Function to schedule a single reminder
    function scheduleReminder(reminder) {
        const now = new Date();
        const reminderTime = new Date(reminder.reminderTime);
        const timeUntilReminder = reminderTime - now;
        
        if (timeUntilReminder <= 0) {
            // If time has passed, mark as sent
            markReminderAsSent(reminder.id);
            return;
        }
        
        // Set timeout to send email
        setTimeout(() => {
            sendReminderEmail(reminder);
            markReminderAsSent(reminder.id);
            loadReminders();
        }, timeUntilReminder);
    }
    
    // Function to send reminder email
    function sendReminderEmail(reminder) {
        const templateParams = {
            name: reminder.name,
            task_name: reminder.taskName,
            description: reminder.description,
            email: reminder.email,
            reminder_time: formatDateTime(reminder.reminderTime)
        };
        
        emailjs.send('service_xutk4up', 'template_l276dxu', templateParams)
            .then(function(response) {
                console.log('Reminder email sent:', response.status, response.text);
            }, function(error) {
                console.log('Failed to send reminder email:', error);
            });
    }
    
    // Function to mark reminder as sent
    function markReminderAsSent(id) {
        let reminders = JSON.parse(localStorage.getItem('reminders')) || [];
        reminders = reminders.map(reminder => {
            if (reminder.id === id) {
                return { ...reminder, sent: true };
            }
            return reminder;
        });
        localStorage.setItem('reminders', JSON.stringify(reminders));
    }
    
    // Function to format datetime
    function formatDateTime(datetimeString) {
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(datetimeString).toLocaleDateString('en-US', options);
    }
    
    // Function to show status message
    function showStatusMessage(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${type}`;
        
        // Hide message after 5 seconds
        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 5000);
    }
    
    // Schedule all reminders on page load
    scheduleAllReminders();
});
