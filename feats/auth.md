# Implementation Plan: Passkey-First Authentication

FlareCMS will implement a professional, secure, and modern authentication system inspired by industry-leading practices and the Model Context Protocol ecosystem. The core philosophy is **Passkey-First**, with **Magic Links** as a secure fallback and **OAuth** for convenience.

## 🏗️ Core Technologies
- **[Oslojs](https://oslo.lucia-auth.com/)**: Utility library for auth primitives (hashing, encoding, WebAuthn).
- **Hono Middleware**: Integrated directly into the `apps/api` runtime.
- **Cloudflare D1**: Persistent storage for sessions, users, and credentials.

---

## 📊 Database Schema (D1)

### `users`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | TEXT (ULID) | Primary Key |
| `email` | TEXT | Unique |
| `role` | INTEGER | Enum: Subscriber(1), Contributor(2), Author(3), Editor(4), Admin(5) |
| `disabled` | INTEGER | Boolean (0/1) |
| `created_at` | TEXT | ISO Timestamp |

### `sessions`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | TEXT (ULID) | Primary Key |
| `user_id` | TEXT | Foreign Key (users.id) |
| `expires_at` | TEXT | ISO Timestamp |

### `credentials`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | TEXT (ULID) | Primary Key |
| `user_id` | TEXT | Foreign Key (users.id) |
| `type` | TEXT | 'password', 'passkey', 'oauth' |
| `data` | TEXT | JSON blob (hashes, public keys, provider IDs) |

---

## 🔒 Authentication Flows

### 1. Passkey (WebAuthn) - Primary
1.  **Challenge**: Server generates a unique challenge using `oslo/webauthn`.
2.  **Verify**: Browser signs the challenge; Server verifies the signature against the stored public key.
3.  **Session**: Upon success, a new session is created and return as a secure HTTP-only cookie.

### 2. Magic Link - Fallback
1.  **Request**: User enters email.
2.  **Token**: Server generates a short-lived, single-use token.
3.  **Email**: Send link (e.g., `/api/auth/verify?token=...`).
4.  **Consume**: Token is exchanged for a valid session.

### 3. OAuth (GitHub/Google)
1.  **Redirect**: Initialized via state-protected OAuth URLs.
2.  **Callback**: Server exchanges `code` for user profile and creates/links the user.

---

## 🛡️ Authorization & RBAC

| Role | Permissions |
| :--- | :--- |
| **Admin** | Full system control, users, schema, settings. |
| **Editor** | Manage all content, taxonomies, and media. |
| **Author** | Create and publish own content. |
| **Contributor** | Create and edit own drafts (no publish). |
| **Subscriber** | Read-only access to private/preview content. |

### Implementation Detail (RBAC)
```typescript
export const Permissions = {
  "content:edit_any": Role.EDITOR,
  "content:publish_own": Role.AUTHOR,
  "users:manage": Role.ADMIN,
  // ...
} as const;

export function hasPermission(user: User, permission: keyof typeof Permissions) {
  return (user.role ?? 0) >= Permissions[permission];
}
```

---

## 🚀 Execution Roadmap

- **[ ] Phase 1: Foundation**: Create migrations and core session logic using `oslojs`.
- **[ ] Phase 2: Magic Link**: Implement the passwordless flow for initial admin setup.
- **[ ] Phase 3: WebAuthn**: Add passkey enrollment and verification.
- **[ ] Phase 4: Middleware**: Protect `/api/admin/*` routes and populate `c.get('user')`.
- **[ ] Phase 5: UI Integration**: Finalize the "Zen Minimalist" login screen.
