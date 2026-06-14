import { checkAdmin, decrypt, json, err, genId } from "../../../_shared.js";

export async function onRequest({ request, env }) {
  if (!checkAdmin(request, env)) return err("認証エラー", 401);

  if (request.method === "GET") {
    const raw = await env.KV.get("events_index");
    const index = raw ? JSON.parse(raw) : [];
    return json({ events: index });
  }

  if (request.method === "POST") {
    const { title, date, prices } = await request.json();
    if (!title) return err("タイトルは必須です");

    // メンバーリストをマスターからコピー
    const rawMembers = await env.KV.get("master_members");
    let members = [];
    if (rawMembers) {
      const decrypted = await decrypt(rawMembers, env.ENCRYPTION_KEY);
      members = JSON.parse(decrypted);
    }

    const id = genId();
    const event = {
      id,
      title,
      date: date || "",
      prices: {
        父: prices?.父 ?? 0,
        母: prices?.母 ?? 0,
        子: prices?.子 ?? 0,
        誰も参加しない: 0,
      },
      members,
      createdAt: new Date().toISOString(),
    };

    await env.KV.put(`event:${id}`, JSON.stringify(event));

    // インデックス更新
    const raw = await env.KV.get("events_index");
    const index = raw ? JSON.parse(raw) : [];
    index.unshift({ id, title, date: event.date, createdAt: event.createdAt });
    await env.KV.put("events_index", JSON.stringify(index));

    return json({ ok: true, id });
  }

  return err("Method Not Allowed", 405);
}
