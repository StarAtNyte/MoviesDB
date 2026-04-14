# MovieDB - Personal Movie Library

A complete web application for managing your personal movie collection. Built with HTML, CSS, and JavaScript with Firebase backend. Features public viewing with admin-only editing capabilities.

## Features

### Public Features (Anyone can access)
-  Browse all movies in the database
-  Search by title, genre, or country
-  Filter by genre, country, decade, and rating
-  Sort by various criteria (date watched, rating, title, year)
-  View detailed movie information
-  See statistics (average rating, monthly count)
-  Random movie picker
-  Export collection as JSON
-  Real-time updates when admin makes changes
-  Responsive design (desktop, tablet, mobile)

### Admin Features (Password protected)
-  Add new movies via TMDb search
-  Edit movie details (rating, notes, status, date)
-  Delete movies
-  Batch operations
-  Import/Export data
-  Change admin password
-  Clear all data

## Technology Stack

- **Frontend**: HTML5, CSS3 (Tailwind), Vanilla JavaScript
- **Backend**: Firebase Firestore (NoSQL database)
- **APIs**: TMDb (movie data), OMDb (IMDb ratings)
- **Fonts**: Spline Sans, Material Symbols
- **No frameworks**: Pure vanilla JavaScript for maximum simplicity

## Project Structure

```
MyMovies/
├── index.html              # Main application page
├── css/
│   └── styles.css         # Custom styles
├── js/
│   ├── config.js          # Configuration (API keys)
│   ├── firebase-db.js     # Firebase database operations
│   ├── admin-auth.js      # Admin authentication
│   ├── api-service.js     # TMDb/OMDb API integration
│   ├── ui-components.js   # Modal and UI components
│   ├── filters.js         # Filtering and sorting logic
│   └── app.js             # Main application logic
└── README.md              # This file
```

## Setup Instructions

### 1. Get Required API Keys

#### Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable Firestore Database:
   - Go to "Firestore Database" in the left menu
   - Click "Create database"
   - Choose "Start in production mode"
   - Select your region
4. Get your configuration:
   - Go to Project Settings (gear icon)
   - Scroll down to "Your apps"
   - Click "Web" (</> icon)
   - Register your app
   - Copy the Firebase configuration object

#### TMDb API Key
1. Go to [The Movie Database](https://www.themoviedb.org/)
2. Create a free account
3. Go to [Settings > API](https://www.themoviedb.org/settings/api)
4. Request an API key (choose "Developer")
5. Fill out the form (personal use is fine)
6. Copy your API key

#### OMDb API Key
1. Go to [OMDb API](http://www.omdbapi.com/apikey.aspx)
2. Select "Free" plan (1,000 requests/day)
3. Enter your email
4. Check your email for the API key
5. Activate it by clicking the link in the email

### 2. Configure the Application

Open `js/config.js` and replace the placeholder values:

```javascript
// Firebase Configuration
const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// TMDb API Configuration
const TMDB_CONFIG = {
    apiKey: "YOUR_TMDB_API_KEY",
    // ... rest is already configured
};

// OMDb API Configuration
const OMDB_CONFIG = {
    apiKey: "YOUR_OMDB_API_KEY",
    // ... rest is already configured
};
```

### 3. Set Up Firestore Rules

In Firebase Console, go to Firestore Database > Rules and use these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow public read access to movies
    match /movies/{movie} {
      allow read: if true;
      allow write: if false; // All writes are done through the web app
    }

    // Allow public read access to config
    match /config/{document} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

**Note**: Since there's no Firebase Authentication, all writes are done client-side with admin password protection. In a production environment, you should implement proper server-side validation.

### 4. Deploy the Application

You can deploy this application in several ways:

#### Option 1: Firebase Hosting (Recommended)
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project directory
firebase init hosting

# Select your Firebase project
# Set public directory to: .
# Configure as single-page app: No
# Don't overwrite index.html

# Deploy
firebase deploy --only hosting
```

#### Option 2: Any Static Host
Upload all files to any static hosting service:
- Netlify
- Vercel
- GitHub Pages
- AWS S3
- Any web server

#### Option 3: Local Development
Simply open `index.html` in a web browser. Note: You may need to run a local server to avoid CORS issues:

```bash
# Python 3
python -m http.server 8000

# Node.js (http-server)
npx http-server

# Then open http://localhost:8000
```
