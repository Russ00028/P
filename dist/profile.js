// profile.js - COMPLETE WORKING VERSION WITH PASSWORD FIX
let currentUser = null;
let userProfile = null;

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Profile page initialized');
    initializeMenu();
    initializeProfile();
    setupEventListeners();
});

// ===== MENU FUNCTIONALITY =====
function initializeMenu() {
    const menuBtn = document.getElementById('menuBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');
    
    if (menuBtn && dropdownMenu) {
        menuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!menuBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownMenu.classList.remove('show');
            }
        });
        
        // Close menu when clicking menu items
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', function() {
                dropdownMenu.classList.remove('show');
            });
        });
        
        console.log('✅ Menu initialized successfully');
    }
}

// ===== PROFILE FUNCTIONALITY =====
function initializeProfile() {
    // Get user data from localStorage
    currentUser = localStorage.getItem('loggedInUser');
    userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    
    if (!currentUser) {
        showNotification('Please login first!', 'error');
        setTimeout(() => window.location.href = 'index.html', 2000);
        return;
    }
    
    loadProfileData();
    updateAvatar();
}

function setupEventListeners() {
    // Form submissions
    document.getElementById('personalForm').addEventListener('submit', handlePersonalUpdate);
    document.getElementById('securityForm').addEventListener('submit', handlePasswordChange);
    document.getElementById('preferencesForm').addEventListener('submit', handlePreferencesUpdate);
    
    // Real-time validation
    document.getElementById('profileBio').addEventListener('input', updateBioCharCount);
    document.getElementById('newPassword').addEventListener('input', validatePasswordStrength);
    document.getElementById('confirmPassword').addEventListener('input', validatePasswordMatch);
    
    // Password requirements
    setupPasswordValidation();
}

function setupPasswordValidation() {
    const newPassword = document.getElementById('newPassword');
    if (!newPassword) return;

    newPassword.addEventListener('input', function() {
        const password = this.value;
        const requirements = {
            length: document.getElementById('reqLength'),
            uppercase: document.getElementById('reqUppercase'),
            lowercase: document.getElementById('reqLowercase'),
            number: document.getElementById('reqNumber'),
            special: document.getElementById('reqSpecial')
        };

        // Check requirements
        const hasLength = password.length >= 8;
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        // Update requirement indicators
        if (requirements.length) requirements.length.className = hasLength ? 'valid' : 'invalid';
        if (requirements.uppercase) requirements.uppercase.className = hasUppercase ? 'valid' : 'invalid';
        if (requirements.lowercase) requirements.lowercase.className = hasLowercase ? 'valid' : 'invalid';
        if (requirements.number) requirements.number.className = hasNumber ? 'valid' : 'invalid';
        if (requirements.special) requirements.special.className = hasSpecial ? 'valid' : 'invalid';
    });
}

function loadProfileData() {
    console.log('📥 Loading profile data for:', currentUser);
    
    // Set default values if profile is empty
    if (!userProfile.fullName) userProfile.fullName = currentUser;
    if (!userProfile.email) userProfile.email = `${currentUser}@gmail.com`;
    if (!userProfile.department) userProfile.department = 'operations';
    if (!userProfile.role) userProfile.role = 'user';
    if (!userProfile.joinDate) userProfile.joinDate = new Date().toISOString();
    
    // Basic info
    document.getElementById('profileUsername').value = currentUser;
    document.getElementById('profileFullName').value = userProfile.fullName;
    document.getElementById('profileEmail').value = userProfile.email;
    document.getElementById('profilePhone').value = userProfile.phone || '';
    document.getElementById('profileDepartment').value = userProfile.department;
    document.getElementById('profilePosition').value = userProfile.position || '';
    document.getElementById('profileBio').value = userProfile.bio || '';

    // Header info
    document.getElementById('profileName').textContent = userProfile.fullName;
    document.getElementById('profileRoleDepartment').textContent = 
        `${getRoleDisplayName(userProfile.role)} - ${getDepartmentDisplayName(userProfile.department)}`;
    document.getElementById('memberSince').textContent = `Member since: ${formatDateForDisplay(userProfile.joinDate)}`;

    // Preferences
    document.getElementById('prefLanguage').value = userProfile.preferences?.language || 'en';
    document.getElementById('prefTimezone').value = userProfile.preferences?.timezone || 'utc-5';
    document.getElementById('prefDateFormat').value = userProfile.preferences?.dateFormat || 'mm/dd/yyyy';
    document.getElementById('prefNotifications').value = userProfile.preferences?.notifications || 'all';
    document.getElementById('prefAutoSave').checked = userProfile.preferences?.autoSave !== false;
    document.getElementById('prefEmailConfirm').checked = userProfile.preferences?.emailConfirm || false;
    document.getElementById('prefManagerNotify').checked = userProfile.preferences?.managerNotify !== false;

    updateBioCharCount();
}

function updateAvatar() {
    const avatar = document.getElementById('userAvatar');
    const fullName = userProfile.fullName || currentUser;
    avatar.textContent = getInitials(fullName);
}

function getInitials(name) {
    return name.split(' ')
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

function updateBioCharCount() {
    const bio = document.getElementById('profileBio');
    const countElement = document.getElementById('bioCharCount');
    const count = bio.value.length;
    countElement.textContent = count;
}

function validatePasswordStrength() {
    const password = document.getElementById('newPassword').value;
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');

    let strength = 0;
    let color = '#ff6b6b';

    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 20;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 20;

    strength = Math.min(strength, 100);

    if (strength >= 80) {
        color = '#27ae60';
        strengthText.textContent = 'Strong';
    } else if (strength >= 60) {
        color = '#f39c12';
        strengthText.textContent = 'Good';
    } else if (strength >= 40) {
        color = '#e67e22';
        strengthText.textContent = 'Fair';
    } else {
        strengthText.textContent = 'Weak';
    }

    strengthBar.style.width = strength + '%';
    strengthBar.style.background = color;
}

function validatePasswordMatch() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const matchElement = document.getElementById('passwordMatch');

    if (!confirmPassword) {
        matchElement.textContent = '';
        return;
    }

    if (newPassword === confirmPassword) {
        matchElement.textContent = '✓ Passwords match';
        matchElement.style.color = '#27ae60';
    } else {
        matchElement.textContent = '✗ Passwords do not match';
        matchElement.style.color = '#e74c3c';
    }
}

// ===== FORM HANDLERS =====
async function handlePersonalUpdate(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('.submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');

    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    submitBtn.disabled = true;

    try {
        if (!validatePersonalForm()) {
            throw new Error('Please fill in all required fields');
        }

        // Update user profile
        userProfile.fullName = document.getElementById('profileFullName').value.trim();
        userProfile.email = document.getElementById('profileEmail').value.trim();
        userProfile.phone = document.getElementById('profilePhone').value.trim();
        userProfile.department = document.getElementById('profileDepartment').value;
        userProfile.position = document.getElementById('profilePosition').value.trim();
        userProfile.bio = document.getElementById('profileBio').value.trim();

        // Save to localStorage
        localStorage.setItem('userProfile', JSON.stringify(userProfile));

        // Update UI
        updateAvatar();
        document.getElementById('profileName').textContent = userProfile.fullName;
        document.getElementById('profileRoleDepartment').textContent = 
            `${getRoleDisplayName(userProfile.role)} - ${getDepartmentDisplayName(userProfile.department)}`;

        showNotification('Profile updated successfully!', 'success');
        
    } catch (error) {
        console.error('❌ Profile update error:', error);
        showNotification(error.message, 'error');
    } finally {
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        submitBtn.disabled = false;
    }
}

async function handlePasswordChange(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('.submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');

    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    submitBtn.disabled = true;

    try {
        if (!validatePasswordForm()) {
            throw new Error('Please fix the password errors');
        }

        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Update password in users array (this is what login system uses)
        updateUserPassword(currentUser, currentPassword, newPassword);

        // Also update in userProfile for consistency
        userProfile.password = newPassword;
        localStorage.setItem('userProfile', JSON.stringify(userProfile));

        resetSecurityForm();
        showNotification('Password changed successfully!', 'success');
        
    } catch (error) {
        console.error('❌ Password change error:', error);
        showNotification(error.message, 'error');
    } finally {
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        submitBtn.disabled = false;
    }
}

// NEW FUNCTION: Update password in the users array
function updateUserPassword(username, currentPassword, newPassword) {
    try {
        // Get users array from localStorage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Find the current user
        const userIndex = users.findIndex(user => user.username === username);
        
        if (userIndex === -1) {
            throw new Error('User not found in system');
        }
        
        // Verify current password matches
        if (users[userIndex].password !== currentPassword) {
            throw new Error('Current password is incorrect');
        }
        
        // Update the password
        users[userIndex].password = newPassword;
        
        // Save back to localStorage
        localStorage.setItem('users', JSON.stringify(users));
        
        console.log('✅ Password updated in users array for:', username);
        return true;
        
    } catch (error) {
        console.error('❌ Error updating user password:', error);
        throw error;
    }
}

async function handlePreferencesUpdate(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('.submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');

    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    submitBtn.disabled = true;

    try {
        if (!userProfile.preferences) {
            userProfile.preferences = {};
        }

        userProfile.preferences.language = document.getElementById('prefLanguage').value;
        userProfile.preferences.timezone = document.getElementById('prefTimezone').value;
        userProfile.preferences.dateFormat = document.getElementById('prefDateFormat').value;
        userProfile.preferences.notifications = document.getElementById('prefNotifications').value;
        userProfile.preferences.autoSave = document.getElementById('prefAutoSave').checked;
        userProfile.preferences.emailConfirm = document.getElementById('prefEmailConfirm').checked;
        userProfile.preferences.managerNotify = document.getElementById('prefManagerNotify').checked;

        localStorage.setItem('userProfile', JSON.stringify(userProfile));
        showNotification('Preferences updated successfully!', 'success');
        
    } catch (error) {
        console.error('❌ Preferences update error:', error);
        showNotification('Error updating preferences', 'error');
    } finally {
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        submitBtn.disabled = false;
    }
}

// ===== VALIDATION FUNCTIONS =====
function validatePersonalForm() {
    const fullName = document.getElementById('profileFullName').value.trim();
    const email = document.getElementById('profileEmail').value.trim();
    const department = document.getElementById('profileDepartment').value;

    if (!fullName) {
        showNotification('Full name is required', 'error');
        return false;
    }

    if (!email) {
        showNotification('Email address is required', 'error');
        return false;
    }

    if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return false;
    }

    if (!department) {
        showNotification('Please select a department', 'error');
        return false;
    }

    return true;
}

function validatePasswordForm() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!currentPassword) {
        showNotification('Current password is required', 'error');
        return false;
    }

    // Note: We no longer check against userProfile.password here
    // The actual validation happens in updateUserPassword function

    if (newPassword.length < 8) {
        showNotification('New password must be at least 8 characters', 'error');
        return false;
    }

    if (newPassword !== confirmPassword) {
        showNotification('New passwords do not match', 'error');
        return false;
    }

    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
        showNotification('New password does not meet strength requirements', 'error');
        return false;
    }

    return true;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ===== UTILITY FUNCTIONS =====
function resetPersonalForm() {
    if (confirm('Are you sure you want to reset all changes?')) {
        loadProfileData();
        showNotification('Form reset to saved values', 'info');
    }
}

function resetSecurityForm() {
    document.getElementById('securityForm').reset();
    document.getElementById('passwordMatch').textContent = '';
    document.getElementById('strengthBar').style.width = '0%';
    document.getElementById('strengthText').textContent = 'None';
    
    const requirements = ['reqLength', 'reqUppercase', 'reqLowercase', 'reqNumber', 'reqSpecial'];
    requirements.forEach(req => {
        const element = document.getElementById(req);
        if (element) element.className = '';
    });
}

function resetPreferences() {
    if (confirm('Reset all preferences to default values?')) {
        document.getElementById('prefLanguage').value = 'en';
        document.getElementById('prefTimezone').value = 'utc-5';
        document.getElementById('prefDateFormat').value = 'mm/dd/yyyy';
        document.getElementById('prefNotifications').value = 'all';
        document.getElementById('prefAutoSave').checked = true;
        document.getElementById('prefEmailConfirm').checked = false;
        document.getElementById('prefManagerNotify').checked = true;
        showNotification('Preferences reset to defaults', 'info');
    }
}

function openTab(tabName) {
    const tabContents = document.getElementsByClassName('tab-content');
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].classList.remove('active');
    }

    const tabButtons = document.getElementsByClassName('tab-button');
    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].classList.remove('active');
    }

    document.getElementById(tabName).classList.add('active');
    event.currentTarget.classList.add('active');
}

function formatDateForDisplay(dateString) {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch {
        return dateString;
    }
}

function getRoleDisplayName(role) {
    const roles = {
        user: 'Regular User',
        admin: 'Administrator',
        approver: 'Leave Approver',
        manager: 'Department Manager'
    };
    return roles[role] || 'User';
}

function getDepartmentDisplayName(dept) {
    const departments = {
        engineering: 'Engineering',
        hr: 'Human Resources',
        finance: 'Finance',
        marketing: 'Marketing',
        sales: 'Sales',
        it: 'IT Support',
        operations: 'Operations'
    };
    return departments[dept] || dept;
}

function showNotification(message, type = 'info') {
    const resultElement = document.getElementById('result');
    resultElement.textContent = message;
    resultElement.className = `result-message ${type}`;
    resultElement.style.display = 'block';

    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            resultElement.style.display = 'none';
        }, 5000);
    }
}

// ===== NAVIGATION FUNCTIONS =====
function goToDashboard() {
    window.location.href = 'index.html';
}

function goToLeaveForm() {
    window.location.href = 'leaveform.html';
}

function goToAdmin() {
    window.location.href = 'admin.html';
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('loggedInUser');
        localStorage.removeItem('userProfile');
        window.location.href = 'index.html';
    }
}

console.log('✅ Profile management JavaScript loaded successfully');