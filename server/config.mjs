import path from "node:path";

/**
 * Környezeti változókból felépített konfiguráció.
 * Production módban a hiányzó vagy gyenge kötelező beállítás hibalistát ad, és a szerver nem indul el —
 * beépített alapjelszó vagy alap titok production módban soha nem használható.
 */
export function loadConfig(env, { root }) {
  const errors = [];
  const isProduction = env.NODE_ENV === "production";
  const onRailway = Boolean(env.RAILWAY_ENVIRONMENT || env.RAILWAY_PROJECT_ID || env.RAILWAY_SERVICE_ID);

  // Tartós adatok helye: DATA_DIR → Railway-kötet csatolási pontja → ./data
  const dataDir = path.resolve(env.DATA_DIR || env.RAILWAY_VOLUME_MOUNT_PATH || path.join(root, "data"));
  if (isProduction && onRailway && !env.RAILWAY_VOLUME_MOUNT_PATH && !env.DATA_DIR && env.ALLOW_EPHEMERAL_DATA !== "1") {
    errors.push("Nincs Railway-kötet csatolva (RAILWAY_VOLUME_MOUNT_PATH hiányzik): az adatbázis és a feltöltött képek újratelepítéskor elvesznének. Csatolj egy Volume-ot a szolgáltatáshoz (pl. /data).");
  }

  const jwtSecret = env.JWT_SECRET || "";
  if (isProduction) {
    if (jwtSecret.length < 32) errors.push("JWT_SECRET hiányzik vagy túl rövid (legalább 32 véletlen karakter kell, pl. `openssl rand -hex 32`).");
    if (/change|example|minta|secret-in-production/i.test(jwtSecret)) errors.push("JWT_SECRET mintaértéknek tűnik — generálj új, véletlen értéket.");
  }

  let publicSiteUrl = (env.PUBLIC_SITE_URL || (env.RAILWAY_PUBLIC_DOMAIN ? `https://${env.RAILWAY_PUBLIC_DOMAIN}` : "")).replace(/\/+$/, "");
  if (!publicSiteUrl) {
    if (isProduction) errors.push("PUBLIC_SITE_URL hiányzik (a levelekben szereplő lemondási és admin hivatkozásokhoz kell, pl. https://mesegombolyag.up.railway.app).");
    else publicSiteUrl = `http://localhost:${env.VITE_PORT || 4173}`;
  } else if (isProduction && !publicSiteUrl.startsWith("https://")) {
    errors.push("PUBLIC_SITE_URL production módban https:// címmel kezdődjön.");
  }

  const resendApiKey = env.RESEND_API_KEY || "";
  const smtp = { host: env.SMTP_HOST, port: Number(env.SMTP_PORT || 587), user: env.SMTP_USER, pass: env.SMTP_PASS };
  const transport = env.MAIL_TRANSPORT || (resendApiKey ? "resend" : smtp.host ? "smtp" : "disabled");
  const mailFrom = env.MAIL_FROM || env.FROM_EMAIL || "";
  if (!["resend", "smtp", "file", "fail", "disabled"].includes(transport)) errors.push(`Ismeretlen MAIL_TRANSPORT: ${transport}`);
  if (transport === "resend" && !resendApiKey) errors.push("MAIL_TRANSPORT=resend, de a RESEND_API_KEY hiányzik.");
  if ((transport === "resend" || transport === "smtp") && !mailFrom) errors.push("MAIL_FROM hiányzik (hitelesített domainről küldő feladó, pl. \"Mesegombolyag <ertesites@pelda.hu>\").");
  if (isProduction && transport === "disabled" && env.MAIL_TRANSPORT !== "disabled") {
    errors.push("Nincs levélküldés beállítva (RESEND_API_KEY vagy SMTP). Ha szándékosan levél nélkül indítod, állítsd MAIL_TRANSPORT=disabled értékre.");
  }
  if (isProduction && (transport === "file" || transport === "fail")) errors.push(`MAIL_TRANSPORT=${transport} csak teszteléshez használható.`);

  const adminPassword = env.ADMIN_PASSWORD || "";
  if (isProduction && adminPassword && adminPassword.length < 12) errors.push("ADMIN_PASSWORD legalább 12 karakter legyen.");

  return {
    errors,
    isProduction,
    onRailway,
    host: env.HOST || "0.0.0.0",
    port: Number(env.PORT || 3001),
    dataDir,
    app: {
      dbPath: env.DB_PATH ? path.resolve(env.DB_PATH) : path.join(dataDir, "mesegombolyag.db"),
      uploadDir: path.join(dataDir, "uploads"),
      distDir: path.join(root, "dist"),
      basePath: env.BASE_PATH || "/",
      jwtSecret: jwtSecret || (isProduction ? "" : "mesegombolyag-local-dev-secret-only"),
      secureCookies: isProduction,
      trustProxy: env.TRUST_PROXY === "1" || onRailway ? 1 : false,
      corsOrigins: (env.CORS_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean),
      publicSiteUrl,
      adminNotifyEmail: env.ADMIN_NOTIFY_EMAIL || env.ADMIN_EMAIL || "",
      rateLimit: env.DISABLE_RATE_LIMIT !== "1",
      processOutboxOnStart: true,
      mail: {
        transport,
        captureDir: path.join(dataDir, "mail-capture"),
        from: mailFrom || "Mesegombolyag <mesegombolyag@localhost>",
        smtp,
        resend: { apiKey: resendApiKey, apiBase: env.RESEND_API_BASE || undefined },
      },
      bootstrapAdmin: {
        username: env.ADMIN_USERNAME || "mesegombolyag",
        email: env.ADMIN_EMAIL,
        password: adminPassword,
        passwordHash: env.ADMIN_PASSWORD_HASH,
      },
    },
  };
}
