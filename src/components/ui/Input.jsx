import { useId } from "react";

export function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  rightElement,
  autoComplete,
  name
}) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={[
            "w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-900 outline-none",
            "placeholder:text-slate-400",
            error ? "border-rose-300 focus:ring-2 focus:ring-rose-200" : "border-slate-200 focus:ring-2 focus:ring-indigo-200",
            rightElement ? "pr-10" : ""
          ].join(" ")}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        {rightElement ? (
          <div className="absolute inset-y-0 right-2 flex items-center">{rightElement}</div>
        ) : null}
      </div>
      {error ? (
        <div id={`${id}-error`} className="text-xs text-rose-600">
          {error}
        </div>
      ) : null}
    </div>
  );
}

