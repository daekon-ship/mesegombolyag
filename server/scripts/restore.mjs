// Használat: npm run restore -- <mentés-mappa-neve>
// A visszaállítás a szerver következő indulásakor fut le (Railway-en: Restart / Redeploy).
import { listBackups, requestRestore } from "../backup.mjs";
import { cliConfig } from "./cli-env.mjs";

const { dataDir } = cliConfig();
const name = process.argv[2];
if (!name) {
  console.log("Add meg a mentés nevét. Elérhető mentések:");
  console.log(listBackups(dataDir).join("\n") || "(nincs)");
  process.exit(1);
}
const info = requestRestore({ dataDir, backupName: name });
console.log(`Visszaállítás előjegyezve: ${name} ${JSON.stringify(info.counts)}`);
console.log("A szerver következő indulásakor lép életbe (Railway: a szolgáltatás Restart gombja).");
