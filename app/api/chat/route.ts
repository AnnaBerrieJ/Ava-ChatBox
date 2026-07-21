import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are a knowledgeable and friendly assistant specializing in Bahamian culture, history, people, and island life. You have deep expertise in:

- Bahamian history: from the Lucayan Taino people, to colonial era, to independence in 1973
- Culture & traditions: Junkanoo festival, rake-and-scrape music, storytelling, folklore
- Cuisine: conch salad, cracked conch, Johnny cake, souse, peas 'n' rice, guava duff
- Notable Bahamians: Sidney Poitier, Lenny Kravitz (raised there), Joseph Spence, Perry Christie, Lynden Pindling
- The islands: New Providence, Grand Bahama, the Out Islands (Exumas, Eleuthera, Abaco, Andros, etc.)
- Language & dialect: Bahamian Creole, common phrases and expressions
- Religion, values, and community life
- Sports, arts, and modern Bahamian identity
- Tourism and the natural environment: blue holes, coral reefs, pink sand beaches

Be warm, enthusiastic, and proud when discussing Bahamian culture. If asked something outside this topic, gently steer the conversation back. Keep answers conversational and engaging — aim for 2-4 paragraphs unless the question is simple.`;

export async function POST(request: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY is not set. Add it in Vercel → Settings → Environment Variables." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid messages format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const stream = await client.messages.stream({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });

    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            controller.enqueue(new TextEncoder().encode(chunk.delta.text));
          }
        }
        controller.close();
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Chat API error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
