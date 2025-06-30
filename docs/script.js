// Global variables
let currentUser = null;
const API_BASE = 'http://localhost:3000/api';
let currentCouponId = null;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    checkExistingLogin();
    setupEventListeners();
});

function checkExistingLogin() {
    const userData = localStorage.getItem('userData');
    if (userData) {
        currentUser = JSON.parse(userData);
        showMainApp();
    }
}

function setupEventListeners() {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('userData', JSON.stringify(data.user));
            showMainApp();
        } else {
            showLoginError(data.error || 'Login failed');
        }
    } catch (error) {
        showLoginError('Connection error. Please try again.');
    }
}

function showLoginError(message) {
    const errorDiv = document.getElementById('loginError');
    errorDiv.textContent = message;
    errorDiv.classList.remove('d-none');
}

function showMainApp() {
    document.getElementById('loginContainer').classList.add('d-none');
    document.getElementById('mainApp').classList.remove('d-none');
    
    // Update user info
    const userInfo = document.getElementById('userInfo');
    userInfo.innerHTML = `
        <i class="fas fa-user"></i> ${currentUser.firstName} ${currentUser.lastName}
        ${currentUser.isAdmin ? '<span class="badge bg-warning">Admin</span>' : ''}
    `;
    
    // Show/hide elements based on admin status
    if (currentUser.isAdmin) {
        // Admin-only buttons
        document.getElementById('addCouponBtn').classList.remove('d-none');
        document.getElementById('viewSuggestionsBtn').classList.remove('d-none');
        document.getElementById('adminSuggestBtn').classList.remove('d-none');
        // Hide suggestion button and rules for admins
        document.getElementById('suggestBtn').classList.add('d-none');
        document.getElementById('rulesCard').classList.add('d-none');
    } else {
        // Non-admin: show suggestion button and rules, hide admin buttons
        document.getElementById('suggestBtn').classList.remove('d-none');
        document.getElementById('rulesCard').classList.remove('d-none');
        document.getElementById('addCouponBtn').classList.add('d-none');
        document.getElementById('viewSuggestionsBtn').classList.add('d-none');
        document.getElementById('adminSuggestBtn').classList.add('d-none');
    }
    
    // Load initial data
    loadCoupons();
}

async function loadCoupons() {
    try {
        const response = await fetch(`${API_BASE}/coupons`);
        const allCoupons = await response.json();
        
        // Get search filter value
        const searchQuery = document.getElementById('searchFilter').value.trim().toLowerCase();
        
        // Load users to show names alongside IDs
        const usersResponse = await fetch(`${API_BASE}/users`);
        const users = await usersResponse.json();
        const userMap = users.reduce((map, user) => {
            map[user.id] = `${user.firstName} ${user.lastName}`;
            return map;
        }, {});
        
        // Filter coupons by title, content, id, or user name
        let filteredCoupons = allCoupons;
        if (searchQuery) {
            filteredCoupons = allCoupons.filter(coupon => {
                const userName = userMap[coupon.userId] || '';
                const adminName = userMap[coupon.adminId] || '';
                return coupon.title.toLowerCase().includes(searchQuery) || 
                       coupon.content.toLowerCase().includes(searchQuery) ||
                       coupon.id.toLowerCase().includes(searchQuery) ||
                       userName.toLowerCase().includes(searchQuery) ||
                       adminName.toLowerCase().includes(searchQuery);
            });
        }
        
        displayCoupons(filteredCoupons, userMap);
    } catch (error) {
        console.error('Error loading coupons:', error);
        document.getElementById('couponsContainer').innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle"></i> Error loading coupons
            </div>
        `;
    }
}

function displayCoupons(coupons, userMap = {}) {
    const container = document.getElementById('couponsContainer');
    
    if (coupons.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-ticket-alt fa-3x text-muted"></i>
                <p class="mt-3">No coupons found</p>
            </div>
        `;
        return;
    }

    // Helper function to format date in American format
    function formatAmericanDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    const couponsHtml = coupons.map(coupon => {
        const userName = userMap[coupon.userId] || 'Unknown User';
        const adminName = userMap[coupon.adminId] || 'Unknown Admin';
        
        return `
            <div class="card coupon-card ${coupon.isActive ? 'coupon-active' : 'coupon-inactive'} mb-3">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-8">
                            <h5 class="card-title">
                                ${coupon.title}
                                ${coupon.isActive ? '<span class="badge bg-success">Active</span>' : '<span class="badge bg-secondary">Inactive</span>'}
                            </h5>
                            <p class="card-text">${coupon.content}</p>
                            <small class="text-muted">
                                <i class="fas fa-user"></i> User: ${userName} (${coupon.userId})<br>
                                <i class="fas fa-user-shield"></i> Admin: ${adminName} (${coupon.adminId})<br>
                                <i class="fas fa-calendar"></i> Created: ${formatAmericanDate(new Date())}
                                ${coupon.scheduledDate ? `<br><i class="fas fa-clock"></i> Scheduled: ${formatAmericanDate(coupon.scheduledDate)}` : ''}
                            </small>
                        </div>
                        <div class="col-md-4 text-end">
                            <div class="btn-group-vertical">
                                ${!coupon.isActive ? `
                                    <button class="btn btn-sm btn-primary btn-action" onclick="showRedeemModal('${coupon.id}')">
                                        <i class="fas fa-check"></i> Redeem
                                    </button>
                                ` : ''}
                                
                                <button class="btn btn-sm btn-info btn-action" onclick="showScheduleModal('${coupon.id}')">
                                    <i class="fas fa-calendar-plus"></i> Schedule
                                </button>
                                
                                ${currentUser.isAdmin ? `
                                    <button class="btn btn-sm btn-danger btn-action" onclick="deleteCoupon('${coupon.id}')">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = couponsHtml;
}

function showRedeemModal(couponId) {
    currentCouponId = couponId;
    document.getElementById('redeemDateTime').value = '';
    const modal = new bootstrap.Modal(document.getElementById('redeemModal'));
    modal.show();
}

function showScheduleModal(couponId) {
    currentCouponId = couponId;
    document.getElementById('scheduleDateTime').value = '';
    const modal = new bootstrap.Modal(document.getElementById('scheduleModal'));
    modal.show();
}

async function redeemCoupon() {
    const dateTimeInput = document.getElementById('redeemDateTime').value;
    
    try {
        const body = dateTimeInput ? { date: new Date(dateTimeInput).toISOString() } : {};
        const response = await fetch(`${API_BASE}/coupons/${currentCouponId}/redeem`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('redeemModal')).hide();
            alert('Coupon redeemed successfully!');
            loadCoupons();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        alert('Error redeeming coupon');
    }
}

async function scheduleCoupon() {
    const dateTimeInput = document.getElementById('scheduleDateTime').value;
    
    if (!dateTimeInput) {
        alert('Please select a date and time');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/coupons/${currentCouponId}/schedule`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ date: new Date(dateTimeInput).toISOString() })
        });

        const data = await response.json();
        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('scheduleModal')).hide();
            alert('Coupon scheduled successfully!');
            loadCoupons();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        alert('Error scheduling coupon');
    }
}

async function deleteCoupon(couponId) {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/coupons/${couponId}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        if (response.ok) {
            alert('Coupon deleted successfully!');
            loadCoupons();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        alert('Error deleting coupon');
    }
}

async function showAddCouponModal() {
    try {
        // Load users for the multiselect
        const response = await fetch(`${API_BASE}/users`);
        const users = await response.json();
        
        const select = document.getElementById('couponUserIds');
        select.innerHTML = users.map(user => 
            `<option value="${user.id}">${user.firstName} ${user.lastName} (${user.email})</option>`
        ).join('');
        
        const modal = new bootstrap.Modal(document.getElementById('addCouponModal'));
        modal.show();
    } catch (error) {
        console.error('Error loading users:', error);
        alert('Error loading users for selection');
    }
}

async function addCoupon() {
    const title = document.getElementById('couponTitle').value;
    const content = document.getElementById('couponContent').value;
    const select = document.getElementById('couponUserIds');
    const selectedOptions = Array.from(select.selectedOptions);
    
    if (!title || !content || selectedOptions.length === 0) {
        alert('Please fill in all fields and select at least one user');
        return;
    }

    const userIds = selectedOptions.map(option => option.value);
    
    try {
        const response = await fetch(`${API_BASE}/coupons`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userIds,
                title,
                content,
                adminId: currentUser.id
            })
        });

        const data = await response.json();
        if (response.ok) {
            alert('Coupons created successfully!');
            document.getElementById('addCouponForm').reset();
            bootstrap.Modal.getInstance(document.getElementById('addCouponModal')).hide();
            loadCoupons();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        alert('Error creating coupon');
    }
}

async function loadUsers() {
    try {
        const response = await fetch(`${API_BASE}/users`);
        const users = await response.json();
        displayUsers(users);
        const modal = new bootstrap.Modal(document.getElementById('usersModal'));
        modal.show();
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function displayUsers(users) {
    const container = document.getElementById('usersContainer');
    
    const usersHtml = users.map(user => `
        <div class="card mb-2">
            <div class="card-body">
                <h6 class="card-title">
                    ${user.firstName} ${user.lastName}
                    ${user.isAdmin ? '<span class="badge bg-warning">Admin</span>' : ''}
                </h6>
                <p class="card-text">
                    <small class="text-muted">
                        <i class="fas fa-envelope"></i> ${user.email}<br>
                        <i class="fas fa-id-card"></i> ID: ${user.id}
                    </small>
                </p>
                <button class="btn btn-sm btn-primary" onclick="document.getElementById('searchFilter').value='${user.firstName} ${user.lastName}'; bootstrap.Modal.getInstance(document.getElementById('usersModal')).hide(); loadCoupons();">
                    <i class="fas fa-filter"></i> Search by Name
                </button>
            </div>
        </div>
    `).join('');

    container.innerHTML = usersHtml;
}

function logout() {
    localStorage.removeItem('userData');
    currentUser = null;
    document.getElementById('mainApp').classList.add('d-none');
    document.getElementById('loginContainer').classList.remove('d-none');
    document.getElementById('loginForm').reset();
    document.getElementById('loginError').classList.add('d-none');
}

// Suggestion Functions
function showSuggestionModal() {
    document.getElementById('suggestionContent').value = '';
    const modal = new bootstrap.Modal(document.getElementById('suggestionModal'));
    modal.show();
}

async function submitSuggestion() {
    const content = document.getElementById('suggestionContent').value.trim();
    
    if (!content) {
        alert('Please enter a suggestion');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/suggestions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: currentUser.id,
                content: content
            })
        });

        const data = await response.json();
        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('suggestionModal')).hide();
            alert('Suggestion submitted successfully! Thank you for your suggestion.');
            document.getElementById('suggestionForm').reset();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        alert('Error submitting suggestion');
    }
}

async function loadSuggestions() {
    if (!currentUser.isAdmin) {
        alert('Access denied. Admin privileges required.');
        return;
    }
    
    try {
        const [suggestionsResponse, usersResponse] = await Promise.all([
            fetch(`${API_BASE}/suggestions`),
            fetch(`${API_BASE}/users`)
        ]);
        
        const suggestions = await suggestionsResponse.json();
        const users = await usersResponse.json();
        
        const userMap = users.reduce((map, user) => {
            map[user.id] = `${user.firstName} ${user.lastName}`;
            return map;
        }, {});
        
        displaySuggestions(suggestions, userMap);
        const modal = new bootstrap.Modal(document.getElementById('suggestionsModal'));
        modal.show();
    } catch (error) {
        console.error('Error loading suggestions:', error);
        alert('Error loading suggestions');
    }
}

function displaySuggestions(suggestions, userMap) {
    const container = document.getElementById('suggestionsContainer');
    
    if (suggestions.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-lightbulb fa-3x text-muted"></i>
                <p class="mt-3">No suggestions found</p>
            </div>
        `;
        return;
    }

    // Helper function to format date in American format
    function formatAmericanDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    const suggestionsHtml = suggestions.map(suggestion => {
        const userName = userMap[suggestion.userId] || 'Unknown User';
        
        return `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-10">
                            <p class="card-text">${suggestion.content}</p>
                            <small class="text-muted">
                                <i class="fas fa-user"></i> ${userName} (${suggestion.userId})<br>
                                <i class="fas fa-calendar"></i> ${formatAmericanDate(suggestion.createdAt)}
                            </small>
                        </div>
                        <div class="col-md-2 text-end">
                            <button class="btn btn-sm btn-danger" onclick="deleteSuggestion('${suggestion.id}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = suggestionsHtml;
}

async function deleteSuggestion(suggestionId) {
    if (!confirm('Are you sure you want to delete this suggestion?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/suggestions/${suggestionId}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        if (response.ok) {
            alert('Suggestion deleted successfully!');
            loadSuggestions(); // Reload the suggestions list
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        alert('Error deleting suggestion');
    }
}
