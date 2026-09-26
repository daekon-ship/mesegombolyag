/**
 * Resend HTTPS API szerinti levélküldés (Railway Free/Trial/Hobby csomagon az SMTP nem használható).
 * Csak a szállításért felel — a foglalási logika nem hivatkozik rá közvetlenül, a mail.mjs választja ki.
 *
 * Az Idempotency-Key a kimenő levélsor sorazonosítójából képződik, így ugyanannak a levélnek
 * az újrapróbálása 24 órán belül nem eredményez dupla kézbesítést a szolgáltatónál.
 */
export function createResendTransport({ apiKey, from, apiBase = "https://api.resend.com", fetchImpl = fetch, timeoutMs = 15_000 }) {
  if (!apiKey) throw new Error("RESEND_API_KEY hiányzik.");
  if (!from) throw new Error("A feladó címe (MAIL_FROM) hiányzik.");

  return async function deliver(message) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let response;
    try {
      response = await fetchImpl(`${apiBase}/emails`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": message.idempotencyKey,
        },
        body: JSON.stringify({
          from,
          to: [message.to],
          subject: message.subject,
          html: message.html,
          text: message.text,
          ...(message.replyTo ? { reply_to: message.replyTo } : {}),
        }),
        signal: controller.signal,
      });
    } catch (error) {
      throw new Error(error?.name === "AbortError" ? "A levélküldő szolgáltatás nem válaszolt időben." : `A levélküldő szolgáltatás nem érhető el (${error?.message || error}).`);
    } finally {
      clearTimeout(timer);
    }

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      // A szolgáltató hibaüzenete nem tartalmaz titkot; az API-kulcsot sosem naplózzuk.
      const detail = payload?.message || payload?.name || response.statusText;
      throw new Error(`Resend hiba (${response.status}): ${String(detail).slice(0, 300)}`);
    }
    return { providerId: payload?.id ?? null };
  };
}
