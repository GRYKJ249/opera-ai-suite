import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";
import catAvatar from "@/assets/space-cat-avatar.png";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "New password — Opera AI" },
      { name: "description", content: "Set a new password for your Opera AI account." },
      { property: "og:title", content: "New password — Opera AI" },
      { property: "og:description", content: "Set a new password for your Opera AI account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error(t("Passwords do not match.", "كلمتا المرور غير متطابقتين."));
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("Password updated.", "تم تحديث كلمة المرور."));
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="glass-strong w-full max-w-md rounded-3xl p-8">
        <div className="flex flex-col items-center text-center">
          <img src={catAvatar} alt="Opera AI space cat" width={816} height={816} className="h-16 w-16 rounded-full ring-1 ring-glass-border" />
          <h1 className="mt-4 font-display text-2xl font-bold">{t("Set a new password", "اختر كلمة مرور جديدة")}</h1>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("New password", "كلمة المرور الجديدة")}</span>
            <span className="flex items-center gap-2.5 rounded-xl border border-glass-border bg-background/40 px-3.5 py-3 focus-within:border-primary/60">
              <Lock className="h-4 w-4 text-primary" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full bg-transparent text-sm outline-none" />
            </span>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("Confirm password", "تأكيد كلمة المرور")}</span>
            <span className="flex items-center gap-2.5 rounded-xl border border-glass-border bg-background/40 px-3.5 py-3 focus-within:border-primary/60">
              <Lock className="h-4 w-4 text-primary" />
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} className="w-full bg-transparent text-sm outline-none" />
            </span>
          </label>
          <button type="submit" disabled={busy} className="btn-hero w-full justify-center disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("Update password", "تحديث كلمة المرور")}
          </button>
        </form>

        <Link to="/auth" className="mt-6 block text-center text-xs text-muted-foreground hover:text-foreground">
          {t("Back to sign in", "رجوع لتسجيل الدخول")}
        </Link>
      </div>
    </div>
  );
}
