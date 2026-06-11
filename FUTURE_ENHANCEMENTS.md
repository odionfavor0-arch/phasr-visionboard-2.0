# PHASR — Future Enhancements & Build Backlog

This file tracks features, integrations, and ideas to build into PHASR after MVP.
Nothing here touches live code. It's a running list to reference when ready to build.

---

## Journal

### Focus area templates
- Each focus area gets its own journal template, designed uniquely for its purpose
- Templates should feel contextual — a health template looks and prompts differently from a career or relationship template
- Auto-loaded when a user opens the journal for a specific focus area

---

## Sage (AI Coach)

### Phase summary automation
- When a user completes a phase, Sage automatically summarizes everything they did in that phase
- Presents the summary for review before they move on
- User only needs to fill in one specific input section, not rewrite everything manually
- Reduces friction at phase transitions and makes progress feel real

### Firecrawl integration
- Add Firecrawl API so Sage can search the internet for live resources
- Instead of relying only on Pinecone vector memory, Sage can pull current articles, research, and references relevant to a user's specific goal
- Use case: user sets a goal around starting a business, Sage finds real current resources to support their action steps
- API key to add to .env: FIRECRAWL_API_KEY
- Reference: APIs and MCPs section of Claude Code course (timestamp 5:00:02)

---

## Rooms & Community

### Shareable room links
- Every room gets a unique shareable link
- Link grants direct access to that room from any external platform (WhatsApp, TikTok, Instagram, etc.)
- Drives external traffic into the community

### Sub-rooms
- Main rooms have no member limit
- Sub-rooms are created inside main rooms by users
- Sub-room creator sets the member limit
- Increasing the limit beyond the default is a Pro feature
- Sub-rooms can be themed — e.g. a 10-day or 50-day challenge under a Health & Fitness room
- Other users can discover and join visible sub-rooms
- Users can quit a sub-room at any time

### Sub-room monetization (creator earning)
- Sub-room creators can turn their sub-room into a paid space
- Other users pay to join that sub-room
- Creator earns from it directly through the platform
- PHASR takes a platform cut (percentage TBD)
- This is a post-MVP feature — needs user base before it's meaningful

### Platform-level user monetization (concept stage)
- At some point, users who reach a certain level or milestone start earning on the platform
- Model not fully defined yet — could be tied to community leadership, content creation, or challenge completion
- Inspired by: platforms like Substack and Patreon but inside a goal-tracking community
- Flag: do not build until post-MVP and user growth is established

---

## Technical / Integration Backlog

### Claude Code (WAT framework)
- CLAUDE.md added to visionboard project when ready to build with Claude Code
- Learn in demo project first, apply to PHASR after completing course foundation
- Reference course timestamps:
  - 55:10 — Claude.md
  - 58:57 — First Workflow
  - 3:17:39 — RAG
  - 3:32:59 — Turning n8n Workflow into App
  - 5:00:02 — APIs and MCPs
  - 6:51:30 — Sub-agents

### RAG upgrade
- Current: Pinecone vector memory with static knowledge
- Future: Combine Pinecone with live Firecrawl search so Sage has both trained knowledge and real-time internet access

---

## Sage (AI Coach) — continued

### Future Self Messages
- At the start of every phase, Sage prompts: "Write a message to the version of yourself who finishes this phase."
- Sage stores the message tied to that phase and that user
- When the phase ends, Sage surfaces it: "30 days ago you wrote this…" and displays the message
- Creates a strong emotional payoff at phase completion
- Fits directly into PHASR's before-and-after identity concept — the user sees who they were when they started vs who they are now
- Priority: high. Low build complexity, high emotional impact, deeply on-brand

---

## Product Identity Note

PHASR is becoming three products in one:
- **Vision Board** — identity and aspiration
- **Accountability System** — action and consistency
- **AI Coach (Sage)** — guidance and reflection

The strongest features in this backlog are the ones that connect all three layers together rather than adding entirely new standalone features. Future Self Messages is a good example — it touches identity (vision board), completion (accountability), and reflection (Sage) at once. Use this as a filter when evaluating new ideas.

---

## Notes
- Sub-room monetization and user earning features are strong retention tools but are post-MVP
- Shareable room links are relatively low effort and high growth impact — consider prioritizing
- Journal templates can be built incrementally — start with 2 or 3 focus areas, expand later
- Future Self Messages: prioritize early — high impact, fits the core identity of the product
