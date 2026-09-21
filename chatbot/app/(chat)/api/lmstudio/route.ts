import { probeLmStudio } from "@/lib/ai/lmstudio";
import { isOnVercel } from "@/lib/ai/runtime";

export async function GET() {
  // Cloud deploys cannot reach the school LAN LM Studio host.
  if (isOnVercel()) {
    return Response.json(
      {
        models: [],
        provider: "gateway",
        status: "healthy",
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  const result = await probeLmStudio();

  return Response.json(
    {
      ...result,
      provider: "lmstudio",
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
