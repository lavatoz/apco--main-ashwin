// Import the Firebase scripts inside the service worker
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyD20gFE6Q0xviu30MfBwu9h_IioqPaDVJI",
  authDomain: "apco-crm.firebaseapp.com",
  projectId: "apco-crm",
  storageBucket: "apco-crm.firebasestorage.app",
  messagingSenderId: "706381428734",
  appId: "1:706381428734:web:23e315c03dd3d92586f2af"
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages
const messaging = firebase.messaging();

// Background message handler placeholder
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
});
