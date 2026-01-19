# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AntiqOS is a QR-Chat service for art objects. Visitors scan a QR code and open a chat with a virtual character (statue, exhibit). No authentication required.

**Repository**: https://github.com/TimBokarev/AntiqOS

## Commands

```bash
npm run dev      # Start development server
npm run build    # Type-check and build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build

# Database commands
npm run sql "SELECT * FROM entities"     # Execute any SQL query
npm run db:init                          # Apply supabase/schema.sql
```

## Tech Stack

- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS v4
- **Backend**: n8n webhooks (https://n8n.bookvalia.com/webhook/AntiqOS)
- **Database/Storage**: Supabase (PostgreSQL + Storage buckets)

## Architecture

### Data Flow
1. User scans QR → opens `/:entity_slug` route
2. `useChat` hook loads entity from **Supabase directly**
3. Creates/restores session in Supabase, updates URL to `/:entity_slug/:session_id`
4. Messages sent via **n8n webhook** (LLM processing)
5. Session persisted in localStorage via `useSession` hook

### What runs where
| Operation | Where | Why |
|-----------|-------|-----|
| Load entity | Supabase | Direct DB query |
| Create/get session | Supabase | Direct DB query |
| Reset (new thread) | Supabase | Just updates thread_id |
| Wipe (delete all) | Supabase | Deletes session + n8n_chat_histories |
| **Send message** | **n8n** | Needs LLM for response |

### Types (`src/types/index.ts`)
- **Entity** - Full DB entity (id, slug, name, subtitle, avatar_url, intro_url, welcome_message, system_prompt, is_active, created_at)
- **EntityInfo** - Simplified for client (name, subtitle, avatar_url, intro_url)

### Key Hooks (`src/hooks/`)
- **useChat** - Main chat logic: load entity & session from Supabase, send messages via n8n, reset/wipe via Supabase. Returns `introUrl` for intro image
- **useSession** - localStorage persistence for session_id and thread_id
- **useVoiceRecorder** - MediaRecorder API wrapper for voice messages

### Supabase Functions (`src/services/supabase.ts`)
- `getEntityBySlug(slug)` - Load entity by slug
- `createSession(entityId)` - Create new session with thread_id
- `getSession(sessionId)` - Load existing session
- `resetSession(sessionId)` - Generate new thread_id (clear chat)
- `deleteSession(sessionId)` - Delete session + n8n_chat_histories
- `uploadImage/uploadVoiceRecording` - Media uploads

### n8n Webhook (`src/services/api.ts`)
Single endpoint for LLM messages only:
- `message` - Send text/image/audio, get LLM response

### Component Hierarchy
```
ChatPage
└── ChatContainer
    ├── ChatHeader (avatar, menu with reset/wipe)
    ├── MessageList (intro image + messages)
    │   └── MessageBubble (text/image/audio rendering)
    └── MessageInput
        ├── ImageUploader (camera/gallery picker)
        └── VoiceRecorder (recording controls)
```

## Environment Variables

Copy `.env.example` to `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=https://n8n.bookvalia.com/webhook/AntiqOS
DATABASE_URL=postgresql://postgres.[ref]:[pass]@db.[ref].supabase.co:5432/postgres
```

`DATABASE_URL` is required for `npm run sql` commands. Find it in Supabase Dashboard → Settings → Database → Connection string → URI.

## Database Setup

Run `npm run db:init` or execute `supabase/schema.sql` manually. Creates:
- `entities` - Characters/objects with prompts, avatar_url, intro_url
- `sessions` - User sessions with thread_id
- `messages` - Chat history (frontend messages)
- `n8n_chat_histories` - LLM conversation context (managed by n8n, key: `{session_id}_{thread_id}`)
- Storage buckets: `entity-avatars`, `user-uploads`, `voice-recordings`
