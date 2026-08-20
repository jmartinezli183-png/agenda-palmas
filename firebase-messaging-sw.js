importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBb9iICkqJSDHHKibEufRBZzSlUu1Ki3yQ",
  authDomain: "podologico-palmas.firebaseapp.com",
  databaseURL: "https://podologico-palmas-default-rtdb.firebaseio.com",
  projectId: "podologico-palmas",
  storageBucket: "podologico-palmas.firebasestorage.app",
  messagingSenderId: "436785925015",
  appId: "1:436785925015:web:8855c213ce4a78ade6d2d2",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Notificación en segundo plano recibida:", payload);
  const tituloNotificacion = payload.notification.title;
  const opciones = {
    body: payload.notification.body,
  };
  self.registration.showNotification(tituloNotificacion, opciones);
});
