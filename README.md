# Digital Ambassador demo (92 Logics) for tender GHI/ED/PSR1

> **Demonstration by 92 Logics for tender GHI/ED/PSR1 — not an official Suffolk County Council service.**
> This site uses no Suffolk County Council or Suffolk Economy logos or branding. Its answers come from a small set of short, neutral summaries that 92 Logics wrote from public sources (listed below).

**Live demo:** https://92logics.github.io/suffolk-economy-avatar-demo/
**Admin view:** https://92logics.github.io/suffolk-economy-avatar-demo/admin.html

This is a browser-based AI "digital ambassador" for events and exhibitions. It answers visitor questions about investing and doing business in Suffolk **only from approved content**, shows the source for every answer, and says so when it doesn't know. Everything runs client-side on GitHub Pages: there are no API keys, no servers and no tracking. Visitor data stays in the browser's `localStorage`.

## What the demo shows

| Tender requirement (ITT Service Specification) | In this demo |
|---|---|
| Visual + voice avatar, animation and gestures | An original SVG avatar with idle motion, blinking, lip movement while speaking, a listening ring and a wave in the attract loop. Spoken answers use the Web Speech API (en-GB voice), with a voice on/off toggle. |
| Natural spoken conversation; accents | Speech-to-text via the browser's `SpeechRecognition` (en-GB) where supported (Chrome/Edge), with a typed fallback. |
| Restricted to approved content; no hallucination | BM25 retrieval over approved blocks, plus a coverage check: the question's specific words must be grounded in the matched block, otherwise the answer is *"I don't have approved information on that, so I won't guess."* Answers are extractive (approved text only). |
| Source citations | Every answer shows its source link(s) and content version. |
| Follow-up questions and context | "Tell me more" continues the last topic. Short or pronoun follow-ups ("which sites does it cover?") reuse the previous topic. |
| Audience tailoring | Selector for public, investor, business, student and partner, which changes the framing while keeping the same approved facts. |
| Safeguards | Abuse filter, neutral refusal for political or opinion questions, a warning against sharing personal or financial details, and a polite decline with signposting. |
| Signposting and event-specific promotion | Each block carries a signpost link. An illustrative "this event" block shows how stand, speaker and partner information is added before an event and removed afterwards. |
| Lead capture (consent) and QR code | "Leave your details" form (name, company, email, interest, required consent checkbox). The QR code opens `lead.html` (in production, a Suffolk Economy-owned form). Leads export as CSV, guarded against spreadsheet formula injection. |
| Kiosk / event mode | Full-screen mode, an attract loop after 30 s idle, a "Still there?" warning, then an automatic conversation reset and new session after 90 s of inactivity. Timings can be overridden with `?attract=ms&idle=ms` and `?kiosk`. |
| Content management, version control, audit | Admin view: approve or block blocks, set source priority (1–3), add, edit or remove blocks (each edit bumps the version), restore the baseline, export JSON, and view a full audit log. |
| Urgent removal (compromised source) | An "Emergency: block domain" control blocks every block from a domain in one step and logs it. The ambassador stops using that content immediately, including in other open tabs. |
| Analytics and reporting | Sessions, questions, % answered from approved content, unanswered questions (content gaps), moderated count, average questions per conversation, top topics, audiences, signpost and source clicks, leads captured. Questions export as CSV. |
| Accessibility | Live captions/subtitles, larger text, high contrast, keyboard operable, `prefers-reduced-motion` respected, and typed input as an alternative to voice. |

## Run locally

```bash
python3 -m http.server 8080   # then open http://localhost:8080/
```

## How the production version would work

The demo deliberately keeps the *governed* parts (approved content, priorities, blocking, audit, analytics, lead capture by consent) and replaces the two expensive parts with browser equivalents. In production:

1. **Grounded LLM (e.g. Azure OpenAI, UK South region).** The `compose` step in `engine.js` is replaced by a call to an Azure OpenAI deployment. It receives *only* the top-k approved passages retrieved from an index (e.g. Azure AI Search with hybrid vector + keyword search), under a system prompt that requires answers only from those passages, with citations, and a fixed "I don't know" reply when they are insufficient. We would add Azure AI Content Safety on input and output, a groundedness check before an answer is spoken, and tone and audience instructions. Conversation logs would be minimised, pseudonymised and held in a UK region.
2. **Content pipeline.** Suffolk Economy staff upload or point to approved documents and pages. Each is chunked, versioned and tagged with priority, owner and review date. Blocking a source removes its chunks from the index at once, so they are never retrieved again. An emergency "kill switch" can block a whole domain or take the avatar into a safe "signpost only" mode.
3. **Commercial avatar engine.** The SVG avatar is swapped for a licensed real-time avatar (for example Azure AI Speech text-to-speech avatar, or a comparable commercial engine chosen with Suffolk Economy). It is driven by the same answer text and SSML, with custom outfit, colours, logo and voice so it is distinct from library characters. It runs in a kiosk-mode browser or desktop shell on the supplied Dell XPS 16, with display output to tabletop screens or a hologram unit as an option.
4. **Speech.** Cloud speech-to-text (e.g. Azure AI Speech) with en-GB models, custom phrase lists (place names, programme names) and noise-robust microphone settings for busy halls. Text-to-speech uses a neural British English voice, with captions always on.
5. **Lead capture.** The QR code and form post to a Suffolk Economy-owned form or CRM, so the supplier never holds the lead data unless contracted to.
6. **Monitoring.** Health checks, uptime alerts and a support channel for live events, plus an offline fallback mode (cached approved FAQ) if venue Wi-Fi fails.

## Files

- `index.html`, `app.js`: the ambassador (avatar, chat, voice, kiosk, attract and idle, lead form, QR code)
- `engine.js`: retrieval, grounding check, follow-ups, audience framing, guardrails
- `kb.js`: approved knowledge base (baseline), with sources
- `store.js`: local persistence, CSV export, audit log
- `admin.html`, `admin.js`: content governance, leads, analytics, audit
- `lead.html`: QR follow-up form
- `vendor/qrcode.js`: QR Code Generator by Kazuhiko Arase (MIT licence)

## Public sources used for the knowledge summaries (checked 29 Oct 2026)

- Wikipedia: Suffolk (population and ONS estimates, economy, education, culture): https://en.wikipedia.org/wiki/Suffolk
- Wikipedia: Port of Felixstowe: https://en.wikipedia.org/wiki/Port_of_Felixstowe
- Freeport East (official site): https://www.freeporteast.com/
- Wikipedia: East Anglia Array: https://en.wikipedia.org/wiki/East_Anglia_Array
- Wikipedia: Sizewell C nuclear power station: https://en.wikipedia.org/wiki/Sizewell_C_nuclear_power_station
- Wikipedia: Adastral Park: https://en.wikipedia.org/wiki/Adastral_Park
- New Anglia Growth Hub: https://www.newangliagrowthhub.co.uk/ and https://www.newangliagrowthhub.co.uk/what-support-is-offered-to-business-in-suffolk/

The summaries are short paraphrases of facts, not copied text. They are illustrative and should be re-checked against the originals before any real use. In a live service, only content approved by Suffolk Economy would be loaded.

## Tests

The engine has unit tests (retrieval, refusals, guardrails, follow-ups, blocking, audience). An end-to-end headless Chrome run covers the UI, voice and captions state, lead capture and CSV, QR code, kiosk, attract and idle reset, admin blocking, adding content, emergency domain block, analytics and audit. See `tests/`.

## Licence

Code: MIT. © 2026 92 Logics. Knowledge summaries cite their sources. Third-party names are used only to describe public facts and imply no endorsement or relationship.
