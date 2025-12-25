/**
 * Filters and Sorting Module
 * Handles all filtering and sorting logic
 */

// Current filter state
const filterState = {
    genres: [],
    country: '',
    decades: [],
    minRating: 0,
    search: '',
    sort: 'date_watched',
    currentTab: 'watched'
};

// Apply all filters to movies array
function applyFilters(movies) {
    let filtered = movies.filter(movie => {
        // Tab filter (watched/watchlist)
        if (movie.status !== filterState.currentTab) {
            return false;
        }

        // Search filter
        if (filterState.search) {
            const searchLower = filterState.search.toLowerCase();
            const matchTitle = movie.title.toLowerCase().includes(searchLower);
            const matchGenres = movie.genres && movie.genres.some(g => g.toLowerCase().includes(searchLower));
            const matchCountry = movie.country && movie.country.toLowerCase().includes(searchLower);
            if (!matchTitle && !matchGenres && !matchCountry) {
                return false;
            }
        }

        // Genre filter
        if (filterState.genres.length > 0) {
            const hasGenre = movie.genres && filterState.genres.some(g => movie.genres.includes(g));
            if (!hasGenre) {
                return false;
            }
        }

        // Country filter
        if (filterState.country && movie.country !== filterState.country) {
            return false;
        }

        // Decade filter
        if (filterState.decades.length > 0) {
            if (!movie.year) return false;
            const decade = Math.floor(movie.year / 10) * 10;
            if (!filterState.decades.includes(decade)) {
                return false;
            }
        }

        // Rating filter (using IMDb or admin rating)
        if (filterState.minRating > 0) {
            const rating = parseFloat(movie.imdb_rating || movie.admin_rating || 0);
            if (rating < filterState.minRating) {
                return false;
            }
        }

        return true;
    });

    // Apply sorting
    filtered = applySort(filtered, filterState.sort);

    return filtered;
}

// Apply sorting to movies array
function applySort(movies, sortBy) {
    const sorted = [...movies];

    switch (sortBy) {
        case 'date_watched':
            sorted.sort((a, b) => {
                const dateA = a.date_watched ? new Date(a.date_watched) : new Date(0);
                const dateB = b.date_watched ? new Date(b.date_watched) : new Date(0);
                return dateB - dateA;
            });
            break;

        case 'admin_rating':
            sorted.sort((a, b) => {
                const ratingA = parseFloat(a.admin_rating || 0);
                const ratingB = parseFloat(b.admin_rating || 0);
                return ratingB - ratingA;
            });
            break;

        case 'imdb_rating':
            sorted.sort((a, b) => {
                const ratingA = parseFloat(a.imdb_rating || 0);
                const ratingB = parseFloat(b.imdb_rating || 0);
                return ratingB - ratingA;
            });
            break;

        case 'date_added':
            sorted.sort((a, b) => {
                const dateA = a.date_added ? a.date_added.toDate() : new Date(0);
                const dateB = b.date_added ? b.date_added.toDate() : new Date(0);
                return dateB - dateA;
            });
            break;

        case 'title':
            sorted.sort((a, b) => a.title.localeCompare(b.title));
            break;

        case 'year':
            sorted.sort((a, b) => (b.year || 0) - (a.year || 0));
            break;

        default:
            break;
    }

    return sorted;
}

// Get all unique genres from movies
function getAllGenres(movies) {
    const genresSet = new Set();
    movies.forEach(movie => {
        if (movie.genres && Array.isArray(movie.genres)) {
            movie.genres.forEach(genre => genresSet.add(genre));
        }
    });
    return Array.from(genresSet).sort();
}

// Get all unique countries from movies
function getAllCountries(movies) {
    const countriesSet = new Set();
    movies.forEach(movie => {
        if (movie.country && movie.country !== 'Unknown') {
            countriesSet.add(movie.country);
        }
    });
    return Array.from(countriesSet).sort();
}

// Get all unique decades from movies
function getAllDecades(movies) {
    const decadesSet = new Set();
    movies.forEach(movie => {
        if (movie.year) {
            const decade = Math.floor(movie.year / 10) * 10;
            decadesSet.add(decade);
        }
    });
    return Array.from(decadesSet).sort((a, b) => b - a);
}

// Update genre filter UI
function updateGenreFilters(movies) {
    const container = document.getElementById('genreFilters');
    if (!container) return;

    const genres = getAllGenres(movies);

    container.innerHTML = genres.map(genre => `
        <label class="flex items-center gap-3 cursor-pointer group">
            <input
                class="h-4 w-4 rounded border-surface-border bg-surface-dark text-primary focus:ring-offset-background-dark focus:ring-primary transition"
                type="checkbox"
                value="${genre}"
                ${filterState.genres.includes(genre) ? 'checked' : ''}
                onchange="toggleGenreFilter('${genre}')"
            />
            <span class="text-sm text-gray-300 group-hover:text-white">${genre}</span>
        </label>
    `).join('');
}

// Update country filter UI
function updateCountryFilters(movies) {
    const select = document.getElementById('countryFilter');
    if (!select) return;

    const countries = getAllCountries(movies);

    const currentValue = filterState.country;
    select.innerHTML = `
        <option value="">Any Country</option>
        ${countries.map(country => `
            <option value="${country}" ${country === currentValue ? 'selected' : ''}>${country}</option>
        `).join('')}
    `;
}

// Update decade filter UI
function updateDecadeFilters(movies) {
    const container = document.getElementById('decadeFilters');
    if (!container) return;

    const decades = getAllDecades(movies);

    container.innerHTML = decades.map(decade => `
        <label class="flex items-center gap-3 cursor-pointer group">
            <input
                class="h-4 w-4 rounded border-surface-border bg-surface-dark text-primary focus:ring-offset-background-dark focus:ring-primary transition"
                type="checkbox"
                value="${decade}"
                ${filterState.decades.includes(decade) ? 'checked' : ''}
                onchange="toggleDecadeFilter(${decade})"
            />
            <span class="text-sm text-gray-300 group-hover:text-white">${decade}s</span>
        </label>
    `).join('');
}

// Toggle genre filter
function toggleGenreFilter(genre) {
    const index = filterState.genres.indexOf(genre);
    if (index > -1) {
        filterState.genres.splice(index, 1);
    } else {
        filterState.genres.push(genre);
    }
    renderMovies();
}

// Toggle decade filter
function toggleDecadeFilter(decade) {
    const index = filterState.decades.indexOf(decade);
    if (index > -1) {
        filterState.decades.splice(index, 1);
    } else {
        filterState.decades.push(decade);
    }
    renderMovies();
}

// Clear all filters
function clearAllFilters() {
    filterState.genres = [];
    filterState.country = '';
    filterState.decades = [];
    filterState.minRating = 0;
    filterState.search = '';

    // Reset UI
    document.getElementById('searchInput').value = '';
    document.getElementById('countryFilter').value = '';
    document.getElementById('ratingFilter').value = 0;
    document.getElementById('ratingValue').textContent = '0.0';

    // Re-render filters and movies
    updateGenreFilters(window.allMovies);
    updateDecadeFilters(window.allMovies);
    renderMovies();
}

// Initialize filter event listeners
function initializeFilters() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            filterState.search = e.target.value.trim();
            renderMovies();
        }, APP_CONFIG.searchDebounce);
    });

    // Country filter
    const countryFilter = document.getElementById('countryFilter');
    countryFilter.addEventListener('change', (e) => {
        filterState.country = e.target.value;
        renderMovies();
    });

    // Rating filter
    const ratingFilter = document.getElementById('ratingFilter');
    const ratingValue = document.getElementById('ratingValue');
    ratingFilter.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        filterState.minRating = value;
        ratingValue.textContent = value.toFixed(1);
        renderMovies();
    });

    // Clear filters button
    const clearBtn = document.getElementById('clearFilters');
    clearBtn.addEventListener('click', clearAllFilters);

    // Sort select
    const sortSelect = document.getElementById('sortSelect');
    sortSelect.addEventListener('change', (e) => {
        filterState.sort = e.target.value;
        renderMovies();
    });

    // Tab buttons
    const watchedTab = document.getElementById('watchedTab');
    const watchlistTab = document.getElementById('watchlistTab');

    watchedTab.addEventListener('click', () => {
        filterState.currentTab = 'watched';
        switchTab('watched');
        clearAllFilters(); // Clear filters when switching tabs
        renderMovies();
    });

    watchlistTab.addEventListener('click', () => {
        filterState.currentTab = 'watchlist';
        switchTab('watchlist');
        clearAllFilters(); // Clear filters when switching tabs
        renderMovies();
    });

    // Home navigation link
    const navHome = document.getElementById('navHome');
    if (navHome) {
        navHome.addEventListener('click', () => {
            // Reset to watched tab and clear filters
            filterState.currentTab = 'watched';
            switchTab('watched');
            clearAllFilters();
            renderMovies();

            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

// Switch active tab
function switchTab(tab) {
    const watchedTab = document.getElementById('watchedTab');
    const watchlistTab = document.getElementById('watchlistTab');

    // Remove active from both first to ensure clean state
    watchedTab.classList.remove('active');
    watchlistTab.classList.remove('active');

    // Add active to the selected tab
    if (tab === 'watched') {
        watchedTab.classList.add('active');
    } else if (tab === 'watchlist') {
        watchlistTab.classList.add('active');
    }
}

// Calculate and update stats
function updateStats(movies) {
    // Total counts
    const watchedCount = movies.filter(m => m.status === 'watched').length;
    const watchlistCount = movies.filter(m => m.status === 'watchlist').length;

    document.getElementById('watchedCount').textContent = watchedCount;
    document.getElementById('watchlistCount').textContent = watchlistCount;

    // Average rating
    const watchedMovies = movies.filter(m => m.status === 'watched');
    const ratingsWithValue = watchedMovies.filter(m => m.admin_rating > 0);
    const avgRating = ratingsWithValue.length > 0
        ? ratingsWithValue.reduce((sum, m) => sum + m.admin_rating, 0) / ratingsWithValue.length
        : 0;

    document.getElementById('avgRating').textContent = avgRating > 0 ? avgRating.toFixed(1) : '-';

    // Watched this month
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const watchedThisMonth = watchedMovies.filter(m => {
        if (!m.date_watched) return false;
        const watchDate = new Date(m.date_watched);
        return watchDate.getMonth() === thisMonth && watchDate.getFullYear() === thisYear;
    }).length;

    document.getElementById('monthCount').textContent = watchedThisMonth;
}

// Random movie picker
function pickRandomMovie() {
    const filteredMovies = applyFilters(window.allMovies);

    if (filteredMovies.length === 0) {
        showToast('No movies found with current filters', 'warning');
        return;
    }

    const randomIndex = Math.floor(Math.random() * filteredMovies.length);
    const randomMovie = filteredMovies[randomIndex];

    showMovieDetailModal(randomMovie.id);
}
