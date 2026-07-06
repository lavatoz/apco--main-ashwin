import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import type { Messaging } from 'firebase/messaging';
import { isSupported } from 'firebase/messaging';
import { app } from './firebase';
import { api } from './api';

let memoryToken: string | null = null;
let messagingPromise: Promise<Messaging | null> | null = null;
let lastRegisteredToken: string | null = null;

const getDeviceId = (): string => {
  if (typeof window === 'undefined') return 'server';
  let deviceId = localStorage.getItem('fcm_device_id');
  if (!deviceId) {
    deviceId = `web_${Math.random().toString(36).substring(2, 15)}_${Date.now().toString(36)}`;
    localStorage.setItem('fcm_device_id', deviceId);
  }
  return deviceId;
};

// Reusable getter to initialize Firebase Messaging safely and asynchronously
export const getMessagingInstance = (): Promise<Messaging | null> => {
  if (messagingPromise) return messagingPromise;

  messagingPromise = (async () => {
    try {
      const supported = await isSupported();
      if (!supported) {
        console.warn('Firebase Messaging is not supported in this browser environment.');
        return null;
      }
      return getMessaging(app);
    } catch (err) {
      console.error('Error initializing Firebase Messaging:', err);
      return null;
    }
  })();

  return messagingPromise;
};

const waitForActiveServiceWorker = (registration: ServiceWorkerRegistration): Promise<ServiceWorkerRegistration> => {
  return new Promise((resolve) => {
    if (registration.active) {
      resolve(registration);
      return;
    }

    const serviceWorker = registration.installing || registration.waiting;
    if (serviceWorker) {
      if (serviceWorker.state === 'activated') {
        resolve(registration);
        return;
      }
      
      const stateChangeListener = () => {
        if (serviceWorker.state === 'activated') {
          serviceWorker.removeEventListener('statechange', stateChangeListener);
          resolve(registration);
        }
      };
      serviceWorker.addEventListener('statechange', stateChangeListener);
    } else {
      resolve(registration);
    }
  });
};

let swRegistration: ServiceWorkerRegistration | null = null;

// Register Firebase Service Worker if supported through dedicated async helper
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (swRegistration) return swRegistration;
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('Firebase Messaging Service Worker registered with scope:', registration.scope);
    await waitForActiveServiceWorker(registration);
    swRegistration = registration;
    return registration;
  } catch (err) {
    console.error('Firebase Service Worker registration failed:', err);
    return null;
  }
};

// Retrieve FCM registration token using VAPID key and registered service worker
export const getMessagingToken = async (): Promise<string | null> => {
  if (memoryToken) return memoryToken;

  const messaging = await getMessagingInstance();
  if (!messaging) {
    console.warn('FCM token generation skipped: Messaging not supported.');
    return null;
  }

  try {
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    const serviceWorkerRegistration = await registerServiceWorker();

    const token = await getToken(messaging, {
      vapidKey: vapidKey || undefined,
      serviceWorkerRegistration: serviceWorkerRegistration || undefined,
    });

    if (token) {
      memoryToken = token;
      console.log('FCM Registration Token generated and cached in memory:', token);

      if (token !== lastRegisteredToken) {
        console.log("Sending FCM token to backend...");
        const deviceId = getDeviceId();
        try {
          await api.registerDeviceToken({
            token,
            deviceId,
            platform: 'web'
          });
          lastRegisteredToken = token;
          console.log("Device token registration succeeded.");
        } catch (err: any) {
          const statusText = err?.status ? `Status: ${err.status}` : "";
          const detailsText = err?.data ? `Details: ${JSON.stringify(err.data)}` : (err?.message || err);
          console.error("Device token registration failed.", `${statusText} ${detailsText}`);
        }
      }
    }
    return token;
  } catch (err) {
    console.error('Failed to generate FCM registration token:', err);
    return null;
  }
};

// Request browser notification permission
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('Notifications are not supported in this browser.');
    return 'denied';
  }

  const currentPermission = Notification.permission;
  if (currentPermission === 'denied') {
    console.log('Notification permission was previously denied. Skipping prompt.');
    return 'denied';
  }

  if (currentPermission === 'granted') {
    // Generate token if permission is already granted
    await getMessagingToken();
    return 'granted';
  }

  try {
    const permission = await Notification.requestPermission();
    console.log(`Notification permission request completed. Status: ${permission}`);
    if (permission === 'granted') {
      await getMessagingToken();
    }
    return permission;
  } catch (err) {
    console.error('Error while requesting notification permission:', err);
    return 'default';
  }
};

// Register foreground messaging listener with React Strict Mode cleanup support
export const registerForegroundMessageListener = async (
  onMessageReceived: (payload: any) => void
): Promise<(() => void)> => {
  const messaging = await getMessagingInstance();
  if (!messaging) {
    return () => {};
  }

  return onMessage(messaging, (payload) => {
    console.log('Foreground notification message received:', payload);
    onMessageReceived(payload);
  });
};

export const clearMessagingSession = () => {
  lastRegisteredToken = null;
  memoryToken = null;
};
