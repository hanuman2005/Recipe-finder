import React from "react";
import { useFilterStore } from "../../store/filterStore";
import { motion } from "framer-motion";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

const EQUIPMENT_OPTIONS = [
  { name: "Induction", icon: "⚡" },
  { name: "Gas", icon: "🔥" },
  { name: "Oven", icon: "🍳" },
  { name: "Microwave", icon: "📡" },
  { name: "Slow-Cooker", icon: "⏲️" },
  { name: "Pressure-Cooker", icon: "💨" },
  { name: "Mixer", icon: "⚙️" },
  { name: "Blender", icon: "🌀" },
  { name: "Food-Processor", icon: "🔪" },
  { name: "One-Pot", icon: "🍲" },
  { name: "Cast-Iron-Skillet", icon: "🍳" },
];

export const EquipmentFilter = () => {
  const { selectedEquipment, toggleEquipment, clearFilters } = useFilterStore();

  return (
    <div className="bg-white rounded-lg p-6 shadow-md">
      <h3 className="text-lg font-bold text-neutral-900 mb-4">Equipment</h3>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        {EQUIPMENT_OPTIONS.map((equip) => (
          <motion.button
            key={equip.name}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleEquipment(equip.name)}
            className={`p-3 rounded-lg border-2 transition-all ${
              selectedEquipment.includes(equip.name)
                ? "border-primary-500 bg-primary-50"
                : "border-neutral-200 bg-white hover:border-primary-500"
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <span className="text-2xl">{equip.icon}</span>
              <span className="text-xs font-medium text-center">
                {equip.name}
              </span>
            </div>
          </motion.button>
        ))}
      </div>

      {selectedEquipment.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-sm text-neutral-600 mb-3">
            <strong>{selectedEquipment.length}</strong> equipment selected
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="w-full"
          >
            Clear Filters
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default EquipmentFilter;
