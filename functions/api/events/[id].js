import { json, err } from "../../_shared.js";

export async function onRequest({ request, env, params }) {
  const id = params.id;
  const raw = await env.KV.get(`event:${id}`);
  if (!raw) return err("イベントが見つかりません", 404);

  const event = JSON.parse(raw);

  if (request.method === "GET") {
    // 各メンバーの回答を取得
    const responses = {};
    for (const name of event.members) {
      const r = await env.KV.get(`response:${id}:${name}`);
      if (r) responses[name] = JSON.parse(r);
    }
    // 公開情報のみ返す（members, prices, title, date）
    return json({
      id: event.id,
      title: event.title,
      date: event.date,
      prices: event.prices,
      members: event.members,
      responses,
    });
  }

  if (request.method === "POST") {
    const { memberName, choice } = await request.json();
    if (!memberName || !choice) return err("memberName と choice は必須です");
    if (!event.members.includes(memberName)) return err("メンバーが見つかりません");
    const validChoices = ["父", "母", "子", "参加しない"];
    if (!validChoices.includes(choice)) return err("無効な選択肢です");

    await env.KV.put(
      `response:${id}:${memberName}`,
      JSON.stringify({ choice, updatedAt: new Date().toISOString() })
    );
    return json({ ok: true });
  }

  return err("Method Not Allowed", 405);
}
