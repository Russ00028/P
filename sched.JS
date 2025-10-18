// Check if user is logged in when page loads
document.addEventListener('DOMContentLoaded', function() {
    const loggedInUser = localStorage.getItem('loggedInUser');
    console.log('Page loaded, checking authentication...');
    console.log('Current user:', loggedInUser);
    
    if (!loggedInUser) {
        console.log('No user found, redirecting to login...');
        alert('Please log in to access the schedule.');
        window.location.href = 'index.html';
    } else {
        console.log('User authenticated:', loggedInUser);
        // Auto-load schedule when authenticated
        displayScheduleTable();
    }
});

// Navigation functions
function goToLeaveForm() {
    window.location.href = 'leaveform.html';
}

function goToAdmin() {
    window.location.href = 'admin.html';
}

function goToDashboard() {
    window.location.href = 'index.html';
}

function viewProfile() {
    window.location.href = 'profile.html';
}
// Refresh schedule function
function refreshSchedule() {
    console.log('Refreshing schedule...');
    displayScheduleTable();
}

// Logout function
function logout() {
    console.log('Logout initiated');
    
    // Show confirmation dialog
    const confirmLogout = confirm('Are you sure you want to log out?');
    if (!confirmLogout) {
        return; // User cancelled logout
    }
    
    // Firebase logout (if using Firebase)
    if (window.firebaseAuth && window.firebaseAuthFns && window.firebaseAuthFns.signOut) {
        console.log('Signing out from Firebase...');
        window.firebaseAuthFns.signOut(window.firebaseAuth).catch((error) => {
            console.log('Firebase logout completed (with or without error)');
        });
    }
    
    // Clear all authentication data
    localStorage.removeItem('loggedInUser');
    sessionStorage.removeItem('loggedInUser');
    
    console.log('Authentication cleared, redirecting to login...');
    
    // Redirect to login page
    window.location.href = 'index.html';
}

// ==================== SCHEDULE CODE ====================

// Google Sheets configuration
const SHEET_CONFIG = {
    spreadsheetId: '1gz1YVnm4ATR2OHQuoKLJTMRBxlKJ1V7zygKyf40JzGU',
    sheetName: '2025'
};

// Color coding configuration with text colors
const COLOR_CODES = {
    // Status colors
    'DAY OFF': { bg: 'black', text: 'white' },
    'OFF': { bg: 'black', text: 'white' },
    'OFFDAY': { bg: 'black', text: 'white' },
    'RESTDAY': { bg: 'black', text: 'white' },
    'VL': { bg: '#81e481ff', text: 'black' },
    'SL': { bg: '#FFFF00', text: 'black' },
    'EL': { bg: '#FFFF00', text: 'black' },
    'ABSENT': { bg: '#f70202ff', text: 'white' },
    'AWOL': { bg: '#830c0cff', text: 'white' },
    'APPROVE': { bg: '#11cbe4ff', text: 'white' },
    'REJECT': { bg: '#f70202ff', text: 'white' },
    'PENDING': { bg: '#53974aff', text: 'white' },
    
    // Shift colors
    '5:00 AM - 1:00 PM': { bg: '#ADD8E6', text: 'black' },
    '1:00 PM - 9:00 PM': { bg: '#FFB6C1', text: 'black' },
    '9:00 PM - 5:00 AM': { bg: '#e05855ff', text: 'white' }
};

// Exact match statuses (these require exact match)
const EXACT_MATCH_STATUSES = ['VL', 'SL', 'EL'];

// Global variable to store current data
let currentScheduleData = [];

// Main function to get sheet data - starting from column C
async function getSheetData() {
    try {
        console.log('Fetching schedule data from Google Sheets...');
        
        // Start from column C (index 2) - skip columns A and B
        const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_CONFIG.spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${SHEET_CONFIG.sheetName}`;
        
        const response = await fetch(csvUrl);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.status}`);
        }
        
        const csvText = await response.text();
        return csvText;
        
    } catch (error) {
        console.error('❌ Error loading Google Sheets data:', error);
        return '';
    }
}

// Improved CSV parser that removes quotes and starts from column C
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    let columnIndex = 0;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            // Skip columns A and B (index 0 and 1), start from column C (index 2)
            if (columnIndex >= 2) {
                result.push(current.replace(/^"+|"+$/g, '').trim());
            }
            current = '';
            columnIndex++;
        } else {
            current += char;
        }
    }
    
    // Add the last cell if it's column C or beyond
    if (columnIndex >= 2) {
        result.push(current.replace(/^"+|"+$/g, '').trim());
    }
    
    return result;
}

// Get background and text color for cell
function getCellStyle(cellValue) {
    if (!cellValue) return { bg: '', text: 'black' };
    
    const upperValue = cellValue.toUpperCase().trim();
    
    // Check for exact match statuses first (VL, SL, EL)
    for (const status of EXACT_MATCH_STATUSES) {
        if (upperValue === status) {
            return COLOR_CODES[status];
        }
    }
    
    // Check for other status codes with partial matching
    for (const [status, style] of Object.entries(COLOR_CODES)) {
        // Skip exact match statuses since we already checked them
        if (EXACT_MATCH_STATUSES.includes(status)) continue;
        
        if (upperValue.includes(status)) {
            return style;
        }
    }
    
    // Check for shift patterns
    if (upperValue.includes('5:00 AM - 1:00 PM') || upperValue.includes('5:00AM - 1:00PM')) {
        return COLOR_CODES['5:00 AM - 1:00 PM'];
    }
    if (upperValue.includes('1:00 PM - 9:00 PM') || upperValue.includes('1:00PM - 9:00PM')) {
        return COLOR_CODES['1:00 PM - 9:00 PM'];
    }
    if (upperValue.includes('9:00 PM - 5:00 AM') || upperValue.includes('9:00PM - 5:00AM')) {
        return COLOR_CODES['9:00 PM - 5:00 AM'];
    }
    
    return { bg: '', text: 'black' };
}

// Convert CSV to HTML table with color coding and centered text
function csvToTable(csvText) {
    const rows = csvText.split('\n').filter(row => row.trim() !== '');
    
    if (rows.length === 0) {
        return '<div class="no-data">No data found in Google Sheet</div>';
    }
    
    // Store the data globally for filtering
    currentScheduleData = rows.map(row => parseCSVLine(row));
    
    let html = '<table class="schedule-table compact-table centered-table"><thead><tr>';
    
    // Header row
    const headers = currentScheduleData[0];
    headers.forEach((header, index) => {
        // First column (names) left-aligned, others centered
        const alignClass = index === 0 ? 'left-align' : 'center-align';
        html += `<th class="${alignClass}">${header}</th>`;
    });
    
    html += '</tr></thead><tbody>';
    
    // Data rows (skip header)
    for (let i = 1; i < currentScheduleData.length; i++) {
        const cells = currentScheduleData[i];
        const rowClass = i % 2 === 0 ? 'even' : 'odd';
        html += `<tr class="${rowClass}">`;
        
        cells.forEach((cell, index) => {
            const style = getCellStyle(cell);
            const cellStyle = style.bg ? `style="background-color: ${style.bg}; color: ${style.text};"` : '';
            const alignClass = index === 0 ? 'left-align' : 'center-align';
            html += `<td class="${alignClass}" ${cellStyle} data-label="${headers[index]}">${cell}</td>`;
        });
        
        html += '</tr>';
    }
    
    html += '</tbody></table>';
    return html;
}

// Search/filter function
function filterSchedule(searchTerm) {
    if (!currentScheduleData.length) return;
    
    const tbody = document.querySelector('.schedule-table tbody');
    if (!tbody) return;
    
    const rows = tbody.getElementsByTagName('tr');
    const searchLower = searchTerm.toLowerCase();
    
    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName('td');
        let rowMatches = false;
        
        for (let j = 0; j < cells.length; j++) {
            const cellText = cells[j].textContent.toLowerCase();
            if (cellText.includes(searchLower)) {
                rowMatches = true;
                break;
            }
        }
        
        rows[i].style.display = rowMatches ? '' : 'none';
    }
    
    // Update result count
    const visibleRows = Array.from(rows).filter(row => row.style.display !== 'none').length;
    const resultCount = document.getElementById('resultCount');
    if (resultCount) {
        resultCount.textContent = `Showing ${visibleRows} of ${rows.length} employees`;
    }
}

// Display schedule in table format with search functionality
async function displayScheduleTable() {
    const scheduleDiv = document.getElementById('scheduleDisplay');
    
    if (!scheduleDiv) return;
    
    // Show loading message
    scheduleDiv.innerHTML = '<div class="loading-message">Loading schedule data...</div>';
    
    try {
        const csvData = await getSheetData();
        
        if (!csvData) {
            scheduleDiv.innerHTML = '<div class="no-data">No schedule data available</div>';
            return;
        }
        
        const rows = csvData.split('\n').filter(row => row.trim() !== '');
        
        if (rows.length === 0) {
            scheduleDiv.innerHTML = '<div class="no-data">No data found in schedule</div>';
            return;
        }
        
        const tableHTML = csvToTable(csvData);
        
        scheduleDiv.innerHTML = `
            <div class="schedule-section">
                <div class="search-container">
                    <div class="search-box">
                        <input type="text" id="scheduleSearch" placeholder="🔍 Search employees, shifts, or status..." 
                               onkeyup="filterSchedule(this.value)">
                        <div class="search-info">
                            <span id="resultCount">Showing ${currentScheduleData.length - 1} employees</span>
                        </div>
                    </div>
                </div>
                
                <div class="table-container">
                    ${tableHTML}
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('Error displaying schedule:', error);
        scheduleDiv.innerHTML = '<div class="no-data">Error loading schedule data</div>';
    }
}
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

// Close menu when clicking outside
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
            setTimeout(closeMenu, 300); // Small delay for smooth transition
        });
    });
    
    // Close menu on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && menuOpen) {
            closeMenu();
        }
    });
});