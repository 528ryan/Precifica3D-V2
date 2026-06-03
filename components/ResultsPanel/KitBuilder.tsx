'use client'

import { useState, useEffect, useMemo } from 'react'
import type { CalculatorInput, KitItem, SavedKit } from '@/types'
import { calculateKitPricing } from '@/lib/pricingCalculator'
import { loadKits, saveKit, deleteKit, generateId } from '@/lib/storage'

interface Props {
  input: CalculatorInput
}

function brl(v: number): string {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function KitBuilder({ input }: Props) {
  const [open, setOpen]           = useState(false)
  const [items, setItems]         = useState<KitItem[]>([])
  const [savedKits, setSavedKits] = useState<SavedKit[]>([])
  const [kitName, setKitName]     = useState('')

  useEffect(() => { setSavedKits(loadKits()) }, [])

  function addItem() {
    setItems((prev) => [...prev, { id: generateId(), name: '', quantity: 1, unitCost: 0 }])
  }

  function updateItem(id: string, partial: Partial<KitItem>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...partial } : item)))
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const totalCost = items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0)

  const kitPrices = useMemo(() => {
    if (totalCost <= 0) return []
    return calculateKitPricing(totalCost, input)
  }, [totalCost, input])

  function handleSaveKit() {
    if (!kitName.trim() || items.length === 0) return
    saveKit({ id: generateId(), name: kitName.trim(), createdAt: new Date().toISOString(), items })
    setSavedKits(loadKits())
    setKitName('')
  }

  function handleLoadKit(kit: SavedKit) { setItems(kit.items) }

  function handleDeleteKit(id: string) {
    deleteKit(id)
    setSavedKits(loadKits())
  }

  return (
    <div className="rounded-xl border border-[#1e1e32] bg-[#0f0f1a] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors duration-150 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-syne font-semibold text-[#e8e8f0]">Kit Builder</span>
          <span className="text-xs text-[#6b6b8a]">— precifique conjuntos de produtos</span>
        </div>
        <svg
          className={`w-4 h-4 text-[#6b6b8a] transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-[#1e1e32]">
          {/* Saved kits */}
          {savedKits.length > 0 && (
            <div className="pt-4">
              <p className="text-xs font-medium text-[#6b6b8a] mb-2">Kits Salvos</p>
              <div className="space-y-1.5">
                {savedKits.map((kit) => (
                  <div
                    key={kit.id}
                    className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-white/[0.02] border border-[#1e1e32]"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#e8e8f0]">{kit.name}</p>
                      <p className="text-xs text-[#6b6b8a]">{kit.items.length} iten(s)</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleLoadKit(kit)}
                        className="text-xs text-[#4f46e5] hover:text-indigo-300 transition-colors px-1.5 py-0.5 rounded"
                      >
                        Carregar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteKit(kit.id)}
                        className="text-xs text-[#6b6b8a] hover:text-red-400 transition-colors px-1.5 py-0.5 rounded"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Items */}
          <div className={savedKits.length > 0 ? '' : 'pt-4'}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-[#6b6b8a]">Itens do Kit</p>
              <button
                type="button"
                onClick={addItem}
                className="text-xs text-[#4f46e5] hover:text-indigo-300 transition-colors flex items-center gap-1"
              >
                <span className="text-base leading-none">+</span> Adicionar Item
              </button>
            </div>

            {items.length === 0 && (
              <p className="text-xs text-[#6b6b8a] text-center py-4">
                Adicione itens para calcular o preço do kit.
              </p>
            )}

            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-[#1e1e32]"
                >
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateItem(item.id, { name: e.target.value })}
                    placeholder="Nome do item"
                    className="input-base flex-1 text-xs"
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    min={1}
                    onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                    className="input-base w-14 text-xs text-center"
                    title="Quantidade"
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-[#6b6b8a]">R$</span>
                    <input
                      type="number"
                      value={item.unitCost}
                      min={0}
                      step={0.01}
                      onChange={(e) => updateItem(item.id, { unitCost: parseFloat(e.target.value) || 0 })}
                      className="input-base w-20 text-xs"
                      title="Custo unitário"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-[#6b6b8a] hover:text-red-400 transition-colors text-sm leading-none px-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Total cost */}
          {items.length > 0 && (
            <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.03] border border-[#1e1e32]">
              <span className="text-xs text-[#6b6b8a]">Custo total do kit</span>
              <span className="text-sm font-mono font-bold text-amber-400">R${brl(totalCost)}</span>
            </div>
          )}

          {/* Kit prices */}
          {kitPrices.length > 0 && (
            <div className="rounded-lg border border-[#1e1e32] overflow-hidden">
              <div className="px-3 py-2 bg-white/[0.02] border-b border-[#1e1e32]">
                <p className="text-xs font-semibold text-[#6b6b8a]">Preço do Kit por Canal</p>
              </div>
              <table className="w-full">
                <tbody>
                  {kitPrices.map((kp) => (
                    <tr
                      key={kp.key}
                      className="border-b border-[#1e1e32]/50 hover:bg-white/[0.01] transition-colors"
                    >
                      <td className="px-3 py-2 text-sm text-[#e8e8f0]">{kp.label}</td>
                      {kp.isBlocked ? (
                        <td className="px-3 py-2 text-xs text-amber-400 text-right" colSpan={3}>
                          {kp.blockedReason}
                        </td>
                      ) : kp.errorMsg ? (
                        <td className="px-3 py-2 text-xs text-[#ef4444] text-right" colSpan={3}>
                          {kp.errorMsg}
                        </td>
                      ) : (
                        <>
                          <td className="px-3 py-2 text-sm font-mono font-bold text-[#4f46e5] text-right">
                            R${brl(kp.recommendedPrice)}
                          </td>
                          <td className="px-3 py-2 text-xs font-mono text-[#10b981] text-right">
                            +R${brl(kp.netProfitPerKit)}
                          </td>
                          <td className="px-3 py-2 text-xs font-mono text-[#6b6b8a] text-right">
                            {kp.marginPercent.toFixed(1)}%
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Save kit */}
          {items.length > 0 && (
            <div className="flex gap-2">
              <input
                type="text"
                value={kitName}
                onChange={(e) => setKitName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveKit()}
                placeholder="Nome do kit…"
                className="input-base flex-1 text-xs"
              />
              <button
                type="button"
                onClick={handleSaveKit}
                disabled={!kitName.trim()}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#4f46e5] hover:bg-[#4338ca] text-white transition-colors duration-150 disabled:opacity-40 shrink-0"
              >
                Salvar Kit
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
