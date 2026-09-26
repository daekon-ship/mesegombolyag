import fs from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";
import { createResendTransport } from "./mail-resend.mjs";

/**
 * E-mail-küldés kimenő soron (email_outbox) keresztül.
 * Az adatmentés és a levélküldés külön lépés: a beküldés akkor is sikeres,
 * ha a levél nem megy ki — a hiba a naplóban látszik, és az adminból újraküldhető.
 *
 * MAIL_TRANSPORT:
 *   resend   — HTTPS API (Railway Free/Trial/Hobby csomagon ez működik); RESEND_API_KEY kell
 *   smtp     — SMTP (Railway-en csak Pro csomagtól); SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 *   file     — levélfogó: a leveleket a DATA_DIR/mail-capture mappába írja (.html + .txt)
 *   fail     — minden küldés hibát ad (hibakezelés teszteléséhez)
 *   disabled — nem küld, a levél „failed" állapotba kerül magyarázattal
 * Alapértelmezés: resend, ha RESEND_API_KEY van; smtp, ha SMTP_HOST van; különben disabled.
 */
export function createMailer({ transport, captureDir, from, smtp = {}, resend = {} }) {
  const mode = transport || (resend.apiKey ? "resend" : smtp.host ? "smtp" : "disabled");
  let smtpTransport = null;
  const resendDeliver = mode === "resend" ? createResendTransport({ ...resend, from }) : null;

  async function deliver(message) {
    if (mode === "fail") throw new Error("Szimulált levélküldési hiba (MAIL_TRANSPORT=fail).");
    if (mode === "disabled") throw new Error("A levélküldés nincs beállítva (hiányzó RESEND_API_KEY vagy SMTP beállítás).");
    if (mode === "file") {
      fs.mkdirSync(captureDir, { recursive: true });
      const base = path.join(captureDir, `${Date.now()}-${message.id}-${message.to.replace(/[^a-z0-9@.]/gi, "_")}`);
      fs.writeFileSync(`${base}.html`, message.html, "utf8");
      fs.writeFileSync(
        `${base}.txt`,
        `To: ${message.to}
From: ${from}
${message.replyTo ? `Reply-To: ${message.replyTo}
` : ""}Idempotency-Key: ${message.idempotencyKey}
Subject: ${message.subject}

${message.text}`,
        "utf8",
      );
      return { providerId: null };
    }
    if (mode === "resend") return resendDeliver(message);
    if (mode === "smtp") {
      if (!smtpTransport) {
        smtpTransport = nodemailer.createTransport({
          host: smtp.host,
          port: smtp.port,
          secure: smtp.port === 465,
          auth: smtp.user ? { user: smtp.user, pass: smtp.pass } : undefined,
        });
      }
      const info = await smtpTransport.sendMail({ from, to: message.to, replyTo: message.replyTo || undefined, subject: message.subject, text: message.text, html: message.html });
      return { providerId: info?.messageId ?? null };
    }
    throw new Error(`Ismeretlen MAIL_TRANSPORT: ${mode}`);
  }

  return { mode, deliver };
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Egységes levélsablon. A `rows` kulcs–érték sorai a részleteket, a `paragraphs` a törzsszöveget,
 * az opcionális `action` egy gombot ad. Egyoszlopos, max. 560 px széles, mobilon is olvasható.
 */
export function renderEmail({ subject, greeting, paragraphs = [], rows = [], action, footerNote, signature = true }) {
  const textParts = [greeting, "", ...paragraphs.flatMap((p) => [p, ""])];
  if (rows.length) textParts.push(...rows.map(([k, v]) => `${k}: ${v}`), "");
  if (action) textParts.push(`${action.label}: ${action.url}`, "");
  if (footerNote) textParts.push(footerNote, "");
  if (signature) textParts.push("Üdvözlettel:", "Tóth Johanna – Mesegombolyag");
  else textParts.push("— Mesegombolyag weboldal, automatikus értesítés");
  const text = textParts.join("\n");

  const rowsHtml = rows.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-collapse:collapse;">${rows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:8px 0;border-bottom:1px solid #e7ddcc;color:#826878;font-size:13px;width:38%;vertical-align:top;">${escapeHtml(k)}</td><td style="padding:8px 0;border-bottom:1px solid #e7ddcc;color:#25221f;font-size:15px;vertical-align:top;white-space:pre-line;">${escapeHtml(v)}</td></tr>`,
        )
        .join("")}</table>`
    : "";
  const actionHtml = action
    ? `<p style="margin:24px 0;"><a href="${escapeHtml(action.url)}" style="display:inline-block;background:#203a32;color:#f6f0e5;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600;font-size:15px;">${escapeHtml(action.label)}</a></p>`
    : "";

  const html = `<!doctype html>
<html lang="hu"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#f6f0e5;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f0e5;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:18px;">
<tr><td style="padding:28px 24px 8px;font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#203a32;">Mesegombolyag</td></tr>
<tr><td style="padding:8px 24px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#25221f;">
<p style="margin:0 0 14px;">${escapeHtml(greeting)}</p>
${paragraphs.map((p) => `<p style="margin:0 0 14px;white-space:pre-line;">${escapeHtml(p)}</p>`).join("\n")}
${rowsHtml}
${actionHtml}
${footerNote ? `<p style="margin:0 0 14px;font-size:13px;color:#6b6259;">${escapeHtml(footerNote)}</p>` : ""}
${signature ? '<p style="margin:20px 0 0;">Üdvözlettel:<br>Tóth Johanna – Mesegombolyag</p>' : '<p style="margin:20px 0 0;font-size:13px;color:#6b6259;">Mesegombolyag weboldal – automatikus értesítés</p>'}
</td></tr></table>
</td></tr></table>
</body></html>`;

  return { subject, text, html };
}
