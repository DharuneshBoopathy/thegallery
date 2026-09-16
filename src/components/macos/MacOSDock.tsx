"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FinderAppIcon,
  PhotosAppIcon,
  GroupsAppIcon,
  UploadAppIcon,
  AdminAppIcon,
  KeychainAppIcon,
} from "./MacOSIcons";

interface DockItem {
  id: string;
  name: string;
  href: string;
  icon: React.ReactNode;
  requiresAdmin?: boolean;
}

interface DockProps {
  isAdmin?: boolean;
  onOpenApp?: (appId: string) => void;
}

export default function MacOSDock({ isAdmin, onOpenApp }: DockProps) {
  const pathname = usePathname();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const dockItems: DockItem[] = [
    {
      id: "photos",
      name: "All Memories",
      href: "/archive",
      icon: <PhotosAppIcon />,
    },
    {
      id: "circles",
      name: "Community Circles",
      href: "/groups",
      icon: <GroupsAppIcon />,
    },
    {
      id: "upload",
      name: "Deposit Media",
      href: "/upload",
      icon: <UploadAppIcon />,
    },
    {
      id: "keys",
      name: "Invite Portal",
      href: "/register",
      icon: <KeychainAppIcon />,
    },
    {
      id: "admin",
      name: "Mission Control",
      href: "/admin",
      icon: <AdminAppIcon />,
      requiresAdmin: true,
    },
  ];

  const visibleItems = dockItems.filter(
    (item) => !item.requiresAdmin || isAdmin
  );

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 select-none">
      <div className="flex items-end space-x-2 rounded-2xl liquid-glass-dock px-3 py-2 transition-all">
        {visibleItems.map((item, idx) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/archive" && pathname.startsWith(item.href));

          const distance = hoveredIndex !== null ? Math.abs(hoveredIndex - idx) : 3;
          const scaleClass =
            distance === 0
              ? "scale-120 -translate-y-2"
              : distance === 1
              ? "scale-110 -translate-y-1"
              : "scale-100";

          return (
            <div
              key={item.id}
              className="relative flex flex-col items-center group"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Tooltip Label */}
              <div className="pointer-events-none absolute -top-9 z-50 whitespace-nowrap rounded-lg border border-slate-200 bg-white/95 px-2.5 py-1 text-[11px] font-medium text-slate-800 shadow-md backdrop-blur-md opacity-0 transition-all duration-150 group-hover:opacity-100 group-hover:-top-10">
                {item.name}
              </div>

              {/* App Icon Button */}
              <Link
                href={item.href}
                onClick={() => onOpenApp && onOpenApp(item.id)}
                className={`relative flex items-center justify-center transition-all duration-150 transform ${scaleClass}`}
              >
                {item.icon}
              </Link>

              {/* Running App Dot Indicator */}
              <div className="mt-1 h-1 w-1 rounded-full bg-slate-800 transition-opacity">
                {isActive ? (
                  <div className="h-1 w-1 rounded-full bg-slate-900 shadow-xs" />
                ) : (
                  <div className="h-1 w-1 opacity-0" />
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
