import { HeaderTooltip, HexlyLink } from "@/components/header-links";
import { ThemeToggle } from "@/components/theme-toggle";
import { Wallet } from "lucide-react";
import { Button } from "@nocoo/basalt";
import { GitHubIcon } from "@/components/icons/GitHubIcon";
import { Logo } from "@/components/Logo";

function Barcode() {
  const bars = [2, 1, 3, 1, 2, 1, 1, 3, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1];
  return (
    <div className="flex items-stretch gap-[1.5px] h-full">
      {bars.map((w, i) => (
        <div
          key={i}
          className="rounded-[0.5px] bg-basalt-primary-foreground"
          style={{ width: `${w * 1.5}px`, opacity: i % 3 === 0 ? 0.9 : 0.5 }}
        />
      ))}
    </div>
  );
}

export default function LoginPage() {
  const year = new Date().getFullYear();
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  const handleAccessSignIn = () => {
    // Cloudflare Access protects dashboard routes automatically.
    // Navigating to / or reloading prompts Cloudflare Access login.
    window.location.href = "/";
  };

  return (
    <div className="relative flex min-h-screen flex-col flex-1 items-center justify-center bg-basalt-background p-4 overflow-hidden">
      {/* Top-right controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1">
        <HeaderTooltip label="GitHub repository">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-basalt-muted-foreground hover:text-basalt-foreground"
          >
            <a
              href="https://github.com/nocoo/wooly"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub repository"
            >
              <GitHubIcon className="h-[18px] w-[18px]" />
            </a>
          </Button>
        </HeaderTooltip>
        <HexlyLink />
        <ThemeToggle aria-label="切换主题" />
      </div>

      {/* Radial glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 70% 55% at 50% 50%,",
            "hsl(var(--basalt-foreground) / 0.045) 0%,",
            "hsl(var(--basalt-foreground) / 0.042) 10%,",
            "hsl(var(--basalt-foreground) / 0.036) 20%,",
            "hsl(var(--basalt-foreground) / 0.028) 32%,",
            "hsl(var(--basalt-foreground) / 0.020) 45%,",
            "hsl(var(--basalt-foreground) / 0.012) 58%,",
            "hsl(var(--basalt-foreground) / 0.006) 72%,",
            "hsl(var(--basalt-foreground) / 0.002) 86%,",
            "transparent 100%)",
          ].join(" "),
        }}
      />
      <div className="flex flex-col items-center">
        {/* Badge card — bank card flipped vertical: 54/86 */}
        <div
          data-basalt-surface-root=""
          className="relative aspect-[54/86] w-72 overflow-hidden rounded-2xl bg-basalt-card flex flex-col ring-1 ring-black/[0.08] dark:ring-white/[0.06]"
          style={{
            boxShadow: [
              "0 1px 2px rgba(0,0,0,0.06)",
              "0 4px 8px rgba(0,0,0,0.04)",
              "0 12px 24px rgba(0,0,0,0.06)",
              "0 24px 48px rgba(0,0,0,0.04)",
              "0 0 0 0.5px rgba(0,0,0,0.02)",
              "0 0 60px rgba(0,0,0,0.03)",
            ].join(", "),
          }}
        >
          {/* Header strip with barcode */}
          <div className="bg-basalt-primary px-5 py-4">
            <div className="flex items-center justify-between">
              {/* Punch hole */}
              <div
                className="h-4 w-8 rounded-full bg-basalt-background/80"
                style={{
                  boxShadow: "inset 0 1.5px 3px rgba(0,0,0,0.35), inset 0 -0.5px 1px rgba(255,255,255,0.1)",
                }}
              />
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-basalt-primary-foreground" strokeWidth={1.5} />
                <span className="text-sm font-semibold text-basalt-primary-foreground">wooly.</span>
              </div>
              <span className="text-[10px] font-medium uppercase tracking-widest text-basalt-primary-foreground/60">
                访客
              </span>
            </div>
            {/* Barcode row */}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[9px] font-mono text-basalt-primary-foreground/40 tracking-wider">
                ID {year}-{today.slice(4)}
              </span>
              <div className="h-6">
                <Barcode />
              </div>
            </div>
          </div>

          {/* Badge content */}
          <div className="flex flex-1 flex-col items-center px-6 pt-6 pb-14">
            {/* Logo */}
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-basalt-secondary dark:bg-[#171717] ring-1 ring-basalt-border overflow-hidden p-2.5">
              <Logo size="lg" />
            </div>

            <p className="mt-5 text-lg font-semibold text-basalt-foreground">欢迎使用</p>
            <p className="mt-1 text-xs text-basalt-muted-foreground">验证身份以进入家庭权益控制台</p>

            {/* Divider */}
            <div className="mt-5 h-px w-full bg-basalt-border" />

            {/* Push button toward bottom */}
            <div className="flex-1" />

            {/* Cloudflare Access sign-in button */}
            <Button
              type="button"
              variant="secondary"
              onClick={handleAccessSignIn}
              className="w-full rounded-xl py-3 text-sm font-medium"
            >
              使用 Cloudflare Access 登录
            </Button>

            {/* Terms */}
            <p className="mt-3 text-center text-[10px] leading-relaxed text-basalt-muted-foreground/60">
              由 Cloudflare Access 提供统一身份认证保护
            </p>
          </div>

          {/* Footer strip */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center border-t border-basalt-border bg-basalt-secondary/50 py-2.5">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-basalt-heatmap-green-3 animate-pulse" />
              <span className="text-[10px] text-basalt-muted-foreground">安全身份验证</span>
            </div>
          </div>
        </div>
      </div>

      {/* Inline footer */}
      <footer className="absolute bottom-0 left-0 right-0 py-4 text-center text-xs text-basalt-muted-foreground/50">
        © {new Date().getFullYear()} wooly
      </footer>
    </div>
  );
}
