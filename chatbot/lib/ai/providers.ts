import { createOpenAI } from "@ai-sdk/openai";
import { customProvider, gateway } from "ai";

import { isTestEnvironment } from "../constants";

import { titleModel } from "./models";

const lmstudio = createOpenAI({
  baseURL: process.env.LMSTUDIO_BASE_URL || "http://localhost:1234/v1",
  apiKey: process.env.LMSTUDIO_API_KEY || "lm-studio",
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
    return myProvider.languageModel(modelId);
  }

  return lmstudio.chat(modelId);
}

export function getTitleModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("title-model");
  }

  return lmstudio.chat(process.env.LMSTUDIO_MODEL || "your-model-id");
}