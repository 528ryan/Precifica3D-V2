import type { SavedPreset, SavedKit } from '@/types'

// ── Presets ────────────────────────────────────────────────────────────────

const PRESETS_KEY = 'precifica3d_presets'
const KITS_KEY = 'precifica3d_kits'

function isClient(): boolean {
  return typeof window !== 'undefined'
}

export function loadPresets(): SavedPreset[] {
  if (!isClient()) return []
  try {
    const raw = localStorage.getItem(PRESETS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as SavedPreset[]
  } catch {
    return []
  }
}

export function savePreset(preset: SavedPreset): void {
  if (!isClient()) return
  const existing = loadPresets().filter((p) => p.id !== preset.id)
  localStorage.setItem(PRESETS_KEY, JSON.stringify([...existing, preset]))
}

export function deletePreset(id: string): void {
  if (!isClient()) return
  const updated = loadPresets().filter((p) => p.id !== id)
  localStorage.setItem(PRESETS_KEY, JSON.stringify(updated))
}

// ── Kits ───────────────────────────────────────────────────────────────────

export function loadKits(): SavedKit[] {
  if (!isClient()) return []
  try {
    const raw = localStorage.getItem(KITS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as SavedKit[]
  } catch {
    return []
  }
}

export function saveKit(kit: SavedKit): void {
  if (!isClient()) return
  const existing = loadKits().filter((k) => k.id !== kit.id)
  localStorage.setItem(KITS_KEY, JSON.stringify([...existing, kit]))
}

export function deleteKit(id: string): void {
  if (!isClient()) return
  const updated = loadKits().filter((k) => k.id !== id)
  localStorage.setItem(KITS_KEY, JSON.stringify(updated))
}

// ── ID generation ──────────────────────────────────────────────────────────

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
