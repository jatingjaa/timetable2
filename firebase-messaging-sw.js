importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");
 
// วางค่า firebaseConfig ของคุณตรงนี้ (อันเดียวกับใน push.js)
firebase.initializeApp({
  apiKey: "AIzaSyDsc_npQdb6J6IDclEcLuNs5Bc3LAwN8pQ",
  authDomain: "timetable-2-11d99.firebaseapp.com",
  projectId: "timetable-2-11d99",
  storageBucket: "timetable-2-11d99.firebasestorage.app",
  messagingSenderId: "224346839882",
  appId: "1:224346839882:web:e1857d725102dbdb1a7fb3",
});
 
const messaging = firebase.messaging();
 
// แจ้งเตือนตอนแอปปิดอยู่ / อยู่เบื้องหลัง
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || "แจ้งเตือน", {
    body: body || "",
    icon: "icon-192.png",
  });
});
 