import React from "react";
import clsx from "clsx";

export const Badge = ({ children, variant = "primary", size = "md" }) => {
  const variants = {
    primary: "bg-primary-100 text-primary-700",
    secondary: "bg-secondary-100 text-secondary-700",
    success: "bg-green-100 text-green-700",
    danger: "bg-red-100 text-red-700",
  };

  const sizes = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-2 text-base",
  };

  return (
    <span
      className={clsx(
        "font-semibold rounded-full inline-block",
        variants[variant],
        sizes[size],
      )}
    >
      {children}
    </span>
  );
};

export default Badge;
