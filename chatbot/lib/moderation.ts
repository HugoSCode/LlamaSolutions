

export async function isFlagged(text: string) {
  try {
    const res = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ model: "omni-moderation-latest", input: text }),
    });
    const { results } = await res.json();
    return results[0].flagged as boolean;
  } catch {
    return true; 
  }
}