import React from "react";
import clsx from "clsx";

export const Textarea = ({
  label,
  error,
  hint,
  rows = 4,
  className = "",
  required = false,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        rows={rows}
        className={clsx(
          "w-full px-4 py-2.5 text-sm rounded-lg border-2 transition-all duration-200 resize-vertical",
          "focus:outline-none focus:ring-2 focus:ring-primary-100",
          "text-neutral-900 placeholder-neutral-400",
          error
            ? "border-red-400 focus:border-red-500"
            : "border-neutral-200 focus:border-primary-500",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-neutral-400">{hint}</p>}
    </div>
  );
};

export default Textarea;
