'use client';

import { Instagram, Music2 } from 'lucide-react';

interface ConnectButtonProps {
  platform: 'instagram' | 'tiktok';
}

export default function ConnectButton({ platform }: ConnectButtonProps) {
  const handleConnect = () => {
    window.location.href = `/api/social/${platform}/auth`;
  };

  if (platform === 'instagram') {
    return (
      <button
        onClick={handleConnect}
        className="flex items-center gap-2.5 px-5 py-3 text-white text-sm font-semibold rounded-xl transition-all hover:opacity-90 active:scale-[0.98] bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737]"
        style={{ boxShadow: '0 4px 14px rgba(225, 48, 108, 0.25)' }}
      >
        <Instagram className="w-5 h-5" />
        Conectar Instagram
      </button>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="flex items-center gap-2.5 px-5 py-3 text-sm font-semibold rounded-xl transition-all hover:opacity-90 active:scale-[0.98] bg-text-primary text-bg-primary"
      style={{ boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)' }}
    >
      <Music2 className="w-5 h-5" />
      Conectar TikTok
    </button>
  );
}
