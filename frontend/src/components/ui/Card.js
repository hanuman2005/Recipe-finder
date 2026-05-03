import React from "react";
import { motion } from "framer-motion";
import clsx from "clsx";

export const Card = ({
  children,
  hover = false,
  padding = "md",
  className = "",
  onClick,
  ...props
}) => {
  const paddings = { none: "", sm: "p-4", md: "p-6", lg: "p-8" };

  return (
    <motion.div
      whileHover={hover ? { y: -4, boxShadow: "0 20px 40px rgba(0,0,0,0.12)" } : undefined}
      onClick={onClick}
      className={clsx(
        "bg-white rounded-xl shadow-md",
        hover && "cursor-pointer transition-shadow duration-300",
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default Card;
