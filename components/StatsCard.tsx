"use client";

import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  description?: string;
}

export default function StatsCard({ title, value, icon: Icon, color, description }: StatsCardProps) {
  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-lg hover:scale-105 transition duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-white">{value}</h3>
          {description && <p className="text-xs text-gray-500 mt-2">{description}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="text-white" size={24} />
        </div>
      </div>
    </div>
  );
}
