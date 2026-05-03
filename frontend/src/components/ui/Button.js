import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import clsx from "clsx";

const variants = {
  primary: "bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500",
  secondary: "bg-secondary-500 text-white hover:bg-secondary-600 focus:ring-secondary-500",
  outline: "border-2 border-primary-500 text-primary-500 hover:bg-primary-50 focus:ring-primary-500",
  ghost: "text-primary-500 hover:bg-primary-50 focus:ring-primary-500",
  danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
  white: "bg-white text-primary-600 hover:bg-gray-100 focus:ring-white",
};

const sizes = {
  xs: "px-2.5 py-1 text-xs",
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3 text-base",
  xl: "px-8 py-4 text-lg",
};

const Spinner = () => (
  <motion.span
    animate={{ rotate: 360 }}
    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
    className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"
  />
);

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
  className = "",
  as,
  to,
  href,
  ...props
}) => {
  const base = clsx(
    "inline-flex items-center justify-center gap-2 font-semibold rounded-lg",
    "transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    variants[variant],
    sizes[size],
    fullWidth && "w-full",
    className
  );

  const content = (
    <>
      {loading && <Spinner />}
      {children}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={base} {...props}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={base} {...props}>
        {content}
      </a>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      disabled={disabled || loading}
      className={base}
      {...props}
    >
      {content}
    </motion.button>
  );
};

export default Button;
