/**
 * Configuration file for MovieDB Application
 *
 * SECURITY NOTE:
 * - TMDb and OMDb API keys are hidden via Vercel serverless functions (/api/tmdb.js, /api/omdb.js)
 * - Firebase API key is INTENTIONALLY public (required for client-side SDK)
 * - Firebase security is handled by Firestore Security Rules, NOT by hiding the API key
 * - See: https://firebase.google.com/docs/projects/api-keys
 */

// Firebase Configuration
// Get your config from: https://console.firebase.google.com/
//
// ⚠️ IMPORTANT: This API key is meant to be public!
// Security comes from Firestore Security Rules (set in Firebase Console)
// Set rules to restrict write access and add domain restrictions to prevent abuse
const firebaseConfig = {
    apiKey: "AIzaSyDjmiat7tqvCFRtCgSGq0G8Rzg18jyEBoo",
    authDomain: "moviesdb-caa3a.firebaseapp.com",
    projectId: "moviesdb-caa3a",
    storageBucket: "moviesdb-caa3a.firebasestorage.app",
    messagingSenderId: "860670358206",
    appId: "1:860670358206:web:cf1643b1b9922d55f264ef"
};

// TMDb Configuration (API calls now go through Vercel serverless functions)
const TMDB_CONFIG = {
    // For local development only - remove before deploying!
    // These will be ignored when deployed to Vercel (serverless functions will be used)
    apiKey: "e131520144b37273db23f983af407a36", // LOCAL DEV ONLY
    baseUrl: "https://api.themoviedb.org/3", // LOCAL DEV ONLY
    imageBaseUrl: "https://image.tmdb.org/t/p",
    posterSize: "w500",
    backdropSize: "original"
};

// OMDb Configuration (API calls now go through Vercel serverless functions)
const OMDB_CONFIG = {
    // For local development only - remove before deploying!
    apiKey: "a7f62a99", // LOCAL DEV ONLY
    baseUrl: "https://www.omdbapi.com" // LOCAL DEV ONLY
};

// Application Configuration
const APP_CONFIG = {
    // Admin password hash (SHA-256)
    adminPasswordHash: "cb8ca4ca33764899f6aa25c0c067804a0ca6e0f0300a2ab15744fc35cd62296a",

    // Number of logo clicks to access admin login
    logoClicksForAdmin: 5,

    // Session timeout (in milliseconds) - 24 hours
    sessionTimeout: 24 * 60 * 60 * 1000,

    // Toast notification duration (in milliseconds)
    toastDuration: 3000,

    // Pagination
    moviesPerPage: 50,

    // Search debounce delay (in milliseconds)
    searchDebounce: 300
};

// Simple hash function (for demo purposes only - use proper hashing in production)
async function simpleHash(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// Validate that user has configured Firebase
// Note: TMDb and OMDb API keys are now handled by Vercel environment variables
function validateConfig() {
    const errors = [];

    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_FIREBASE_API_KEY") {
        errors.push("Firebase configuration not set. Please update firebaseConfig in js/config.js");
    }

    if (errors.length > 0) {
        console.error("Configuration Errors:", errors);
        return false;
    }

    return true;
}
