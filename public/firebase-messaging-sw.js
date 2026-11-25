importScripts("https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDi_MU7fGHT2Kw7ShoPqbtCPjZ_aecY0FY",
  authDomain: "urban-754b9.firebaseapp.com",
  projectId: "urban-754b9",
  storageBucket: "urban-754b9.firebasestorage.app",
  messagingSenderId: "1040485503279",
  appId: "1:1040485503279:web:a7a26ca77fbb5e1c3f11da",
});

const messaging = firebase.messaging();

function inboxUrl(data) {
  const type = String(data?.type ?? "").toLowerCase();
  const rideId = data?.rideId ?? data?.ride;
  const bookingId = data?.bookingId ?? data?.booking;
  const isNewRequest =
    type.includes("new-request") ||
    type.includes("new_request") ||
    type.includes("ride-request") ||
    type.includes("ride_request") ||
    type === "request";
  if (data?.chatId) return "/message?chat=" + encodeURIComponent(data.chatId);
  // The rider's own ride page takes the passenger id.
  if (type === "ride_start_otp" && data?.passengerId) {
    return "/my-rides/" + data.passengerId;
  }
  if (isNewRequest) return "/driver";
  if (rideId) return "/driver/my-rides/" + rideId;
  if (bookingId) return "/driver/my-rides";
  return "/driver";
}

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification ?? {};
  const url = inboxUrl(payload.data ?? {});
  self.registration.showNotification(title ?? "Split Ride", {
    body,
    icon: icon ?? "/icon.png",
    data: { url, isNewRequest: url === "/driver" },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = event.notification.data?.url ?? "/driver";
  const origin = self.location.origin;
  const url = path.startsWith("http") ? path : origin + path;
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ("focus" in client) {
          // A new request never takes a driver away from a ride in progress.
          const onRide = /\/driver\/my-rides\/.+/.test(
            new URL(client.url).pathname,
          );
          if (!(onRide && event.notification.data?.isNewRequest)) {
            client.navigate?.(url);
          }
          return client.focus();
        }
      }
      return clients.openWindow(url);
    }),
  );
});
