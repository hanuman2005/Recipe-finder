import React from "react";
import { motion } from "framer-motion";
import Button from "./Button";

export const EmptyState = ({
  icon: Icon,
  emoji,
  title,
  description,
  action,
  actionLabel,
  actionTo,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      {emoji && <div className="text-5xl mb-4">{emoji}</div>}
      {Icon && (
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
          <Icon size={32} className="text-neutral-400" />
        </div>
      )}
      {title && <h3 className="text-xl font-bold text-neutral-900 mb-2">{title}</h3>}
      {description && <p className="text-neutral-500 max-w-sm mb-6">{description}</p>}
      {actionTo && actionLabel && (
        <Button to={actionTo} size="md">
          {actionLabel}
        </Button>
      )}
      {action && actionLabel && !actionTo && (
        <Button onClick={action} size="md">
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
};

export default EmptyState;
