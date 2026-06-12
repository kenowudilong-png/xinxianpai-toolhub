"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type ToolCard = { id: string; name: string; icon: string; description: string };

export function AppSettingsCards({ tools, mode = "dialog" }: { tools: ToolCard[]; mode?: "dialog" | "links" }) {
  const [activeTool, setActiveTool] = useState<ToolCard | null>(null);
  const settingsSrc = useMemo(() => activeTool?.id === "gip" ? "/tools/gip/app/admin?settings=1&embed=settings" : "", [activeTool]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "xinp-close-app-settings") setActiveTool(null);
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tools.map((tool) => {
          const enabled = tool.id === "gip";
          return (
            <Card key={tool.id}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{tool.icon}</div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold">{tool.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{tool.description || "配置该应用的全局设置"}</p>
                  </div>
                </div>
                <div className="mt-5">
                  {mode === "links" && enabled ? (
                    <Button asChild>
                      <a href={`/admin/app-settings/${tool.id}`}>打开设置</a>
                    </Button>
                  ) : (
                    <Button type="button" disabled={!enabled} variant={enabled ? "default" : "outline"} onClick={() => enabled && setActiveTool(tool)}>
                      {enabled ? "打开设置" : "暂未接入设置"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {mode === "dialog" && <Dialog open={Boolean(activeTool)} onOpenChange={(open) => !open && setActiveTool(null)}>
        <DialogContent className="fixed left-1/2 top-1/2 z-50 flex h-[88vh] w-[min(1120px,94vw)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border bg-background p-0 shadow-2xl">
          <button
            type="button"
            className="absolute right-3 top-3 z-10 rounded-full border bg-background/90 px-3 py-1 text-sm shadow-sm hover:bg-accent"
            onClick={() => setActiveTool(null)}
            aria-label="关闭设置"
          >
            关闭
          </button>
          <DialogHeader className="sr-only">
            <DialogTitle>{activeTool?.name || "应用"}设置</DialogTitle>
          </DialogHeader>
          {settingsSrc ? <iframe className="h-full w-full rounded-2xl border-0 bg-background" src={settingsSrc} title={`${activeTool?.name || "应用"}设置`} /> : null}
        </DialogContent>
      </Dialog>}
    </>
  );
}
