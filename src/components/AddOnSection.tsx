import React from 'react'
import { ChevronDown } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import type { StudioAddonGear } from '@/lib/types'

interface AddOnSectionProps {
  addonGears: StudioAddonGear[]
  selectedGearIds: string[]
  addonTotal: number
  onGearToggle: (gearId: string) => void
}

export function AddOnSection({
  addonGears,
  selectedGearIds,
  addonTotal,
  onGearToggle,
}: AddOnSectionProps) {
  const selectedGears = addonGears.filter(g => selectedGearIds.includes(g.id))

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">
        Add-Ons (Opsional)
      </h3>

      {/* Gear Add-ons */}
      {addonGears.length > 0 && (
        <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
          <label className="block text-sm font-medium text-foreground mb-3">
            Pilih Gear Tambahan
          </label>
          <div className="space-y-2">
            {addonGears.map((gear) => (
              <label
                key={gear.id}
                className="flex items-center gap-3 p-2 hover:bg-green-500/20 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedGearIds.includes(gear.id)}
                  onChange={() => onGearToggle(gear.id)}
                  className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">
                    {gear.name}
                  </div>
                  {gear.description && (
                    <div className="text-xs text-muted-foreground">
                      {gear.description}
                    </div>
                  )}
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {formatPrice(gear.price)}
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Add-on Summary */}
      {selectedGearIds.length > 0 && (
        <div className="bg-[#171717] rounded-lg p-3 border border-border">
          <div className="text-sm text-muted-foreground">Total Add-ons:</div>
          <div className="text-lg font-bold text-foreground">
            {formatPrice(addonTotal)}
          </div>
        </div>
      )}
    </div>
  )
}