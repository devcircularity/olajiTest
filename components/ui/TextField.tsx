// components/ui/TextField.tsx - Updated based on your existing component
"use client";
import clsx from "clsx";

type Props = {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  error?: string | null;
  helperText?: string;
  autoComplete?: string;
};

export default function TextField({
  id, label, type = "text", value, onChange, placeholder, required,
  error, helperText, autoComplete
}: Props) {
  const hasError = error && error.trim() !== "";
  
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${id}-error` : (helperText ? `${id}-help` : undefined)}
        className={clsx("input", hasError && "input-invalid")}
      />
      {hasError ? (
        <p id={`${id}-error`} role="alert" aria-live="polite" className="error-text mt-1">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${id}-help`} className="helper mt-1">{helperText}</p>
      ) : null}
    </div>
  );
}