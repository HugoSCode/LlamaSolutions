import { createOpenAI } from "@ai-sdk/openai";
import { customProvider, gateway } from "ai";

import { isTestEnvironment } from "../constants";

import { getTitleModelConfig } from "./models";
import { isAiGatewayEnabled } from "./runtime";

const lmstudio = createOpenAI({
  apiKey: process.env.LMSTUDIO_API_KEY || "lm-studio",
  baseURL: process.env.LMSTUDIO_BASE_URL || "http://localhost:1234/v1",
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

  if (isAiGatewayEnabled()) {
    return gateway.languageModel(modelId);
  }

  return lmstudio.chat(modelId);
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
