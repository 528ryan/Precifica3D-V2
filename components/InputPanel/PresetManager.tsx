'use client'

import { useState, useEffect, useRef } from 'react'
import type { CalculatorInput, SavedPreset } from '@/types'
import { loadPresets, savePreset, deletePreset, generateId } from '@/lib/storage'

interface Props {
  currentInput: CalculatorInput
  onLoad: (input: CalculatorInput) => void
  onNew: () => void
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function PresetManager({ currentInput, onLoad, onNew }: Props) {
  const [presets, setPresets]       = useState<SavedPreset[]>([])
  const [open, setOpen]             = useState(false)
  const [currentName, setCurrentName] = useState('')
  const [saved, setSaved]           = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => { setPresets(loadPresets()) }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleSave() {
    const name = currentName.trim() || `Preset ${new Date().toLocaleDateString('pt-BR')}`
    const preset: SavedPreset = {
      id: generateId(),
      name,
      createdAt: new Date().toISOString(),
      input: currentInput,
    }
    savePreset(preset)
    setPresets(loadPresets())
    setCurrentName(name)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setOpen(false)
  }

  function handleLoad(preset: SavedPreset) {
    setCurrentName(preset.name)
    onLoad(preset.input)
    setOpen(false)
  }

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    deletePreset(id)
    const updated = loadPresets()
    setPresets(updated)
    if (currentName && !updated.find((p) => p.name === currentName)) {
      // Current preset was deleted
    }
  }

  function handleNew() {
    setCurrentName('')
    onNew()
    setOpen(false)
  }

  return (
    <div className="flex items-center gap-2" ref={ref}>
      {/* Dropdown trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#1e1e32] bg-[#0f0f1a] text-sm text-[#e8e8f0] hover:border-[#4f46e5]/50 transition-colors max-w-[180px]"
        >
          <span className="truncate">{currentName || 'Sem título'}</span>
          <svg className={`w-3.5 h-3.5 text-[#6b6b8a] shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-[#0f0f1a] border border-[#1e1e32] rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden">
            {/* Name input */}
            <div className="px-3 py-2 border-b border-[#1e1e32]">
              <input
                type="text"
                value={currentName}
                onChange={(e) => setCurrentName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder="Nome do preset…"
                className="input-base text-xs"
              />
            </div>
            {/* Saved presets list */}
            {presets.length > 0 && (
              <div className="max-h-48 overflow-y-auto">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleLoad(preset)}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/[0.04] transition-colors text-left group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#e8e8f0] truncate">{preset.name}</p>
                      <p className="text-xs text-[#6b6b8a]">{formatDate(preset.createdAt)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, preset.id)}
                      className="text-[#6b6b8a] hover:text-red-400 transition-colors p-1 rounded opacity-0 group-hover:opacity-100"
                    >
                      ✕
                    </button>
                  </button>
                ))}
              </div>
            )}
            {presets.length === 0 && (
              <p className="text-xs text-[#6b6b8a] text-center px-3 py-3">Nenhum preset salvo.</p>
            )}
          </div>
        )}
      </div>

      {/* Save */}
      <button
        type="button"
        onClick={handleSave}
        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#4f46e5] hover:bg-[#4338ca] text-white transition-colors duration-150 shrink-0"
      >
        {saved ? '✓' : 'Salvar'}
      </button>

      {/* New */}
      <button
        type="button"
        onClick={handleNew}
        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-[#1e1e32] text-[#6b6b8a] hover:text-[#e8e8f0] hover:border-[#4f46e5]/50 transition-colors duration-150 shrink-0"
      >
        Novo
      </button>
    </div>
  )
}
