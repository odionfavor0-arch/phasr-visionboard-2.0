// Single source of truth for the six underlying focus-area categories.
// `id` doubles as the pillar's icon-lookup code (see PILLAR_ICONS in
// VisionBoard.jsx / MobilePillarNav.jsx) and as the key Sage's plan
// generation uses for territory/knowledge lookups — it is system-only and
// never shown to the user. `name` is the canonical label shown as a
// suggestion/fallback; her actual pillar.name is free text she can override.
export const FOCUS_AREA_CATEGORIES = [
  { id: 'HF', name: 'Health & Fitness', details: 'Body, food, sleep, gym, energy' },
  { id: 'CB', name: 'Career & Business', details: 'Job, entrepreneurship, income streams' },
  { id: 'WE', name: 'Wealth', details: 'Savings, investing, debt, financial freedom' },
  { id: 'RE', name: 'Relationships', details: 'Love, family, friendships, community' },
  { id: 'IL', name: 'Inner Life', details: 'Spirituality, mindfulness, mental health' },
  { id: 'PG', name: 'Personal Growth', details: 'Learning, creativity, self-development' },
]

export function getFocusAreaCategory(id) {
  return FOCUS_AREA_CATEGORIES.find(category => category.id === id) || null
}

export function getFocusAreaLabel(id) {
  return getFocusAreaCategory(id)?.name || ''
}
