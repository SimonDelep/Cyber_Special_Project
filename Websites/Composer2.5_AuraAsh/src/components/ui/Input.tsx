import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id ?? props.name;

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-charcoal">
        {label}
      </label>
      <input
        id={inputId}
        className={cn(
          "w-full rounded-xl border border-stone/25 bg-warm-white px-4 py-2.5 text-sm",
          "outline-none transition-colors placeholder:text-stone/60",
          "focus:border-ember focus:ring-1 focus:ring-ember/30",
          error && "border-red-400 focus:border-red-400 focus:ring-red-400/30",
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
