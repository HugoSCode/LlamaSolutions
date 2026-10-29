
import OpenAI from "openai";
import fs from "fs";

export async function isFlagged(text: string, session: any, id: string) {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    maxRetries: 0,
    timeout: 3000,
  });

  try {
    const decision = await client.decisions.create({
      model: "gpt-6-luna",
      input: text,
      questions: [{
        type: "choice",
        name: "Category",
        instructions: "What category does this message fall into?",
        choices: [
          { value: "self_harm", description: "Messages expressing suicidal thoughts, self-injury, or intent to harm oneself." },
          { value: "violence", description: "Threats, plans, or requests to harm, attack, or kill another person." },
          { value: "weapons", description: "Requests to create, obtain, or use weapons for harmful purposes." },
          { value: "illegal_activity", description: "Requests for assistance committing crimes, fraud, theft, or evading law enforcement." },
          { value: "sexual_abuse", description: "Sexual exploitation, coercion, abuse, or sexual content involving minors." },
          { value: "hate_and_harassment", description: "Hateful attacks, targeted harassment, or threats against individuals or protected groups." },
          { value: "cyber_abuse", description: "Requests for malware, credential theft, unauthorized access, or other malicious cyber activity." },
          { value: "dangerous_substances", description: "Instructions for creating or misusing poisons, explosives, or other dangerous substances." },
          { value: "privacy_violation", description: "Requests to expose private information, dox someone, or conduct unauthorized surveillance." },
          { value: "other_unsafe", description: "Unsafe requests that do not fit the categories above." },
          { value: "safe", description: "Benign messages, ordinary questions, or legitimate requests that do not indicate unsafe intent." }
        ]
      }]
    });

    console.log("Moderation decision:", decision);

    const answer = decision.answers[0];

    if (answer.type === "choice" && answer.choice !== "safe") {
      fs.appendFileSync(
        "moderation.log",
        `Flagged message: ${text}\nDecision: ${JSON.stringify(decision)}\nuserId: ${session.user.id}, chatId: ${id}, ts: ${Date.now()}\n\n`
      );
      return true;
    } else {
      return false;
    }

  }
  catch (error) {
    if (error instanceof OpenAI.APIError) {
      console.error("Moderation API error:", {
        status: error.status,
        code: error.code,
        message: error.message,
      });

      if (
        error.code === "insufficient_quota" ||
        error.code === "credit_balance_exhausted" ||
        error.code === "organization_spend_limit_exceeded" ||
        error.code === "project_spend_limit_exceeded" ||
        error.code === "organization_usage_limit_exceeded"
      ) {
        console.warn("Moderation skipped: API credits or quota exhausted.");
        return false;
      }
    } else {
      console.error("Moderation failed:", error);
    }

    // Allow the chat to continue if moderation fails for any reason.
    return false;
  }

}
