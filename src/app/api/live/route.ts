import { APP_VERSION } from "@/lib/version";

export function GET() {
  return Response.json({ status: "ok", version: APP_VERSION });
}
