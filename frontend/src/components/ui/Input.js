import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import clsx from "clsx";

export const Input = ({
  label,
  error,
  hint,
  icon: Icon,
  type = "text",
  variant = "default",
  className = "",
  required = false,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const resolvedType = isPassword ? (showPassword ? "text" : "password") : type;

  const inputBase = clsx(
    "w-full rounded-lg transition-all duration-200 focus:outline-none",
    Icon ? "pl-10" : "pl-4",
    isPassword ? "pr-10" : "pr-4",
    "py-2.5 text-sm",
    {
      "border-2 border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100":
        variant === "default",
      "bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-white/50 focus:bg-white/15":
        variant === "glass",
      "border-2 border-red-400 bg-white text-neutral-900 focus:border-red-500 focus:ring-2 focus:ring-red-100":
        error && variant === "default",
    },
    className
  );

  const labelClass = clsx(
    "block text-sm font-medium mb-1.5",
    variant === "glass" ? "text-white/90" : "text-neutral-700"
  );

  const iconClass = clsx(
    "absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none",
    variant === "glass" ? "text-white/50" : "text-neutral-400"
  );

  return (
    <div className="w-full">
      {label && (
        <label className={labelClass}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && <Icon size={18} className={iconClass} />}
        <input type={resolvedType} className={inputBase} {...props} />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={clsx(
              "absolute right-3 top-1/2 -translate-y-1/2 transition",
              variant === "glass"
                ? "text-white/50 hover:text-white/80"
                : "text-neutral-400 hover:text-neutral-600"
            )}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <p className={clsx("mt-1 text-xs", variant === "glass" ? "text-red-300" : "text-red-500")}>
          {error}
        </p>
      )}
      {hint && !error && (
        <p className={clsx("mt-1 text-xs", variant === "glass" ? "text-white/50" : "text-neutral-400")}>
          {hint}
        </p>
      )}
    </div>
  );
};

export default Input;
