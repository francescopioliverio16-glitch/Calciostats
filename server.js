const express = require("express");

const app = express();
const KEY = process.env.API_FOOTBALL_KEY;
const PORT = process.env.PORT || 3000;

const CAMPIONATI = {
  135: "Serie A",
  2: "Champions League",
  39: "Premier League",
  140: "La Liga"
};

function dataItalia() {
  const oggi = new Date();
  const parti = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(oggi);

  const get = (tipo) => parti.find(x => x.type === tipo).value;

  return `${get("year")}-${get("month")}-${get("day")}`;
}

async function apiFootball(url) {
  const risposta = await fetch(url, {
    headers: {
      "x-apisports-key": KEY
    }
  });

  if (!risposta.ok) {
    throw new Error(`API Football: ${risposta.status}`);
  }

  return await risposta.json();
}

app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="it">
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta charset="UTF-8">
<title>CalcioStats</title>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: #081018;
  color: white;
  font-family: Arial, sans-serif;
  padding: 16px;
}

h1 {
  color: #61d4c5;
  margin-bottom: 4px;
}

.subtitle {
  color: #aeb8c2;
  margin-top: 0;
}

.menu {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 12px 0;
}

.menu button {
  white-space: nowrap;
  border: 0;
  border-radius: 20px;
  padding: 11px 15px;
  background: #1b2733;
  color: white;
  font-weight: bold;
}

.menu button.active {
  background: #61d4c5;
  color: #071018;
}

.aggiorna {
  width: 100%;
  border: 0;
  border-radius: 12px;
  padding: 13px;
  background: #263542;
  color: white;
  font-size: 16px;
  margin-bottom: 12px;
}

.card {
  background: #151e28;
  padding: 15px;
  margin: 12px 0;
  border-radius: 16px;
  border: 1px solid #263542;
}

.card:active {
  transform: scale(0.99);
}

.league {
  color: #61d4c5;
  font-size: 13px;
  margin-bottom: 10px;
}

.match {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.team {
  width: 40%;
  font-weight: bold;
}

.home {
  text-align: right;
}

.away {
  text-align: left;
}

.score {
  font-size: 21px;
  font-weight: bold;
  min-width: 65px;
  text-align: center;
}

.status {
  color: #9ba8b4;
  font-size: 12px;
  margin-top: 9px;
  text-align: center;
}

.dettagli {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #2a3642;
  color: #61d4c5;
  text-align: center;
  font-size: 13px;
}

#titolo {
  font-size: 18px;
  margin-top: 18px;
}

.stat-box {
  background: #151e28;
  border-radius: 16px;
  padding: 16px;
  margin-top: 12px;
}

.stat-title {
  color: #61d4c5;
  text-align: center;
  font-weight: bold;
  margin-bottom: 15px;
}

.stat-row {
  display: grid;
  grid-template-columns: 1fr 80px 1fr;
  gap: 8px;
  align-items: center;
  padding: 9px 0;
  border-bottom: 1px solid #26313c;
}

.stat-row:last-child {
  border-bottom: 0;
}

.stat-value {
  text-align: center;
  color: #dce3e8;
}

.stat-home {
  text-align: right;
  font-weight: bold;
}

.stat-away {
  text-align: left;
  font-weight: bold;
}

.indietro {
  border: 0;
  background: #263542;
  color: white;
  padding: 11px 16px;
  border-radius: 10px;
  margin-top: 12px;
}

.loading {
  text-align: center;
  padding: 30px;
  color: #aeb8c2;
}
</style>
</head>

<body>

<h1>⚽ CalcioStats</h1>
<p class="subtitle">Risultati e statistiche di calcio</p>

<div class="menu">
  <button id="b135" onclick="cambiaCampionato(135)">🇮🇹 Serie A</button>
  <button id="b2" onclick="cambiaCampionato(2)">🏆 Champions</button>
  <button id="b39" onclick="cambiaCampionato(39)">🏴 Premier</button>
  <button id="b140" onclick="cambiaCampionato(140)">🇪🇸 La Liga</button>
</div>

<button class="aggiorna" onclick="caricaPartite()">
  🔄 Aggiorna partite
</button>

<div id="titolo"></div>
<div id="partite" class="loading">
  Caricamento...
</div>

<div id="dettaglio"></div>

<script>
let campionato = 135;

function cambiaCampionato(id) {
  campionato = id;

  document.querySelectorAll(".menu button").forEach(b => {
    b.classList.remove("active");
  });

  document.getElementById("b" + id).classList.add("active");

  caricaPartite();
}

function escapeHtml(testo) {
  return String(testo ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function statoPartita(x) {
  const s = x.fixture.status;

  if (s.short === "NS") {
    return new Date(x.fixture.date).toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  if (s.short === "HT") return "Intervallo";

  if (s.short === "FT") return "Terminata";

  if (s.elapsed) return s.elapsed + "'";

  return s.long || "";
}

async function caricaPartite() {
  document.getElementById("partite").innerHTML =
    '<div class="loading">Caricamento partite...</div>';

  document.getElementById("dettaglio").innerHTML = "";

  try {
    const r = await fetch("/api/partite?league=" + campionato);
    const d = await r.json();

    if (!d.response || d.response.length === 0) {
      document.getElementById("partite").innerHTML =
        '<div class="loading">Nessuna partita oggi.</div>';
      return;
    }

    document.getElementById("titolo").innerHTML =
      "<b>" + escapeHtml(d.league) + "</b>";

    document.getElementById("partite").innerHTML =
      d.response.map(x => {

        const home = escapeHtml(x.teams.home.name);
        const away = escapeHtml(x.teams.away.name);

        const gh = x.goals.home ?? "-";
        const ga = x.goals.away ?? "-";

        return \`
          <div class="card" onclick="mostraStatistiche(\${x.fixture.id})">

            <div class="league">
              \${escapeHtml(x.league.name)}
            </div>

            <div class="match">

              <div class="team home">
                \${home}
              </div>

              <div class="score">
                \${gh} - \${ga}
              </div>

              <div class="team away">
                \${away}
              </div>

            </div>

            <div class="status">
              \${escapeHtml(statoPartita(x))}
            </div>

            <div class="dettagli">
              Tocca per vedere le statistiche →
            </div>

          </div>
        \`;
      }).join("");

  } catch (e) {
    document.getElementById("partite").innerHTML =
      '<div class="loading">Errore nel caricamento.</div>';
  }
}

async function mostraStatistiche(id) {

  document.getElementById("dettaglio").innerHTML =
    '<div class="loading">Caricamento statistiche...</div>';

  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: "smooth"
  });

  try {
    const r = await fetch("/api/statistiche?id=" + id);
    const d = await r.json();

    if (!d.response || d.response.length < 2) {
      document.getElementById("dettaglio").innerHTML = \`
        <div class="stat-box">
          <div class="stat-title">
            Statistiche non ancora disponibili
          </div>
          <button class="indietro" onclick="chiudiDettaglio()">
            ← Torna alle partite
          </button>
        </div>
      \`;
      return;
    }

    const casa = d.response[0];
    const trasferta = d.response[1];

    const valoriCasa = {};
    const valoriTrasferta = {};

    casa.statistics.forEach(s => {
      valoriCasa[s.type] = s.value ?? "-";
    });

    trasferta.statistics.forEach(s => {
      valoriTrasferta[s.type] = s.value ?? "-";
    });

    const statistiche = [
      ["Possesso palla", "Ball Possession"],
      ["Tiri totali", "Total Shots"],
      ["Tiri in porta", "Shots on Goal"],
      ["Corner", "Corner Kicks"],
      ["Tiri fuori", "Shots off Goal"],
      ["Falli", "Fouls"],
      ["Fuorigioco", "Offsides"],
      ["Passaggi", "Total passes"],
      ["Cartellini gialli", "Yellow Cards"],
      ["Cartellini rossi", "Red Cards"],
      ["xG", "expected_goals"]
    ];

    let righe = "";

    statistiche.forEach(s => {

      const nome = s[0];
      const chiave = s[1];

      if (
        valoriCasa[chiave] !== undefined ||
        valoriTrasferta[chiave] !== undefined
      ) {

        righe += \`
          <div class="stat-row">

            <div class="stat-home">
              \${escapeHtml(valoriCasa[chiave] ?? "-")}
            </div>

            <div class="stat-value">
              \${nome}
            </div>

            <div class="stat-away">
              \${escapeHtml(valoriTrasferta[chiave] ?? "-")}
            </div>

          </div>
        \`;
      }
    });

    document.getElementById("dettaglio").innerHTML = \`
      <div class="stat-box">

        <div class="stat-title">
          📊 \${escapeHtml(casa.team.name)}
          vs
          \${escapeHtml(trasferta.team.name)}
        </div>

        \${righe || "<p>Nessuna statistica disponibile.</p>"}

        <button class="indietro" onclick="chiudiDettaglio()">
          ← Torna alle partite
        </button>

      </div>
    \`;

    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth"
    });

  } catch (e) {

    document.getElementById("dettaglio").innerHTML = \`
      <div class="stat-box">
        <div class="stat-title">
          Errore nel caricamento delle statistiche
        </div>

        <button class="indietro" onclick="chiudiDettaglio()">
          ← Torna alle partite
        </button>
      </div>
    \`;
  }
}

function chiudiDettaglio() {
  document.getElementById("dettaglio").innerHTML = "";
}

document.getElementById("b135").classList.add("active");

caricaPartite();
</script>

</body>
</html>
  `);
});

app.get("/api/partite", async (req, res) => {
  try {
    const league = req.query.league || "135";
    const data = dataItalia();

    const urlOggi =
      "https://v3.football.api-sports.io/fixtures" +
      "?league=" + encodeURIComponent(league) +
      "&season=" + new Date().getFullYear() +
      "&date=" + data;

    let risultato = await apiFootball(urlOggi);
    let partite = risultato.response || [];
    let prossime = false;

    if (partite.length === 0) {
      const urlProssime =
        "https://v3.football.api-sports.io/fixtures" +
        "?league=" + encodeURIComponent(league) +
        "&season=" + new Date().getFullYear() +
        "&next=5";

      risultato = await apiFootball(urlProssime);
      partite = risultato.response || [];
      prossime = true;
    }

    res.json({
      league: CAMPIONATI[league] || "Campionato",
      prossime: prossime,
      response: partite
    });
  } catch (errore) {
    console.error(errore);
    res.status(500).json({
      error: "Errore API Football"
    });
  }
});

    

app.get("/api/statistiche", async (req, res) => {

  try {

    const id = req.query.id;

    if (!id) {
      return res.status(400).json({
        error: "ID partita mancante"
      });
    }

    const url =
      "https://v3.football.api-sports.io/fixtures/statistics" +
      "?fixture=" + encodeURIComponent(id);

    const risultato = await apiFootball(url);

    res.json(risultato);

  } catch (errore) {

    console.error(errore);

    res.status(500).json({
      error: "Errore statistiche"
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("CalcioStats avviato");
});
