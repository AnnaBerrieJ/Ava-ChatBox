"use client";

// components/AvatarViewer.tsx
// Dynamic wrapper — prevents Three.js from running on the server (SSR)

import dynamic from "next/dynamic";

const AvatarScene = dynamic(() => import("./AvatarScene"), {
  ssr: false,
  loading: () => (
    <div style={{
      width: "100%", height: "100%",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "rgba(255,255,255,0.5)", fontSize: 13,
    }}>
      Loading Ava...
    </div>
  ),
});

export default AvatarScene;
