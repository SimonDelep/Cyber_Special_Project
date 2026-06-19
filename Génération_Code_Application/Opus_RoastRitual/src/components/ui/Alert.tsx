type AlertProps = {
  variant?: "error" | "success" | "info";
  children: React.ReactNode;
};

const styles = {
  error: "border-red-200 bg-red-50 text-red-800",
  success: "border-sage/40 bg-sage/10 text-espresso",
  info: "border-sage/30 bg-cream text-espresso/80",
};

export function Alert({ variant = "info", children }: AlertProps) {
  return (
    <div
      role="alert"
      className={`rounded-xl border px-4 py-3 text-sm ${styles[variant]}`}
    >
      {children}
    </div>
  );
}
