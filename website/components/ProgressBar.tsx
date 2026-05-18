interface ProgressBarProps {
  current: number
  total: number
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = (current / total) * 100

  return (
    <div className="glass-panel mb-6 rounded-[30px] p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">Focus Flow</p>
          <h3 className="font-display mt-2 text-2xl font-bold tracking-[-0.05em] text-slate-950">Progress</h3>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl font-bold tracking-[-0.05em] text-slate-950">
            {current}
            <span className="text-base text-slate-400"> / {total}</span>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">question tracked</p>
        </div>
      </div>

      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-900/8">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#11203a_0%,#2a4e87_42%,#00d7a0_100%)] transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {Math.round(percentage)}% session completed
      </p>
    </div>
  )
}
