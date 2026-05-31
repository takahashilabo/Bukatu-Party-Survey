// ---- Crypto helpers (AES-GCM, Web Crypto API) ----

function b64ToBytes(b64) {
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function bytesToB64(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

export async function encrypt(text, keyB64) {
  const keyData = b64ToBytes(keyB64);
  const key = await crypto.subtle.importKey("raw", keyData, "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const combined = new Uint8Array(12 + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), 12);
  return bytesToB64(combined);
}

export async function decrypt(encB64, keyB64) {
  const keyData = b64ToBytes(keyB64);
  const key = await crypto.subtle.importKey("raw", keyData, "AES-GCM", false, ["decrypt"]);
  const combined = b64ToBytes(encB64);
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return new TextDecoder().decode(decrypted);
}

// ---- Auth helper ----

export function checkAdmin(request, env) {
  const pw = request.headers.get("X-Admin-Password");
  return pw === env.ADMIN_PASSWORD;
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function err(msg, status = 400) {
  return json({ error: msg }, status);
}

// ---- ID generator ----
export function genId() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}
