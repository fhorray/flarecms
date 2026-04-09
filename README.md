# FlareCMS: The Lean, Edge-Native CMS for the AI Era

FlareCMS is a high-performance, minimalist, and developer-centric Content Management System built for the modern web. Engineered for speed and stability, it leverages the power of Bun, Hono, and Cloudflare D1 to deliver an unparalleled editing experience directly at the edge.

## 🚀 Vision: Design-First & AI-Ready

Unlike traditional bloated CMS architectures, FlareCMS follows two core principles:

1.  **Zen Minimalism**: A purely "Flat Design" interface. No shadows, no entry animations, and no unnecessary transitions. We value instant response times and visual clarity over decorative UI elements.
2.  **AI-Native Infrastructure**: Built to be managed by human developers and AI agents alike. Every interface is designed to be lean and high-contrast, facilitating seamless navigation for both eyes and algorithms.

## 🛠️ Technology Stack

- **Runtime**: [Bun](https://bun.sh/)
- **Server Framework**: [Hono](https://hono.dev/)
- **Database**: [Cloudflare D1](https://developers.cloudflare.com/d1/) (Edge SQL)
- **Frontend**: React + Vite + Tailwind CSS v4
- **State Management**: [Nanostores](https://github.com/nanostores/nanostores)

## 📦 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed on your machine.
- Cloudflare Wrangler CLI (for D1 interactions).

### Installation

```bash
bun install
```

### Development

To start the admin dashboard and the API concurrently:

```bash
bun run dev
```

## 🗺️ Technical Feature Roadmap

Inspired by modern CMS best practices and enterprise-grade research, FlareCMS is evolving to support:

- **[x] WebAuthn / Passkeys**: Biometric authentication implemented as a stable, passwordless login method.
- **[x] Automated Deployment Pipeline**: Integrated custom build & deploy orchestration for Cloudflare Workers.
- **[x] Self-Healing Database**: Automatic runtime migrations and table initialization.
- **[x] Production Routing**: Native SPA fallback handling for seamless page refreshes at the edge.
- **[ ] MCP Server Integration**: Full support for the Model Context Protocol to allow AI Agents (Claude, ChatGPT) to manage content, schemas, and mediaLibrary programmatically.
- **[ ] Portable Text Protocol**: Transitioning from HTML-based storage to structured JSON (Portable Text) for presentation-agnostic content delivery.
- **[ ] Agentic Developer Skills**: Native skills and instructions to turn FlareCMS into an "autonomous" CMS that can build its own plugins via AI.
- **[ ] Edge Worker Sandboxing**: A plugin system based on isolated Cloudflare Workers for secure, third-party extensibility.

---

## License

MIT © fhorray
