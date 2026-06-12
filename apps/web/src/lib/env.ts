export const env = {
  appSecret: required("APP_SECRET"),
  jwtSecret: required("JWT_SECRET"),
  dataDir: process.env.DATA_DIR || "/var/lib/xinxianpai-toolhub",
  logDir: process.env.LOG_DIR || "/var/log/xinxianpai-toolhub",
  storageDriver: process.env.STORAGE_DRIVER || "local",
  gipBasePath: process.env.GIP_BASE_PATH || "/tools/gip"
};

function required(name: string) {
  const value = process.env[name];
  if (!value || value.length < 32) throw new Error(`${name} must be set and at least 32 chars`);
  return value;
}
