import { useState, useEffect, useRef } from 'react'
import { Eye, EyeOff, Send } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import * as telegramService from '@/services/telegramService'
import type {
  TelegramConfig as TelegramConfigType,
  NotificationLogEntry,
} from '@/services/telegramService'

// ── Mock data for template preview ──
const MOCK_DATA: Record<string, string> = {
  '{{guestName}}': 'Nguyễn Văn A',
  '{{guestPhone}}': '0901 234 567',
  '{{roomName}}': 'G01',
  '{{startTime}}': '14:00',
  '{{endTime}}': '18:00',
  '{{date}}': '20/03/2026',
  '{{totalPrice}}': '676,000đ',
  '{{promoCode}}': '—',
  '{{status}}': 'Confirmed',
}

const TEMPLATE_VARIABLES = [
  '{{guestName}}',
  '{{guestPhone}}',
  '{{roomName}}',
  '{{startTime}}',
  '{{endTime}}',
  '{{date}}',
  '{{totalPrice}}',
  '{{promoCode}}',
  '{{status}}',
]

// ── Event label mapping ──
const EVENT_LABELS: Record<string, string> = {
  new_booking: 'Booking mới',
  confirmed: 'Xác nhận',
  checked_in: 'Check-in',
  checked_out: 'Check-out',
  cancelled: 'Hủy',
  test: 'Test',
}

export function TelegramConfig() {
  // ── Section 1: Bot configuration state ──
  const [botToken, setBotToken] = useState('')
  const [chatId, setChatId] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [configSaved, setConfigSaved] = useState(false)

  // ── Section 2: Template editor state ──
  const [template, setTemplate] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // ── Section 3: Notification log state ──
  const [log, setLog] = useState<NotificationLogEntry[]>([])

  // ── Load data on mount ──
  useEffect(() => {
    const config = telegramService.getConfig()
    if (config) {
      setBotToken(config.botToken)
      setChatId(config.chatId)
      setConfigSaved(true)
    }
    setTemplate(telegramService.getTemplate())
    setLog(telegramService.getLog())
  }, [])

  // ── Handlers ──
  const handleSaveConfig = () => {
    const config: TelegramConfigType = { botToken, chatId }
    telegramService.saveConfig(config)
    setConfigSaved(true)
    toast.success('Đã lưu!')
  }

  const handleSendTest = () => {
    telegramService.sendTest()
    setLog(telegramService.getLog())
    toast.success('Đã gửi tin test!')
  }

  const handleSaveTemplate = () => {
    telegramService.saveTemplate(template)
    toast.success('Đã lưu template!')
  }

  const handleInsertVariable = (variable: string) => {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newValue =
      template.slice(0, start) + variable + template.slice(end)
    setTemplate(newValue)
    // Restore cursor position after the inserted variable
    requestAnimationFrame(() => {
      textarea.focus()
      const newPos = start + variable.length
      textarea.setSelectionRange(newPos, newPos)
    })
  }

  // ── Preview: substitute mock data into template ──
  const previewText = TEMPLATE_VARIABLES.reduce(
    (text, variable) => text.replaceAll(variable, MOCK_DATA[variable]),
    template,
  )

  // ── Extract bot name from token (if available) ──
  const botDisplayName = configSaved && botToken ? '@NhaCamBot' : null

  return (
    <div className="space-y-8 p-6">
      <h2 className="text-xl font-bold text-slate-800">Cấu hình Telegram</h2>

      {/* ══════════════════════════════════════════════
          Section 1: Bot Configuration
          ══════════════════════════════════════════════ */}
      <section className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-slate-700">
          Cấu hình Bot
        </h3>

        {/* Connection status */}
        <div className="mb-5 flex items-center gap-2">
          <span
            className={cn(
              'inline-block h-2.5 w-2.5 rounded-full',
              configSaved ? 'bg-emerald-500' : 'bg-slate-400',
            )}
          />
          <span className="text-sm text-slate-600">
            {configSaved
              ? `Đã kết nối — ${botDisplayName}`
              : 'Chưa cấu hình'}
          </span>
        </div>

        {/* Bot Token */}
        <div className="mb-4 space-y-1.5">
          <Label htmlFor="bot-token">Bot Token</Label>
          <div className="relative">
            <Input
              id="bot-token"
              type={showToken ? 'text' : 'password'}
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={showToken ? 'Ẩn token' : 'Hiện token'}
            >
              {showToken ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Chat ID */}
        <div className="mb-5 space-y-1.5">
          <Label htmlFor="chat-id">Chat ID</Label>
          <Input
            id="chat-id"
            type="text"
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            placeholder="-1001234567890"
            className="font-mono"
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            variant="primary"
            onClick={handleSaveConfig}
            disabled={!botToken.trim() || !chatId.trim()}
          >
            Lưu cấu hình
          </Button>
          <Button variant="outline" onClick={handleSendTest}>
            <Send className="h-4 w-4" />
            Gửi tin test
          </Button>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          Section 2: Template Editor + Preview
          ══════════════════════════════════════════════ */}
      <section className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-slate-700">
          Template tin nhắn
        </h3>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left: Template editor */}
          <div className="space-y-3">
            <Label htmlFor="template-editor">Nội dung template</Label>
            <textarea
              ref={textareaRef}
              id="template-editor"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={8}
              className="w-full rounded-lg border border-[#E2E8F0] bg-slate-50 px-3 py-2 font-mono text-sm text-slate-800 outline-none transition-shadow focus:border-[#F87171] focus:ring-2 focus:ring-[#F87171]/30"
            />

            {/* Variable chips */}
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATE_VARIABLES.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleInsertVariable(v)}
                  className="rounded-md bg-blue-100 px-2 py-0.5 font-mono text-xs text-blue-700 transition-colors hover:bg-blue-200"
                >
                  {v}
                </button>
              ))}
            </div>

            <Button variant="primary" onClick={handleSaveTemplate}>
              Lưu template
            </Button>
          </div>

          {/* Right: Telegram preview */}
          <div className="flex flex-col">
            <div className="rounded-xl bg-[#0E1621] p-4">
              <p className="mb-3 text-xs font-medium text-slate-400">
                Preview — Telegram
              </p>
              {/* Message bubble */}
              <div className="max-w-sm rounded-xl bg-[#182533] px-4 py-3">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
                  {previewText}
                </p>
                <div className="mt-2 flex items-center justify-end gap-2">
                  <span className="text-[10px] text-slate-500">
                    NhaCam Bot
                  </span>
                  <span className="text-[10px] text-slate-500">14:00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          Section 3: Events + Notification Log
          ══════════════════════════════════════════════ */}
      <section className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-slate-700">
          Sự kiện & Nhật ký thông báo
        </h3>

        {/* Info cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Green card: auto-send events */}
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-sm font-medium text-emerald-800">
              Tự động gửi khi:
            </p>
            <p className="mt-1 text-sm text-emerald-700">
              Booking mới &middot; Xác nhận &middot; Check-in
            </p>
          </div>

          {/* Red card: no-send events */}
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-800">
              Không gửi khi:
            </p>
            <p className="mt-1 text-sm text-red-700">
              Nội bộ (dọn/bảo trì) &middot; Hủy &middot; Check-out
            </p>
          </div>
        </div>

        {/* Notification log table */}
        {log.length === 0 ? (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-[#E2E8F0] py-12">
            <p className="text-sm text-slate-400">Chưa có thông báo nào.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-left">
                  <th className="pb-2 pr-4 font-medium text-slate-500">
                    Thời gian
                  </th>
                  <th className="pb-2 pr-4 font-medium text-slate-500">
                    Sự kiện
                  </th>
                  <th className="pb-2 pr-4 font-medium text-slate-500">
                    Khách &middot; Phòng
                  </th>
                  <th className="pb-2 font-medium text-slate-500">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody>
                {log.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-[#E2E8F0] last:border-0"
                  >
                    <td className="py-2.5 pr-4 text-slate-600">
                      {formatTimestamp(entry.timestamp)}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-700">
                      {EVENT_LABELS[entry.event] || entry.event}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-700">
                      {entry.guestName} &middot; {entry.roomName}
                    </td>
                    <td className="py-2.5">
                      <LogStatusBadge status={entry.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

// ── Helper: format ISO timestamp to readable string ──
function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ── Helper: status badge for log entries ──
function LogStatusBadge({
  status,
}: {
  status: NotificationLogEntry['status']
}) {
  if (status === 'sent') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
        Đã gửi ✓
      </span>
    )
  }
  if (status === 'simulated') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
        Mô phỏng
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
      Bỏ qua
    </span>
  )
}
