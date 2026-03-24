import { useState, useRef } from 'react'
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
  const [botToken, setBotToken] = useState(() => telegramService.getConfig()?.botToken ?? '')
  const [chatId, setChatId] = useState(() => telegramService.getConfig()?.chatId ?? '')
  const [showToken, setShowToken] = useState(false)
  const [configSaved, setConfigSaved] = useState(() => !!telegramService.getConfig())

  // ── Section 2: Template editor state ──
  const [template, setTemplate] = useState(() => telegramService.getTemplate())
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // ── Section 3: Notification log state ──
  const [log, setLog] = useState<NotificationLogEntry[]>(() => telegramService.getLog())

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
    <div className="flex flex-col gap-8 p-6">
      <h2 className="text-xl font-bold text-foreground">Cấu hình Telegram</h2>

      {/* ══════════════════════════════════════════════
          Section 1: Bot Configuration
          ══════════════════════════════════════════════ */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-foreground">
          Cấu hình Bot
        </h3>

        {/* Connection status */}
        <div className="mb-5 flex items-center gap-2">
          <span
            className={cn(
              'inline-block h-2.5 w-2.5 rounded-full',
              configSaved ? 'bg-status-success' : 'bg-muted-foreground',
            )}
          />
          <span className="text-sm text-muted-foreground">
            {configSaved
              ? `Đã kết nối — ${botDisplayName}`
              : 'Chưa cấu hình'}
          </span>
        </div>

        {/* Bot Token */}
        <div className="mb-4 flex flex-col gap-1.5">
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
        <div className="mb-5 flex flex-col gap-1.5">
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
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-foreground">
          Template tin nhắn
        </h3>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left: Template editor */}
          <div className="flex flex-col gap-3">
            <Label htmlFor="template-editor">Nội dung template</Label>
            <textarea
              ref={textareaRef}
              id="template-editor"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={8}
              className="w-full rounded-lg border border-border bg-muted px-3 py-2 font-mono text-sm text-foreground outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary/30"
            />

            {/* Variable chips */}
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATE_VARIABLES.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleInsertVariable(v)}
                  className="rounded-md bg-status-info-muted px-2 py-0.5 font-mono text-xs text-status-info-foreground transition-colors hover:bg-status-info-muted/80"
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
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-foreground">
          Sự kiện & Nhật ký thông báo
        </h3>

        {/* Info cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Green card: auto-send events */}
          <div className="rounded-lg border border-status-success/20 bg-status-success-muted px-4 py-3">
            <p className="text-sm font-medium text-status-success-foreground">
              Tự động gửi khi:
            </p>
            <p className="mt-1 text-sm text-status-success-foreground">
              Booking mới &middot; Xác nhận &middot; Check-in
            </p>
          </div>

          {/* Red card: no-send events */}
          <div className="rounded-lg border border-status-error/20 bg-status-error-muted px-4 py-3">
            <p className="text-sm font-medium text-status-error-foreground">
              Không gửi khi:
            </p>
            <p className="mt-1 text-sm text-status-error-foreground">
              Nội bộ (dọn/bảo trì) &middot; Hủy &middot; Check-out
            </p>
          </div>
        </div>

        {/* Notification log table */}
        {log.length === 0 ? (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-12">
            <p className="text-sm text-muted-foreground">Chưa có thông báo nào.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 pr-4 font-medium text-muted-foreground">
                    Thời gian
                  </th>
                  <th className="pb-2 pr-4 font-medium text-muted-foreground">
                    Sự kiện
                  </th>
                  <th className="pb-2 pr-4 font-medium text-muted-foreground">
                    Khách &middot; Phòng
                  </th>
                  <th className="pb-2 font-medium text-muted-foreground">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody>
                {log.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="py-2.5 pr-4 text-muted-foreground">
                      {formatTimestamp(entry.timestamp)}
                    </td>
                    <td className="py-2.5 pr-4 text-foreground">
                      {EVENT_LABELS[entry.event] || entry.event}
                    </td>
                    <td className="py-2.5 pr-4 text-foreground">
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
      <span className="inline-flex items-center gap-1 rounded-full bg-status-success-muted px-2.5 py-0.5 text-xs font-medium text-status-success-foreground">
        Đã gửi ✓
      </span>
    )
  }
  if (status === 'simulated') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-status-warning-muted px-2.5 py-0.5 text-xs font-medium text-status-warning-foreground">
        Mô phỏng
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
      Bỏ qua
    </span>
  )
}
