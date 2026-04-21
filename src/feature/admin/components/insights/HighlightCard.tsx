import React from "react";
import type { LucideIcon } from "lucide-react";

interface HighlightCardProps {
  title: string;
  value: string | number | React.ReactNode;
  subtitle?: string;
  icon: LucideIcon;
  colorScheme: "yellow" | "blue" | "red" | "green" | "purple" | "indigo";
}

export const HighlightCard: React.FC<HighlightCardProps> = ({ title, value, subtitle, icon: Icon, colorScheme }) => {
  const colorMap = {
    yellow: "from-amber-100 to-yellow-50 text-amber-700 border-amber-200",
    blue: "from-blue-100 to-blue-50 text-blue-700 border-blue-200",
    red: "from-rose-100 to-rose-50 text-rose-700 border-rose-200",
    green: "from-emerald-100 to-green-50 text-emerald-700 border-emerald-200",
    purple: "from-purple-100 to-purple-50 text-purple-700 border-purple-200",
    indigo: "from-indigo-100 to-indigo-50 text-indigo-700 border-indigo-200",
  };

  const bgGradient = colorMap[colorScheme];

  return (
    <div className={`flex h-full min-h-[150px] flex-col rounded-[1.5rem] border ${bgGradient} bg-gradient-to-br p-4 shadow-sm transition-shadow hover:shadow-md lg:p-5`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="font-semibold text-sm opacity-90">{title}</h3>
        <div className="p-2 bg-white rounded-lg bg-opacity-60 shadow-sm border border-white/50">
          <Icon size={18} />
        </div>
      </div>
      <div className="mt-auto min-w-0">
        <p className="text-lg font-bold leading-tight break-words md:text-xl">{value}</p>
        {subtitle && <p className="mt-2 text-xs leading-relaxed opacity-80 break-words">{subtitle}</p>}
      </div>
    </div>
  );
};
