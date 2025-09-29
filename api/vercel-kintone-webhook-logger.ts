// ────────────────────────────────────────────────────────────
// api/kintone-webhook.ts
// Minimal Vercel Serverless Function to receive Kintone webhooks
// Logs headers & payload; optional signature check (best‐effort)
// ────────────────────────────────────────────────────────────
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHmac } from "crypto";


/**
* NOTE on signature verification:
* Kintone can sign the *raw* request body with HMAC-SHA256 and send it in
* the `X-Cybozu-Webhook-Signature` header. In a Vercel Node function, `req.body`
* is already parsed (not raw). For quick validation we compute HMAC over
* `JSON.stringify(req.body)`, which is usually fine for Kintone's payload shape
* but is not bullet-proof if whitespace/ordering differ.
* For strict verification of the raw body, you would need to collect the raw
* bytes in a custom listener (or an Edge Function). For a simple logger, this
* best-effort check is sufficient for most tests.
*/
function verifySignature(body: any, signature: string | undefined, secret: string | undefined): boolean {
if (!secret || !signature) return false;
try {
const payload = typeof body === "string" ? body : JSON.stringify(body);
const hmac = createHmac("sha256", secret).update(payload).digest("hex");
return hmac === signature;
} catch {
return false;
}
}


export default async function handler(req: VercelRequest, res: VercelResponse) {
if (req.method === "GET") {
return res.status(200).json({ ok: true, message: "kintone webhook logger up" });
}


if (req.method !== "POST") {
return res.status(405).json({ ok: false, error: "Method Not Allowed" });
}


const startedAt = new Date().toISOString();


const sigHeader = (req.headers["x-cybozu-webhook-signature"] || req.headers["X-Cybozu-Webhook-Signature"]) as string | undefined;
const secret = process.env.KINTONE_WEBHOOK_SECRET;
const isValid = verifySignature(req.body, sigHeader, secret);


// Redact a few noisy/irrelevant headers
const { host, "user-agent": userAgent, "content-type": contentType } = req.headers as Record<string, string>;


const logEntry = {
type: "kintone-webhook",
startedAt,
ip: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
path: req.url,
method: req.method,
headers: { host, userAgent, contentType },
signaturePresent: Boolean(sigHeader),
signatureValid: isValid,
body: req.body,
};


// This goes to Vercel logs ("Functions" tab or `vercel logs` CLI)
console.log(JSON.stringify(logEntry));


// Respond quickly so Kintone doesn't retry
return res.status(200).json({ ok: true, receivedAt: new Date().toISOString(), signatureValid: isValid });
}
