"use client";

import { Users, Clipboard, Wallet, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap = {
  users: Users,
  clipboard: Clipboard,
  wallet: Wallet,
  invoice: FileText,
};

interface StatCardProps {
  title: string;
  value: string;
  icon: keyof typeof iconMap;
}

export function StatCard({ title, value, icon }: StatCardProps) {
  const Icon = iconMap[icon];

  return (
    <div className="group relative overflow-hidden rounded-3xl border-2 border-[#14b4a1]/30 bg-gradient-to-br from-card via-card/95 to-[#14b4a1]/10 p-5 sm:p-6 shadow-xl hover:shadow-2xl hover:shadow-[#14b4a1]/30 transition-all duration-500 hover:scale-[1.03] hover:border-[#14b4a1]/60">
      {/* Animated background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#14b4a1]/0 via-[#14b4a1]/0 to-[#14b4a1]/0 group-hover:from-[#14b4a1]/10 group-hover:via-[#14b4a1]/15 group-hover:to-[#14b4a1]/10 transition-all duration-700" />
      
      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      <div className="relative flex items-start justify-between gap-4 z-10">
        <div className="space-y-2 sm:space-y-3 min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-muted-foreground/80 truncate font-semibold uppercase tracking-wide">{title}</p>
          <p className="text-3xl sm:text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-[#14b4a1] via-[#14b4a1] to-[#0f9d8a] bg-clip-text text-transparent drop-shadow-lg">
            {value}
          </p>
        </div>
        <div className="flex size-14 sm:size-16 md:size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#14b4a1]/25 via-[#14b4a1]/15 to-[#14b4a1]/25 border-2 border-[#14b4a1]/40 shrink-0 group-hover:scale-110 group-hover:rotate-6 group-hover:border-[#14b4a1]/60 transition-all duration-500 shadow-lg shadow-[#14b4a1]/20 group-hover:shadow-xl group-hover:shadow-[#14b4a1]/40">
          <Icon className="size-7 sm:size-8 md:size-10 text-[#14b4a1] group-hover:text-[#0f9d8a] transition-colors duration-300 drop-shadow-md" />
        </div>
      </div>
      
      {/* Decorative corner elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#14b4a1]/8 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-[#14b4a1]/15 group-hover:scale-150 transition-all duration-700" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#13282b]/20 rounded-full blur-2xl -ml-12 -mb-12 group-hover:bg-[#13282b]/30 transition-all duration-700" />
      
      {/* Animated border glow */}
      <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 rounded-3xl border-2 border-[#14b4a1]/40 animate-pulse" />
      </div>
    </div>
  );
}

