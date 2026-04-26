import { cn } from "@/lib/utils";

interface StatTileProps {
  title: string;
  description: string;
  value: string;
  delta?: string;
}

/** 카드 대신 벤토형 수치 타일 */
export function StatTile({ title, description, value, delta }: StatTileProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-border/70 bg-card/80 p-5",
        "shadow-none ring-1 ring-black/[0.03] transition-[transform,box-shadow] duration-300",
        "hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-24px_rgba(255,111,15,0.35)] dark:bg-card/45 dark:ring-white/[0.05]",
      )}
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/[0.07] opacity-70 blur-2xl transition-opacity duration-300 group-hover:opacity-100 dark:bg-primary/[0.1]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-3 left-0 w-1 rounded-full bg-gradient-to-b from-primary via-primary to-primary/40"
        aria-hidden
      />
      <div className="pl-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
            <p className="mt-1 text-xs text-muted-foreground/90">{description}</p>
          </div>
          {delta ? (
            <span className="rounded-full bg-primary/12 px-2.5 py-1 text-[11px] font-semibold text-primary">
              {delta}
            </span>
          ) : null}
        </div>
        <p className="mt-4 text-3xl font-bold tabular-nums tracking-tight text-foreground md:text-4xl">{value}</p>
      </div>
    </div>
  );
}
