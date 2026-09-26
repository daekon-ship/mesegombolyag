// Admin jelszó beállítása / cseréje és a meglévő munkamenetek érvénytelenítése.
//   npm run admin:password                  — jelszó bekérése (a beírás nem látszik)
//   npm run admin:password -- --revoke-only — csak az összes munkamenet érvénytelenítése
// A jelszót nem parancssori argumentumként kéri (az a shell-előzményekben és a folyamatlistában látszana).
import readline from "node:readline";
import bcrypt from "bcryptjs";
import { openDatabase } from "../db.mjs";
import { cliConfig } from "./cli-env.mjs";

const { dbPath } = cliConfig();
const db = openDatabase(dbPath);
const username = process.env.ADMIN_USERNAME || "mesegombolyag";

if (process.argv.includes("--revoke-only")) {
  const info = db.prepare("UPDATE admin_users SET token_version = token_version + 1").run();
  console.log(`${info.changes} admin felhasználó minden munkamenete érvénytelenítve.`);
  process.exit(0);
}

function ask(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY });
    if (process.stdin.isTTY) {
      // a beírt karakterek elrejtése
      rl._writeToOutput = (s) => { if (s.includes(question)) rl.output.write(s); };
    }
    rl.question(question, (answer) => {
      rl.close();
      if (process.stdin.isTTY) process.stdout.write("\n");
      resolve(answer);
    });
  });
}

const password = await ask("Új admin jelszó (min. 12 karakter): ");
const again = process.stdin.isTTY ? await ask("Jelszó újra: ") : password;
if (password.length < 12) {
  console.error("A jelszó legalább 12 karakter legyen.");
  process.exit(1);
}
if (password !== again) {
  console.error("A két jelszó nem egyezik.");
  process.exit(1);
}
const hash = bcrypt.hashSync(password, 12);
const existing = db.prepare("SELECT id FROM admin_users WHERE username = ?").get(username);
if (existing) {
  db.prepare("UPDATE admin_users SET password_hash = ?, token_version = token_version + 1 WHERE id = ?").run(hash, existing.id);
  console.log(`A(z) „${username}" jelszava megváltozott, a korábbi munkamenetek érvénytelenek.`);
} else {
  db.prepare("INSERT INTO admin_users (username, email, password_hash, created_at) VALUES (?, ?, ?, ?)").run(username, process.env.ADMIN_EMAIL || null, hash, new Date().toISOString());
  console.log(`Admin felhasználó létrehozva: „${username}".`);
}
// Más admin felhasználók: munkamenetük érvénytelen, és figyelmeztetünk, mert a jelszavuk nem változott.
db.prepare("UPDATE admin_users SET token_version = token_version + 1 WHERE username != ?").run(username);
const others = db.prepare("SELECT username FROM admin_users WHERE username != ?").all(username).map((r) => r.username);
if (others.length) console.warn(`Figyelem: további admin felhasználók is léteznek (${others.join(", ")}); az ő jelszavukat is cseréld le ADMIN_USERNAME=<név> npm run admin:password paranccsal.`);
db.close();
