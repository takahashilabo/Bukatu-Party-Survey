import { checkAdmin, json, err } from "../../../_shared.js";

export async function onRequest({ request, env, params }) {
  if (!checkAdmin(request, env)) return err("認証エラー", 401);

  const id = params.id;
  const raw = await env.KV.get(`event:${id}`);
  if (!raw) return err("イベントが見つかりません", 404);

  const event = JSON.parse(raw);

  // 各メンバーの回答を取得
  const responses = {};
  for (const name of event.members) {
    const r = await env.KV.get(`response:${id}:${name}`);
    if (r) responses[name] = JSON.parse(r);
  }

  return json({ event, responses });
}
