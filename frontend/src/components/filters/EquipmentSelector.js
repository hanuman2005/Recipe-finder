import React, { useState } from "react";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import Badge from "../ui/Badge";

const EQUIPMENT_OPTIONS = [
  "Induction",
  "Gas",
  "Oven",
  "Microwave",
  "Slow-Cooker",
  "Pressure-Cooker",
  "Mixer",
  "Blender",
  "Food-Processor",
  "One-Pot",
  "Cast-Iron-Skillet",
];

export const EquipmentSelector = ({ value = [], onChange }) => {
  const [open, setOpen] = useState(false);

  const toggle = (equip) => {
    if (value.includes(equip)) {
      onChange(value.filter((e) => e !== equip));
    } else {
      onChange([...value, equip]);
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-semibold text-neutral-700 mb-2">
        Equipment <span className="text-red-500">*</span>
      </label>

      {/* Selected Equipment */}
      <div className="flex flex-wrap gap-2 mb-3 min-h-10">
        {value.map((equip) => (
          <Badge key={equip} variant="primary" size="md">
            {equip}
            <X
              size={14}
              className="ml-2 cursor-pointer hover:text-primary-900"
              onClick={() => toggle(equip)}
            />
          </Badge>
        ))}
      </div>

      {/* Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="input-field text-left flex justify-between items-center"
        >
          {value.length === 0
            ? "Select equipment..."
            : `${value.length} selected`}
          <span>{open ? "▲" : "▼"}</span>
        </button>

        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full mt-2 w-full bg-white border-2 border-primary-500 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto"
          >
            {EQUIPMENT_OPTIONS.map((equip) => (
              <button
                key={equip}
                type="button"
                onClick={() => toggle(equip)}
                className={`w-full text-left px-4 py-3 hover:bg-primary-50 ${
                  value.includes(equip)
                    ? "bg-primary-50 text-primary-700 font-semibold"
                    : ""
                }`}
              >
                ✓ {equip}
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {value.length === 0 && (
        <p className="text-xs text-red-500 mt-1">Equipment is required</p>
      )}
    </div>
  );
};

export default EquipmentSelector;
