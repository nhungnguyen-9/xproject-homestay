import { useState, useMemo, useEffect } from 'react'
import { Navigate } from 'react-router'
import { Loader2 } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import * as authService from '@/services/authService'
import * as revenueService from '@/services/revenueService'
import type {
  RevenueSummary,
  RoomOccupancy,
  TopCustomer,
  DailyRevenue,
} from '@/services/revenueService'
import { formatPrice } from '@/utils/helpers'
import { cn } from '@/lib/utils'

type Period = 'today' | 'week' | 'month'

const PERIOD_LABELS: { value: Period; label: string }[] = [
  { value: 'today', label: 'Hôm nay' },
  { value: 'week', label: 'Tuần này' },
  { value: 'month', label: 'Tháng này' },
]

const ROOM_TYPE_COLORS: Record<string, string> = {
  standard: 'var(--color-room-standard)',
  vip: 'var(--color-room-vip)',
  supervip: 'var(--color-room-supervip)',
}

function getPeriodDateRange(period: Period): { start: string; end: string } {
  const now = new Date()
  const formatDate = (d: Date) => d.toISOString().split('T')[0]

  if (period === 'today') {
    return { start: formatDate(now), end: formatDate(now) }
  }

  if (period === 'week') {
    const dayOfWeek = now.getDay()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - dayOfWeek)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    return { start: formatDate(weekStart), end: formatDate(weekEnd) }
  }

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { start: formatDate(monthStart), end: formatDate(monthEnd) }
}

function formatDateLabel(dateStr: unknown): string {
  const d = new Date(String(dateStr))
  return `${d.getDate()}/${d.getMonth() + 1}`
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Bảng tổng quan doanh thu — biểu đồ xu hướng, tỷ lệ lấp đầy, top khách hàng
 * Lọc theo kỳ: hôm nay / tuần / tháng. Chỉ admin mới truy cập được
 */
export function RevenueDashboard() {
  const [period, setPeriod] = useState<Period>('week')
  const [summary, setSummary] = useState<RevenueSummary | null>(null)
  const [dailyData, setDailyData] = useState<DailyRevenue[]>([])
  const [occupancy, setOccupancy] = useState<RoomOccupancy[]>([])
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([])
  const [loading, setLoading] = useState(true)

  const dateRange = useMemo(() => getPeriodDateRange(period), [period])

  useEffect(() => {
    let cancelled = false
    Promise.all([
      revenueService.getRevenueByPeriod(period),
      revenueService.getDailyRevenue(dateRange.start, dateRange.end),
      revenueService.getOccupancyByRoom(period),
      revenueService.getTopCustomers(period, 5),
    ])
      .then(([s, d, o, t]) => {
        if (cancelled) return
        setSummary(s)
        setDailyData(d)
        setOccupancy(o)
        setTopCustomers(t)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [period, dateRange.start, dateRange.end])

  const role = authService.getRole()

  if (role === 'staff') {
    return <Navigate to="/admin/bookings" />
  }

  if (loading || !summary) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  const hasDailyData = dailyData.some((d) => d.revenue > 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        {PERIOD_LABELS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              period === p.value
                ? 'bg-primary text-primary-foreground'
                : 'border border-border bg-card text-muted-foreground hover:bg-accent',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-primary/5 p-5">
          <p className="text-sm font-medium text-primary">
            Tổng doanh thu
          </p>
          <p className="mt-2 text-2xl font-bold text-primary">
            {formatPrice(summary.totalRevenue)}đ
          </p>
          <div className="mt-1 flex items-center gap-1 text-sm">
            {summary.revenueDelta >= 0 ? (
              <span className="font-medium text-status-success-foreground">
                ↑ {summary.revenueDelta}%
              </span>
            ) : (
              <span className="font-medium text-status-error-foreground">
                ↓ {Math.abs(summary.revenueDelta)}%
              </span>
            )}
            <span className="text-muted-foreground">so với kỳ trước</span>
          </div>
        </div>

        <div className="rounded-xl bg-status-success-muted p-5">
          <p className="text-sm font-medium text-status-success-foreground">
            Tổng booking
          </p>
          <p className="mt-2 text-2xl font-bold text-status-success-foreground">
            {summary.totalBookings}
          </p>
          <div className="mt-1 flex items-center gap-1 text-sm">
            {summary.bookingsDelta >= 0 ? (
              <span className="font-medium text-status-success-foreground">
                ↑ {summary.bookingsDelta}
              </span>
            ) : (
              <span className="font-medium text-status-error-foreground">
                ↓ {Math.abs(summary.bookingsDelta)}
              </span>
            )}
            <span className="text-status-success-foreground">so với kỳ trước</span>
          </div>
        </div>

        <div className="rounded-xl bg-status-info-muted p-5">
          <p className="text-sm font-medium text-status-info-foreground">
            Tỷ lệ lấp đầy
          </p>
          <p className="mt-2 text-2xl font-bold text-status-info-foreground">
            {summary.occupancyRate}%
          </p>
          <div className="mt-2 h-[6px] w-full overflow-hidden rounded-full bg-status-info/20">
            <div
              className="h-full rounded-full bg-status-info transition-all"
              style={{ width: `${Math.min(summary.occupancyRate, 100)}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl bg-status-warning-muted p-5">
          <p className="text-sm font-medium text-status-warning-foreground">TB / booking</p>
          <p className="mt-2 text-2xl font-bold text-status-warning-foreground">
            {formatPrice(summary.avgPerBooking)}đ
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">
            Xu hướng doanh thu
          </h3>
          <span className="text-sm text-slate-500">
            {formatDisplayDate(dateRange.start)} -{' '}
            {formatDisplayDate(dateRange.end)}
          </span>
        </div>

        {hasDailyData ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient
                  id="revenueGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDateLabel}
                tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
                axisLine={{ stroke: 'var(--color-border)' }}
              />
              <YAxis
                tickFormatter={(v: number) => `${formatPrice(v)}`}
                tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
                axisLine={{ stroke: 'var(--color-border)' }}
                width={90}
              />
              <Tooltip
                formatter={(value: unknown) => [
                  `${formatPrice(Number(value))}đ`,
                  'Doanh thu',
                ]}
                labelFormatter={formatDateLabel}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  fontSize: '13px',
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--color-primary)"
                strokeWidth={2}
                fill="url(#revenueGradient)"
                dot={{ r: 4, fill: 'var(--color-primary)', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: 'var(--color-primary)' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-slate-400">
            Chưa có dữ liệu
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-7">
          <h3 className="mb-5 text-[18px] font-bold text-slate-800">
            Tỷ lệ lấp đầy theo phòng
          </h3>
          <div className="flex flex-col gap-[18px]">
            {occupancy.map((room) => (
              <div key={room.roomId}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[15px] font-bold text-slate-700">
                    {room.roomName}
                  </span>
                  <span className="text-[15px] font-semibold text-slate-600">
                    {room.occupancyPercent}%
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(room.occupancyPercent, 100)}%`,
                      backgroundColor:
                        ROOM_TYPE_COLORS[room.roomType] || '#22C55E',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-7">
          <h3 className="mb-5 text-[18px] font-bold text-slate-800">
            Top khách hàng chi tiêu
          </h3>
          {topCustomers.length > 0 ? (
            <div className="flex flex-col gap-4">
              {topCustomers.map((customer, index) => {
                const rank = index + 1
                const isTop = rank === 1

                return (
                  <div
                    key={`${customer.name}-${index}`}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-4 py-3',
                      isTop ? 'bg-status-warning-muted' : 'bg-muted/50',
                    )}
                  >
                    <div
                      className={cn(
                        'flex size-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold',
                        isTop
                          ? 'bg-status-warning/20 text-status-warning-foreground'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {rank}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-bold text-slate-800">
                        {customer.name}
                      </p>
                      <p className="text-[13px] text-muted-foreground">
                        {customer.visitCount} lần đặt
                      </p>
                    </div>

                    <p className="flex-shrink-0 text-[16px] font-extrabold text-primary">
                      {formatPrice(customer.totalSpent)}đ
                    </p>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center text-slate-400">
              Chưa có dữ liệu khách hàng.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
