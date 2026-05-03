import React from "react";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from "lucide-react";
import clsx from "clsx";

const config = {
  error: { Icon: AlertCircle, container: "bg-red-50 border-red-200 text-red-800", iconColor: "text-red-500" },
  success: { Icon: CheckCircle, container: "bg-green-50 border-green-200 text-green-800", iconColor: "text-green-500" },
  warning: { Icon: AlertTriangle, container: "bg-yellow-50 border-yellow-200 text-yellow-800", iconColor: "text-yellow-500" },
  info: { Icon: Info, container: "bg-blue-50 border-blue-200 text-blue-800", iconColor: "text-blue-500" },
  glass: { Icon: AlertCircle, container: "bg-red-500/20 border-red-500/50 text-red-100", iconColor: "text-red-300" },
};

export const Alert = ({ type = "error", message, onDismiss, className = "" }) => {
  if (!message) return null;
  const { Icon, container, iconColor } = config[type] ?? config.error;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={clsx("flex items-start gap-3 p-4 rounded-lg border", container, className)}
    >
      <Icon size={18} className={clsx("flex-shrink-0 mt-0.5", iconColor)} />
      <p className="text-sm flex-1">{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="flex-shrink-0 opacity-60 hover:opacity-100 transition">
          <X size={16} />
        </button>
      )}
    </motion.div>
  );
};

export default Alert;
