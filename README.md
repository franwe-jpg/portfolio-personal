<div align="center">

<img src="docs/readme/banner.svg" alt="Franco Martin Soler — Software Analyst" width="100%">

<br>

[![Live](https://img.shields.io/badge/●_LIVE-francosolersistemas.com-25d366?style=for-the-badge&labelColor=0b141a)](https://francosolersistemas.com)

![Astro](https://img.shields.io/badge/Astro_7-0b141a?style=flat-square&logo=astro&logoColor=ff5d01)
![TypeScript](https://img.shields.io/badge/TypeScript-0b141a?style=flat-square&logo=typescript&logoColor=3178c6)
![Cloudflare Workers](https://img.shields.io/badge/Workers-0b141a?style=flat-square&logo=cloudflareworkers&logoColor=f38020)
![Workers AI](https://img.shields.io/badge/Workers_AI-Llama_3.1_8B-0b141a?style=flat-square&logo=cloudflare&logoColor=f38020)
![D1](https://img.shields.io/badge/D1-SQLite-0b141a?style=flat-square&logo=sqlite&logoColor=53bdeb)
![Turnstile](https://img.shields.io/badge/Turnstile-human_check-0b141a?style=flat-square&logo=cloudflare&logoColor=25d366)

</div>

```text
┌──────────────────────────────────────────────────────────────────────┐
│  SYSTEM.INFO                                                         │
├──────────────────────────────────────────────────────────────────────┤
│  > what      a portfolio that is a chat, not a page                  │
│  > how       tap through the scripted intro, then ask anything       │
│  > who       an AI persona answers in first person, ES / EN          │
│  > where     static HTML on Cloudflare + one Worker route            │
│  > status    ██████████████████████████████  ONLINE                  │
└──────────────────────────────────────────────────────────────────────┘
```

## `01` // The interface

Each tap plays one exchange. The scripted visitor question is typed into the
composer letter by letter and sent, then Franco types and answers. When the script
ends, the chat scrolls natively and opens up to real questions.

<div align="center">

| `[ boot ]` | `[ typing… ]` | `[ your turn ]` |
| :---: | :---: | :---: |
| <img src="docs/readme/screen-tap-hint.png" width="230" alt="Pulsing tap hint centered on the chat"> | <img src="docs/readme/screen-typing.png" width="230" alt="Visitor message being typed in the composer"> | <img src="docs/readme/screen-your-turn.png" width="230" alt="Invitation to write once the script ends"> |
| A pulsing hint asks for a tap | The draft takes 1–2 s, then it is sent | Ask anything or pick a suggested question |

</div>

## `02` // Architecture

```mermaid
flowchart LR
    V([visitor]):::ext -->|GET /| A[["static HTML<br/>prerendered by Astro"]]
    V -->|POST /api/chat| W{{"Worker<br/>src/pages/api/chat.ts"}}
    W --> T[(Turnstile<br/>siteverify)]
    W --> D[(D1<br/>quota + log)]
    W --> AI[/"Workers AI<br/>llama-3.1-8b-instruct-fp8"/]

    classDef ext fill:#0b141a,stroke:#25d366,color:#e9edef
    classDef default fill:#111b21,stroke:#53bdeb,color:#e9edef
```

Every page is prerendered to static HTML. Only `/api/chat` runs on the Worker.

## `03` // Request pipeline

```mermaid
sequenceDiagram
    autonumber
    participant B as browser
    participant W as /api/chat
    participant T as Turnstile
    participant D as D1
    participant M as Workers AI

    B->>W: { question, lang, turnstileToken }
    W->>W: validate shape and length
    W->>T: verify token
    T-->>W: passed / rejected
    W->>D: upsert question_quota (hashed IP, day)
    D-->>W: count (cap: 25/day)
    alt emoji-only message
        W-->>B: 🤖 ⚙️ 💻  (answered in code)
    else regular question
        W->>M: system persona + <question> as data
        M-->>W: answer
        W->>D: insert chat_log
        W-->>B: { answer }
    end
```

## `04` // Source map

```text
src/
├── components/     ▸ ChatPanel, ProjectsPanel, Intro, Avatar …
├── data/           ▸ scripted messages, profile, projects (ES / EN)
├── i18n/           ▸ UI copy and language routing
├── lib/persona.ts  ▸ the system prompt and the daily limit
├── pages/
│   ├── index.astro ▸ /      (Spanish)
│   ├── en/         ▸ /en/   (English)
│   └── api/chat.ts ▸ the only server route
├── scripts/        ▸ tap-driven chat, typing drafts, Turnstile, theme
└── styles/         ▸ landing.css, with light and dark themes
db/schema.sql       ▸ D1 tables: question_quota, chat_log
public/_headers     ▸ security headers for static responses
```

## `05` // Boot sequence

```sh
$ npm install
$ npx wrangler d1 execute portfolio --local --file=db/schema.sql   # once
$ npm run dev        # http://localhost:4321
$ npm run build      # dist/client (static) + dist/server (Worker)
$ npm run deploy     # build + wrangler deploy
```

> [!NOTE]
> Workers AI has no local emulation. With the `ai` binding enabled, `astro dev`
> opens a remote proxy session, so run `npx wrangler login` first. If the binding
> is absent in dev, `/api/chat` answers with a `[STUB LOCAL …]` placeholder; that
> path is guarded by `import.meta.env.DEV`. Turnstile is skipped in dev when
> `TURNSTILE_SECRET` is not set.

<details>
<summary><b>▸ Database</b></summary>

```sh
npx wrangler d1 create portfolio                       # paste the id into wrangler.jsonc
npx wrangler d1 execute portfolio --local  --file=db/schema.sql
npx wrangler d1 execute portfolio --remote --file=db/schema.sql
```

</details>

<details>
<summary><b>▸ Secrets</b></summary>

```sh
npx wrangler secret put IP_SALT            # random string; salts the stored IP hashes
npx wrangler secret put TURNSTILE_SECRET   # Turnstile widget secret for siteverify
```

</details>

<details>
<summary><b>▸ Types</b></summary>

```sh
npm run cf-typegen   # regenerate worker-configuration.d.ts after editing wrangler.jsonc
```

</details>

<div align="center">

```text
> connection closed by remote host. thanks for reading_
```

</div>
