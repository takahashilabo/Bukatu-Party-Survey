import { checkAdmin, json, err } from "../../_shared.js";

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  if (body.password === env.ADMIN_PASSWORD) {
    return json({ ok: true });
  }
  return err("パスワードが違います", 401);
}
