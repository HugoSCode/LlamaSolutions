import { createOpenAI } from "@ai-sdk/openai";
import { customProvider, gateway } from "ai";

import { isTestEnvironment } from "../constants";

import { getLmStudioBaseUrl } from "./lmstudio";
import { getTitleModelConfig, resolveModelRuntime } from "./models";
import { isAiGatewayEnabled } from "./runtime";

const lmstudio = createOpenAI({
  apiKey: process.env.LMSTUDIO_API_KEY || "lm-studio",
  baseURL: getLmStudioBaseUrl(),
});

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        chatModel,
        titleModel: mockTitleModel,
      } = require("./models.mock");

      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "title-model": mockTitleModel,
        },
      });
    })()
  : null;

export function getLanguageModel(modelId: string) {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("chat-model");
  }

  if (resolveModelRuntime(modelId) === "lmstudio") {
    return lmstudio.chat(modelId);
  }

  return gateway.languageModel(modelId);
}

export function getTitleModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("title-model");
  }

  if (isAiGatewayEnabled()) {
    return gateway.languageModel(getTitleModelConfig().id);
  }

  return lmstudio.chat(process.env.LMSTUDIO_MODEL || getTitleModelConfig().id);
}
