// Local fallback users (only used if Firebase isn't configured)
const USERS = {
  "admin": "password123",
  "approver": "secure456"
};

// User profiles for auto-fill feature
const USER_PROFILES = {
  'admin': { fullName: 'System Administrator', department: 'Admin', role: 'admin' },
  'approver': { fullName: 'Leave Approver', department: 'HR', role: 'admin' },
  'manager': { fullName: 'Department Manager', department: 'Management', role: 'admin' }
};

// Enhanced logout function that prevents back navigation
function logout() {
  // Clear all authentication data
  if (window.firebaseAuth && window.firebaseAuthFns && window.firebaseAuthFns.signOut) {
    window.firebaseAuthFns.signOut(window.firebaseAuth).catch(() => {});
  }
  
  // Clear all stored data
  localStorage.removeItem('loggedInUser');
  localStorage.removeItem('userProfile');
  sessionStorage.removeItem('sessionActive');
  
  // Clear any cached data
  if (window.scheduleData) {
    window.scheduleData = null;
  }
  
  // Hide dashboard and show login
  document.getElementById('dashboardSection').style.display = 'none';
  document.getElementById('loginSection').style.display = 'block';
  
  // Clear form fields
  document.getElementById("loginForm").reset();
  
  // Replace history state to prevent back navigation
  history.replaceState(null, null, window.location.href);
  
  // Add event listener to prevent back navigation
  window.addEventListener('popstate', preventBackNavigation);
  
  // Show logout confirmation
  showLogoutMessage();
}

// Function to prevent back navigation after logout
function preventBackNavigation(event) {
  // Replace current state again to prevent going back
  history.replaceState(null, null, window.location.href);
  
  // Show message if user tries to go back
  if (localStorage.getItem('loggedInUser')) {
    // User is logged in, allow normal navigation
    return;
  }
  
  // User is logged out, prevent back navigation to dashboard
  event.preventDefault();
  event.stopPropagation();
  
  // Optional: Show a message
  if (!document.getElementById('backBlockMessage')) {
    const message = document.createElement('div');
    message.id = 'backBlockMessage';
    message.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff2a6d;
      color: white;
      padding: 10px 15px;
      border-radius: 8px;
      z-index: 10000;
      box-shadow: 0 0 15px rgba(255, 42, 109, 0.5);
      font-family: monospace;
      font-size: 12px;
    `;
    message.textContent = 'Session ended. Please login again.';
    document.body.appendChild(message);
    
    // Remove message after 3 seconds
    setTimeout(() => {
      if (document.getElementById('backBlockMessage')) {
        document.getElementById('backBlockMessage').remove();
      }
    }, 3000);
  }
}

// Show logout confirmation message
function showLogoutMessage() {
  // Create or show logout message
  let message = document.getElementById('logoutMessage');
  if (!message) {
    message = document.createElement('div');
    message.id = 'logoutMessage';
    message.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(10, 10, 26, 0.95);
      color: #00f3ff;
      padding: 20px 30px;
      border-radius: 12px;
      border: 1px solid #00f3ff;
      box-shadow: 0 0 30px rgba(0, 243, 255, 0.5);
      z-index: 10000;
      text-align: center;
      backdrop-filter: blur(10px);
      font-family: monospace;
    `;
    document.body.appendChild(message);
  }
  
  message.innerHTML = `
    <h3 style="margin: 0 0 10px 0; color: #00f3ff;">Logged Out Successfully</h3>
    <p style="margin: 0; color: #b4b4d4;">You have been securely logged out.</p>
  `;
  
  // Remove message after 2 seconds
  setTimeout(() => {
    if (document.getElementById('logoutMessage')) {
      document.getElementById('logoutMessage').remove();
    }
  }, 2000);
}

// Enhanced authentication check with session management
function checkAuthentication() {
  const loggedInUser = localStorage.getItem('loggedInUser');
  const sessionActive = sessionStorage.getItem('sessionActive');
  
  if (loggedInUser && sessionActive) {
    showDashboard();
    return true;
  } else if (loggedInUser) {
    // User data exists but no active session - require re-login
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('userProfile');
    showLogin();
    return false;
  }
  
  showLogin();
  return false;
}

// Enhanced showDashboard with session management
function showDashboard() {
  // Set session as active
  sessionStorage.setItem('sessionActive', 'true');
  
  // Update UI
  document.getElementById("loginSection").style.display = "none";
  document.getElementById("dashboardSection").style.display = "block";
  
  // Remove back navigation prevention
  window.removeEventListener('popstate', preventBackNavigation);
  
  // Push state to history for proper navigation
  history.pushState({ dashboard: true }, '', window.location.href);
  
  // Update dashboard with user info
  updateDashboardWithUserInfo();
  
  // Re-check admin status when dashboard is shown
  if (typeof checkAdminAndShow === 'function') checkAdminAndShow();
  
  // Load dashboard data
  loadDashboardData();
}

// Update dashboard with user information
function updateDashboardWithUserInfo() {
  const loggedInUser = localStorage.getItem('loggedInUser');
  const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
  
  const dashMenu = document.getElementById('dashmenu');
  if (dashMenu) {
    if (userProfile.role === 'admin') {
      dashMenu.innerHTML = `Dashboard Menu <span style="color: #FFD700; background: rgba(255, 215, 0, 0.2); padding: 4px 12px; border-radius: 20px; font-size: 14px; margin-left: 10px;">Admin</span>`;
    } else {
      dashMenu.textContent = 'Dashboard Menu';
    }
  }
  
  console.log('👤 Dashboard loaded for:', loggedInUser);
  console.log('📋 User profile:', userProfile);
}

// Enhanced showLogin function
function showLogin() {
  document.getElementById("loginSection").style.display = "block";
  document.getElementById("dashboardSection").style.display = "none";
  document.getElementById("loginForm").reset();
}

// Load dashboard data
function loadDashboardData() {
  // Your existing dashboard loading logic here
  console.log('Loading dashboard data...');
}

// Initialize authentication on page load
document.addEventListener('DOMContentLoaded', function() {
  // Check if user is authenticated
  checkAuthentication();
  
  // Add history state for initial load
  history.replaceState({ login: true }, '', window.location.href);
  
  // Handle browser back/forward buttons
  window.addEventListener('popstate', function(event) {
    if (!localStorage.getItem('loggedInUser')) {
      // User is logged out, prevent access to dashboard
      preventBackNavigation(event);
    }
  });
});

// Enhanced login function with session management and user profiles
document.getElementById("loginForm").addEventListener("submit", async function(e) {
  e.preventDefault();
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;
  
  // Try Firebase auth if initialized
  if (window.firebaseAuth && window.firebaseAuthFns && window.firebaseAuthFns.signInWithEmailAndPassword && window.firebaseDb && window.firebaseDbFns) {
    try {
      // Resolve username -> email via users collection
      const usersCol = window.firebaseDbFns.collection(window.firebaseDb, 'users');
      const q = window.firebaseDbFns.query(usersCol, window.firebaseDbFns.where('username', '==', user));
      const snap = await window.firebaseDbFns.getDocs(q);
      if (snap.size === 0) {
        throw new Error('Username not found');
      }
      const docSnap = snap.docs[0];
      const email = docSnap.data().email;
      await window.firebaseAuthFns.signInWithEmailAndPassword(window.firebaseAuth, email, pass);
      
      // Store user session and profile
      localStorage.setItem("loggedInUser", user);
      storeUserProfile(user, docSnap.data());
      showDashboard();
      return;
    } catch (err) {
      // fall through to local check
      console.warn('Firebase sign-in failed or username not found, falling back to local users.', err);
    }
  }

  // Local fallback with user profiles
  if (USERS[user] && USERS[user] === pass) {
    localStorage.setItem("loggedInUser", user);
    storeUserProfile(user);
    showDashboard();
  } else {
    alert("Invalid credentials.");
  }
});

// Store user profile information
function storeUserProfile(username, firebaseData = null) {
  let userProfile;
  
  if (firebaseData) {
    // Use data from Firebase
    userProfile = {
      fullName: firebaseData.fullName || username,
      department: firebaseData.department || '',
      role: firebaseData.role || 'user',
      email: firebaseData.email || ''
    };
  } else {
    // Use local profile data
    userProfile = USER_PROFILES[username] || {
      fullName: username,
      department: '',
      role: 'user'
    };
  }
  
  localStorage.setItem('userProfile', JSON.stringify(userProfile));
  console.log('💾 Stored user profile:', userProfile);
}

// Determine admin status and show Register button if admin
async function checkAdminAndShow() {
  const btn = document.getElementById('registerBtn');
  try {
    // Prefer Firebase custom claim
    if (window.firebaseAuth && window.firebaseAuth.currentUser) {
      const user = window.firebaseAuth.currentUser;
      // Wait to ensure token is loaded
      const token = await user.getIdTokenResult(true).catch(() => null);
      const isAdmin = token && token.claims && token.claims.admin === true;
      if (isAdmin) btn.style.display = 'inline-block';
      return;
    }
  } catch (e) { console.warn('admin claim check failed', e); }

  // Fallback: check user profile for admin role
  const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
  if (userProfile.role === 'admin') {
    btn.style.display = 'inline-block';
    console.log('👑 Admin user detected, showing register button');
  } else {
    btn.style.display = 'none';
  }
}

// Run on load
setTimeout(checkAdminAndShow, 500);

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

// Handle page visibility changes (tab switching)
document.addEventListener('visibilitychange', function() {
  if (document.hidden) {
    // Page is hidden - you could add additional security here
    console.log('Page is now hidden');
  } else {
    // Page is visible again - verify session is still valid
    if (localStorage.getItem('loggedInUser') && !sessionStorage.getItem('sessionActive')) {
      // Session might be compromised, force re-login
      logout();
    }
  }
});

// Prevent right-click context menu (optional security measure)
document.addEventListener('contextmenu', function(e) {
  if (localStorage.getItem('loggedInUser')) {
    e.preventDefault();
    return false;
  }
});

// Enhanced getSheetData function (keep your existing implementation)
const { google } = require('googleapis');

async function getSheetData() {
    const auth = new google.auth.GoogleAuth({
        keyFile: 'credentials.json',
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: '1gz1YVnm4ATR2OHQuoKLJTMRBxlKJ1V7zygKyf40JzGU',
        range: '2025!C1:J1000', // Adjust range
    });

    return response.data.values;
}

// Utility function to check if current user is admin
function isCurrentUserAdmin() {
  const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
  return userProfile.role === 'admin';
}

// Utility function to get current user profile
function getCurrentUserProfile() {
  return JSON.parse(localStorage.getItem('userProfile') || '{}');
}

// Auto-redirect admin users to admin panel (optional)
function setupAdminAutoRedirect() {
  if (isCurrentUserAdmin()) {
    console.log('👑 Admin user detected - enabling admin features');
  }
}

// Initialize admin features
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(setupAdminAutoRedirect, 1000);
});