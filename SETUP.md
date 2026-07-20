# Bahamas Culture Chatbot — Setup Guide

## What you're getting

- **`api-chat-route.ts`** → Next.js API route that calls the Anthropic (Claude) API
- **`ChatWidget.tsx`** → Floating chat bubble component with streaming responses
- Themed in Bahamian green & blue with 🌴 toggle button

---

## 1. Install the Anthropic SDK

```bash
npm install @anthropic-ai/sdk
```

---

## 2. Get your API key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an account (free tier available)
3. Generate an API key under **API Keys**

---

## 3. Add your API key

Create or edit `.env.local` in your project root:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

> Never commit this file — it's already in `.gitignore` by default in Next.js.

---

## 4. Add the API route

Copy `api-chat-route.ts` to:

```
your-project/
  app/
    api/
      chat/
        route.ts    ← paste the file here (rename it)
```

---

## 5. Add the chat widget

Copy `ChatWidget.tsx` into your components folder, then add it to your layout or any page:

```tsx
// app/layout.tsx  (recommended — appears on every page)
import ChatWidget from "@/components/ChatWidget";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <ChatWidget />   {/* ← add this */}
      </body>
    </html>
  );
}
```

---

## 6. Run it

```bash
npm run dev
```

Visit your site — you'll see a 🌴 button in the bottom-right corner.

---

## Customization tips

| What to change | Where |
|---|---|
| Chatbot personality / knowledge | `SYSTEM_PROMPT` in `route.ts` |
| Suggested starter questions | `SUGGESTED_QUESTIONS` array in `ChatWidget.tsx` |
| Colors | `background: "linear-gradient(135deg, #009B77, #005F99)"` |
| Toggle button emoji | The `"🌴"` in the button |
| AI model | `model: "claude-opus-4-8"` in `route.ts` (try `claude-haiku-4-5-20251001` for faster/cheaper) |

---

## Estimated cost

- Claude Haiku: ~$0.0008 per 1K tokens (very cheap for a personal site)
- Claude Sonnet: ~$0.003 per 1K tokens (smarter, still affordable)
- A typical chat exchange is ~300-600 tokens total

For a personal portfolio site, your monthly API bill will likely be **under $1**.
