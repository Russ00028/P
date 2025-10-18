// Fixed Registration Form JavaScript - WITH PASSWORD SAVING
let allUsers = [];
let currentAdmin = null;

// Initialize the registration form
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Registration form initialized');
    checkAdminAccess();
    loadExistingUsers();
    setupEventListeners();
    initializeRoleSelection();
    setupPasswordToggle(); // Add password toggle
});

// Check if user has admin access
function checkAdminAccess() {
    currentAdmin = localStorage.getItem('loggedInUser');
    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    
    if (!currentAdmin || userProfile.role !== 'admin') {
        showResult('❌ Access denied. Admin privileges required.', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
        return;
    }
    
    console.log('👑 Admin access verified:', currentAdmin);
}

// Load existing users
async function loadExistingUsers() {
    console.log('📥 Loading existing users...');
    
    // Load from localStorage
    const localProfiles = JSON.parse(localStorage.getItem('localProfiles') || '{}');
    allUsers = Object.values(localProfiles);
    
    // Try to load from Firebase
    if (window.firebaseDb && window.firebaseDbFns) {
        try {
            const usersCol = window.firebaseDbFns.collection(window.firebaseDb, 'users');
            const snapshot = await window.firebaseDbFns.getDocs(usersCol);
            
            snapshot.forEach(doc => {
                const userData = doc.data();
                userData.id = doc.id;
                
                if (!allUsers.some(user => user.username === userData.username)) {
                    allUsers.push(userData);
                }
            });
            
            console.log('✅ Loaded users from Firebase:', snapshot.size);
        } catch (error) {
            console.error('❌ Error loading from Firebase:', error);
        }
    }
    
    console.log('📊 Total users loaded:', allUsers.length);
}

// Set up event listeners
function setupEventListeners() {
    // Form submission
    document.getElementById('registerForm').addEventListener('submit', handleRegistration);
    
    // Date validation
    const hiredDate = document.getElementById('regHired');
    const today = new Date().toISOString().split('T')[0];
    hiredDate.max = today;
}

// Add password toggle function
function setupPasswordToggle() {
    const passwordInput = document.getElementById('regPassword');
    const passwordToggle = document.getElementById('passwordToggle');
    
    if (passwordInput && passwordToggle) {
        passwordToggle.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Toggle eye icon
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            }
        });
    }
}

// Enhanced registration handler with proper error handling
async function handleRegistration(e) {
    e.preventDefault();
    console.log('📝 Registration form submitted');
    
    const submitBtn = document.querySelector('button[type="submit"]');
    const result = document.getElementById('regResult');
    
    // Show loading state
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Creating...';
    submitBtn.disabled = true;
    result.textContent = '';
    
    try {
        // Get form values
        const username = document.getElementById('regUsername').value.trim();
        const name = document.getElementById('regName').value.trim();
        const department = document.getElementById('regDepartment').value;
        const hired = document.getElementById('regHired').value;
        const email = document.getElementById('regEmail').value.trim();
        const password =
          document.getElementById('regPassword')?.value ||
          document.getElementById('password')?.value ||
          document.querySelector('input[type="password"]')?.value || '';

        if (!password) {
          console.warn('Register: no password found from form inputs');
        }

        // Basic validation
        if (!username || !name || !department || !hired || !email || !password) {
            throw new Error('All fields are required');
        }

        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }

        // Normalize username for case-insensitive checks
        const usernameLower = username.toLowerCase();

        // Check username uniqueness in Firestore if available (case-insensitive)
        if (window.firebaseDb && window.firebaseDbFns && window.firebaseDbFns.getDocs && window.firebaseDbFns.query && window.firebaseDbFns.where) {
            try {
                const usersCol = window.firebaseDbFns.collection(window.firebaseDb, 'users');
                const q = window.firebaseDbFns.query(usersCol, window.firebaseDbFns.where('usernameLower', '==', usernameLower));
                const snap = await window.firebaseDbFns.getDocs(q);
                if (snap.size > 0) {
                    throw new Error('Username already taken.');
                }
                
                // Create Auth user (client-side). Note: createUserWithEmailAndPassword signs in the new user,
                // so we'll immediately send a reset email and sign out to preserve admin session.
                if (window.firebaseAuth && window.firebaseAuthFns && window.firebaseAuthFns.createUserWithEmailAndPassword) {
                    const userCred = await window.firebaseAuthFns.createUserWithEmailAndPassword(window.firebaseAuth, email, password);
                    const uid = userCred.user.uid;

                    // Save user profile to Firestore (do NOT store the password)
                    await window.firebaseDbFns.addDoc(usersCol, {
                        uid: uid,
                        username,
                        usernameLower,
                        fullName: name,
                        department,
                        dateHired: hired,
                        email,
                        role: (document.getElementById('regRole')?.value || 'user'),
                        registeredBy: currentAdmin,
                        registeredAt: new Date().toISOString(),
                        createdAt: window.firebaseDbFns.serverTimestamp ? window.firebaseDbFns.serverTimestamp() : new Date().toISOString()
                    });

                    // Send password-reset email so the user sets their own password securely
                    try {
                        await window.firebaseAuthFns.sendPasswordResetEmail(window.firebaseAuth, email);
                        result.textContent = '✅ User created. Password setup email sent.';
                    } catch (sendErr) {
                        console.warn('Password reset email failed:', sendErr);
                        result.textContent = '✅ User created. (Failed to send reset email automatically.)';
                    }

                    // Sign out the newly created user (so admin session isn't lost)
                    try {
                        await window.firebaseAuthFns.signOut(window.firebaseAuth);
                    } catch (soErr) {
                        console.warn('Sign-out after create failed:', soErr);
                    }

                    result.style.color = 'green';
                    document.getElementById('registerForm').reset();
                    loadExistingUsers();
                    return;
                }
            } catch (err) {
                console.error('Firebase register flow failed', err);
                throw new Error('Firebase register failed: ' + (err.message || err));
            }
        }

        // Local fallback: store users in localStorage under 'localProfiles' keyed by username
        const profiles = JSON.parse(localStorage.getItem('localProfiles') || '{}');
        
        // Check localProfiles using case-insensitive key match
        const localExists = Object.keys(profiles).some(k => k.toLowerCase() === usernameLower);
        if (localExists) {
            throw new Error('Username already taken locally.');
        }
        
        // Get role if available
        const roleSelect = document.getElementById('regRole');
        const role = roleSelect ? roleSelect.value : 'user';
        
        // FIXED: Save user data WITH PASSWORD
        profiles[username] = { 
            username, 
            fullName: name,
            department, 
            dateHired: hired, 
            email,
            password: password, // ← ADDED PASSWORD HERE
            role: role,
            registeredBy: currentAdmin,
            registeredAt: new Date().toISOString()
        };
        
        localStorage.setItem('localProfiles', JSON.stringify(profiles));
        
        // ALSO update the main users array for login system
        updateUsersArray(username, password, name, email, department, role);
        
        result.textContent = '✅ User created locally with password saved.';
        result.style.color = 'green';
        
        // Clear form
        document.getElementById('registerForm').reset();
        
        // Reload users
        loadExistingUsers();

    } catch (error) {
        console.error('💥 Registration error:', error);
        result.textContent = '❌ ' + error.message;
        result.style.color = 'red';
    } finally {
        // Restore button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// NEW FUNCTION: Update users array for login compatibility
function updateUsersArray(username, password, name, email, department, role) {
    try {
        let users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Check if user already exists
        const existingUserIndex = users.findIndex(user => user.username === username);
        
        if (existingUserIndex !== -1) {
            // Update existing user
            users[existingUserIndex] = {
                username,
                password,
                fullName: name,
                email,
                department,
                role,
                lastUpdated: new Date().toISOString()
            };
        } else {
            // Add new user
            users.push({
                username,
                password,
                fullName: name,
                email,
                department,
                role,
                createdAt: new Date().toISOString()
            });
        }
        
        localStorage.setItem('users', JSON.stringify(users));
        console.log('✅ User added to users array for login:', username);
        
    } catch (error) {
        console.error('❌ Error updating users array:', error);
    }
}

// Show result message
function showResult(message, type = 'info') {
    const resultElement = document.getElementById('regResult');
    if (resultElement) {
        resultElement.textContent = message;
        resultElement.style.color = type === 'error' ? 'red' : 'green';
    }
}

// Fill test data
function fillTestData() {
    const testUsers = [
        {
            username: 'testuser' + Date.now().toString().slice(-4),
            fullName: 'Test User',
            department: 'Operation',
            email: 'test.user' + Date.now().toString().slice(-4) + '@company.com',
            password: 'Test123!'
        }
    ];
    
    const randomUser = testUsers[0];
    
    document.getElementById('regUsername').value = randomUser.username;
    document.getElementById('regName').value = randomUser.fullName;
    document.getElementById('regDepartment').value = randomUser.department;
    document.getElementById('regEmail').value = randomUser.email;
    document.getElementById('regPassword').value = randomUser.password;
    document.getElementById('regHired').value = '2024-01-15';
    
    // Set role if exists
    const roleSelect = document.getElementById('regRole');
    if (roleSelect) {
        roleSelect.value = 'user';
    }
    
    console.log('🧪 Test data filled:', randomUser.username);
    showResult('Test data filled. Click "Register" to create account.', 'info');
}

// Navigation functions
function goToLeaveForm() {
    window.location.href = 'leaveform.html';
}

function goToDashboard() {
    window.location.href = 'index.html';
}

function goToAdmin() {
    window.location.href = 'admin.html';
}

function goToSchedule() {
    window.location.href = 'sched.html';
}

function viewProfile() {
    window.location.href = 'profile.html';
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('loggedInUser');
        localStorage.removeItem('userProfile');
        window.location.href = 'index.html';
    }
}

// Role Management JavaScript
function initializeRoleSelection() {
    const roleSelect = document.getElementById('regRole');
    const roleDescription = document.getElementById('roleDescription');
    
    if (roleSelect && roleDescription) {
        // Set initial description
        updateRoleDescription(roleSelect.value, roleDescription);
        
        // Add event listener for role changes
        roleSelect.addEventListener('change', function() {
            updateRoleDescription(this.value, roleDescription);
        });
        
        console.log('✅ Role selection initialized');
    }
}

function updateRoleDescription(role, descriptionElement) {
    const descriptions = {
        user: {
            text: 'Can submit leave requests and view own schedule',
            permissions: [
                'Submit leave requests',
                'View personal schedule',
                'View own request history'
            ]
        },
        admin: {
            text: 'Full system access and control',
            permissions: [
                'Submit leave requests',
                'Edit all user data',
                'Manage system settings',
                'View all requests and schedules',
                'Approve/reject leave requests',
                'Generate reports'
            ]
        },
        approver: {
            text: 'Can submit requests and approve leaves',
            permissions: [
                'Submit own leave requests',
                'Approve/reject leave requests',
                'View team schedules',
                'View department leave calendar'
            ]
        },
        manager: {
            text: 'Full department management access',
            permissions: [
                'Submit leave requests',
                'Edit department user data',
                'Approve/reject department leaves',
                'View department schedules',
                'Manage team allocations',
                'Generate department reports'
            ]
        }
    };
    
    const roleInfo = descriptions[role] || descriptions.user;
    
    // Update the description text
    descriptionElement.textContent = roleInfo.text;
    
    // Create detailed permissions list (optional enhancement)
    showDetailedPermissions(descriptionElement, roleInfo.permissions);
}

function showDetailedPermissions(container, permissions) {
    // Clear any existing detailed permissions
    const existingDetails = container.nextElementSibling;
    if (existingDetails && existingDetails.classList.contains('permissions-details')) {
        existingDetails.remove();
    }
    
    // Create detailed permissions element
    const permissionsDetails = document.createElement('div');
    permissionsDetails.className = 'permissions-details';
    permissionsDetails.style.cssText = `
        margin-top: 8px;
        padding: 10px;
        background: rgba(109, 214, 255, 0.1);
        border-radius: 6px;
        border-left: 3px solid var(--neon-blue);
        font-size: 12px;
    `;
    
    const permissionsTitle = document.createElement('div');
    permissionsTitle.textContent = 'Permissions:';
    permissionsTitle.style.cssText = `
        font-weight: 600;
        color: var(--neon-blue);
        margin-bottom: 5px;
    `;
    
    const permissionsList = document.createElement('ul');
    permissionsList.style.cssText = `
        margin: 0;
        padding-left: 15px;
        color: var(--text-secondary);
    `;
    
    permissions.forEach(permission => {
        const listItem = document.createElement('li');
        listItem.textContent = permission;
        listItem.style.marginBottom = '2px';
        permissionsList.appendChild(listItem);
    });
    
    permissionsDetails.appendChild(permissionsTitle);
    permissionsDetails.appendChild(permissionsList);
    
    // Insert after the description
    container.parentNode.insertBefore(permissionsDetails, container.nextSibling);
}

// Menu functionality
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
    const overlay = document.createElement('div');
    overlay.id = 'overlay';
    overlay.className = 'overlay';
    overlay.addEventListener('click', closeMenu);
    document.body.appendChild(overlay);
}

function closeMenu() {
    const dropdownMenu = document.getElementById('dropdownMenu');
    const overlay = document.getElementById('overlay');
    
    menuOpen = false;
    dropdownMenu.classList.remove('show');
    if (overlay) overlay.classList.remove('active');
}

// Close menu when clicking on menu items
document.addEventListener('DOMContentLoaded', function() {
    setupMenuClose();
    
    // Close menu after clicking any menu item
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            setTimeout(closeMenu, 300);
        });
    });
    
    // Close menu on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && menuOpen) {
            closeMenu();
        }
    });
});

// Add test button to form temporarily
function addTestButton() {
    const form = document.getElementById('registerForm');
    if (form) {
        const testButton = document.createElement('button');
        testButton.type = 'button';
        testButton.textContent = '🧪 Fill Test Data';
        testButton.onclick = fillTestData;
        testButton.style.margin = '10px';
        testButton.style.padding = '10px';
        testButton.style.background = '#f39c12';
        testButton.style.color = 'white';
        testButton.style.border = 'none';
        testButton.style.borderRadius = '5px';
        form.appendChild(testButton);
    }
}

// Initialize test button
setTimeout(addTestButton, 1000);

console.log('✅ Fixed registration JavaScript loaded successfully WITH PASSWORD SAVING');