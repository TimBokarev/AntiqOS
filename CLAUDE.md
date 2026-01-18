# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AntiqOS is a QR-Chat service for art objects. Visitors scan a QR code and open a chat with a virtual character (statue, exhibit). No authentication required.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Type-check and build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

## Tech Stack

- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS v4
- **Backend**: n8n webhooks (https://n8n.bookvalia.com/webhook/AntiqOS)
- **Database/Storage**: Supabase (PostgreSQL + Storage buckets)

## Architecture

### Data Flow
1. User scans QR → opens `/:entity_slug` route
2. `useChat` hook calls n8n webhook with `load` event
3. Webhook returns entity info, session_id, thread_id, messages
4. URL updates to `/:entity_slug/:session_id`
5. Messages sent via webhook `message` event
6. Session persisted in localStorage via `useSession` hook

### Key Hooks (`src/hooks/`)
- **useChat** - Main chat logic: load session, send messages (text/image/audio), reset/wipe
- **useSession** - localStorage persistence for session_id and thread_id
- **useVoiceRecorder** - MediaRecorder API wrapper for voice messages

### API Events (`src/services/api.ts`)
All requests go to single n8n webhook endpoint:
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
    ├── MessageList
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
```

## Database Setup

Run `supabase/schema.sql` in Supabase SQL Editor. Creates:
- `entities` - Characters/objects with prompts
- `sessions` - User sessions with thread_id
- `messages` - Chat history
- Storage buckets: `entity-avatars`, `user-uploads`, `voice-recordings`
