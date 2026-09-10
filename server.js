const express = require("express");
const app = express();

const KEY = process.env.API_FOOTBALL_KEY;
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="it">
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>CalcioStats</title>
<style>
body {
  margin: 0;
  background: #081018;
  color: white;
  font-family: Arial;
  padding: 20px;
}
h1 { color: #61d4c5; }
button {
  padding: 12px;
  border: 0;
  border-radius: 10px;
}
.card {
  background: #151e28;
  padding: 18px;
  margin: 12px 0;
  border-radius: 15px;
}
</style>
</head>

<body>

<h1>⚽ CalcioStats</h1>
<p>Risultati e statistiche di calcio</p>

<button onclick="carica()">🔄 Aggiorna partite</button>

<div id="partite">Premi Aggiorna</div>

<script>
async function carica() {
  document.getElementById("partite").innerHTML = "Caricamento...";

  try {
    const r = await fetch("/api/partite");
    const d = await r.json();

    document.getElementById("partite").innerHTML =
      d.response.map(x => \`
        <div class="card">
          <b>\${x.teams.home.name}</b>
          \${x.goals.home ?? 0}
          -
          \${x.goals.away ?? 0}
          <b>\${x.teams.away.name}</b>
          <br>
          <small>\${x.league.name}</small>
        </div>
      \`).join("");

  } catch (e) {
    document.getElementById("partite").innerHTML =
      "Errore nel caricamento";
  }
}
</script>

</body>
</html>
  `);
});

app.get("/api/partite", async (req, res) => {
  const data = new Date().toISOString().slice(0, 10);

  const r = await fetch(
    "https://v3.football.api-sports.io/fixtures?date=" + data,
    {
      headers: {
        "x-apisports-key": KEY
      }
    }
  );

  res.json(await r.json());
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("CalcioStats avviato");
});
