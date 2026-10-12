# Kadam AI: Gemini + Vercel

A static React app plus two serverless functions. Your Gemini API key lives only in a Vercel environment variable and is never sent to the browser.

## Files
- `index.html`: the app. It calls `/api/chat` and `/api/plan`, and falls back to the built-in mock AI if they fail.
- `api/chat.js`: mentor chat.
- `api/plan.js`: roadmap generator.
- `lib/ai.js`: the only code that reads the key. It also does rate limiting, the origin check and input clipping.
- `vercel.json`: time limits for the functions.
- `.env.example`: the variables to set. Copy it to `.env.local` for local work. Real keys must never be committed (`.gitignore` already skips them).

## Deploy
1. Create a key in Google AI Studio (aistudio.google.com, Get API key).
2. Push this folder to GitHub and import it in Vercel, or run `npx vercel` inside it.
3. In Vercel open Project, Settings, Environment Variables. Add `GEMINI_API_KEY` and switch on Sensitive so the value is hidden after saving. Optional: `GEMINI_MODEL`, `ALLOWED_ORIGINS`.
4. Redeploy so the variables apply.
5. Test it:

```
curl -X POST https://YOUR-DOMAIN/api/chat -H "Content-Type: application/json" -d '{"text":"Give me a study tip","goal":"Crack SSC CGL"}'
```

A reply like `{"reply":"..."}` means it works. For local testing run `npx vercel dev` with a `.env.local` file.

## Keep the key safe
- Only `lib/ai.js` reads `GEMINI_API_KEY`. It sends the key in a request header from the server, so it is never in the page, the URL, a response or the logs.
- Set `ALLOWED_ORIGINS` to your site, for example `https://kadam.example.com` (comma separate several). Browsers from other sites are rejected. Add preview URLs if you test on them.
- In Google Cloud Console, restrict the key to the Generative Language API and set a budget alert.
- If the key ever leaks, delete it in AI Studio, create a new one, update Vercel and redeploy.

## Before heavy traffic
- The rate limit (20 chats and 5 plans per minute per IP) is per server instance and resets on cold starts. Use Upstash Redis or Vercel KV for a firm limit, and add sign-in so only your users can call the API.
- Model names change. If calls fail, check Google's model list and update `GEMINI_MODEL`.
- The page compiles JSX in the browser and loads Tailwind from its CDN script. That is fine for a prototype; move to a Vite build for production speed.
- If the app seems to give canned answers, open the browser console. A "failed, using mock" line shows why.
