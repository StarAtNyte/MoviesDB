/**
 * Admin Authentication Module
 * Handles admin login/logout and session management
 */

const ADMIN_SESSION_KEY = 'moviedb_admin_session';
const ADMIN_SESSION_EXPIRY_KEY = 'moviedb_admin_expiry';

// Check if user is currently logged in as admin
function isAdminLoggedIn() {
    const session = sessionStorage.getItem(ADMIN_SESSION_KEY);
    const expiry = sessionStorage.getItem(ADMIN_SESSION_EXPIRY_KEY);

    if (!session || !expiry) {
        return false;
    }

    // Check if session has expired
    if (Date.now() > parseInt(expiry)) {
        logoutAdmin();
        return false;
    }

    return session === 'active';
}

// Login as admin
async function loginAdmin(password) {
    try {
        const passwordHash = await simpleHash(password);

        // Check against configured password hash
        if (passwordHash === APP_CONFIG.adminPasswordHash) {
            const expiryTime = Date.now() + APP_CONFIG.sessionTimeout;
            sessionStorage.setItem(ADMIN_SESSION_KEY, 'active');
            sessionStorage.setItem(ADMIN_SESSION_EXPIRY_KEY, expiryTime.toString());

            enableAdminMode();
            showToast('Logged in as admin successfully!', 'success');
            return true;
        } else {
            showToast('Incorrect password', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error logging in:', error);
        showToast('Login failed', 'error');
        return false;
    }
}

// Logout admin
function logoutAdmin() {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    sessionStorage.removeItem(ADMIN_SESSION_EXPIRY_KEY);
    disableAdminMode();
    showToast('Logged out successfully', 'success');
}

// Enable admin mode UI
function enableAdminMode() {
    document.body.classList.add('admin-mode');

    // Show admin indicator
    const indicator = document.getElementById('adminIndicator');
    if (indicator) {
        indicator.classList.remove('hidden');
    }

    // Update add movie button text
    const addMovieBtnText = document.getElementById('addMovieBtnText');
    if (addMovieBtnText) {
        addMovieBtnText.textContent = 'Add New Movie';
    }

    // Show pending movies button
    const pendingBtn = document.getElementById('pendingMoviesBtn');
    if (pendingBtn) {
        pendingBtn.classList.remove('hidden');
    }

    // Show edit/delete buttons on movie cards
    document.querySelectorAll('.admin-controls').forEach(el => {
        el.classList.remove('hidden');
        el.classList.add('flex');
    });

    // Update admin link text
    const adminLink = document.getElementById('adminLink');
    if (adminLink) {
        adminLink.textContent = 'Logout';
    }

    // Subscribe to pending movies
    subscribeToPendingMovies((pendingMovies) => {
        const pendingCount = document.getElementById('pendingCount');
        if (pendingCount) {
            if (pendingMovies.length > 0) {
                pendingCount.textContent = pendingMovies.length;
                pendingCount.classList.remove('hidden');
            } else {
                pendingCount.classList.add('hidden');
            }
        }
    });

    console.log('Admin mode enabled');
}

// Disable admin mode UI
function disableAdminMode() {
    document.body.classList.remove('admin-mode');

    // Hide admin indicator
    const indicator = document.getElementById('adminIndicator');
    if (indicator) {
        indicator.classList.add('hidden');
    }

    // Update add movie button text back to suggest
    const addMovieBtnText = document.getElementById('addMovieBtnText');
    if (addMovieBtnText) {
        addMovieBtnText.textContent = 'Suggest Movie';
    }

    // Hide pending movies button
    const pendingBtn = document.getElementById('pendingMoviesBtn');
    if (pendingBtn) {
        pendingBtn.classList.add('hidden');
    }

    // Hide edit/delete buttons on movie cards
    document.querySelectorAll('.admin-controls').forEach(el => {
        el.classList.add('hidden');
        el.classList.remove('flex');
    });

    // Update admin link text
    const adminLink = document.getElementById('adminLink');
    if (adminLink) {
        adminLink.textContent = 'Admin';
    }

    console.log('Admin mode disabled');
}

// Show admin login modal
function showAdminLoginModal() {
    const modal = createModal({
        title: 'Admin Login',
        content: `
            <div class="space-y-4">
                <p class="text-text-secondary text-sm">Enter admin password to access admin features</p>
                <div class="space-y-2">
                    <label class="text-xs font-semibold uppercase tracking-wider text-text-secondary">Password</label>
                    <input
                        type="password"
                        id="adminPasswordInput"
                        class="w-full bg-surface-dark border border-surface-border rounded-lg px-4 py-2.5 text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        placeholder="Enter password"
                        autocomplete="current-password"
                    />
                </div>
                <div id="loginError" class="hidden text-red-400 text-sm"></div>
            </div>
        `,
        buttons: [
            {
                text: 'Cancel',
                class: 'px-6 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-white hover:bg-white/5 transition-colors',
                onClick: () => closeModal(modal)
            },
            {
                text: 'Login',
                class: 'px-8 py-2.5 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary-hover shadow-lg transition-all',
                onClick: async () => {
                    const passwordInput = document.getElementById('adminPasswordInput');
                    const password = passwordInput.value.trim();

                    if (!password) {
                        const errorDiv = document.getElementById('loginError');
                        errorDiv.textContent = 'Please enter a password';
                        errorDiv.classList.remove('hidden');
                        return;
                    }

                    const success = await loginAdmin(password);
                    if (success) {
                        closeModal(modal);
                    } else {
                        const errorDiv = document.getElementById('loginError');
                        errorDiv.textContent = 'Incorrect password';
                        errorDiv.classList.remove('hidden');
                        passwordInput.value = '';
                        passwordInput.focus();
                    }
                }
            }
        ]
    });

    showModal(modal);

    // Focus password input
    setTimeout(() => {
        const passwordInput = document.getElementById('adminPasswordInput');
        if (passwordInput) {
            passwordInput.focus();

            // Handle Enter key
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const loginBtn = modal.querySelector('button:last-child');
                    loginBtn.click();
                }
            });
        }
    }, 100);
}

// Logo click counter for secret admin access
let logoClickCount = 0;
let logoClickTimeout = null;

function initializeLogoClickHandler() {
    const logo = document.getElementById('logoClick');
    if (!logo) return;

    logo.addEventListener('click', () => {
        logoClickCount++;

        // Reset counter after 3 seconds of no clicks
        clearTimeout(logoClickTimeout);
        logoClickTimeout = setTimeout(() => {
            logoClickCount = 0;
        }, 3000);

        // Show login modal after required number of clicks
        if (logoClickCount >= APP_CONFIG.logoClicksForAdmin) {
            logoClickCount = 0;
            if (!isAdminLoggedIn()) {
                showAdminLoginModal();
            } else {
                showToast('Already logged in as admin', 'info');
            }
        }
    });
}

// Admin link click handler
function initializeAdminLinkHandler() {
    const adminLink = document.getElementById('adminLink');
    if (!adminLink) return;

    adminLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (isAdminLoggedIn()) {
            // Show logout confirmation
            const modal = createModal({
                title: 'Logout',
                content: '<p class="text-text-secondary">Are you sure you want to logout from admin mode?</p>',
                buttons: [
                    {
                        text: 'Cancel',
                        class: 'px-6 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-white hover:bg-white/5 transition-colors',
                        onClick: (modalEl) => closeModal(modalEl)
                    },
                    {
                        text: 'Logout',
                        class: 'px-8 py-2.5 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-all',
                        onClick: (modalEl) => {
                            logoutAdmin();
                            closeModal(modalEl);
                        }
                    }
                ]
            });
            showModal(modal);
        } else {
            showAdminLoginModal();
        }
    });
}

// Change admin password (Admin only)
function showChangePasswordModal() {
    if (!isAdminLoggedIn()) {
        showToast('Admin access required', 'error');
        return;
    }

    const modal = createModal({
        title: 'Change Admin Password',
        content: `
            <div class="space-y-4">
                <div class="space-y-2">
                    <label class="text-xs font-semibold uppercase tracking-wider text-text-secondary">Current Password</label>
                    <input
                        type="password"
                        id="currentPassword"
                        class="w-full bg-surface-dark border border-surface-border rounded-lg px-4 py-2.5 text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        placeholder="Enter current password"
                    />
                </div>
                <div class="space-y-2">
                    <label class="text-xs font-semibold uppercase tracking-wider text-text-secondary">New Password</label>
                    <input
                        type="password"
                        id="newPassword"
                        class="w-full bg-surface-dark border border-surface-border rounded-lg px-4 py-2.5 text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        placeholder="Enter new password"
                    />
                </div>
                <div class="space-y-2">
                    <label class="text-xs font-semibold uppercase tracking-wider text-text-secondary">Confirm New Password</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        class="w-full bg-surface-dark border border-surface-border rounded-lg px-4 py-2.5 text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        placeholder="Confirm new password"
                    />
                </div>
                <div id="passwordError" class="hidden text-red-400 text-sm"></div>
            </div>
        `,
        buttons: [
            {
                text: 'Cancel',
                class: 'px-6 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-white hover:bg-white/5 transition-colors',
                onClick: (modalEl) => closeModal(modalEl)
            },
            {
                text: 'Update Password',
                class: 'px-8 py-2.5 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary-hover shadow-lg transition-all',
                onClick: async (modalEl) => {
                    const current = document.getElementById('currentPassword').value;
                    const newPass = document.getElementById('newPassword').value;
                    const confirm = document.getElementById('confirmPassword').value;
                    const errorDiv = document.getElementById('passwordError');

                    if (!current || !newPass || !confirm) {
                        errorDiv.textContent = 'All fields are required';
                        errorDiv.classList.remove('hidden');
                        return;
                    }

                    if (newPass !== confirm) {
                        errorDiv.textContent = 'New passwords do not match';
                        errorDiv.classList.remove('hidden');
                        return;
                    }

                    if (newPass.length < 6) {
                        errorDiv.textContent = 'Password must be at least 6 characters';
                        errorDiv.classList.remove('hidden');
                        return;
                    }

                    const currentHash = await simpleHash(current);
                    if (currentHash !== APP_CONFIG.adminPasswordHash) {
                        errorDiv.textContent = 'Current password is incorrect';
                        errorDiv.classList.remove('hidden');
                        return;
                    }

                    const newHash = await simpleHash(newPass);
                    console.log('New password hash:', newHash);
                    showToast('Password updated! Please update APP_CONFIG.adminPasswordHash in config.js with: ' + newHash, 'success');
                    closeModal(modalEl);
                }
            }
        ]
    });

    showModal(modal);
}

// Initialize admin authentication on page load
function initializeAdminAuth() {
    initializeLogoClickHandler();
    initializeAdminLinkHandler();

    // Check if already logged in
    if (isAdminLoggedIn()) {
        enableAdminMode();
    }
}
