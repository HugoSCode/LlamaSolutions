import OpenAI from "openai";

export async function isFlagged(text: string) {

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const decision = await client.decisions.create({
    model: "gpt-6-luna",
    input: text,
    questions: [{
      type: "choice",
      name: "Category",
      instructions: "What category does this message fall into?",
      choices: [
        {
          "value": "self_harm",
          "description": "Messages expressing suicidal thoughts, self-injury, or intent to harm oneself."
        },
        {
          "value": "violence",
          "description": "Threats, plans, or requests to harm, attack, or kill another person."
        },
        {
          "value": "weapons",
          "description": "Requests to create, obtain, or use weapons for harmful purposes."
        },
        {
          "value": "illegal_activity",
          "description": "Requests for assistance committing crimes, fraud, theft, or evading law enforcement."
        },
        {
          "value": "sexual_abuse",
          "description": "Sexual exploitation, coercion, abuse, or sexual content involving minors."
        },
        {
          "value": "hate_and_harassment",
          "description": "Hateful attacks, targeted harassment, or threats against individuals or protected groups."
        },
        {
          "value": "cyber_abuse",
          "description": "Requests for malware, credential theft, unauthorized access, or other malicious cyber activity."
        },
        {
          "value": "dangerous_substances",
          "description": "Instructions for creating or misusing poisons, explosives, or other dangerous substances."
        },
        {
          "value": "privacy_violation",
          "description": "Requests to expose private information, dox someone, or conduct unauthorized surveillance."
        },
        {
          "value": "other_unsafe",
          "description": "Unsafe requests that do not fit the categories above."
        },
        {
          "value": "safe",
          "description": "Benign messages, ordinary questions, or legitimate requests that do not indicate unsafe intent."
        }
      ]
    }]
  });

  console.log(decision)

}