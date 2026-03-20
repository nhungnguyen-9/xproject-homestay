import { useState, useMemo } from 'react'
import { Navigate } from 'react-router'
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
  standard: '#22C55E',
  vip: '#F87171',
  supervip: '#8B5CF6',
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

  // month
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

export function RevenueDashboard() {
  const role = authService.getRole()

  if (role === 'staff') {
    return <Navigate to="/admin/bookings" />
  }

  const [period, setPeriod] = useState<Period>('week')

  const summary: RevenueSummary = useMemo(
    () => revenueService.getRevenueByPeriod(period),
    [period],
  )

  const dateRange = useMemo(() => getPeriodDateRange(period), [period])

  const dailyData: DailyRevenue[] = useMemo(
    () => revenueService.getDailyRevenue(dateRange.start, dateRange.end),
    [dateRange.start, dateRange.end],
  )

  const occupancy: RoomOccupancy[] = useMemo(
    () => revenueService.getOccupancyByRoom(period),
    [period],
  )

  const topCustomers: TopCustomer[] = useMemo(
    () => revenueService.getTopCustomers(period, 5),
    [period],
  )

  const hasDailyData = dailyData.some((d) => d.revenue > 0)

  return (
    <div className="space-y-6 p-6">
      {/* Period Selector */}
      <div className="flex items-center gap-2">
        {PERIOD_LABELS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              period === p.value
                ? 'bg-[#F87171] text-white'
                : 'border border-gray-300 bg-white text-gray-600 hover:bg-gray-50',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <div className="rounded-xl bg-[#FEF2F2] p-5">
          <p className="text-sm font-medium text-rose-700">
            Tổng doanh thu
          </p>
          <p className="mt-2 text-2xl font-bold text-rose-900">
            {formatPrice(summary.totalRevenue)}đ
          </p>
          <div className="mt-1 flex items-center gap-1 text-sm">
            {summary.revenueDelta >= 0 ? (
              <span className="font-medium text-green-600">
                ↑ {summary.revenueDelta}%
              </span>
            ) : (
              <span className="font-medium text-red-600">
                ↓ {Math.abs(summary.revenueDelta)}%
              </span>
            )}
            <span className="text-rose-600">so với kỳ trước</span>
          </div>
        </div>

        {/* Total Bookings */}
        <div className="rounded-xl bg-[#F0FDF4] p-5">
          <p className="text-sm font-medium text-green-700">
            Tổng booking
          </p>
          <p className="mt-2 text-2xl font-bold text-green-900">
            {summary.totalBookings}
          </p>
          <div className="mt-1 flex items-center gap-1 text-sm">
            {summary.bookingsDelta >= 0 ? (
              <span className="font-medium text-green-600">
                ↑ {summary.bookingsDelta}
              </span>
            ) : (
              <span className="font-medium text-red-600">
                ↓ {Math.abs(summary.bookingsDelta)}
              </span>
            )}
            <span className="text-green-600">so với kỳ trước</span>
          </div>
        </div>

        {/* Occupancy Rate */}
        <div className="rounded-xl bg-[#EFF6FF] p-5">
          <p className="text-sm font-medium text-blue-700">
            Tỷ lệ lấp đầy
          </p>
          <p className="mt-2 text-2xl font-bold text-blue-900">
            {summary.occupancyRate}%
          </p>
          <div className="mt-2 h-[6px] w-full overflow-hidden rounded-full bg-blue-200">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: `${Math.min(summary.occupancyRate, 100)}%` }}
            />
          </div>
        </div>

        {/* Average per Booking */}
        <div className="rounded-xl bg-[#F5F3FF] p-5">
          <p className="text-sm font-medium text-purple-700">TB / booking</p>
          <p className="mt-2 text-2xl font-bold text-purple-900">
            {formatPrice(summary.avgPerBooking)}đ
          </p>
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6">
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
                  <stop offset="5%" stopColor="#F87171" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F87171" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDateLabel}
                tick={{ fontSize: 12, fill: '#64748B' }}
                axisLine={{ stroke: '#E2E8F0' }}
              />
              <YAxis
                tickFormatter={(v: number) => `${formatPrice(v)}`}
                tick={{ fontSize: 12, fill: '#64748B' }}
                axisLine={{ stroke: '#E2E8F0' }}
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
                  border: '1px solid #E2E8F0',
                  fontSize: '13px',
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#F87171"
                strokeWidth={2}
                fill="url(#revenueGradient)"
                dot={{ r: 4, fill: '#F87171', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#F87171' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-slate-400">
            Chưa có dữ liệu
          </div>
        )}
      </div>

      {/* Bottom Section: Occupancy by Room + Top Customers */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Occupancy by Room */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-7">
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
                <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
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

        {/* Top Customers */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-7">
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
                      isTop ? 'bg-[#FFFBEB]' : 'bg-[#F8FAFC]',
                    )}
                  >
                    {/* Rank circle */}
                    <div
                      className={cn(
                        'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold',
                        isTop
                          ? 'bg-[#FEF3C7] text-[#92400E]'
                          : 'bg-gray-200 text-gray-600',
                      )}
                    >
                      {rank}
                    </div>

                    {/* Name and visit count */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-bold text-slate-800">
                        {customer.name}
                      </p>
                      <p className="text-[13px] text-gray-500">
                        {customer.visitCount} lần đặt
                      </p>
                    </div>

                    {/* Amount */}
                    <p className="flex-shrink-0 text-[16px] font-extrabold text-[#F87171]">
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
