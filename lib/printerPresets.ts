import type { PrinterPreset } from '@/types'

export const PRINTER_PRESETS: PrinterPreset[] = [
  { id: 'a1-mini', name: 'Bambu Lab A1 Mini',          avgWatts: 90  },
  { id: 'a1',      name: 'Bambu Lab A1',               avgWatts: 125 },
  { id: 'p1p',     name: 'Bambu Lab P1P',              avgWatts: 140 },
  { id: 'p1s',     name: 'Bambu Lab P1S',              avgWatts: 125 }, // enclosure retém calor
  { id: 'x1c',     name: 'Bambu Lab X1 Carbon',        avgWatts: 135 },
  { id: 'x1e',     name: 'Bambu Lab X1 Enterprise',    avgWatts: 150 },
  { id: 'h2d',     name: 'Bambu Lab H2D',              avgWatts: 200 },
  { id: 'custom',  name: 'Personalizada',               avgWatts: 0   },
]

export function getPreset(id: string): PrinterPreset | undefined {
  return PRINTER_PRESETS.find((p) => p.id === id)
}

export const DEFAULT_PRINTER = PRINTER_PRESETS[0]
