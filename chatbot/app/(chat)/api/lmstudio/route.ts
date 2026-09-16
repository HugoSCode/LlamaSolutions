import { probeLmStudio } from "@/lib/ai/lmstudio";
import { getAiRuntime } from "@/lib/ai/runtime";

export async function GET() {
  if (getAiRuntime() === "gateway") {
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
