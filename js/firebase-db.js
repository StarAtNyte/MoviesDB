/**
 * Firebase Database Operations Module
 * Handles all Firestore database interactions
 */

let db = null;
let unsubscribeMovies = null;

// Initialize Firebase
function initializeFirebase() {
    try {
        if (!validateConfig()) {
            showToast('Please configure your API keys in js/config.js', 'error');
            return false;
        }

        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        console.log('Firebase initialized successfully');
        return true;
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        showToast('Failed to initialize Firebase. Check your configuration.', 'error');
        return false;
    }
}

// Real-time listener for movies
function subscribeToMovies(callback) {
    if (!db) return;

    // Unsubscribe from previous listener if exists
    if (unsubscribeMovies) {
        unsubscribeMovies();
    }

    unsubscribeMovies = db.collection('movies')
        .onSnapshot((snapshot) => {
            const movies = [];
            snapshot.forEach((doc) => {
                movies.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            callback(movies);
        }, (error) => {
            console.error('Error fetching movies:', error);
            showToast('Error loading movies from database', 'error');
        });
}

// Add a new movie
async function addMovie(movieData) {
    try {
        const docRef = await db.collection('movies').add({
            ...movieData,
            date_added: firebase.firestore.FieldValue.serverTimestamp(),
            last_modified: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('Movie added with ID:', docRef.id);
        showToast(`${movieData.title} added successfully!`, 'success');
        return docRef.id;
    } catch (error) {
        console.error('Error adding movie:', error);
        showToast('Failed to add movie', 'error');
        throw error;
    }
}

// Update an existing movie
async function updateMovie(movieId, updates) {
    try {
        await db.collection('movies').doc(movieId).update({
            ...updates,
            last_modified: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('Movie updated:', movieId);
        showToast('Movie updated successfully!', 'success');
    } catch (error) {
        console.error('Error updating movie:', error);
        showToast('Failed to update movie', 'error');
        throw error;
    }
}

// Delete a movie
async function deleteMovie(movieId, movieTitle) {
    try {
        await db.collection('movies').doc(movieId).delete();
        console.log('Movie deleted:', movieId);
        showToast(`${movieTitle} deleted successfully!`, 'success');
    } catch (error) {
        console.error('Error deleting movie:', error);
        showToast('Failed to delete movie', 'error');
        throw error;
    }
}

// Get a single movie by ID
async function getMovie(movieId) {
    try {
        const doc = await db.collection('movies').doc(movieId).get();
        if (doc.exists) {
            return {
                id: doc.id,
                ...doc.data()
            };
        } else {
            console.warn('Movie not found:', movieId);
            return null;
        }
    } catch (error) {
        console.error('Error getting movie:', error);
        throw error;
    }
}

// Batch delete movies
async function batchDeleteMovies(movieIds) {
    try {
        const batch = db.batch();
        movieIds.forEach(id => {
            const docRef = db.collection('movies').doc(id);
            batch.delete(docRef);
        });
        await batch.commit();
        console.log(`${movieIds.length} movies deleted`);
        showToast(`${movieIds.length} movies deleted successfully!`, 'success');
    } catch (error) {
        console.error('Error batch deleting movies:', error);
        showToast('Failed to delete movies', 'error');
        throw error;
    }
}

// Batch update movies (e.g., change status)
async function batchUpdateMovies(movieIds, updates) {
    try {
        const batch = db.batch();
        movieIds.forEach(id => {
            const docRef = db.collection('movies').doc(id);
            batch.update(docRef, {
                ...updates,
                last_modified: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
        await batch.commit();
        console.log(`${movieIds.length} movies updated`);
        showToast(`${movieIds.length} movies updated successfully!`, 'success');
    } catch (error) {
        console.error('Error batch updating movies:', error);
        showToast('Failed to update movies', 'error');
        throw error;
    }
}

// Export all data as JSON
async function exportData() {
    try {
        const snapshot = await db.collection('movies').get();
        const movies = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            // Convert Firestore timestamps to ISO strings for JSON compatibility
            if (data.date_added) {
                data.date_added = data.date_added.toDate().toISOString();
            }
            if (data.last_modified) {
                data.last_modified = data.last_modified.toDate().toISOString();
            }
            movies.push({
                id: doc.id,
                ...data
            });
        });

        const dataStr = JSON.stringify(movies, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `moviedb-export-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);

        showToast('Data exported successfully!', 'success');
    } catch (error) {
        console.error('Error exporting data:', error);
        showToast('Failed to export data', 'error');
    }
}

// Import data from JSON (Admin only)
async function importData(jsonData) {
    try {
        const movies = JSON.parse(jsonData);
        const batch = db.batch();

        movies.forEach(movie => {
            const docRef = db.collection('movies').doc();
            // Remove the old id if it exists and convert date strings to Timestamps
            const { id, ...movieData } = movie;
            if (movieData.date_added) {
                movieData.date_added = firebase.firestore.Timestamp.fromDate(new Date(movieData.date_added));
            }
            if (movieData.last_modified) {
                movieData.last_modified = firebase.firestore.Timestamp.fromDate(new Date(movieData.last_modified));
            }
            batch.set(docRef, movieData);
        });

        await batch.commit();
        console.log(`${movies.length} movies imported`);
        showToast(`${movies.length} movies imported successfully!`, 'success');
    } catch (error) {
        console.error('Error importing data:', error);
        showToast('Failed to import data. Check JSON format.', 'error');
        throw error;
    }
}

// Clear all data (Admin only - with extreme caution)
async function clearAllData() {
    try {
        const snapshot = await db.collection('movies').get();
        const batch = db.batch();

        snapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        console.log('All data cleared');
        showToast('All data cleared successfully!', 'success');
    } catch (error) {
        console.error('Error clearing data:', error);
        showToast('Failed to clear data', 'error');
        throw error;
    }
}

// Check if a movie already exists by TMDb ID
async function movieExists(tmdbId) {
    try {
        const snapshot = await db.collection('movies')
            .where('tmdb_id', '==', tmdbId)
            .get();
        return !snapshot.empty;
    } catch (error) {
        console.error('Error checking movie existence:', error);
        return false;
    }
}

// Check if movie exists and return its status (watched/watchlist) and movie data
async function getMovieByTmdbId(tmdbId) {
    try {
        const snapshot = await db.collection('movies')
            .where('tmdb_id', '==', tmdbId)
            .get();

        if (snapshot.empty) {
            return null;
        }

        const doc = snapshot.docs[0];
        return {
            id: doc.id,
            ...doc.data()
        };
    } catch (error) {
        console.error('Error getting movie by TMDb ID:', error);
        return null;
    }
}

// ===== PENDING MOVIES (FOR PUBLIC SUGGESTIONS) =====

// Add a pending movie suggestion (public users)
async function addPendingMovie(movieData) {
    try {
        const docRef = await db.collection('pending_movies').add({
            ...movieData,
            date_suggested: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'pending'
        });

        console.log('Pending movie added with ID:', docRef.id);
        showToast(`${movieData.title} submitted for approval!`, 'success');
        return docRef.id;
    } catch (error) {
        console.error('Error adding pending movie:', error);
        showToast('Failed to submit movie suggestion', 'error');
        throw error;
    }
}

// Get all pending movies (admin only)
function subscribeToPendingMovies(callback) {
    if (!db) return;

    return db.collection('pending_movies')
        .where('status', '==', 'pending')
        .onSnapshot((snapshot) => {
            const pendingMovies = [];
            snapshot.forEach((doc) => {
                pendingMovies.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            callback(pendingMovies);
        }, (error) => {
            console.error('Error fetching pending movies:', error);
        });
}

// Approve a pending movie (admin only)
async function approvePendingMovie(pendingMovieId) {
    try {
        // Get the pending movie data
        const pendingDoc = await db.collection('pending_movies').doc(pendingMovieId).get();
        if (!pendingDoc.exists) {
            showToast('Pending movie not found', 'error');
            return;
        }

        const movieData = pendingDoc.data();

        // Add to main movies collection
        await db.collection('movies').add({
            ...movieData,
            date_added: firebase.firestore.FieldValue.serverTimestamp(),
            last_modified: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Update pending movie status to approved
        await db.collection('pending_movies').doc(pendingMovieId).update({
            status: 'approved',
            approved_at: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('Pending movie approved:', pendingMovieId);
        showToast(`${movieData.title} approved and added to collection!`, 'success');
    } catch (error) {
        console.error('Error approving pending movie:', error);
        showToast('Failed to approve movie', 'error');
        throw error;
    }
}

// Reject a pending movie (admin only)
async function rejectPendingMovie(pendingMovieId, movieTitle) {
    try {
        await db.collection('pending_movies').doc(pendingMovieId).update({
            status: 'rejected',
            rejected_at: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('Pending movie rejected:', pendingMovieId);
        showToast(`${movieTitle} rejected`, 'info');
    } catch (error) {
        console.error('Error rejecting pending movie:', error);
        showToast('Failed to reject movie', 'error');
        throw error;
    }
}

// Delete a pending movie suggestion
async function deletePendingMovie(pendingMovieId) {
    try {
        await db.collection('pending_movies').doc(pendingMovieId).delete();
        console.log('Pending movie deleted:', pendingMovieId);
    } catch (error) {
        console.error('Error deleting pending movie:', error);
        throw error;
    }
}

// Get admin password hash from config collection (optional - for storing password in Firestore)
async function getAdminPasswordHash() {
    try {
        const doc = await db.collection('config').doc('admin').get();
        if (doc.exists) {
            return doc.data().passwordHash;
        }
        return null;
    } catch (error) {
        console.error('Error getting admin password:', error);
        return null;
    }
}

// Set admin password hash in config collection (optional)
async function setAdminPasswordHash(passwordHash) {
    try {
        await db.collection('config').doc('admin').set({
            passwordHash: passwordHash,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
        showToast('Admin password updated successfully!', 'success');
    } catch (error) {
        console.error('Error setting admin password:', error);
        showToast('Failed to update admin password', 'error');
        throw error;
    }
}
