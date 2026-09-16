import {
  getActiveModels,
  getCapabilities,
  getDefaultChatModel,
} from "@/lib/ai/models";
import { getAiRuntime } from "@/lib/ai/runtime";

export async function GET() {
  const headers = {
    "Cache-Control": "public, max-age=60, s-maxage=60",
  };

  const capabilities = await getCapabilities();
  const models = getActiveModels();

  return Response.json(
    {
      capabilities,
      defaultModel: getDefaultChatModel(),
      models,
      provider: getAiRuntime(),
    },
    { headers }
  );
}
