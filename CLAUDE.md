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
2. `useChat` hook calls n8n webhook with `load` event
3. Webhook returns `{ session_id, thread_id, entity: EntityInfo, welcome_message }`
4. URL updates to `/:entity_slug/:session_id`
5. Messages sent via webhook `message` event
6. Session persisted in localStorage via `useSession` hook

### Types (`src/types/index.ts`)
- **Entity** - Full DB entity (id, slug, name, subtitle, avatar_url, intro_url, welcome_message, system_prompt, is_active, created_at)
- **EntityInfo** - Simplified for client (name, subtitle, avatar_url, intro_url)
- **LoadResponse** - `{ session_id, thread_id, entity: EntityInfo, welcome_message }`

### Key Hooks (`src/hooks/`)
- **useChat** - Main chat logic: load session, send messages (text/image/audio), reset/wipe. Returns `introUrl` for intro image
- **useSession** - localStorage persistence for session_id and thread_id
- **useVoiceRecorder** - MediaRecorder API wrapper for voice messages

### API Events (`src/services/api.ts`)
All requests go to single n8n webhook endpoint (handles n8n array response automatically):
- `load` - Initialize or restore session
- `message` - Send text/image/audio message
- `reset` - Clear chat (new thread, same session)
- `wipe` - Delete session entirely

### Media Upload (`src/services/supabase.ts`)
- Images converted to WebP, uploaded to `user-uploads/{session_id}/images/`
- Voice recordings as WebM, uploaded to `voice-recordings/{session_id}/`

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
- `messages` - Chat history
- Storage buckets: `entity-avatars`, `user-uploads`, `voice-recordings`
