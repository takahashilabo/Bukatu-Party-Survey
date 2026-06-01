import { json, err } from "../../_shared.js";

const VALID_CHOICES = ["父", "母", "子", "参加しない"];

export async function onRequest({ request, env, params }) {
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
    const body = await request.json();
    const { memberName } = body;
    // choices: 配列（新形式）、choice: 文字列（旧形式も受け付け）
    const choices = body.choices ?? (body.choice ? [body.choice] : null);

    if (!memberName || !choices) return err("memberName と choices は必須です");
    if (!event.members.includes(memberName)) return err("メンバーが見つかりません");
    if (!Array.isArray(choices) || choices.some(c => !VALID_CHOICES.includes(c))) {
      return err("無効な選択肢が含まれています");
    }

    await env.KV.put(
      `response:${id}:${memberName}`,
      JSON.stringify({ choices, updatedAt: new Date().toISOString() })
    );
    return json({ ok: true });
  }

  return err("Method Not Allowed", 405);
}
