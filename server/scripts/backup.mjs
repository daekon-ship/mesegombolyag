// Használat: npm run backup        — mentés a DATA_DIR/backups mappába
//            npm run backup -- --list
import { createBackup, listBackups } from "../backup.mjs";
import { cliConfig } from "./cli-env.mjs";

const { dataDir, dbPath } = cliConfig();
if (process.argv.includes("--list")) {
  const list = listBackups(dataDir);
  console.log(list.length ? list.join("\n") : "Nincs mentés.");
} else {
  const result = createBackup({ dataDir, dbPath });
  console.log(`Mentés kész: ${result.dir}`);
  console.log(JSON.stringify(result.counts));
}
