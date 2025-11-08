// firebase-config.js

// Register the Firebase services as a module
App.registerModule('Firebase', function () {
  // Firebase Configuration
  const firebaseConfig = {
    apiKey: "AIzaSyBzSHkVxRiLC5gsq04LTTDnXaGdoF7eJ2c",
    authDomain: "easyregistrationforms.firebaseapp.com",
    projectId: "easyregistrationforms",
    storageBucket: "easyregistrationforms.firebasestorage.app",
    messagingSenderId: "589421628989",
    appId: "1:589421628989:web:d9f6e9dbe372ab7acd6454",
    measurementId: "G-GVCPBN8VB5"
  };

  let app;
  let auth;
  let db;

  // Initialize Firebase only if it hasn't been initialized already
  if (!firebase.apps.length) {
    try {
      app = firebase.initializeApp(firebaseConfig);
      auth = firebase.auth();
      db = firebase.firestore();
      console.log("✅ Firebase initialized successfully.");
    } catch (error) {
      console.error("❌ Firebase initialization failed:", error);
      // Return a null module if initialization fails
      return null;
    }
  } else {
    // If Firebase is already initialized, get the existing instances
    app = firebase.app();
    auth = firebase.auth();
    db = firebase.firestore();
    console.log("ℹ️ Firebase already initialized. Using existing instance.");
  }

  // Return the Firebase services as the public API of this module
  return {
    app,
    auth,
    db
  };
});