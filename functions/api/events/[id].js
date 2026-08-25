import { json, err } from "../../_shared.js";

function normalizeChoices(event) {
  if (event.choices) return event.choices;
  const LEGACY_ORDER = ["父", "母", "子", "誰も参加しない", "参加しない"];
  return LEGACY_ORDER
    .filter(k => k in (event.prices || {}))
    .map(k => ({
      label: k,
      price: event.prices[k] || 0,
      exclusive: k === "誰も参加しない" || k === "参加しない",
    }));
}

export async function onRequest({ request, env, params }) {
  const id = params.id;
  const raw = await env.KV.get(`event:${id}`);
  if (!raw) return err("イベントが見つかりません", 404);

  const event = JSON.parse(raw);
  if (event.archived) return err("このイベントは終了しました", 410);

  const choices = normalizeChoices(event);

  if (request.method === "GET") {
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
      choices,
      members: event.members,
      responses,
    });
  }

  if (request.method === "POST") {
    const body = await request.json();
    const { memberName } = body;
    const selectedChoices = body.choices ?? (body.choice ? [body.choice] : null);

    if (!memberName || !selectedChoices) return err("memberName と choices は必須です");
    if (!event.members.includes(memberName)) return err("メンバーが見つかりません");

    const validLabels = choices.map(c => c.label);
    if (!Array.isArray(selectedChoices) || selectedChoices.some(c => !validLabels.includes(c))) {
      return err("無効な選択肢が含まれています");
    }

    await env.KV.put(
      `response:${id}:${memberName}`,
      JSON.stringify({ choices: selectedChoices, updatedAt: new Date().toISOString() })
    );
    return json({ ok: true });
  }

  return err("Method Not Allowed", 405);
}
