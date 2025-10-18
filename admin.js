// Admin Panel JavaScript - WITH LEAVE TYPE SUPPORT
let allRequests = [];
let filteredRequests = [];

// Initialize the admin panel
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Admin panel initialized');
    checkAuthentication();
    updateAdminHeader();
    loadRequests();
    setupEventListeners();
    updateUIForUserRole();
});

// Check if user is authenticated
function checkAuthentication() {
    const currentUser = localStorage.getItem('loggedInUser');
    if (!currentUser) {
        alert('Please login first!');
        window.location.href = 'index.html';
        return;
    }
    console.log('🔐 User authenticated:', currentUser);
}

// Update admin header based on user role
function updateAdminHeader() {
    const header = document.querySelector('.header h1');
    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    const currentUser = localStorage.getItem('loggedInUser');
    
    if (header) {
        if (userProfile.role === 'admin' || userProfile.role === 'approver' || userProfile.role === 'manager') {
            header.innerHTML = `Leave Management Panel <span style="color: #FFD700; font-size: 14px; margin-left: 10px;">👑 ${userProfile.role.toUpperCase()}</span>`;
        } else {
            header.innerHTML = `My Leave Requests <span style="color: #3498db; font-size: 14px; margin-left: 10px;">👤 ${currentUser}</span>`;
        }
    }
}

// Update UI based on user role
function updateUIForUserRole() {
    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    const currentUser = localStorage.getItem('loggedInUser');
    const permissions = getUserPermissions();
    
    console.log('🔄 Updating UI for role:', userProfile.role, 'User:', currentUser);
    
    // Hide admin-only elements for regular users
    if (permissions.isRegularUser) {
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'none';
        });
        
        // Update page title for regular users
        document.title = 'My Leave Requests - Leave Management System';
        
        // Show user-specific message
        const requestsInfo = document.querySelector('.requests-info');
        if (requestsInfo) {
            const userSpan = document.createElement('span');
            userSpan.style.color = '#3498db';
            userSpan.style.fontWeight = 'bold';
            userSpan.style.marginLeft = '10px';
            userSpan.textContent = `👤 Viewing requests for: ${currentUser}`;
            requestsInfo.appendChild(userSpan);
        }
    } else {
        // Show admin-only elements for admins/approvers
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = '';
        });
    }
}

// Set up event listeners
function setupEventListeners() {
    // Enter key for search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchRequests();
            }
        });
    }
}

// Load requests from localStorage
function loadRequests() {
    console.log('📥 Loading requests from localStorage...');
    
    try {
        const stored = localStorage.getItem('leaveRequests');
        console.log('📦 Raw localStorage data:', stored);
        
        if (stored) {
            allRequests = JSON.parse(stored);
            console.log('✅ Successfully parsed requests:', allRequests);
        } else {
            allRequests = [];
            console.log('ℹ️ No leaveRequests found in localStorage');
        }
    } catch (error) {
        console.error('💥 Error loading requests:', error);
        allRequests = [];
    }
    
    console.log(`📊 Total requests loaded: ${allRequests.length}`);
    
    // Filter requests based on user role
    filterRequestsByUserRole();
    displayRequests();
    updateStats();
    updateRequestsCount();
}

// Filter requests based on user role
function filterRequestsByUserRole() {
    const currentUser = localStorage.getItem('loggedInUser');
    const permissions = getUserPermissions();
    
    console.log('🔍 Filtering requests for user:', currentUser, 'Role permissions:', permissions);
    
    if (permissions.isRegularUser) {
        // Regular users can only see their own requests
        const userRequests = allRequests.filter(request => request.user === currentUser);
        console.log(`👤 User ${currentUser} can see ${userRequests.length} of ${allRequests.length} total requests`);
        filteredRequests = userRequests;
    } else {
        // Admins/approvers can see all requests
        filteredRequests = allRequests;
        console.log(`👑 Admin can see all ${allRequests.length} requests`);
    }
}

// Display requests in the table
function displayRequests(requestsToShow = filteredRequests) {
    console.log('🖥️ Displaying requests...');
    const tableBody = document.getElementById('requestsTableBody');
    
    if (!tableBody) {
        console.error('❌ Table body not found!');
        return;
    }
    
    // Get current user role and permissions
    const currentUser = localStorage.getItem('loggedInUser');
    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    const permissions = getUserPermissions();
    
    console.log('👤 Current user:', currentUser, 'Role:', userProfile.role, 'Permissions:', permissions);
    
    if (requestsToShow.length === 0) {
        if (permissions.isRegularUser) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="11" class="no-requests">
                        📭 You haven't submitted any leave requests yet
                        <br><small><a href="leaveform.html" style="color: #3498db; text-decoration: none;">Submit your first leave request →</a></small>
                    </td>
                </tr>
            `;
        } else {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="11" class="no-requests">
                        📭 No leave requests found
                        <br><small>Submit requests from the leave form</small>
                    </td>
                </tr>
            `;
        }
        console.log('ℹ️ No requests to display');
        return;
    }
    
    // Sort by date (newest first)
    const sortedRequests = requestsToShow.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.requestDate || 0);
        const dateB = new Date(b.createdAt || b.requestDate || 0);
        return dateB - dateA;
    });
    
    // Display requests with role-based actions
    tableBody.innerHTML = sortedRequests.map(request => {
        const isOwnRequest = request.user === currentUser;
        let actionButtons = '';
        
        if (permissions.canApprove && request.status === 'pending') {
            // Admin/approver can approve/reject pending requests
            actionButtons = `
                <button class="btn-approve" onclick="updateStatus('${request.requestId}', 'approved')">✓ Approve</button>
                <button class="btn-reject" onclick="updateStatus('${request.requestId}', 'rejected')">✗ Reject</button>
                ${permissions.canDelete ? `<button class="delete-btn" onclick="deleteRequest('${request.requestId}')">🗑️ Delete</button>` : ''}
            `;
        } else if (permissions.canDelete) {
            // Admin can delete any request
            actionButtons = `<button class="delete-btn" onclick="deleteRequest('${request.requestId}')">🗑️ Delete</button>`;
        } else if (isOwnRequest) {
            // Users can delete their own requests
            actionButtons = `<button class="delete-btn" onclick="deleteRequest('${request.requestId}')">🗑️ Delete</button>`;
        } else {
            // No permissions
            actionButtons = '<span class="view-only">View Only</span>';
        }
        
        // Get leave type with proper fallback
        const leaveType = request.leaveType || 'Other';
        const leaveTypeClass = leaveType.toLowerCase();
        
        return `
            <tr>
                <td><strong>${request.user || 'N/A'}</strong></td>
                <td>${request.fullName || 'N/A'}</td>
                <td>${request.department || 'N/A'}</td>
                <!-- ADDED: Leave Type with badge -->
                <td>
                    <span class="leave-type-badge badge-${leaveTypeClass}">
                        ${leaveType}
                    </span>
                </td>
                <td>${formatDate(request.startDate) || 'N/A'}</td>
                <td>${formatDate(request.endDate) || 'N/A'}</td>
                <td><span class="days-badge">${request.days || 'N/A'}</span></td>
                <td title="${request.reason || ''}">${truncateText(request.reason, 50) || 'N/A'}</td>
                <td>${formatDate(request.requestDate) || 'N/A'}</td>
                <td><span class="status-badge ${request.status || 'pending'}">${(request.status || 'pending').toUpperCase()}</span></td>
                <td>
                    <div class="action-buttons">
                        ${actionButtons}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    console.log('✅ Table updated with', requestsToShow.length, 'requests');
    updateRequestsCount();
}

// Get user permissions based on role
function getUserPermissions() {
    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    const currentUser = localStorage.getItem('loggedInUser');
    
    const permissions = {
        canApprove: ['admin', 'approver', 'manager'].includes(userProfile.role),
        canDelete: ['admin', 'manager'].includes(userProfile.role),
        canExport: ['admin', 'manager'].includes(userProfile.role),
        canViewStats: ['admin', 'manager', 'approver'].includes(userProfile.role),
        canManageUsers: ['admin'].includes(userProfile.role),
        isRegularUser: userProfile.role === 'user' || !userProfile.role
    };
    
    console.log('🔐 User permissions:', permissions);
    return permissions;
}

// Update request status
function updateStatus(requestId, newStatus) {
    if (!confirm(`Are you sure you want to ${newStatus} this leave request?`)) {
        return;
    }
    
    const requestIndex = allRequests.findIndex(req => req.requestId === requestId);
    if (requestIndex !== -1) {
        allRequests[requestIndex].status = newStatus;
        allRequests[requestIndex].processedAt = new Date().toISOString();
        
        // Save to localStorage
        localStorage.setItem('leaveRequests', JSON.stringify(allRequests));
        
        console.log(`✅ Request ${requestId} status updated to ${newStatus}`);
        
        // Reload and re-filter requests
        filterRequestsByUserRole();
        displayRequests();
        updateStats();
        
        // Show success message
        showNotification(`Request ${newStatus} successfully!`, 'success');
    } else {
        console.error('❌ Request not found:', requestId);
        showNotification('Error: Request not found!', 'error');
    }
}

// Delete request
function deleteRequest(requestId) {
    if (!confirm('Are you sure you want to delete this leave request? This action cannot be undone.')) {
        return;
    }
    
    const initialLength = allRequests.length;
    allRequests = allRequests.filter(req => req.requestId !== requestId);
    
    if (allRequests.length < initialLength) {
        // Save to localStorage
        localStorage.setItem('leaveRequests', JSON.stringify(allRequests));
        
        console.log(`✅ Request ${requestId} deleted`);
        
        // Reload and re-filter requests
        filterRequestsByUserRole();
        displayRequests();
        updateStats();
        
        // Show success message
        showNotification('Request deleted successfully!', 'success');
    } else {
        console.error('❌ Request not found for deletion:', requestId);
        showNotification('Error: Request not found!', 'error');
    }
}

// Update statistics
function updateStats() {
    const statsContainer = document.getElementById('statsContainer');
    if (!statsContainer) return;
    
    const permissions = getUserPermissions();
    
    // Hide stats for regular users
    if (!permissions.canViewStats) {
        statsContainer.style.display = 'none';
        return;
    }
    
    statsContainer.style.display = 'grid';
    
    // Calculate stats based on filtered requests (what the user can see)
    const total = filteredRequests.length;
    const pending = filteredRequests.filter(req => req.status === 'pending').length;
    const approved = filteredRequests.filter(req => req.status === 'approved').length;
    const rejected = filteredRequests.filter(req => req.status === 'rejected').length;
    
    // ADDED: Leave type statistics
    const leaveTypeStats = {};
    filteredRequests.forEach(req => {
        const type = req.leaveType || 'Other';
        leaveTypeStats[type] = (leaveTypeStats[type] || 0) + 1;
    });
    
    const mostCommonLeaveType = Object.keys(leaveTypeStats).length > 0 
        ? Object.keys(leaveTypeStats).reduce((a, b) => leaveTypeStats[a] > leaveTypeStats[b] ? a : b)
        : 'None';
    
    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-number">${total}</div>
            <div class="stat-label">Total Requests</div>
        </div>
        <div class="stat-card pending">
            <div class="stat-number">${pending}</div>
            <div class="stat-label">Pending</div>
        </div>
        <div class="stat-card approved">
            <div class="stat-number">${approved}</div>
            <div class="stat-label">Approved</div>
        </div>
        <div class="stat-card rejected">
            <div class="stat-number">${rejected}</div>
            <div class="stat-label">Rejected</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${mostCommonLeaveType}</div>
            <div class="stat-label">Most Common Type</div>
        </div>
    `;
    
    console.log('📈 Stats updated for', total, 'requests');
}

// Filter requests (for admin filtering)
function filterRequests() {
    const statusFilter = document.getElementById('statusFilter').value;
    const departmentFilter = document.getElementById('departmentFilter').value;
    const leaveTypeFilter = document.getElementById('leaveTypeFilter').value;
    
    let filtered = filteredRequests; // Start with role-filtered requests
    
    // Apply status filter
    if (statusFilter !== 'all') {
        filtered = filtered.filter(req => req.status === statusFilter);
    }
    
    // Apply department filter
    if (departmentFilter !== 'all') {
        filtered = filtered.filter(req => req.department === departmentFilter);
    }
    
    // ADDED: Apply leave type filter
    if (leaveTypeFilter !== 'all') {
        filtered = filtered.filter(req => (req.leaveType || 'Other') === leaveTypeFilter);
    }
    
    console.log(`🔍 Filtered to ${filtered.length} requests`);
    displayRequests(filtered);
}

// Search requests
function searchRequests() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    
    if (!searchTerm) {
        displayRequests();
        return;
    }
    
    const filtered = filteredRequests.filter(request => 
        (request.fullName && request.fullName.toLowerCase().includes(searchTerm)) ||
        (request.user && request.user.toLowerCase().includes(searchTerm)) ||
        (request.reason && request.reason.toLowerCase().includes(searchTerm)) ||
        (request.department && request.department.toLowerCase().includes(searchTerm)) ||
        // ADDED: Search by leave type
        (request.leaveType && request.leaveType.toLowerCase().includes(searchTerm)) ||
        (request.requestId && request.requestId.toLowerCase().includes(searchTerm))
    );
    
    console.log(`🔍 Search for "${searchTerm}" found ${filtered.length} requests`);
    displayRequests(filtered);
}

// Clear search
function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = 'all';
    document.getElementById('departmentFilter').value = 'all';
    document.getElementById('leaveTypeFilter').value = 'all';
    
    console.log('🧹 Search and filters cleared');
    displayRequests();
}

// Reset all filters
function resetFilters() {
    document.getElementById('statusFilter').value = 'all';
    document.getElementById('departmentFilter').value = 'all';
    document.getElementById('leaveTypeFilter').value = 'all';
    document.getElementById('searchInput').value = '';
}

// Update requests count
function updateRequestsCount() {
    const countElement = document.getElementById('requestsCount');
    if (countElement) {
        const permissions = getUserPermissions();
        
        if (permissions.isRegularUser) {
            // For regular users, show only their count
            countElement.textContent = `${filteredRequests.length} leave request${filteredRequests.length !== 1 ? 's' : ''}`;
        } else {
            // For admins, show filtered vs total
            const total = allRequests.length;
            const filtered = filteredRequests.length;
            
            if (total === filtered) {
                countElement.textContent = `${total} leave request${total !== 1 ? 's' : ''}`;
            } else {
                countElement.textContent = `${filtered} of ${total} request${total !== 1 ? 's' : ''}`;
            }
        }
    }
}

// Export to CSV
function exportToCSV() {
    const permissions = getUserPermissions();
    if (!permissions.canExport) {
        showNotification('You do not have permission to export data!', 'error');
        return;
    }
    
    if (filteredRequests.length === 0) {
        showNotification('No data to export!', 'warning');
        return;
    }
    
    // ADDED: Include leave type in CSV export
    const headers = ['Username', 'Full Name', 'Department', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Reason', 'Date Filed', 'Status'];
    const csvData = [
        headers.join(','),
        ...filteredRequests.map(req => [
            req.user || '',
            `"${(req.fullName || '').replace(/"/g, '""')}"`,
            req.department || '',
            req.leaveType || 'Other',
            req.startDate || '',
            req.endDate || '',
            req.days || '',
            `"${(req.reason || '').replace(/"/g, '""')}"`,
            req.requestDate || '',
            req.status || ''
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leave-requests-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    console.log('📊 CSV exported with', filteredRequests.length, 'requests');
    showNotification('CSV exported successfully!', 'success');
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Set background color based on type
    const colors = {
        success: '#27ae60',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db'
    };
    
    notification.style.background = colors[type] || colors.info;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Utility functions
function formatDate(dateString) {
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
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Navigation functions
function goToAdmin() {
    console.log('📊 Already on Admin Panel');
    // Already on this page
}

function goToDashboard() {
    console.log('🏠 Navigating to Dashboard...');
    window.location.href = 'index.html';
}

function goToLeaveForm() {
    console.log('📝 Navigating to Leave Form...');
    window.location.href = 'leaveform.html';
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

// Auto-refresh every 30 seconds (optional)
setInterval(() => {
    if (document.visibilityState === 'visible') {
        console.log('🔄 Auto-refreshing requests...');
        loadRequests();
    }
}, 30000);

console.log('✅ Admin panel JavaScript loaded successfully - WITH LEAVE TYPE SUPPORT');