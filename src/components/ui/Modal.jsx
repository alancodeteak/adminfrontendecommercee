import { useEffect } from "react";

export function Modal({ open, title, onClose, children, size = "lg" }) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const width =
    size === "xl" ? "max-w-5xl" : size === "lg" ? "max-w-3xl" : size === "md" ? "max-w-xl" : "max-w-md";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-label={title || "Modal"}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
      <div className={`relative w-full ${width} overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200`}>
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            onClick={onClose}
            aria-label="Close modal"
          >
            Close
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

