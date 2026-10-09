// Penjadwal shift tim teknisi — Node.js murni (tanpa npm install).
// Data di db.json. Jalankan: node server.js  →  http://localhost:3000
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const DB = path.join(__dirname, "db.json");
const TIM = ["Tim 1", "Tim 2", "Tim 3", "Libur"];
const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const SHIFT = ["Pagi (08–16)", "Sore (16–00)", "Malam (00–08)"];

function SOAPawal() {
  const db = {};
  HARI.forEach((h, i) => {
    db[h] = {};
    SHIFT.forEach((s, j) => { db[h][s] = TIM[(i + j) % 3]; });
  });
  return db;
}

function baca() {
  try { return JSON.parse(fs.readFileSync(DB, "utf8")); }
  catch { const d = SOAPawal(); tulis(d); return d; }
}
function tulis(db) { fs.writeFileSync(DB, JSON.stringify(db, null, 2)); }

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png" };

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");

  if (url.pathname === "/api/jadwal" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ tim: TIM, hari: HARI, shift: SHIFT, jadwal: baca() }));
  }

  if (url.pathname === "/api/jadwal" && req.method === "POST") {
    let body = "";
    req.on("data", c => (body += c));
    return req.on("end", () => {
      try {
        const { hari, shift, tim } = JSON.parse(body);
        if (!HARI.includes(hari) || !SHIFT.includes(shift) || !TIM.includes(tim)) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "data tidak valid" }));
        }
        const db = baca(); db[hari][shift] = tim; tulis(db);
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ ok: true }));
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "JSON rusak" }));
      }
    });
  }

  // file statis
  let file = url.pathname === "/" ? "/index.html" : url.pathname;
  const fp = path.normalize(path.join(__dirname, "public", file));
  if (!fp.startsWith(path.join(__dirname, "public")) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
    res.writeHead(404); return res.end("tidak ketemu");
  }
  res.writeHead(200, { "Content-Type": MIME[path.extname(fp)] || "text/plain" });
  fs.createReadStream(fp).pipe(res);
});

server.listen(PORT, "127.0.0.1", () => console.log(`Jadwal shift jalan di http://127.0.0.1:${PORT}`));
