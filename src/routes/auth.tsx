import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Lock, Mail, User } from "lucide-react";
import catAvatar from "@/assets/space-cat-avatar.png";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { logAuthEvent } from "@/lib/security";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — Opera AI" },
      { name: "description", content: "Create your Opera AI account or sign in to reach the AI chat workspace, cloud IDE and creative studio." },
      { property: "og:title", content: "Sign in — Opera AI" },
      { property: "og:description", content: "Secure access to the Opera AI ecosystem." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const { t, lang, setLang } = useLang();
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<null | "confirm" | "reset">(null);
  const [otp, setOtp] = useState("");

  useEffect(() => {
    if (!loading && session) navigate({ to: "/dashboard", replace: true });
  }, [loading, session, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/dashboard",
            data: { username: username.trim(), display_name: username.trim() },
          },
        });
        if (error) throw error;
        setSent("confirm");
        toast.success(t("Check your inbox to confirm your account.", "افحص بريدك لتأكيد حسابك."));
      } else if (mode === "signin") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) void logAuthEvent(data.user.id, "sign_in", "email");
        toast.success(t("Welcome back, explorer.", "أهلاً بعودتك يا مستكشف."));
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;
        setSent("reset");
        toast.success(t("Reset link sent.", "تم إرسال رابط إعادة التعيين."));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async () => {
    const token = otp.replace(/\D/g, "");
    if (token.length !== 6) {
      toast.error(t("Enter the 6-digit code.", "أدخل الرمز المكوّن من 6 أرقام."));
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({ email, token, type: "signup" });
      if (error) throw error;
      if (data.user) void logAuthEvent(data.user.id, "sign_up", "email");
      toast.success(t("Account verified. Welcome aboard.", "تم توثيق الحساب. أهلاً بك على المتن."));
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const resendCode = async () => {
    setBusy(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: window.location.origin + "/dashboard" },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("A new code is on its way.", "تم إرسال رمز جديد."));
  };

  const google = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(result.error.message ?? t("Google sign-in failed.", "فشل الدخول عبر جوجل."));
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  };

  const title =
    mode === "signin"
      ? t("Sign in to Opera AI", "تسجيل الدخول إلى Opera AI")
      : mode === "signup"
        ? t("Create your account", "إنشاء حسابك")
        : t("Reset your password", "إعادة تعيين كلمة المرور");

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="relative flex min-h-screen items-center justify-center px-4 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklab,var(--primary)_18%,transparent),transparent_60%)]" />

      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-6 py-5">
        <Link to="/" className="btn-ghost !px-3 !py-2 text-xs">
          <ArrowLeft className="h-4 w-4" />
          {t("Back home", "الرئيسية")}
        </Link>
        <button type="button" onClick={() => setLang(lang === "ar" ? "en" : "ar")} className="btn-ghost !px-3 !py-2 text-xs">
          {lang === "ar" ? "English" : "العربية"}
        </button>
      </div>

      <div className="glass-strong relative w-full max-w-md rounded-3xl p-8">
        <div className="flex flex-col items-center text-center">
          <img src={catAvatar} alt="Opera AI space cat" width={816} height={816} className="h-16 w-16 animate-float rounded-full ring-1 ring-glass-border" />
          <h1 className="mt-4 font-display text-2xl font-bold">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t(
              "Your gateway to the chat workspace, cloud IDE and image studio.",
              "بوابتك إلى مساحة المحادثة، بيئة البرمجة السحابية، واستوديو الصور.",
            )}
          </p>
        </div>

        {sent ? (
          <div className="mt-8 rounded-2xl border border-glass-border bg-primary/5 p-5 text-center text-sm">
            <Mail className="mx-auto mb-3 h-6 w-6 text-primary" />
            {sent === "confirm"
              ? t(
                  "We emailed you a 6-digit code. Enter it below, or open the confirmation link in the same email.",
                  "أرسلنا إلى بريدك رمزاً من 6 أرقام. أدخله بالأسفل، أو افتح رابط التأكيد في نفس الرسالة.",
                )
              : t(
                  "We sent a password reset link to your email.",
                  "أرسلنا رابط إعادة تعيين كلمة المرور إلى بريدك.",
                )}

            {sent === "confirm" && (
              <div className="mt-5">
                <input
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  aria-label={t("Verification code", "رمز التحقق")}
                  placeholder="••••••"
                  className="w-full rounded-xl border border-glass-border bg-background/40 px-3.5 py-3 text-center font-mono text-2xl tracking-[0.6em] outline-none focus:border-primary/60"
                />
                <button
                  type="button"
                  onClick={() => void verifyCode()}
                  disabled={busy || otp.length !== 6}
                  className="btn-hero mt-4 w-full justify-center disabled:opacity-60"
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t("Verify and continue", "تحقّق وتابع")}
                </button>
                <button
                  type="button"
                  onClick={() => void resendCode()}
                  disabled={busy}
                  className="mt-3 block w-full text-xs text-muted-foreground hover:text-foreground"
                >
                  {t("Send a new code", "إرسال رمز جديد")}
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => { setSent(null); setOtp(""); setMode("signin"); }}
              className="mt-4 block w-full text-xs text-primary underline-offset-4 hover:underline"
            >
              {t("Back to sign in", "رجوع لتسجيل الدخول")}
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={submit} className="mt-8 space-y-4">
              {mode === "signup" && (
                <Field icon={<User className="h-4 w-4" />} label={t("Username", "اسم المستخدم")}>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    minLength={3}
                    placeholder={t("space_explorer", "اسمك بالإنجليزية")}
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                  />
                </Field>
              )}

              <Field icon={<Mail className="h-4 w-4" />} label={t("Email", "البريد الإلكتروني")}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@orbit.dev"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                />
              </Field>

              {mode !== "forgot" && (
                <Field icon={<Lock className="h-4 w-4" />} label={t("Password", "كلمة المرور")}>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    placeholder="••••••••"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                  />
                </Field>
              )}

              <button type="submit" disabled={busy} className="btn-hero w-full justify-center disabled:opacity-60">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "signin"
                  ? t("Sign in", "تسجيل الدخول")
                  : mode === "signup"
                    ? t("Create account", "إنشاء حساب")
                    : t("Send reset link", "إرسال الرابط")}
              </button>
            </form>

            {mode !== "forgot" && (
              <>
                <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="h-px flex-1 bg-glass-border" />
                  {t("or", "أو")}
                  <span className="h-px flex-1 bg-glass-border" />
                </div>

                <button type="button" onClick={google} disabled={busy} className="btn-ghost w-full justify-center disabled:opacity-60">
                  <GoogleMark />
                  {t("Continue with Google", "المتابعة عبر جوجل")}
                </button>
              </>
            )}

            <div className="mt-6 space-y-2 text-center text-xs text-muted-foreground">
              {mode === "signin" ? (
                <>
                  <button type="button" onClick={() => setMode("signup")} className="block w-full hover:text-foreground">
                    {t("New here? Create an account", "جديد هنا؟ أنشئ حساباً")}
                  </button>
                  <button type="button" onClick={() => setMode("forgot")} className="block w-full hover:text-foreground">
                    {t("Forgot your password?", "نسيت كلمة المرور؟")}
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => setMode("signin")} className="block w-full hover:text-foreground">
                  {t("Already have an account? Sign in", "لديك حساب؟ سجّل الدخول")}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2.5 rounded-xl border border-glass-border bg-background/40 px-3.5 py-3 transition-colors focus-within:border-primary/60">
        <span className="text-primary">{icon}</span>
        {children}
      </span>
    </label>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.4a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.6-5.2 3.6-8.8Z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3a7.2 7.2 0 0 1-10.7-3.8H1.3v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1A7.2 7.2 0 0 1 12 4.8Z" />
    </svg>
  );
}
