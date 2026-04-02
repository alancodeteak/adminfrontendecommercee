export function Button({ children, loading, className = "", ...props }) {
  return (
    <button
      className={[
        "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm",
        "hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60",
        className
      ].join(" ")}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
          aria-hidden="true"
        />
      ) : null}
      {children}
    </button>
  );
}

