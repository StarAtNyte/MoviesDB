/**
 * Main Application Module
 * Initializes and coordinates all application components
 */

// Global state
window.allMovies = [];

// Initialize the application
function initializeApp() {
    console.log('Initializing MovieDB Application...');

    // Initialize Firebase
    if (!initializeFirebase()) {
        showConfigurationError();
        return;
    }

    // Initialize admin authentication
    initializeAdminAuth();

    // Initialize filters
    initializeFilters();

    // Initialize event listeners
    initializeEventListeners();

    // Subscribe to real-time movie updates
    subscribeToMovies((movies) => {
        window.allMovies = movies;
        console.log(`Loaded ${movies.length} movies from database`);

        // Update filters with new data
        updateGenreFilters(movies);
        updateCountryFilters(movies);
        updateDecadeFilters(movies);

        // Update stats
        updateStats(movies);

        // Render movies
        renderMovies();
    });

    console.log('Application initialized successfully');
}

// Initialize event listeners
function initializeEventListeners() {
    // Add movie button
    const addMovieBtn = document.getElementById('addMovieBtn');
    if (addMovieBtn) {
        addMovieBtn.addEventListener('click', showAddMovieModal);
    }

    // Settings button
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', showSettingsModal);
    }

    // Random pick button
    const randomBtn = document.getElementById('randomPick');
    if (randomBtn) {
        randomBtn.addEventListener('click', pickRandomMovie);
    }

    // Export data button
    const exportBtn = document.getElementById('exportData');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }

    // Pending movies button (admin only)
    const pendingMoviesBtn = document.getElementById('pendingMoviesBtn');
    if (pendingMoviesBtn) {
        pendingMoviesBtn.addEventListener('click', showPendingMoviesModal);
    }

    // Mobile filter toggle
    const mobileFilterToggle = document.getElementById('mobileFilterToggle');
    const filtersSidebar = document.getElementById('filtersSidebar');
    const filterBackdrop = document.getElementById('filterBackdrop');
    const closeFiltersBtn = document.getElementById('closeFiltersBtn');

    if (mobileFilterToggle && filtersSidebar && filterBackdrop) {
        mobileFilterToggle.addEventListener('click', () => {
            filtersSidebar.classList.add('active');
            filterBackdrop.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        const closeFilters = () => {
            filtersSidebar.classList.remove('active');
            filterBackdrop.classList.remove('active');
            document.body.style.overflow = '';
        };

        if (closeFiltersBtn) {
            closeFiltersBtn.addEventListener('click', closeFilters);
        }

        filterBackdrop.addEventListener('click', closeFilters);
    }
}

// Toggle filter section (collapsible)
function toggleFilterSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.toggle('collapsed');
    }
}

// Render movies to the grid
function renderMovies() {
    const gridContainer = document.getElementById('movieGrid');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const resultCount = document.getElementById('resultCount');

    if (!gridContainer || !loadingState || !emptyState) return;

    // Hide loading state
    loadingState.style.display = 'none';

    // Apply filters and get movies to display
    const filteredMovies = applyFilters(window.allMovies);

    // Update result count
    resultCount.textContent = `Showing ${filteredMovies.length} ${filteredMovies.length === 1 ? 'title' : 'titles'}`;

    // Show empty state if no movies
    if (filteredMovies.length === 0) {
        gridContainer.classList.add('hidden');
        emptyState.classList.remove('hidden');
        emptyState.classList.add('flex');

        // Update empty state message based on filters
        const emptyMessage = document.getElementById('emptyStateMessage');
        if (window.allMovies.length === 0) {
            emptyMessage.textContent = 'Start building your collection by adding movies!';
        } else if (filterState.currentTab === 'watchlist') {
            emptyMessage.textContent = 'No movies in your watchlist yet. Add some movies you want to watch!';
        } else {
            emptyMessage.textContent = 'No movies found with current filters. Try adjusting your filters.';
        }

        return;
    }

    // Show grid and hide empty state
    emptyState.classList.add('hidden');
    emptyState.classList.remove('flex');
    gridContainer.classList.remove('hidden');

    // Render movie cards
    gridContainer.innerHTML = filteredMovies.map(movie => createMovieCard(movie)).join('');

    // Add click handlers to movie cards
    gridContainer.querySelectorAll('.movie-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // Don't open modal if clicking admin controls
            if (e.target.closest('.admin-controls')) return;

            const movieId = card.dataset.movieId;
            showMovieDetailModal(movieId);
        });
    });

    // Show admin controls if logged in
    if (isAdminLoggedIn()) {
        document.querySelectorAll('.admin-controls').forEach(el => {
            el.classList.remove('hidden');
            el.classList.add('flex');
        });
    }
}

// Show settings modal
function showSettingsModal() {
    const isAdmin = isAdminLoggedIn();

    const modal = createModal({
        title: 'Settings',
        content: `
            <div class="space-y-6">
                <!-- App Information -->
                <div>
                    <h3 class="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3">About</h3>
                    <div class="space-y-2 text-sm">
                        <p class="text-text-secondary">MovieDB - Personal Movie Library</p>
                        <p class="text-text-secondary">Total Movies: <span class="text-white font-bold">${window.allMovies.length}</span></p>
                        <p class="text-text-secondary">Watched: <span class="text-white font-bold">${window.allMovies.filter(m => m.status === 'watched').length}</span></p>
                        <p class="text-text-secondary">Watchlist: <span class="text-white font-bold">${window.allMovies.filter(m => m.status === 'watchlist').length}</span></p>
                    </div>
                </div>

                ${isAdmin ? `
                    <hr class="border-surface-border" />

                    <!-- Admin Actions -->
                    <div>
                        <h3 class="text-sm font-bold text-admin-accent uppercase tracking-wider mb-3">Admin Actions</h3>
                        <div class="space-y-2">
                            <button onclick="importDataPrompt()"
                                class="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-surface-dark border border-surface-border hover:border-primary text-white transition-colors">
                                <span class="flex items-center gap-2">
                                    <span class="material-symbols-outlined text-[20px]">upload</span>
                                    <span class="text-sm font-medium">Import Data</span>
                                </span>
                                <span class="material-symbols-outlined text-text-secondary">chevron_right</span>
                            </button>

                            <button onclick="exportData()"
                                class="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-surface-dark border border-surface-border hover:border-primary text-white transition-colors">
                                <span class="flex items-center gap-2">
                                    <span class="material-symbols-outlined text-[20px]">download</span>
                                    <span class="text-sm font-medium">Export Data</span>
                                </span>
                                <span class="material-symbols-outlined text-text-secondary">chevron_right</span>
                            </button>

                            <button onclick="showChangePasswordModal()"
                                class="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-surface-dark border border-surface-border hover:border-primary text-white transition-colors">
                                <span class="flex items-center gap-2">
                                    <span class="material-symbols-outlined text-[20px]">lock</span>
                                    <span class="text-sm font-medium">Change Password</span>
                                </span>
                                <span class="material-symbols-outlined text-text-secondary">chevron_right</span>
                            </button>

                            <button onclick="clearAllDataPrompt()"
                                class="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-red-900/20 border border-red-500/30 hover:border-red-500 text-red-400 transition-colors">
                                <span class="flex items-center gap-2">
                                    <span class="material-symbols-outlined text-[20px]">delete_forever</span>
                                    <span class="text-sm font-medium">Clear All Data</span>
                                </span>
                                <span class="material-symbols-outlined text-red-400/50">chevron_right</span>
                            </button>
                        </div>
                    </div>
                ` : ''}

                <hr class="border-surface-border" />

                <!-- Configuration Note -->
                <div class="bg-surface-dark border border-surface-border rounded-lg p-4">
                    <h3 class="text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">Configuration</h3>
                    <p class="text-xs text-text-secondary leading-relaxed">
                        To configure your Firebase and API keys, edit the <code class="px-1 py-0.5 bg-black/40 rounded text-primary">js/config.js</code> file.
                        ${!isAdmin ? `<br/><br/>Click the logo 5 times to access admin features.` : ''}
                    </p>
                </div>
            </div>
        `,
        buttons: [
            {
                text: 'Close',
                class: 'px-6 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-white hover:bg-white/5 transition-colors',
                onClick: (modalEl) => closeModal(modalEl)
            }
        ]
    });

    showModal(modal);
}

// Import data prompt
function importDataPrompt() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';

    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const confirmModal = createModal({
                title: 'Confirm Import',
                content: `
                    <div class="space-y-3">
                        <p class="text-text-secondary">Are you sure you want to import data from:</p>
                        <p class="text-white font-bold">${file.name}</p>
                        <div class="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 mt-3">
                            <p class="text-yellow-400 text-sm">⚠️ Warning: This will add all movies from the file to your database. Existing movies will not be affected.</p>
                        </div>
                    </div>
                `,
                buttons: [
                    {
                        text: 'Cancel',
                        class: 'px-6 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-white hover:bg-white/5 transition-colors',
                        onClick: (modalEl) => closeModal(modalEl)
                    },
                    {
                        text: 'Import',
                        class: 'px-8 py-2.5 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary-hover transition-all',
                        onClick: async (modalEl) => {
                            await importData(text);
                            closeModal(modalEl);
                        }
                    }
                ]
            });
            showModal(confirmModal);
        } catch (error) {
            showToast('Failed to read file', 'error');
        }
    };

    input.click();
}

// Clear all data prompt
function clearAllDataPrompt() {
    const modal = createModal({
        title: 'Clear All Data',
        content: `
            <div class="space-y-3">
                <div class="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                    <p class="text-red-400 font-bold mb-2">⚠️ DANGER ZONE</p>
                    <p class="text-text-secondary text-sm">This will permanently delete ALL movies from your database. This action cannot be undone!</p>
                </div>
                <p class="text-text-secondary text-sm">Type <code class="px-2 py-1 bg-black/40 rounded text-red-400 font-mono">DELETE</code> to confirm:</p>
                <input
                    type="text"
                    id="confirmDeleteInput"
                    class="w-full bg-surface-dark border border-red-500/30 rounded-lg px-4 py-2.5 text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Type DELETE to confirm"
                />
            </div>
        `,
        buttons: [
            {
                text: 'Cancel',
                class: 'px-6 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-white hover:bg-white/5 transition-colors',
                onClick: (modalEl) => closeModal(modalEl)
            },
            {
                text: 'Delete Everything',
                class: 'px-8 py-2.5 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-all',
                onClick: async (modalEl) => {
                    const input = modalEl.querySelector('#confirmDeleteInput');
                    if (input.value !== 'DELETE') {
                        showToast('Confirmation text does not match', 'error');
                        return;
                    }
                    await clearAllData();
                    closeModal(modalEl);
                }
            }
        ]
    });

    showModal(modal);
}

// Show pending movies modal (Admin only)
function showPendingMoviesModal() {
    if (!isAdminLoggedIn()) {
        showToast('Admin access required', 'error');
        return;
    }

    // Fetch pending movies
    subscribeToPendingMovies((pendingMovies) => {
        const modal = createModal({
            title: `Pending Movie Suggestions (${pendingMovies.length})`,
            content: `
                <div class="space-y-4">
                    ${pendingMovies.length === 0 ? `
                        <div class="flex flex-col items-center justify-center py-12 text-text-secondary">
                            <span class="material-symbols-outlined text-[60px] mb-2">inbox</span>
                            <p class="text-sm">No pending movie suggestions</p>
                        </div>
                    ` : `
                        <div class="max-h-[60vh] overflow-y-auto space-y-3">
                            ${pendingMovies.map(movie => `
                                <div class="flex items-start gap-4 p-4 bg-surface-dark rounded-lg border border-surface-border hover:border-primary transition-colors">
                                    <img src="${movie.poster_path || 'https://via.placeholder.com/100x150/241a30/ab9db9?text=No+Poster'}"
                                        alt="${movie.title}"
                                        class="w-20 h-30 object-cover rounded-lg shrink-0" />
                                    <div class="flex-1 min-w-0">
                                        <h3 class="text-white font-bold truncate">${movie.title}</h3>
                                        <p class="text-text-secondary text-sm mt-1">${movie.year || 'N/A'}</p>
                                        <div class="flex flex-wrap gap-1.5 mt-2">
                                            ${movie.genres && movie.genres.length > 0 ? movie.genres.slice(0, 3).map(genre => `
                                                <span class="text-xs px-2 py-0.5 rounded bg-surface-border text-text-secondary">${genre}</span>
                                            `).join('') : ''}
                                        </div>
                                        <p class="text-xs text-text-secondary mt-2">
                                            Status: <span class="text-primary font-semibold">${movie.status === 'watched' ? 'Watched' : 'Watchlist'}</span>
                                        </p>
                                    </div>
                                    <div class="flex flex-col gap-2 shrink-0">
                                        <button onclick="handleApprovePendingMovie('${movie.id}')"
                                            class="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors">
                                            <span class="material-symbols-outlined text-[16px]">check</span>
                                            Approve
                                        </button>
                                        <button onclick="handleRejectPendingMovie('${movie.id}', '${movie.title.replace(/'/g, "\\'")}')"
                                            class="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors">
                                            <span class="material-symbols-outlined text-[16px]">close</span>
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            `,
            buttons: [
                {
                    text: 'Close',
                    class: 'px-6 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-white hover:bg-white/5 transition-colors',
                    onClick: (modalEl) => closeModal(modalEl)
                }
            ],
            large: true
        });

        showModal(modal);
    });
}

// Handle approve pending movie
async function handleApprovePendingMovie(pendingMovieId) {
    if (!isAdminLoggedIn()) {
        showToast('Admin access required', 'error');
        return;
    }

    try {
        await approvePendingMovie(pendingMovieId);
        // Close and reopen modal to refresh
        const modal = document.querySelector('.modal-backdrop');
        if (modal) {
            closeModal(modal);
            setTimeout(() => showPendingMoviesModal(), 300);
        }
    } catch (error) {
        console.error('Error approving pending movie:', error);
    }
}

// Handle reject pending movie
async function handleRejectPendingMovie(pendingMovieId, movieTitle) {
    if (!isAdminLoggedIn()) {
        showToast('Admin access required', 'error');
        return;
    }

    try {
        await rejectPendingMovie(pendingMovieId, movieTitle);
        // Close and reopen modal to refresh
        const modal = document.querySelector('.modal-backdrop');
        if (modal) {
            closeModal(modal);
            setTimeout(() => showPendingMoviesModal(), 300);
        }
    } catch (error) {
        console.error('Error rejecting pending movie:', error);
    }
}

// Show configuration error
function showConfigurationError() {
    const loadingState = document.getElementById('loadingState');
    const gridContainer = document.getElementById('movieGrid');
    const emptyState = document.getElementById('emptyState');

    if (loadingState) loadingState.style.display = 'none';
    if (gridContainer) gridContainer.classList.add('hidden');

    if (emptyState) {
        emptyState.classList.remove('hidden');
        emptyState.classList.add('flex');
        emptyState.innerHTML = `
            <span class="material-symbols-outlined text-[80px] text-red-400 mb-4">error</span>
            <h3 class="text-xl font-bold text-white mb-2">Configuration Required</h3>
            <p class="text-text-secondary text-center max-w-md mb-4">
                Please configure your Firebase and API keys in <code class="px-2 py-1 bg-black/40 rounded text-primary">js/config.js</code>
            </p>
            <div class="bg-surface-dark border border-surface-border rounded-lg p-4 max-w-md text-left">
                <p class="text-xs text-text-secondary leading-relaxed">
                    <strong class="text-white">Required:</strong><br/>
                    1. Firebase configuration (firebase.google.com)<br/>
                    2. TMDb API key (themoviedb.org/settings/api)<br/>
                    3. OMDb API key (omdbapi.com/apikey.aspx)
                </p>
            </div>
        `;
    }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
