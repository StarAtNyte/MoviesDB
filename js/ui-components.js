/**
 * UI Components Module
 * Handles modal creation, toasts, and other UI elements
 */

// Create and show a toast notification
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };

    const colors = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        warning: 'bg-yellow-600',
        info: 'bg-blue-600'
    };

    const toast = document.createElement('div');
    toast.className = `toast flex items-center gap-3 px-6 py-4 rounded-lg ${colors[type]} text-white shadow-lg min-w-[300px] max-w-md`;
    toast.innerHTML = `
        <span class="text-xl font-bold">${icons[type]}</span>
        <span class="flex-1 text-sm font-medium">${message}</span>
        <button onclick="this.parentElement.remove()" class="text-white/80 hover:text-white transition-colors">
            <span class="material-symbols-outlined text-[20px]">close</span>
        </button>
    `;

    toastContainer.appendChild(toast);

    // Auto remove after duration
    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, APP_CONFIG.toastDuration);
}

// Create a modal
function createModal({ title, content, buttons = [], large = false }) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';

    const maxWidth = large ? 'max-w-[900px]' : 'max-w-[600px]';

    backdrop.innerHTML = `
        <div class="modal-content relative w-full ${maxWidth} flex flex-col rounded-xl bg-[#141118] border border-surface-border shadow-2xl">
            <!-- Modal Header -->
            <div class="flex items-center justify-between px-6 pt-6 pb-2">
                <h2 class="text-white text-2xl font-bold leading-tight tracking-[-0.015em]">${title}</h2>
                <button class="modal-close group flex h-10 w-10 items-center justify-center rounded-full bg-transparent text-text-secondary hover:bg-surface-dark hover:text-white transition-colors duration-200">
                    <span class="material-symbols-outlined text-[24px]">close</span>
                </button>
            </div>

            <!-- Modal Content -->
            <div class="modal-body px-6 py-4 flex-1 overflow-y-auto max-h-[70vh]">
                ${content}
            </div>

            <!-- Modal Footer -->
            ${buttons.length > 0 ? `
                <div class="modal-footer p-4 border-t border-surface-border flex justify-end gap-3 bg-[#141118] rounded-b-xl">
                    ${buttons.map((btn, idx) => `
                        <button data-modal-btn="${idx}" class="${btn.class}">${btn.text}</button>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `;

    // Close on backdrop click
    backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
            closeModal(backdrop);
        }
    });

    // Close button
    const closeBtn = backdrop.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => closeModal(backdrop));

    // Attach button handlers
    buttons.forEach((btn, idx) => {
        const btnEl = backdrop.querySelector(`[data-modal-btn="${idx}"]`);
        if (btnEl && btn.onClick) {
            btnEl.addEventListener('click', () => btn.onClick(backdrop));
        }
    });

    // Close on Escape key
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeModal(backdrop);
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);

    return backdrop;
}

// Show modal
function showModal(modal) {
    document.body.appendChild(modal);
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

// Close modal
function closeModal(modal) {
    modal.style.animation = 'fadeOut 0.2s ease-out';
    setTimeout(() => {
        modal.remove();
        // Re-enable body scroll if no other modals
        if (!document.querySelector('.modal-backdrop')) {
            document.body.style.overflow = '';
        }
    }, 200);
}

// Create movie card HTML
function createMovieCard(movie) {
    const isAdmin = isAdminLoggedIn();
    const posterUrl = movie.poster_path || 'https://via.placeholder.com/500x750/241a30/ab9db9?text=No+Poster';

    // Generate star rating HTML (supports 0.5 increments)
    const maxStars = 5;
    const rating = movie.admin_rating || 0;
    const fullStars = Math.floor(rating / 2);
    const hasHalfStar = (rating % 2) >= 0.5;
    const emptyStars = maxStars - fullStars - (hasHalfStar ? 1 : 0);

    let starsHTML = '';
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<span class="material-symbols-outlined text-[16px] fill-1" style="font-variation-settings: \'FILL\' 1;">star</span>';
    }
    if (hasHalfStar) {
        starsHTML += '<span class="material-symbols-outlined text-[16px] fill-1" style="font-variation-settings: \'FILL\' 1;">star_half</span>';
    }
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<span class="material-symbols-outlined text-[16px] text-white/20">star</span>';
    }

    return `
        <div class="movie-card group flex flex-col gap-3 cursor-pointer" data-movie-id="${movie.id}">
            <div class="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-surface-dark shadow-lg ring-1 ring-white/5 transition-all duration-300 group-hover:scale-[1.02] group-hover:ring-white/20 group-hover:shadow-xl group-hover:shadow-primary/10">
                <img class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    src="${posterUrl}"
                    alt="${movie.title} poster"
                    loading="lazy"
                />
                ${movie.imdb_rating ? `
                    <div class="absolute top-2 right-2 rounded bg-secondary px-1.5 py-0.5 text-xs font-bold text-black shadow-sm">
                        ${movie.imdb_rating}
                    </div>
                ` : ''}
                ${movie.country && movie.country !== 'Unknown' ? `
                    <div class="absolute bottom-2 left-2 rounded bg-black/60 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-bold text-white flex items-center gap-1">
                        ${movie.country}
                    </div>
                ` : ''}

                ${isAdmin ? `
                    <div class="admin-controls hidden absolute top-2 left-2 flex gap-2">
                        <button onclick="event.stopPropagation(); editMovie('${movie.id}')"
                            class="flex h-8 w-8 items-center justify-center rounded-full bg-primary hover:bg-primary-hover text-white shadow-lg transition-all hover:scale-110">
                            <span class="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button onclick="event.stopPropagation(); deleteMoviePrompt('${movie.id}', '${movie.title.replace(/'/g, "\\'")}')"
                            class="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg transition-all hover:scale-110">
                            <span class="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                    </div>
                ` : ''}
            </div>
            <div class="space-y-1.5">
                <div class="flex items-start justify-between gap-2">
                    <h4 class="font-bold text-white leading-tight truncate group-hover:text-primary transition-colors">
                        ${movie.title}
                    </h4>
                    <span class="text-sm text-text-secondary shrink-0">${movie.year || 'N/A'}</span>
                </div>
                <div class="flex flex-wrap gap-1.5">
                    ${movie.genres && movie.genres.length > 0 ? movie.genres.slice(0, 3).map(genre => `
                        <span class="rounded px-1.5 py-0.5 bg-surface-dark text-[10px] font-medium text-text-secondary border border-surface-border">
                            ${genre}
                        </span>
                    `).join('') : ''}
                </div>
                <div class="flex items-center justify-between pt-1">
                    <div class="flex items-center text-primary">
                        ${starsHTML}
                    </div>
                    <div class="flex items-center gap-2">
                        ${movie.notes ? `
                            <span class="material-symbols-outlined text-[14px] text-text-secondary cursor-help" title="Has notes">description</span>
                        ` : ''}
                        ${movie.date_watched ? `
                            <span class="text-[10px] text-text-secondary">${formatDate(movie.date_watched)}</span>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
}

// Show movie detail modal
function showMovieDetailModal(movieId) {
    const movie = window.allMovies.find(m => m.id === movieId);
    if (!movie) return;

    const isAdmin = isAdminLoggedIn();
    const posterUrl = movie.poster_path || 'https://via.placeholder.com/500x750/241a30/ab9db9?text=No+Poster';

    const modal = createModal({
        title: '', // We'll use custom header in content
        content: `
            <div class="flex flex-col md:flex-row gap-6 -mt-4">
                <!-- Poster -->
                <div class="md:w-[300px] shrink-0">
                    <img src="${posterUrl}" alt="${movie.title} poster"
                        class="w-full rounded-lg shadow-lg" />
                </div>

                <!-- Details -->
                <div class="flex-1 space-y-4">
                    <!-- Title & Year -->
                    <div>
                        <h1 class="text-3xl md:text-4xl font-bold text-white leading-tight">${movie.title}</h1>
                        <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-text-secondary">
                            ${movie.year ? `<span>${movie.year}</span>` : ''}
                            ${movie.runtime ? `
                                <span class="w-1 h-1 rounded-full bg-white/20"></span>
                                <span>${movie.runtime} min</span>
                            ` : ''}
                            ${movie.country ? `
                                <span class="w-1 h-1 rounded-full bg-white/20"></span>
                                <span>${movie.country}</span>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Genres & Ratings -->
                    <div class="space-y-3">
                        ${movie.genres && movie.genres.length > 0 ? `
                            <div class="flex flex-wrap gap-2">
                                ${movie.genres.map(genre => `
                                    <span class="px-3 py-1 rounded-full bg-surface-dark border border-surface-border text-xs font-medium text-white/90">
                                        ${genre}
                                    </span>
                                `).join('')}
                            </div>
                        ` : ''}

                        <div class="flex gap-4">
                            ${movie.imdb_rating ? `
                                <div class="flex items-center gap-2 bg-secondary/20 px-3 py-1.5 rounded-lg">
                                    <span class="text-xs font-semibold text-secondary">IMDb</span>
                                    <span class="text-sm font-bold text-white">${movie.imdb_rating}</span>
                                </div>
                            ` : ''}
                            ${movie.letterboxd_rating ? `
                                <div class="flex items-center gap-2 bg-primary/20 px-3 py-1.5 rounded-lg">
                                    <span class="text-xs font-semibold text-primary">Letterboxd</span>
                                    <span class="text-sm font-bold text-white">${movie.letterboxd_rating}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Plot -->
                    ${movie.plot ? `
                        <div>
                            <h3 class="text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">Overview</h3>
                            <p class="text-sm text-text-secondary leading-relaxed">${movie.plot}</p>
                        </div>
                    ` : ''}

                    <hr class="border-surface-border" />

                    <!-- Editable Fields (Admin) or Read-only (Public) -->
                    ${isAdmin ? createEditableFields(movie) : createReadOnlyFields(movie)}
                </div>
            </div>
        `,
        buttons: isAdmin ? [
            {
                text: 'Delete',
                class: 'px-6 py-2.5 rounded-lg text-sm font-medium text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors',
                onClick: () => {
                    closeModal(modal);
                    deleteMoviePrompt(movieId, movie.title);
                }
            },
            {
                text: 'Close',
                class: 'px-6 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-white hover:bg-white/5 transition-colors',
                onClick: () => closeModal(modal)
            },
            {
                text: 'Save Changes',
                class: 'px-8 py-2.5 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary-hover shadow-lg transition-all',
                onClick: () => saveMovieChanges(movieId, modal)
            }
        ] : [
            {
                text: 'Close',
                class: 'px-6 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-white hover:bg-white/5 transition-colors',
                onClick: () => closeModal(modal)
            }
        ],
        large: true
    });

    showModal(modal);

    // Setup star rating if admin
    if (isAdmin) {
        setupStarRating(modal, movie.admin_rating || 0);
    }
}

// Create editable fields for admin
function createEditableFields(movie) {
    return `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <!-- Your Rating -->
                <div class="space-y-2">
                    <label class="text-xs font-semibold uppercase tracking-wider text-text-secondary">Your Rating</label>
                    <div id="starRating" class="star-rating interactive flex items-center gap-1 text-primary cursor-pointer">
                        <!-- Stars will be set by JavaScript -->
                    </div>
                    <input type="hidden" id="ratingValue" value="${movie.admin_rating || 0}" />
                </div>

                <!-- Letterboxd Rating -->
                <div class="space-y-2">
                    <label class="text-xs font-semibold uppercase tracking-wider text-text-secondary">Letterboxd Rating</label>
                    <input type="text" id="letterboxdRating" value="${movie.letterboxd_rating || ''}"
                        class="w-full bg-surface-dark border border-surface-border rounded-lg px-4 py-2.5 text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="e.g. 4.5" />
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <!-- Status -->
                <div class="space-y-2">
                    <label class="text-xs font-semibold uppercase tracking-wider text-text-secondary">Status</label>
                    <select id="movieStatus"
                        class="w-full bg-surface-dark border border-surface-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary">
                        <option value="watched" ${movie.status === 'watched' ? 'selected' : ''}>Watched</option>
                        <option value="watchlist" ${movie.status === 'watchlist' ? 'selected' : ''}>Watchlist</option>
                    </select>
                </div>

                <!-- Date Watched -->
                <div class="space-y-2">
                    <label class="text-xs font-semibold uppercase tracking-wider text-text-secondary">Date Watched</label>
                    <input type="date" id="dateWatched" value="${movie.date_watched || ''}"
                        class="w-full bg-surface-dark border border-surface-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary [color-scheme:dark]" />
                </div>
            </div>

            <!-- Notes -->
            <div class="space-y-2">
                <label class="text-xs font-semibold uppercase tracking-wider text-text-secondary">Personal Notes</label>
                <textarea id="movieNotes" rows="4"
                    class="w-full bg-surface-dark border border-surface-border rounded-lg px-4 py-3 text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm leading-relaxed"
                    placeholder="Write your thoughts...">${movie.notes || ''}</textarea>
            </div>
        </div>
    `;
}

// Create read-only fields for public users
function createReadOnlyFields(movie) {
    return `
        <div class="space-y-3">
            ${movie.admin_rating ? `
                <div>
                    <span class="text-xs font-semibold uppercase tracking-wider text-text-secondary">Rating</span>
                    <div class="mt-1 flex items-center gap-1 text-primary">
                        ${createStarHTML(movie.admin_rating)}
                    </div>
                </div>
            ` : ''}
            ${movie.date_watched ? `
                <div>
                    <span class="text-xs font-semibold uppercase tracking-wider text-text-secondary">Watched</span>
                    <p class="mt-1 text-white">${new Date(movie.date_watched).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
            ` : ''}
            ${movie.notes ? `
                <div>
                    <span class="text-xs font-semibold uppercase tracking-wider text-text-secondary">Notes</span>
                    <p class="mt-1 text-text-secondary text-sm leading-relaxed">${movie.notes}</p>
                </div>
            ` : ''}
        </div>
    `;
}

// Create star HTML for display (supports 0.5 increments)
function createStarHTML(rating) {
    const maxStars = 5;
    const fullStars = Math.floor(rating / 2);
    const hasHalfStar = (rating % 2) >= 0.5;
    const emptyStars = maxStars - fullStars - (hasHalfStar ? 1 : 0);

    let html = '';
    for (let i = 0; i < fullStars; i++) {
        html += '<span class="material-symbols-outlined text-[20px] fill-1" style="font-variation-settings: \'FILL\' 1;">star</span>';
    }
    if (hasHalfStar) {
        html += '<span class="material-symbols-outlined text-[20px] fill-1" style="font-variation-settings: \'FILL\' 1;">star_half</span>';
    }
    for (let i = 0; i < emptyStars; i++) {
        html += '<span class="material-symbols-outlined text-[20px] text-white/20">star</span>';
    }
    return html;
}

// Setup interactive star rating (supports 0.5 increments)
function setupStarRating(modal, currentRating) {
    const container = modal.querySelector('#starRating');
    const input = modal.querySelector('#ratingValue');

    function updateStars(rating) {
        const fullStars = Math.floor(rating / 2);
        const hasHalfStar = (rating % 2) >= 0.5;
        const starElements = container.querySelectorAll('.star');

        starElements.forEach((star, idx) => {
            const starIcon = star.querySelector('.material-symbols-outlined');
            if (idx < fullStars) {
                // Full star
                starIcon.textContent = 'star';
                starIcon.classList.add('fill-1');
                starIcon.style.fontVariationSettings = "'FILL' 1";
                starIcon.style.color = '#7f13ec';
            } else if (idx === fullStars && hasHalfStar) {
                // Half star
                starIcon.textContent = 'star_half';
                starIcon.classList.add('fill-1');
                starIcon.style.fontVariationSettings = "'FILL' 1";
                starIcon.style.color = '#7f13ec';
            } else {
                // Empty star
                starIcon.textContent = 'star';
                starIcon.classList.remove('fill-1');
                starIcon.style.fontVariationSettings = "'FILL' 0";
                starIcon.style.color = 'rgba(255, 255, 255, 0.2)';
            }
        });

        input.value = rating;
    }

    function previewStars(rating) {
        const fullStars = Math.floor(rating / 2);
        const hasHalfStar = (rating % 2) >= 0.5;
        const starElements = container.querySelectorAll('.star');

        starElements.forEach((star, idx) => {
            const starIcon = star.querySelector('.material-symbols-outlined');
            if (idx < fullStars) {
                starIcon.textContent = 'star';
                starIcon.style.color = '#7f13ec';
            } else if (idx === fullStars && hasHalfStar) {
                starIcon.textContent = 'star_half';
                starIcon.style.color = '#7f13ec';
            } else {
                starIcon.textContent = 'star';
                starIcon.style.color = 'rgba(255, 255, 255, 0.2)';
            }
        });
    }

    // Create 5 stars with click zones for half-star support
    for (let i = 1; i <= 5; i++) {
        const starWrapper = document.createElement('div');
        starWrapper.className = 'star relative cursor-pointer';
        starWrapper.style.width = '28px';
        starWrapper.style.height = '28px';

        const starIcon = document.createElement('span');
        starIcon.className = 'material-symbols-outlined text-[28px] transition-all pointer-events-none';
        starIcon.textContent = 'star';
        starIcon.style.position = 'absolute';
        starIcon.style.top = '0';
        starIcon.style.left = '0';

        starWrapper.appendChild(starIcon);

        // Click handler - detect left half vs right half
        starWrapper.addEventListener('click', (e) => {
            const rect = starWrapper.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const halfWidth = rect.width / 2;

            // Left half = half star, right half = full star
            const rating = clickX < halfWidth ? (i * 2 - 1) : (i * 2);
            updateStars(rating);
        });

        // Hover preview
        starWrapper.addEventListener('mousemove', (e) => {
            const rect = starWrapper.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const halfWidth = rect.width / 2;

            const rating = clickX < halfWidth ? (i * 2 - 1) : (i * 2);
            previewStars(rating);
        });

        container.appendChild(starWrapper);
    }

    container.addEventListener('mouseleave', () => {
        updateStars(input.value);
    });

    // Set initial rating
    updateStars(currentRating);
}

// Save movie changes
async function saveMovieChanges(movieId, modal) {
    const updates = {
        admin_rating: parseFloat(modal.querySelector('#ratingValue').value) || null,
        letterboxd_rating: modal.querySelector('#letterboxdRating').value.trim() || null,
        status: modal.querySelector('#movieStatus').value,
        date_watched: modal.querySelector('#dateWatched').value || null,
        notes: modal.querySelector('#movieNotes').value.trim() || ''
    };

    try {
        await updateMovie(movieId, updates);
        closeModal(modal);
    } catch (error) {
        console.error('Error saving changes:', error);
    }
}

// Edit movie (shortcut function)
function editMovie(movieId) {
    showMovieDetailModal(movieId);
}

// Delete movie with confirmation
function deleteMoviePrompt(movieId, movieTitle) {
    const modal = createModal({
        title: 'Delete Movie',
        content: `
            <p class="text-text-secondary">Are you sure you want to delete <strong class="text-white">${movieTitle}</strong>?</p>
            <p class="text-text-secondary text-sm mt-2">This action cannot be undone.</p>
        `,
        buttons: [
            {
                text: 'Cancel',
                class: 'px-6 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-white hover:bg-white/5 transition-colors',
                onClick: (modalEl) => closeModal(modalEl)
            },
            {
                text: 'Delete',
                class: 'px-8 py-2.5 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-all',
                onClick: async (modalEl) => {
                    await deleteMovie(movieId, movieTitle);
                    closeModal(modalEl);
                }
            }
        ]
    });

    showModal(modal);
}
