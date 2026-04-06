import React from "react";
import { motion } from "framer-motion";

export const LoadingSkeleton = ({ count = 1, type = "card" }) => {
  const skeleton = (
    <motion.div
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2, repeat: Infinity }}
      className={
        type === "card"
          ? "bg-gray-300 rounded-xl h-64"
          : "bg-gray-300 h-8 rounded"
      }
    />
  );

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{skeleton}</div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;
