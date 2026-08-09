// Netlify Function: descarga las mareas oficiales del Instituto Hidrográfico
// de la Marina (IHM) para Bilbao, vía su API pública de predicción de marea,
// y las convierte a JSON limpio para la app.
//
// Fuente: https://ideihm.covam.es/api-ihm/getmarea (puerto id=2 = Bilbao)
// Se usa format=json. Esquema real de la respuesta (comprobado con datos reales):
//   { "mareas": { "id":"2", "puerto":"Bilbao", "datos": { "marea": [
//       {"fecha":"2026-08-01","hora":"04:58","altura":"3.889","tipo":"pleamar"},
//       ...
//   ]}}}
//
// Se ejecuta en el servidor de Netlify (no en el navegador), así que no hay
// problema de CORS al llamar a ideihm.covam.es.
//
// IMPORTANTE (confirmado por el usuario, que lo comprobó comparando contra la
// hora real): estas horas vienen en UTC. Por eso se construyen con
// Date.UTC(...): así, al mostrarlas luego con la hora local del navegador
// (Europe/Madrid), JavaScript aplica automáticamente el +1 (invierno) o +2
// (verano) según corresponda — no hace falta sumarlo a mano en ningún sitio.
//
// Las alturas ya vienen referidas al cero del puerto (cero hidrográfico), así
// que tampoco se les aplica ninguna corrección aquí.

const PUERTO_ID = 2; // Bilbao

function parseIHMJson(data){
  const rows = data && data.mareas && data.mareas.datos && data.mareas.datos.marea;
  if(!Array.isArray(rows)) return [];
  const extremes = [];
  for(const row of rows){
    const fm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(row.fecha || "");
    const hm = /^(\d{1,2}):(\d{2})$/.exec(row.hora || "");
    if(!fm || !hm) continue;
    const height = parseFloat(row.altura);
    if(isNaN(height)) continue;
    const time = new Date(Date.UTC(+fm[1], +fm[2]-1, +fm[3], +hm[1], +hm[2], 0));
    const tipo = (row.tipo || "").toLowerCase();
    extremes.push({
      time: time.toISOString(),
      height,
      type: tipo === "pleamar" ? "high" : "low"
    });
  }
  return extremes;
}

async function fetchMonth(year, month){ // month: 1-12
  const mm = String(month).padStart(2,'0');
  const url = `https://ideihm.covam.es/api-ihm/getmarea?request=gettide&id=${PUERTO_ID}&format=json&month=${year}${mm}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; MareasBilbaoApp/1.0)" }
  });
  if(!res.ok) return [];
  const data = await res.json();
  return parseIHMJson(data);
}

exports.handler = async function () {
  try {
    const now = new Date();
    // mes anterior, actual y siguiente: cobertura de sobra para navegar ±12h/±24h
    const months = [-1, 0, 1].map(offset => {
      const d = new Date(now.getFullYear(), now.getMonth()+offset, 1);
      return { year: d.getFullYear(), month: d.getMonth()+1 };
    });

    const results = await Promise.all(months.map(({year, month}) => fetchMonth(year, month)));
    let extremes = results.flat();

    extremes.sort((a,b) => new Date(a.time) - new Date(b.time));
    const seen = new Set();
    extremes = extremes.filter(e => {
      const key = e.time + "_" + e.type;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (extremes.length === 0) {
      return { statusCode: 502, body: JSON.stringify({ error: "Sin datos del IHM (puede que haya cambiado su formato)" }) };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=3600" },
      body: JSON.stringify({ source: "ihm-covam", fetchedAt: new Date().toISOString(), extremes })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
