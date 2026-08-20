const admin = require("firebase-admin");

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://podologico-palmas-default-rtdb.firebaseio.com",
});

const db = admin.database();
const messaging = admin.messaging();

function fechaHoyMexico() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

async function main() {
  try {
    const hoy = fechaHoyMexico();

    const snapshot = await db.ref("citas").once("value");
    const todasLasCitas = snapshot.val() || {};

    const citasHoy = Object.entries(todasLasCitas)
      .map(([id, c]) => ({ id, ...c }))
      .filter((c) => c.fecha === hoy)
      .sort((a, b) => a.hora.localeCompare(b.hora));

    if (citasHoy.length === 0) {
      console.log("Sin citas hoy, no se envía notificación.");
      return;
    }

    const dosHorasAtrasMs = Date.now() - 2 * 60 * 60 * 1000;
    const huboActividadReciente = Object.values(todasLasCitas).some(
      (c) => c.ts && c.ts >= dosHorasAtrasMs
    );

    if (huboActividadReciente) {
      console.log("Ya hubo actividad reciente, no se envía notificación.");
      return;
    }

    const primeraCita = citasHoy[0];
    const totalCitas = citasHoy.length;
    const titulo = "📋 Agenda Podológica Palmas";
    const cuerpo = `Hoy tienes ${totalCitas} cita${totalCitas > 1 ? "s" : ""} — la primera es a las ${primeraCita.hora}`;

    const tokensSnapshot = await db.ref("fcmTokens").once("value");
    const tokensData = tokensSnapshot.val() || {};
    const tokens = Object.keys(tokensData);

    if (tokens.length === 0) {
      console.log("No hay tokens registrados todavía.");
      return;
    }

    const respuesta = await messaging.sendEachForMulticast({
      notification: { title: titulo, body: cuerpo },
      tokens: tokens,
    });

    console.log(
      `Notificaciones enviadas: ${respuesta.successCount} exitosas, ${respuesta.failureCount} fallidas.`
    );

    for (let i = 0; i < respuesta.responses.length; i++) {
      if (!respuesta.responses[i].success) {
        await db.ref("fcmTokens/" + tokens[i]).remove();
      }
    }
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
