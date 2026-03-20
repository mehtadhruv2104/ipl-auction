import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

const workbook = XLSX.readFile(
  path.join(process.env.HOME!, "Downloads", "IPL_2026_Squads.xlsx")
);
const sheet = workbook.Sheets["All Players"];
const raw = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

// Find the header row (the one starting with "#")
const headerIdx = raw.findIndex((r) => r[0] === "#");
const dataRows = raw.slice(headerIdx + 1).filter((r) => r[1]); // skip empty rows

const players = dataRows.map((row, i) => ({
  id: i + 1,
  name: String(row[1] ?? ""),
  team: String(row[2] ?? ""),
  role: String(row[3] ?? ""),
  nationality: String(row[4] ?? ""),
  acquisition: String(row[5] ?? ""),
  price: String(row[6] ?? ""),
  status: String(row[7] ?? ""),
}));

const outPath = path.join(__dirname, "..", "src", "data", "players.json");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(players, null, 2));
console.log(`Wrote ${players.length} players to ${outPath}`);
