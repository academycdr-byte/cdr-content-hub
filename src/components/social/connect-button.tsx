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
        className="btn-accent flex items-center gap-2.5 px-5 py-3"
      >
        <Instagram className="w-5 h-5" />
        Conectar Instagram
      </button>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="btn-ghost flex items-center gap-2.5 px-5 py-3 font-semibold"
    >
      <Music2 className="w-5 h-5" />
      Conectar TikTok
    </button>
  );
}
