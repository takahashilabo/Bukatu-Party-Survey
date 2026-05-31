import { checkAdmin, encrypt, decrypt, json, err } from "../../_shared.js";

export async function onRequest({ request, env }) {
  if (!checkAdmin(request, env)) return err("認証エラー", 401);

  if (request.method === "GET") {
    const raw = await env.KV.get("master_members");
    if (!raw) return json({ members: [] });
    const decrypted = await decrypt(raw, env.ENCRYPTION_KEY);
    return json({ members: JSON.parse(decrypted) });
  }

  if (request.method === "PUT") {
    const { members } = await request.json();
    if (!Array.isArray(members)) return err("membersは配列で指定してください");
    const encrypted = await encrypt(JSON.stringify(members), env.ENCRYPTION_KEY);
    await env.KV.put("master_members", encrypted);
    return json({ ok: true });
  }

  return err("Method Not Allowed", 405);
}
