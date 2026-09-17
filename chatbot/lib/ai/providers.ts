import { createOpenAI } from "@ai-sdk/openai";
import { customProvider } from "ai";

import { isTestEnvironment } from "../constants";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function normalizeOpenAIModelId(modelId: string) {
  return modelId.replace(/^openai\//, "");
}

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

  return openai(normalizeOpenAIModelId(modelId));
}

export function getTitleModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("title-model");
  }

  return openai("gpt-4o-mini");
}