import { getCapabilities, isDemo, chatModels } from "@/lib/ai/models";

export async function GET() {
  const headers = {
    "Cache-Control": "public, max-age=86400, s-maxage=86400",
  };

  const capabilities = await getCapabilities();

  if (isDemo) {
    return Response.json(
      {
        capabilities,
        models: chatModels,
      },
      { headers }
    );
  }

  return Response.json(capabilities, { headers });
}
