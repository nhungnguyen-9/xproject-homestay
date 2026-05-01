import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { z } from 'zod';
import { toast } from 'sonner';
import * as authService from '@/services/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const loginSchema = z.object({
  username: z.string().trim().min(1, 'Vui lòng nhập tên đăng nhập'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect to admin
  if (authService.isAuthenticated()) {
    return <Navigate to="/admin" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // Validate with Zod
    const result = loginSchema.safeParse({ username, password });
    if (!result.success) {
      const msg = result.error.issues.map((i) => i.message).join('. ');
      toast.error(msg);
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.login(result.data.username, result.data.password);
      navigate('/admin', { replace: true });
    } catch (err: unknown) {
      const error = err as Error & { status?: number };
      if (error.status === 401) {
        toast.error('Sai tên đăng nhập hoặc mật khẩu');
      } else if (error.status === 429) {
        toast.error('Quá nhiều lần thử, vui lòng đợi');
      } else {
        toast.error('Không thể kết nối server');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary shadow-md">
            <span className="text-xl font-bold text-primary-foreground">NC</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Nhà Cam Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">Đăng nhập để quản lý hệ thống</p>
        </div>

        {/* Login form */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Tên đăng nhập</Label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Tên đăng nhập"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu"
                disabled={isSubmitting}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Đang xử lý...
                </span>
              ) : (
                'Đăng nhập'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
