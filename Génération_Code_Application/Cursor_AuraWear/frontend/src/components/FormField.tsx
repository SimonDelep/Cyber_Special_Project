interface FormFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  autoComplete?: string;
  hint?: string;
}

export default function FormField({
  id,
  label,
  type = "text",
  value,
  onChange,
  required,
  autoComplete,
  hint,
}: FormFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-aura-800">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        className="w-full rounded-lg border border-aura-300 px-4 py-2.5 text-sm text-aura-950 placeholder:text-aura-400 focus:border-aura-500 focus:outline-none focus:ring-2 focus:ring-aura-500/20"
      />
      {hint && <p className="mt-1 text-xs text-aura-500">{hint}</p>}
    </div>
  );
}
