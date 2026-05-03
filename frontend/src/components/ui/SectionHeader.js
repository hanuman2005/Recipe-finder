import React from "react";
import { motion } from "framer-motion";
import clsx from "clsx";

export const SectionHeader = ({
  title,
  subtitle,
  emoji,
  align = "center",
  className = "",
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={clsx(
        "mb-12",
        align === "center" && "text-center",
        align === "left" && "text-left",
        className
      )}
    >
      <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-3">
        {emoji && <span className="mr-2">{emoji}</span>}
        {title}
      </h2>
      {subtitle && (
        <p className="text-neutral-500 text-lg max-w-2xl mx-auto">{subtitle}</p>
      )}
    </motion.div>
  );
};

export default SectionHeader;
