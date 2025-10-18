// Leave Form JavaScript - COMPLETE WORKING VERSION
let currentUser = null;
let userProfile = null;

// Initialize the form
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Leave form initialized');
    checkUserAccess();
    initializeForm();
    setupEventListeners();
    loadRecentRequests();
});

// Check if user is logged in
function checkUserAccess() {
    currentUser = localStorage.getItem('loggedInUser');
    userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    
    console.log('👤 Current user:', currentUser);
    console.log('📋 User profile:', userProfile);
    
    if (!currentUser) {
        showNotification('Please login first!', 'error');
        setTimeout(() => window.location.href = 'index.html', 2000);
        return;
    }
    
    // Auto-fill user data
    autoFillUserForm();
}

// Initialize form fields - UPDATED: Removed min date restrictions
function initializeForm() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('requestDate').value = formatDateForDisplay(today);
    
    // REMOVED: Minimum date restrictions to allow past dates
    // document.getElementById('startDate').min = today;
    // document.getElementById('endDate').min = today;
    
    console.log('📅 Form initialized with current date:', today);
}

// Set up event listeners
function setupEventListeners() {
    const form = document.getElementById('leaveForm');
    if (!form) {
        console.error('❌ Form not found!');
        return;
    }
    
    form.addEventListener('submit', handleFormSubmit);
    console.log('✅ Form submit listener added');
    
    // Date calculations
    document.getElementById('startDate').addEventListener('change', updateEndDateMin);
    document.getElementById('endDate').addEventListener('change', calculateDays);
    
    // Character count
    document.getElementById('reason').addEventListener('input', updateCharCount);
    
    // Leave type change
    document.getElementById('leaveType').addEventListener('change', handleLeaveTypeChange);
}

// Handle leave type change
function handleLeaveTypeChange() {
    const leaveType = document.getElementById('leaveType').value;
    console.log('📋 Leave type selected:', leaveType);
    updateReasonPlaceholder(leaveType);
}

// Update reason placeholder based on leave type
function updateReasonPlaceholder(leaveType) {
    const reasonField = document.getElementById('reason');
    const placeholders = {
        'Vacation': 'Please describe your vacation plans and destination...',
        'Sick': 'Please describe your symptoms and medical condition...',
        'Emergency': 'Please describe the emergency situation...',
        'Maternity': 'Please provide maternity details and expected dates...',
        'Paternity': 'Please provide paternity leave details...',
        'Bereavement': 'Please specify relationship to deceased and other details...',
        'Personal': 'Please describe the personal matter requiring leave...',
        'Other': 'Please provide detailed explanation for your leave request...'
    };
    
    reasonField.placeholder = placeholders[leaveType] || 'Please provide a detailed reason for your leave request...';
}

// Auto-fill form with user data
function autoFillUserForm() {
    console.log('⚡ Auto-filling form for user:', userProfile);
    
    const fullNameField = document.getElementById('fullName');
    const departmentField = document.getElementById('department');
    
    // Auto-fill full name
    if (userProfile.fullName) {
        fullNameField.value = userProfile.fullName;
        console.log('✅ Auto-filled full name:', userProfile.fullName);
    } else {
        console.log('❌ No full name found, using username');
        fullNameField.value = currentUser;
    }
    
    // Auto-fill department
    if (userProfile.department) {
        departmentField.value = userProfile.department;
        console.log('✅ Auto-filled department:', userProfile.department);
    }
}

// Update end date minimum - UPDATED: Allow past dates but maintain logical consistency
function updateEndDateMin() {
    const startDate = document.getElementById('startDate').value;
    if (startDate) {
        document.getElementById('endDate').min = startDate;
        calculateDays();
    }
}

// Calculate number of days - UPDATED: Enhanced for past date calculations
function calculateDays() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (start <= end) {
            const timeDiff = end.getTime() - start.getTime();
            const dayCount = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;
            
            document.getElementById('daysCount').value = dayCount;
            
            // UPDATED: Show date range with past date indicators
            const today = new Date();
            const isPastLeave = end < today;
            const pastIndicator = isPastLeave ? ' (Past Leave)' : '';
            document.getElementById('daysHint').textContent = `${formatDateForDisplay(startDate)} to ${formatDateForDisplay(endDate)}${pastIndicator}`;
            
            // UPDATED: Add visual indicator for past leaves
            const daysHint = document.getElementById('daysHint');
            if (isPastLeave) {
                daysHint.style.color = '#e74c3c';
                daysHint.style.fontWeight = 'bold';
            } else {
                daysHint.style.color = '';
                daysHint.style.fontWeight = '';
            }
        } else {
            document.getElementById('daysCount').value = '';
            document.getElementById('daysHint').textContent = 'End date must be after start date';
            document.getElementById('daysHint').style.color = '#e74c3c';
        }
    }
}

// Update character count
function updateCharCount() {
    const reason = document.getElementById('reason').value;
    document.getElementById('charCount').textContent = reason.length;
}

// MAIN FORM SUBMISSION HANDLER - UPDATED: Enhanced validation for past dates
async function handleFormSubmit(e) {
    e.preventDefault();
    console.log('📨 Form submission started');
    
    const submitBtn = document.getElementById('submitBtn');
    const result = document.getElementById('result');
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="btn-loading">⏳ Processing...</span>';
    result.textContent = '';
    
    try {
        // Validate form first
        if (!validateForm()) {
            throw new Error('Please fix the form errors before submitting');
        }
        
        // UPDATED: Check for future dates and show confirmation for past dates
        const startDate = new Date(document.getElementById('startDate').value);
        const endDate = new Date(document.getElementById('endDate').value);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time part for accurate comparison
        
        const isPastLeave = endDate < today;
        
        if (isPastLeave) {
            const confirmSubmission = confirm(
                '⚠️ You are submitting a leave request for past dates.\n\n' +
                'This is considered a retroactive leave application.\n\n' +
                'Are you sure you want to proceed?'
            );
            
            if (!confirmSubmission) {
                throw new Error('Submission cancelled for past dates');
            }
        }
        
        // Get form data
        const formData = getFormData();
        console.log('📝 Form data collected:', formData);
        
        // Save leave request
        await saveLeaveRequest(formData);
        
        // Success!
        const successMessage = isPastLeave 
            ? `✅ Retroactive ${formData.leaveType} Leave submitted for ${formData.days} day(s)!` 
            : `✅ ${formData.leaveType} Leave request submitted for ${formData.days} day(s)!`;
        
        showNotification(successMessage, 'success');
        
        // Reset form and reload recent requests
        resetForm();
        loadRecentRequests();
        
    } catch (error) {
        console.error('💥 Form submission error:', error);
        showNotification('❌ ' + error.message, 'error');
    } finally {
        // Restore button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="btn-text">📨 Submit Request</span>';
    }
}

// Get form data
function getFormData() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    const dayCount = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;
    
    // UPDATED: Add retroactive flag for past leaves
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isRetroactive = end < today;
    
    return {
        fullName: document.getElementById('fullName').value.trim(),
        department: document.getElementById('department').value,
        leaveType: document.getElementById('leaveType').value,
        requestDate: new Date().toISOString().split('T')[0],
        startDate: startDate,
        endDate: endDate,
        reason: document.getElementById('reason').value.trim(),
        days: dayCount,
        createdAt: new Date().toISOString(),
        status: 'pending',
        user: currentUser,
        requestId: 'REQ_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        isRetroactive: isRetroactive // NEW: Flag for retroactive leaves
    };
}

// Validate form - UPDATED: Removed future date restrictions
function validateForm() {
    let isValid = true;
    
    // Clear previous errors
    clearErrors();
    
    const fullName = document.getElementById('fullName').value.trim();
    const department = document.getElementById('department').value;
    const leaveType = document.getElementById('leaveType').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const reason = document.getElementById('reason').value.trim();
    
    // Validate full name
    if (!fullName) {
        showError('fullNameError', 'Full name is required');
        isValid = false;
    }
    
    // Validate department
    if (!department) {
        showError('departmentError', 'Please select a department');
        isValid = false;
    }
    
    // Validate leave type
    if (!leaveType) {
        showError('leaveTypeError', 'Please select a leave type');
        isValid = false;
    }
    
    // Validate dates - UPDATED: Allow past dates, only check logical consistency
    if (!startDate) {
        showError('startDateError', 'Start date is required');
        isValid = false;
    }
    
    if (!endDate) {
        showError('endDateError', 'End date is required');
        isValid = false;
    }
    
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        showError('endDateError', 'End date cannot be before start date');
        isValid = false;
    }
    
    // Validate reason
    if (!reason) {
        showError('reasonError', 'Reason for leave is required');
        isValid = false;
    } else if (reason.length < 10) {
        showError('reasonError', 'Please provide a detailed reason (at least 10 characters)');
        isValid = false;
    }
    
    return isValid;
}

// Clear all error messages
function clearErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(element => {
        element.textContent = '';
    });
}

// Show error message
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
    }
}

// Save leave request
async function saveLeaveRequest(request) {
    console.log('💾 Saving leave request...');
    
    // Save to localStorage
    saveToLocalStorage(request);
    
    // Try to save to Firebase if available
    if (window.firebaseDb && window.firebaseDbFns && window.firebaseDbFns.addDoc) {
        try {
            console.log('🔥 Attempting to save to Firebase...');
            const col = window.firebaseDbFns.collection(window.firebaseDb, 'leaveRequests');
            await window.firebaseDbFns.addDoc(col, { 
                ...request, 
                serverTs: window.firebaseDbFns.serverTimestamp ? window.firebaseDbFns.serverTimestamp() : new Date()
            });
            console.log('✅ Successfully saved to Firebase');
        } catch (err) {
            console.error('❌ Failed to save to Firestore:', err);
            // Continue with local storage only
        }
    } else {
        console.log('📱 Firebase not available, using localStorage only');
    }
    
    return true;
}

// Save to localStorage
function saveToLocalStorage(request) {
    try {
        const existing = JSON.parse(localStorage.getItem('leaveRequests') || '[]');
        existing.push(request);
        localStorage.setItem('leaveRequests', JSON.stringify(existing));
        console.log('💾 Saved to localStorage. Total requests:', existing.length);
        return true;
    } catch (error) {
        console.error('❌ Error saving to localStorage:', error);
        throw new Error('Failed to save leave request');
    }
}

// Reset form - UPDATED: Remove min date restrictions
function resetForm() {
    document.getElementById('leaveForm').reset();
    
    // Reset specific fields
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('requestDate').value = formatDateForDisplay(today);
    document.getElementById('daysCount').value = '';
    document.getElementById('daysHint').textContent = '';
    document.getElementById('daysHint').style.color = '';
    document.getElementById('charCount').textContent = '0';
    
    // Re-fill user data
    autoFillUserForm();
    
    console.log('🔄 Form reset successfully');
}

// Load recent requests
function loadRecentRequests() {
    if (!currentUser) return;
    
    try {
        const allRequests = JSON.parse(localStorage.getItem('leaveRequests') || '[]');
        const userRequests = allRequests
            .filter(req => req.user === currentUser)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);
        
        const container = document.getElementById('recentRequests');
        const list = document.getElementById('requestsList');
        
        if (userRequests.length === 0) {
            container.style.display = 'none';
            return;
        }
        
        container.style.display = 'block';
        list.innerHTML = userRequests.map(request => {
            const isRetroactive = request.isRetroactive;
            const retroactiveBadge = isRetroactive ? '<span class="retroactive-badge">⏪ Retroactive</span>' : '';
            
            return `
            <div class="request-item ${request.status} leave-type-${request.leaveType?.toLowerCase() || 'other'} ${isRetroactive ? 'retroactive' : ''}">
                <div class="request-info">
                    <h4>
                        ${request.department} - ${request.leaveType || 'Leave'} 
                        <span class="leave-type-badge badge-${request.leaveType?.toLowerCase() || 'other'}">
                            ${request.leaveType || 'Leave'}
                        </span>
                        ${retroactiveBadge}
                    </h4>
                    <div class="request-dates">
                        ${formatDateForDisplay(request.startDate)} to ${formatDateForDisplay(request.endDate)} - ${request.days} day(s)
                    </div>
                    <div class="request-reason">${truncateText(request.reason, 60)}</div>
                </div>
                <div class="request-status status-${request.status}">
                    ${request.status.toUpperCase()}
                </div>
            </div>
        `}).join('');
        
        console.log('📊 Loaded recent requests:', userRequests.length);
    } catch (error) {
        console.error('❌ Error loading recent requests:', error);
    }
}

// Fill test data - UPDATED: Can now include past dates
function fillTestData() {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    
    const testData = {
        fullName: userProfile.fullName || currentUser,
        department: userProfile.department || 'Operation',
        leaveType: 'Vacation',
        startDate: lastWeek.toISOString().split('T')[0],
        endDate: new Date(lastWeek.getTime() + (2 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0], // +2 days
        reason: 'Family vacation to the beach last week. Need to file retroactive leave.'
    };
    
    document.getElementById('fullName').value = testData.fullName;
    document.getElementById('department').value = testData.department;
    document.getElementById('leaveType').value = testData.leaveType;
    document.getElementById('startDate').value = testData.startDate;
    document.getElementById('endDate').value = testData.endDate;
    document.getElementById('reason').value = testData.reason;
    
    // Trigger calculations
    calculateDays();
    updateCharCount();
    updateReasonPlaceholder(testData.leaveType);
    
    console.log('🧪 Test data filled with past dates');
    showNotification('Test data filled with past dates. You can now submit the form.', 'info');
}

// Utility function to get next Monday
function getNextMonday() {
    const today = new Date();
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + (1 + 7 - today.getDay()) % 7);
    return nextMonday.toISOString().split('T')[0];
}

// Utility function to get next Friday
function getNextFriday() {
    const today = new Date();
    const nextFriday = new Date(today);
    nextFriday.setDate(today.getDate() + (5 + 7 - today.getDay()) % 7);
    return nextFriday.toISOString().split('T')[0];
}

// Show notification
function showNotification(message, type = 'info') {
    const resultElement = document.getElementById('result');
    if (resultElement) {
        resultElement.textContent = message;
        resultElement.className = `result-message ${type}`;
        resultElement.style.display = 'block';
        
        if (type === 'success') {
            setTimeout(() => {
                resultElement.style.display = 'none';
            }, 5000);
        }
    }
}

// Utility functions
function formatDateForDisplay(dateString) {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch {
        return dateString;
    }
}

function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length <= maxLength ? text : text.substring(0, maxLength) + '...';
}

// Clear form function
function clearForm() {
    if (confirm('Are you sure you want to clear the form?')) {
        resetForm();
        clearErrors();
        showNotification('Form cleared successfully', 'info');
    }
}

// NAVIGATION FUNCTIONS
function goToAdmin() {
    console.log('📊 Navigating to Leave Panel...');
    window.location.href = 'admin.html';
}

function goToDashboard() {
    console.log('🏠 Navigating to Dashboard...');
    window.location.href = 'index.html';
}

function goToLeaveForm() {
    console.log('📝 Already on Leave Form');
    // Already on this page
}

function goToSchedule() {
    console.log('📅 Navigating to Schedule...');
    window.location.href = 'sched.html';
}

function viewProfile() {
    console.log('👤 Navigating to Profile...');
    window.location.href = 'profile.html';
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        console.log('🚪 Logging out...');
        localStorage.removeItem('loggedInUser');
        localStorage.removeItem('userProfile');
        window.location.href = 'index.html';
    }
}

// MENU FUNCTIONALITY
let menuOpen = false;

function toggleMenu() {
    const dropdownMenu = document.getElementById('dropdownMenu');
    const overlay = document.getElementById('overlay');
    
    menuOpen = !menuOpen;
    
    if (menuOpen) {
        dropdownMenu.classList.add('show');
        if (overlay) overlay.classList.add('active');
    } else {
        dropdownMenu.classList.remove('show');
        if (overlay) overlay.classList.remove('active');
    }
}

function setupMenuClose() {
    let overlay = document.getElementById('overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'overlay';
        overlay.className = 'overlay';
        overlay.addEventListener('click', closeMenu);
        document.body.appendChild(overlay);
    }
}

function closeMenu() {
    const dropdownMenu = document.getElementById('dropdownMenu');
    const overlay = document.getElementById('overlay');
    
    menuOpen = false;
    if (dropdownMenu) dropdownMenu.classList.remove('show');
    if (overlay) overlay.classList.remove('active');
}

// Initialize menu close functionality
document.addEventListener('DOMContentLoaded', function() {
    setupMenuClose();
    
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            setTimeout(closeMenu, 300);
        });
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && menuOpen) {
            closeMenu();
        }
    });
});

console.log('✅ Leave form JavaScript loaded successfully - NOW WITH PAST DATE SUPPORT');