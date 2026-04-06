import React from "react";

/**
 * EquipmentBadge Component
 *
 * Displays a single equipment type with icon and tooltip
 * Part of Power Feature #3: Equipment Filter
 *
 * @param {string} equipment - Equipment type name (e.g., "Stovetop", "Microwave")
 * @param {string} [size="md"] - Badge size: "sm", "md", "lg"
 *
 * Example Usage:
 * <EquipmentBadge equipment="Induction" size="md" />
 * <EquipmentBadge equipment="Microwave" size="sm" />
 */
const EquipmentBadge = ({ equipment, size = "md" }) => {
  // ========== EQUIPMENT ICONS MAPPING ==========
  // Maps equipment types to emoji icons for visual recognition
  const equipmentIcons = {
    Stovetop: "🔥",
    Oven: "🍳",
    Microwave: "📡",
    Induction: "⚡",
    "Rice Cooker": "🍚",
    "Pressure Cooker": "💨",
    "Air Fryer": "💨",
    Blender: "🌀",
    "Food Processor": "🔪",
    "One-Pot": "🍲",
    "No-Cook": "🥗",
  };

  // ========== SIZE CONFIGURATION ==========
  // Determines badge styling based on size prop
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  // Get the icon for this equipment type (default to ⚙️ if not found)
  const icon = equipmentIcons[equipment] || "⚙️";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold bg-yellow-100 text-yellow-800 ${sizeClasses[size]}`}
      title={`Equipment: ${equipment}`}
      style={{
        backgroundColor: "#fef3c7",
        color: "#92400e",
        borderRadius: "9999px",
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
      }}
    >
      <span>{icon}</span>
      <span>{equipment.substring(0, 12)}</span>
    </span>
  );
};

export default EquipmentBadge;
