// วางค่าเดียวกับใน firebase-messaging-sw.js
const firebaseConfig = {
  apiKey: "AIzaSyDsc_npQdb6J6IDclEcLuNs5Bc3LAwN8pQ",
  authDomain: "timetable-2-11d99.firebaseapp.com",
  projectId: "timetable-2-11d99",
  storageBucket: "timetable-2-11d99.firebasestorage.app",
  messagingSenderId: "224346839882",
  appId: "1:224346839882:web:e1857d725102dbdb1a7fb3",
};
 
const VAPID_KEY = "BGWjuE9xZBTx0NRohxEyjdL9nqVPmQfEezkDvzmSO5SPWd_RhJPU_Vd45EdSqXHh3gduT5Wz3niD7W5TBE9OYRY";
// URL ที่ได้หลัง deploy Cloudflare Worker เช่น https://timetable2-push.yourname.workers.dev
const WORKER_URL = "https://timetable2-push.lalitphan52.workers.dev";
 
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();
 
async function enablePushNotifications() {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      alert("คุณไม่ได้อนุญาตการแจ้งเตือน");
      return;
    }
 
    const registration = await navigator.serviceWorker.register("firebase-messaging-sw.js");
    const token = await messaging.getToken({
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
 
    if (token) {
      await fetch(WORKER_URL + "/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      alert("เปิดการแจ้งเตือนสำเร็จ! ระบบจะเตือนก่อนถึงกำหนดส่งงาน");
    }
  } catch (err) {
    console.error(err);
    alert("เปิดแจ้งเตือนไม่สำเร็จ: " + err.message);
  }
}
 
// แจ้งเตือนตอนแอปเปิดอยู่หน้าจอ (foreground)
messaging.onMessage((payload) => {
  const { title, body } = payload.notification || {};
  alert((title || "แจ้งเตือน") + "\n" + (body || ""));
});
 
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("enableNotifBtn");
  if (btn) btn.addEventListener("click", enablePushNotifications);
});
 