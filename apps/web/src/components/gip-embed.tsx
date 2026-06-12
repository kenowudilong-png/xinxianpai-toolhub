"use client";

import { useMemo, useState } from "react";

export function GipEmbed() {
  const [nonce] = useState(0);
  const src = useMemo(() => `/tools/gip/app/index.html?embed=1&v=${nonce}`, [nonce]);
  return <iframe key={src} src={src} className="block h-[calc(100vh-4rem)] min-h-[760px] w-full border-0 bg-background" title="生图站" />;
}
