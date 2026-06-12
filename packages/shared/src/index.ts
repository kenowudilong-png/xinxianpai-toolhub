export type UserRole = "admin" | "user";

export type ToolDefinition = {
  id: string;
  name: string;
  path: string;
  enabled: boolean;
  embedded: boolean;
  description: string;
};

export const GIP_TOOL_ID = "gip";

export const defaultTools: ToolDefinition[] = [
  {
    id: GIP_TOOL_ID,
    name: "GIP-Team 生图站",
    path: "/tools/gip",
    enabled: true,
    embedded: true,
    description: "统一密钥代理与用户隔离的团队生图工具"
  }
];

export function userToolDataPath(dataDir: string, userId: string, toolId: string) {
  return `${dataDir}/users/${userId}/${toolId}.sqlite`;
}

export function userToolFilePrefix(toolId: string, userId: string) {
  return `tools/${toolId}/users/${userId}`;
}
