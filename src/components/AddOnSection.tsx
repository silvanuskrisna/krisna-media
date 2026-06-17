import React from 'react'
import { ChevronDown } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import type { StudioAddonGear } from '@/lib/types'

interface AddOnSectionProps {
  addonGears: StudioAddonGear[]
  hourAddons: number
  selectedGearIds: string[]
  addonTotal: number
  onHourAddonsChange: (value: number) => void
  onGearToggle: (gearId: string) => void
}

export function AddOnSection({
  addonGears,
  hourAddons,
  selectedGearIds,
  addonTotal,
  onHourAddonsChange,
  onGearToggle,
}: AddOnSectionProps) {
  const selectedGears = addonGears.filter(g => selectedGearIds.includes(g.id))

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Add-Ons (Opsional)
      </h3>

      {/* Hour Add-ons */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tambah Jam Sewa (Rp85.000/jam)
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="0"
            max="10"
            value={hourAddons}
            onChange={(e) => onHourAddonsChange(parseInt(e.target.value) || 0)}
            className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <span className="text-sm text-gray-600">
            {hourAddons > 0 && `+ ${formatPrice(hourAddons * 85000)}`}
          </span>
        </div>
      </div>

      {/* Gear Add-ons */}
      {addonGears.length > 0 && (
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Pilih Gear Tambahan
          </label>
          <div className="space-y-2">
            {addonGears.map((gear) => (
              <label
                key={gear.id}
                className="flex items-center gap-3 p-2 hover:bg-green-100 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedGearIds.includes(gear.id)}
                  onChange={() => onGearToggle(gear.id)}
                  className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {gear.name}
                  </div>
                  {gear.description && (
                    <div className="text-xs text-gray-500">
                      {gear.description}
                    </div>
                  )}
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {formatPrice(gear.price)}
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Add-on Summary */}
      {(hourAddons > 0 || selectedGearIds.length > 0) && (
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="text-sm text-gray-600">Total Add-ons:</div>
          <div className="text-lg font-bold text-gray-900">
            {formatPrice(addonTotal)}
          </div>
        </div>
      )}
    </div>
  )
}
