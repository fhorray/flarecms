# Technical Feature Roadmap

This document outlines the strategic implementation path for FlareCMS features, focused on technical excellence, architectural speed, and AI-readiness.

## 📊 Feature Matrix

| Feature | FlareCMS Status | Strategic Priority |
| :--- | :--- | :--- |
| **Edge-Native Architecture** | ✅ (Bun/D1) | High |
| **Flat, Minimalist UI** | 🚀 (Elite) | Elite |
| **Zero-Animation Speed** | 🚀 (Elite) | Elite |
| **MCP Server (AI Protocol)** | ❌ Planned | **Urgent** |
| **Repeater Fields** | ❌ Planned | **High** |
| **Auto-Redirect System** | ❌ Planned | Medium |
| **Portable Text (JSON)** | ❌ Planned | Medium |
| **Passkey/WebAuthn Login** | ❌ Planned | Medium |
| **Sandboxed Plugin SDK** | ❌ Planned | Long-term |
| **Multi-Byline Authorship** | ❌ Planned | Low |

## 🔍 Missing Feature Deep-Dive

### 1. Model Context Protocol (MCP) Server
**Concept**: Allow AI agents (like those in Cursor, Claude, or ChatGPT) to interact with the CMS data model directly.
- **Why**: FlareCMS is built for the AI era. We need to allow AI agents to create collections, edit content, and manage the site as easily as a human.
- **Path**: Implement an MCP standard endpoint in the Hono API.

### 2. Repeater Fields & Complex Schema
**Concept**: Allowing fields to contain dynamic lists of sub-fields (e.g., "Team Gallery" with name, role, and bio).
- **Why**: Real-world content is often nested. A flat table structure needs JSON-backed support for repeaters.
- **Path**: Update the Schema Registry to support JSON-backed `repeater` types.

### 3. Smart Redirect System
**Concept**: Automatic 301 redirects when a content slug changes.
- **Why**: Prevents broken links (SEO) automatically when users rename posts.
- **Path**: Add a `RedirectRepository` and a middleware to intercept 404s and check for historical slugs.

### 4. Multi-Byline support
**Concept**: Allowing multiple authors and roles (Writer, Editor, Illustrator) per post.
- **Why**: Professional editorial workflows require more than a single "author" field.
- **Path**: Decouple `author_id` into a junction table for contributors.

## 🚀 Implementation Phases

### Phase 1: The "Agentic" Era (Immediate)
- **[ ] MCP Implementation**: Expose `content` and `schema` tools via MCP.
- **[ ] Flare-Agent-Skills**: Native pre-defined instructions for AI coding assistants.
- **[ ] Audit Logs**: Detailed tracking of all platform and content changes.

### Phase 2: Content Maturity (Next)
- **[ ] Repeater Fields**: Support for complex, nested content structures.
- **[ ] Portable Text Storage**: Transitioning to structured JSON for perfect machine readability.
- **[ ] Smart Redirects**: Automatic management of URL changes.

### Phase 3: Scaling & Security (Future)
- **[ ] Passkey Support**: Biometric authentication as a first-class citizen.
- **[ ] Managed Plugin Isolates**: Safe, worker-based extensibility.

---

*This roadmap is a living document, reflecting our commitment to building the fastest, most AI-ready CMS on the edge.*
