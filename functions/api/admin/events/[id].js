import { checkAdmin, json, err } from "../../../_shared.js";

export async function onRequest({ request, env, params }) {
  if (!checkAdmin(request, env)) return err("認証エラー", 401);

  const id = params.id;
  const raw = await env.KV.get(`event:${id}`);
  if (!raw) return err("イベントが見つかりません", 404);

  const event = JSON.parse(raw);

  if (request.method === "GET") {
    const responses = {};
    for (const name of event.members) {
      const r = await env.KV.get(`response:${id}:${name}`);
      if (r) responses[name] = JSON.parse(r);
    }
    return json({ event, responses });
  }

  if (request.method === "DELETE") {
    // イベント本体を削除
    await env.KV.delete(`event:${id}`);
    // 回答を削除
    for (const name of event.members) {
      await env.KV.delete(`response:${id}:${name}`);
    }
    // インデックスから除外
    const rawIndex = await env.KV.get("events_index");
    if (rawIndex) {
      const index = JSON.parse(rawIndex).filter(e => e.id !== id);
      await env.KV.put("events_index", JSON.stringify(index));
    }
    return json({ ok: true });
  }

  return err("Method Not Allowed", 405);
}
