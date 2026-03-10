'use client'

import { useState, useEffect } from 'react'
import type { CalculatorInput, SavedPreset } from '@/types'
import { loadPresets, savePreset, deletePreset, generateId } from '@/lib/storage'

interface Props {
  currentInput: CalculatorInput
  onLoad: (input: CalculatorInput) => void
}

export default function PresetManager({ currentInput, onLoad }: Props) {
  const [presets, setPresets] = useState<SavedPreset[]>([])
  const [name, setName] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setPresets(loadPresets())
  }, [])

  function handleSave() {
    if (!name.trim()) return
    const preset: SavedPreset = {
      id: generateId(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
      input: currentInput,
    }
    savePreset(preset)
    setPresets(loadPresets())
    setName('')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleDelete(id: string) {
    deletePreset(id)
    setPresets(loadPresets())
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

  return (
    <div className="rounded-xl border border-dark-border bg-dark-surface p-4 space-y-3">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Presets</p>

      {/* Save row */}
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          placeholder="Nome do preset…"
          className="input-base flex-1 text-sm"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={!name.trim()}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          {saved ? '✓ Salvo' : 'Salvar'}
        </button>
      </div>

      {/* Saved presets list */}
      {presets.length > 0 && (
        <div className="space-y-1.5 max-h-40 overflow-y-auto">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg bg-white/[0.02] border border-dark-border hover:border-indigo-500/30 transition-colors group"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{preset.name}</p>
                <p className="text-xs text-slate-600">{formatDate(preset.createdAt)}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onLoad(preset.input)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors px-1.5 py-0.5 rounded"
                  title="Carregar preset"
                >
                  Carregar
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(preset.id)}
                  className="text-xs text-slate-600 hover:text-red-400 transition-colors px-1.5 py-0.5 rounded"
                  title="Deletar preset"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {presets.length === 0 && (
        <p className="text-xs text-slate-600 text-center py-2">
          Nenhum preset salvo.
        </p>
      )}
    </div>
  )
}
