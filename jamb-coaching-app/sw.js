// Service Worker for JAMB Coach PWA
const CACHE_NAME = 'jamb-coach-v1.0.0';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/images/clean_pwa_progressive_web_app_icon_shopping_bag.jpg',
  '/images/nigerian-jamb-exam-students-computer-lab-study.jpg',
  '/images/clean_mathematics_equations_chalkboard_background.jpg',
  '/images/physics_laboratory_equipment_collection.jpg',
  '/images/Colorful-Standard-Chemistry-Periodic-Table.jpg',
  '/images/abstract_biology_cellular_data_visualization.jpg',
  '/images/classic-english-literature-book-covers-collage.jpg'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Cache install failed:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        // Clone the request because it's a stream
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response because it's a stream
          const responseToCache = response.clone();
          
          // Add to cache for future use
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        }).catch(() => {
          // Return offline fallback if available
          if (event.request.destination === 'document') {
            return caches.match('/offline.html');
          }
        });
      })
  );
});

// Background sync for offline answer submission
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-answers') {
    event.waitUntil(syncAnswers());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from JAMB Coach',
    icon: '/images/clean_pwa_progressive_web_app_icon_shopping_bag.jpg',
    badge: '/images/clean_pwa_progressive_web_app_icon_shopping_bag.jpg',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Practice Now',
        icon: '/images/clean_pwa_progressive_web_app_icon_shopping_bag.jpg'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/images/clean_pwa_progressive_web_app_icon_shopping_bag.jpg'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('JAMB Coach', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/practice')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action - open app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper function to sync offline answers
async function syncAnswers() {
  try {
    // Get stored offline answers from IndexedDB
    const db = await openDB();
    const transaction = db.transaction(['offlineAnswers'], 'readonly');
    const store = transaction.objectStore('offlineAnswers');
    const answers = await store.getAll();
    
    // Submit each answer to server
    for (const answer of answers) {
      try {
        const response = await fetch('/api/submit-answer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(answer)
        });
        
        if (response.ok) {
          // Remove successfully synced answer
          const deleteTransaction = db.transaction(['offlineAnswers'], 'readwrite');
          const deleteStore = deleteTransaction.objectStore('offlineAnswers');
          await deleteStore.delete(answer.id);
        }
      } catch (error) {
        console.error('Failed to sync answer:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Helper function to open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('JAMBCoachDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offlineAnswers')) {
        db.createObjectStore('offlineAnswers', { keyPath: 'id' });
      }
    };
  });
}