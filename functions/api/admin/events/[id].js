import { checkAdmin, json, err } from "../../../_shared.js";

export async function onRequest({ request, env, params }) {
  if (!checkAdmin(request, env)) return err("認証エラー", 401);

  const id = params.id;
  const raw = await env.KV.get(`event:${id}`);
  if (!raw) return err("イベントが見つかりません", 404);

  const event = JSON.parse(raw);

  if (request.method === "GET") {
    // 全メンバーの回答を並列取得
    const results = await Promise.all(
      event.members.map(name => env.KV.get(`response:${id}:${name}`))
    );
    const responses = {};
    event.members.forEach((name, i) => {
      if (results[i]) responses[name] = JSON.parse(results[i]);
    });
    return json({ event, responses });
  }

  if (request.method === "DELETE") {
    // イベント本体を削除、回答も並列削除
    await Promise.all([
      env.KV.delete(`event:${id}`),
      ...event.members.map(name => env.KV.delete(`response:${id}:${name}`)),
    ]);
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
