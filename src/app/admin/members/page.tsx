'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, Search } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Profile } from '@/lib/types'

export default function AdminMembers() {
  const [members, setMembers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchMembers()
  }, [])

  async function fetchMembers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'member')
        .order('created_at', { ascending: false })

      if (error) throw error
      setMembers(data ?? [])
    } catch (err) {
      console.error('Failed to fetch members:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredMembers = members.filter((m) =>
    m.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground animate-pulse">Memuat data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Member</h1>
        <p className="text-muted-foreground mt-1">Daftar member terdaftar</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Cari member..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-muted-foreground transition-colors"
        />
      </div>

      {/* Empty state */}
      {filteredMembers.length === 0 && (
        <div className="glass rounded-xl p-12 text-center">
          <Users size={48} className="mx-auto mb-4 opacity-40 text-muted-foreground" />
          <h3 className="text-lg font-medium text-foreground mb-1">
            {searchQuery ? 'Member tidak ditemukan' : 'Belum ada member'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {searchQuery
              ? 'Coba kata kunci lain'
              : 'Member akan muncul setelah pengguna mendaftar akun'}
          </p>
        </div>
      )}

      {/* Table */}
      {filteredMembers.length > 0 && (
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                    <input type="checkbox" className="accent-primary rounded" />
                  </th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Nama</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Role</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Bergabung</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-border/50 hover:bg-card/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <input type="checkbox" className="accent-primary rounded" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm font-medium text-accent shrink-0">
                          {(member.full_name?.[0] || '?').toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">
                            {member.full_name || 'Tanpa Nama'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        member.role === 'superadmin'
                          ? 'bg-purple-500/20 text-purple-400'
                          : member.role === 'admin'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-green-500/20 text-green-400'
                      }`}>
                        {member.role === 'superadmin'
                          ? 'Superadmin'
                          : member.role === 'admin'
                          ? 'Admin'
                          : 'Member'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {formatDate(member.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-border/50 text-xs text-muted-foreground">
            Total {filteredMembers.length} member
          </div>
        </div>
      )}
    </div>
  )
}
