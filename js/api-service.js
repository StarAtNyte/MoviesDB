/**
 * API Service Module
 * Handles TMDb and OMDb API calls
 */

// Search movies on TMDb (via Vercel serverless function)
async function searchMoviesTMDb(query) {
    try {
        const params = new URLSearchParams({
            endpoint: 'search/movie',
            query: encodeURIComponent(query),
            include_adult: 'false'
        });

        const url = `/api/tmdb?${params}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`TMDb API error: ${response.status}`);
        }

        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error('Error searching TMDb:', error);
        showToast('Failed to search movies. Please try again.', 'error');
        return [];
    }
}

// Get movie details from TMDb (via Vercel serverless function)
async function getMovieDetailsTMDb(tmdbId) {
    try {
        const params = new URLSearchParams({
            endpoint: `movie/${tmdbId}`,
            append_to_response: 'credits'
        });

        const url = `/api/tmdb?${params}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`TMDb API error: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching TMDb details:', error);
        showToast('Failed to fetch movie details', 'error');
        return null;
    }
}

// Get IMDb rating from OMDb (via Vercel serverless function)
async function getIMDbRating(imdbId) {
    try {
        const url = `/api/omdb?i=${imdbId}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`OMDb API error: ${response.status}`);
        }

        const data = await response.json();
        return data.imdbRating !== 'N/A' ? data.imdbRating : null;
    } catch (error) {
        console.error('Error fetching IMDb rating:', error);
        return null;
    }
}

// Get full movie data from TMDb and OMDb combined
async function getFullMovieData(tmdbId) {
    try {
        const tmdbData = await getMovieDetailsTMDb(tmdbId);
        if (!tmdbData) return null;

        // Get IMDb rating if available
        let imdbRating = null;
        if (tmdbData.imdb_id) {
            imdbRating = await getIMDbRating(tmdbData.imdb_id);
        }

        // Extract relevant data
        const movieData = {
            tmdb_id: tmdbData.id,
            title: tmdbData.title,
            year: tmdbData.release_date ? new Date(tmdbData.release_date).getFullYear() : null,
            poster_path: tmdbData.poster_path ? `${TMDB_CONFIG.imageBaseUrl}/${TMDB_CONFIG.posterSize}${tmdbData.poster_path}` : null,
            genres: tmdbData.genres ? tmdbData.genres.map(g => g.name) : [],
            country: tmdbData.production_countries && tmdbData.production_countries.length > 0
                ? tmdbData.production_countries[0].name
                : 'Unknown',
            imdb_rating: imdbRating,
            plot: tmdbData.overview || '',
            runtime: tmdbData.runtime || null,
            admin_rating: null,
            letterboxd_rating: null,
            notes: '',
            date_watched: null,
            status: 'watchlist' // Default to watchlist
        };

        return movieData;
    } catch (error) {
        console.error('Error getting full movie data:', error);
        showToast('Failed to fetch complete movie data', 'error');
        return null;
    }
}

// Build poster URL from TMDb path
function getTMDbPosterUrl(posterPath, size = 'w500') {
    if (!posterPath) {
        return 'https://via.placeholder.com/500x750/241a30/ab9db9?text=No+Poster';
    }
    return `${TMDB_CONFIG.imageBaseUrl}/${size}${posterPath}`;
}

// Build backdrop URL from TMDb path
function getTMDbBackdropUrl(backdropPath, size = 'original') {
    if (!backdropPath) {
        return null;
    }
    return `${TMDB_CONFIG.imageBaseUrl}/${size}${backdropPath}`;
}

// Format TMDb search result for display
function formatTMDbSearchResult(tmdbMovie) {
    return {
        id: tmdbMovie.id,
        title: tmdbMovie.title,
        year: tmdbMovie.release_date ? new Date(tmdbMovie.release_date).getFullYear() : 'N/A',
        poster: getTMDbPosterUrl(tmdbMovie.poster_path),
        overview: tmdbMovie.overview || 'No overview available',
        rating: tmdbMovie.vote_average ? tmdbMovie.vote_average.toFixed(1) : 'N/A'
    };
}

// Create search result card HTML
function createSearchResultCard(movie, existingMovie = null) {
    const alreadyExists = existingMovie !== null;
    const statusBadge = alreadyExists ? (existingMovie.status === 'watched' ?
        '<div class="absolute top-2 left-2 bg-green-600/90 backdrop-blur-md px-2 py-1 rounded text-xs font-bold text-white flex items-center gap-1 border border-green-400/30"><span class="material-symbols-outlined text-[14px]">check_circle</span> Watched</div>' :
        '<div class="absolute top-2 left-2 bg-blue-600/90 backdrop-blur-md px-2 py-1 rounded text-xs font-bold text-white flex items-center gap-1 border border-blue-400/30"><span class="material-symbols-outlined text-[14px]">bookmark</span> Watchlist</div>'
    ) : '';

    return `
        <div class="group relative flex flex-col gap-3 rounded-lg p-2 hover:bg-surface-dark transition-colors duration-200">
            <div class="relative w-full aspect-[2/3] overflow-hidden rounded-lg shadow-lg">
                <div class="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style="background-image: url('${movie.poster}');"></div>
                ${statusBadge}
                ${movie.rating !== 'N/A' ? `
                    <div class="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-xs font-bold text-white flex items-center gap-1 border border-white/10">
                        <span class="text-yellow-400">★</span> ${movie.rating}
                    </div>
                ` : ''}
                <!-- Hover Overlay with Buttons -->
                <div class="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 p-4">
                    ${alreadyExists ? `
                        <div class="text-center text-white text-sm">
                            <span class="material-symbols-outlined text-[48px] mb-2 opacity-50">check_circle</span>
                            <p class="font-semibold">Already in ${existingMovie.status === 'watched' ? 'Watched' : 'Watchlist'}</p>
                        </div>
                    ` : `
                        <button onclick="addMovieFromSearch(${movie.id}, 'watched')"
                            class="w-full h-10 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-bold shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2">
                            <span class="material-symbols-outlined text-[18px]">visibility</span>
                            Watched
                        </button>
                        <button onclick="addMovieFromSearch(${movie.id}, 'watchlist')"
                            class="w-full h-10 rounded-lg border-2 border-primary text-white hover:bg-primary/20 text-sm font-bold transition-transform hover:scale-105 flex items-center justify-center gap-2">
                            <span class="material-symbols-outlined text-[18px]">bookmark</span>
                            Watchlist
                        </button>
                    `}
                </div>
            </div>
            <div class="px-1">
                <h3 class="text-white text-base font-bold leading-tight truncate" title="${movie.title}">${movie.title}</h3>
                <p class="text-text-secondary text-sm mt-0.5">${movie.year}</p>
            </div>
        </div>
    `;
}

// Add movie from search results
async function addMovieFromSearch(tmdbId, status) {
    const isAdmin = isAdminLoggedIn();

    try {
        // Check if movie already exists
        const exists = await movieExists(tmdbId);
        if (exists) {
            showToast('This movie is already in the collection', 'warning');
            return;
        }

        showToast('Fetching movie details...', 'info');

        // Fetch full movie data
        const movieData = await getFullMovieData(tmdbId);
        if (!movieData) {
            showToast('Failed to fetch movie details', 'error');
            return;
        }

        // Set status and date
        movieData.status = status;
        // Always set today's date for watched movies
        if (status === 'watched') {
            movieData.date_watched = new Date().toISOString().split('T')[0];
        }

        // If admin, add directly to database
        // If not admin, add to pending queue for approval
        if (isAdmin) {
            await addMovie(movieData);
        } else {
            await addPendingMovie(movieData);
        }

        // Close search modal if open
        const searchModal = document.querySelector('.modal-backdrop');
        if (searchModal) {
            closeModal(searchModal);
        }

    } catch (error) {
        console.error('Error adding movie from search:', error);
        showToast('Failed to add movie', 'error');
    }
}

// Show add movie search modal
function showAddMovieModal() {
    const isAdmin = isAdminLoggedIn();
    const modalTitle = isAdmin ? 'Add New Movie' : 'Suggest a Movie';

    const modal = createModal({
        title: modalTitle,
        content: `
            <div class="space-y-4">
                <!-- Search Bar -->
                <div class="relative w-full">
                    <div class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <span class="material-symbols-outlined text-text-secondary text-[24px]">search</span>
                    </div>
                    <input
                        id="movieSearchInput"
                        class="block w-full rounded-lg bg-surface-dark border-transparent text-white placeholder-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-base py-3.5 pl-12 pr-12 transition-all duration-200 ease-in-out"
                        placeholder="Search TMDb..."
                        type="text"
                    />
                    <!-- Loading Spinner -->
                    <div id="searchSpinner" class="hidden absolute inset-y-0 right-0 flex items-center pr-4">
                        <div class="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                    </div>
                </div>

                <!-- Search Results -->
                <div id="searchResultsContainer" class="max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <div id="searchResults" class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <!-- Results will be inserted here -->
                    </div>
                    <div id="searchEmpty" class="flex flex-col items-center justify-center py-12 text-text-secondary">
                        <span class="material-symbols-outlined text-[60px] mb-2">search</span>
                        <p class="text-sm">Search for movies to add to your collection</p>
                    </div>
                </div>
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

    // Setup search functionality
    const searchInput = document.getElementById('movieSearchInput');
    const searchResults = document.getElementById('searchResults');
    const searchEmpty = document.getElementById('searchEmpty');
    const searchSpinner = document.getElementById('searchSpinner');

    let searchTimeout;

    searchInput.addEventListener('input', async (e) => {
        const query = e.target.value.trim();

        clearTimeout(searchTimeout);

        if (query.length < 2) {
            searchResults.innerHTML = '';
            searchEmpty.style.display = 'flex';
            searchSpinner.classList.add('hidden');
            return;
        }

        searchSpinner.classList.remove('hidden');
        searchEmpty.style.display = 'none';

        searchTimeout = setTimeout(async () => {
            const results = await searchMoviesTMDb(query);
            searchSpinner.classList.add('hidden');

            if (results.length === 0) {
                searchResults.innerHTML = '<div class="col-span-full text-center text-text-secondary py-8">No results found</div>';
            } else {
                // Check each movie's existence status
                const limitedResults = results.slice(0, 12);
                const cardsPromises = limitedResults.map(async (movie) => {
                    const formattedMovie = formatTMDbSearchResult(movie);
                    const existingMovie = await getMovieByTmdbId(movie.id);
                    return createSearchResultCard(formattedMovie, existingMovie);
                });

                const cards = await Promise.all(cardsPromises);
                searchResults.innerHTML = cards.join('');
            }
        }, APP_CONFIG.searchDebounce);
    });

    // Focus search input
    setTimeout(() => searchInput.focus(), 100);
}
