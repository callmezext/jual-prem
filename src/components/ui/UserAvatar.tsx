"use client";

import { useState } from "react";
import { User } from "lucide-react";

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

export default function UserAvatar({
  src,
  name,
  size = "sm",
  className = "",
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);

  // Ukuran dimensi
  const sizeMap = {
    xs: { box: "w-5 h-5 text-[10px]", icon: "w-3 h-3" },
    sm: { box: "w-6 h-6 text-xs", icon: "w-3.5 h-3.5" },
    md: { box: "w-8 h-8 text-sm", icon: "w-4 h-4" },
    lg: { box: "w-10 h-10 text-base", icon: "w-5 h-5" },
  };

  const currentSize = sizeMap[size] || sizeMap.sm;

  // Ambil huruf depan nama atau email
  const initial = name?.trim() ? name.trim().charAt(0).toUpperCase() : "";

  // Jika URL gambar tersedia dan tidak mengalami error loading
  if (src && !imageError) {
    return (
      <img
        src={src}
        alt={name || "Avatar Pengguna"}
        referrerPolicy="no-referrer"
        onError={() => setImageError(true)}
        className={`${currentSize.box} rounded-full object-cover border border-[#27272a] shrink-0 ${className}`}
      />
    );
  }

  // Fallback: Tampilan inisial bergaya Emerald Gradient Neon
  return (
    <div
      className={`${currentSize.box} rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold flex items-center justify-center shrink-0 border border-emerald-400/40 shadow-sm ${className}`}
      title={name || "Pengguna"}
      aria-label={name || "Pengguna"}
    >
      {initial ? (
        <span>{initial}</span>
      ) : (
        <User className={`${currentSize.icon} text-white`} />
      )}
    </div>
  );
}
