import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { Search, ChevronLeft, ChevronRight, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/utils/helpers'
import * as customerService from '@/services/customerService'
import type { CustomerWithStats } from '@/types/customer'

// Avatar background colors - generated from name hash
const AVATAR_COLORS = [
  'bg-chart-1/10 text-chart-1',
  'bg-chart-2/10 text-chart-2',
  'bg-chart-3/10 text-chart-3',
  'bg-chart-4/10 text-chart-4',
  'bg-chart-5/10 text-chart-5',
  'bg-primary/10 text-primary',
  'bg-status-info/10 text-status-info',
  'bg-status-warning/10 text-status-warning',
]

type SortOption = 'recent' | 'spent' | 'visits' | 'alpha'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'recent', label: 'Gan nhat' },
  { value: 'spent', label: 'Chi tieu cao nhat' },
  { value: 'visits', label: 'Dat nhieu nhat' },
  { value: 'alpha', label: 'A->Z' },
]

const PAGE_SIZE = 10

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function sortCustomers(
  customers: CustomerWithStats[],
  sort: SortOption,
): CustomerWithStats[] {
  const sorted = [...customers]
  switch (sort) {
    case 'recent':
      return sorted.sort((a, b) => (b.lastVisit || '').localeCompare(a.lastVisit || ''))
    case 'spent':
      return sorted.sort((a, b) => b.totalSpent - a.totalSpent)
    case 'visits':
      return sorted.sort((a, b) => b.visitCount - a.visitCount)
    case 'alpha':
      return sorted.sort((a, b) => a.name.localeCompare(b.name, 'vi'))
    default:
      return sorted
  }
}

export function CustomerList() {
  const navigate = useNavigate()
  const [customers] = useState<CustomerWithStats[]>(() => 
    customerService.getAllWithStats()
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [currentPage, setCurrentPage] = useState(1)

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
      setCurrentPage(1) // Reset to page 1 on search
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Filtered and sorted customers
  const filteredCustomers = useMemo(() => {
    let result = customers
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase().trim()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          (c.email && c.email.toLowerCase().includes(q)),
      )
    }
    return sortCustomers(result, sortBy)
  }, [customers, debouncedQuery, sortBy])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE))
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredCustomers.slice(start, start + PAGE_SIZE)
  }, [filteredCustomers, currentPage])

  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as SortOption)
    setCurrentPage(1)
  }, [])

  const handleRowClick = useCallback(
    (id: string) => {
      navigate('/admin/customers/' + id)
    },
    [navigate],
  )

  // Format last visit date for display
  const formatLastVisit = (dateStr: string): string => {
    if (!dateStr) return '--'
    const parts = dateStr.split('-')
    if (parts.length !== 3) return dateStr
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }

  // Page number buttons
  const pageNumbers = useMemo(() => {
    const pages: number[] = []
    const maxVisible = 5
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    const end = Math.min(totalPages, start + maxVisible - 1)
    start = Math.max(1, end - maxVisible + 1)
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return pages
  }, [currentPage, totalPages])

  // Empty state
  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted mb-4">
          <Users size={28} className="text-slate-400" />
        </div>
        <p className="text-slate-500 text-sm max-w-sm">
          Chua co khach hang nao. Khach hang se tu dong duoc tao khi co booking moi.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">
          Khach hang
          <span className="ml-2 text-sm font-normal text-slate-400">
            ({filteredCustomers.length})
          </span>
        </h2>
      </div>

      {/* Search + Sort toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search bar */}
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tim theo ten, SDT, email..."
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-4 text-sm text-slate-700 placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
          />
        </div>

        {/* Sort dropdown */}
        <select
          value={sortBy}
          onChange={handleSortChange}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left font-medium text-slate-500">
                Khach hang
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">
                SDT
              </th>
              <th className="px-4 py-3 text-center font-medium text-slate-500">
                So lan dat
              </th>
              <th className="px-4 py-3 text-right font-medium text-slate-500">
                Tong chi tieu
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">
                Lan cuoi
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">
                Ghi chu
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedCustomers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                  Khong tim thay khach hang phu hop.
                </td>
              </tr>
            ) : (
              paginatedCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  onClick={() => handleRowClick(customer.id)}
                  className="cursor-pointer border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
                >
                  {/* Avatar + Name + Email */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                          getAvatarColor(customer.name),
                        )}
                      >
                        {getInitials(customer.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 truncate">
                          {customer.name}
                        </p>
                        {customer.email && (
                          <p className="text-xs text-slate-400 truncate">
                            {customer.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {customer.phone}
                  </td>

                  {/* Visit count badge */}
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center rounded-full bg-status-info-muted px-2.5 py-0.5 text-xs font-medium text-status-info-foreground">
                      {customer.visitCount}
                    </span>
                  </td>

                  {/* Total spent */}
                  <td className="px-4 py-3 text-right font-medium text-slate-700 whitespace-nowrap">
                    {customer.totalSpent > 0
                      ? `${formatPrice(customer.totalSpent)}d`
                      : '--'}
                  </td>

                  {/* Last visit */}
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {formatLastVisit(customer.lastVisit)}
                  </td>

                  {/* Note / VIP tag */}
                  <td className="px-4 py-3">
                    {customer.note ? (
                      customer.note.toLowerCase().includes('vip') ? (
                        <span className="inline-flex items-center rounded-full bg-status-warning-muted px-2.5 py-0.5 text-xs font-semibold text-status-warning-foreground border border-status-warning/20">
                          VIP
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 truncate max-w-[120px] inline-block">
                          {customer.note}
                        </span>
                      )
                    ) : (
                      <span className="text-xs text-slate-300">--</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-400">
            {(currentPage - 1) * PAGE_SIZE + 1}–
            {Math.min(currentPage * PAGE_SIZE, filteredCustomers.length)} / {filteredCustomers.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            {pageNumbers.map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  'flex h-8 min-w-[32px] items-center justify-center rounded-lg px-2 text-xs font-medium transition-colors',
                  page === currentPage
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border text-muted-foreground hover:bg-accent',
                )}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
