# VPS Inventory

Generated: 2026-06-01T09:45:29+08:00
Host: iZ7xv3qsjomjs08n223lryZ
SSH: root@8.138.203.173
Workdir: /opt/xinxianpai-toolhub

## OS
NAME="Alibaba Cloud Linux"
VERSION="3 (OpenAnolis Edition)"
ID="alinux"
ID_LIKE="rhel fedora centos anolis"
VERSION_ID="3"
VARIANT="OpenAnolis Edition"
VARIANT_ID="openanolis"
ALINUX_MINOR_ID="2104"
ALINUX_UPDATE_ID="13"
PLATFORM_ID="platform:al8"
PRETTY_NAME="Alibaba Cloud Linux 3.2104 U13 (OpenAnolis Edition)"
ANSI_COLOR="0;31"
HOME_URL="https://www.aliyun.com/"

## Resources
              total        used        free      shared  buff/cache   available
Mem:          1.8Gi       418Mi        76Mi       1.0Mi       1.5Gi       1.4Gi
Swap:         1.0Gi       120Mi       904Mi
Filesystem     Type      Size  Used Avail Use% Mounted on
devtmpfs       devtmpfs  916M     0  916M   0% /dev
tmpfs          tmpfs     936M   92K  936M   1% /dev/shm
tmpfs          tmpfs     936M  532K  935M   1% /run
tmpfs          tmpfs     936M     0  936M   0% /sys/fs/cgroup
/dev/vda3      ext4       40G  8.6G   29G  23% /
/dev/vda2      vfat      200M  5.9M  194M   3% /boot/efi
tmpfs          tmpfs     188M     0  188M   0% /run/user/0

## CPU
2
Architecture:        x86_64
CPU op-mode(s):      32-bit, 64-bit
Byte Order:          Little Endian
CPU(s):              2
On-line CPU(s) list: 0,1
Thread(s) per core:  2
Core(s) per socket:  1
Socket(s):           1
NUMA node(s):        1
Vendor ID:           GenuineIntel
BIOS Vendor ID:      Alibaba Cloud
CPU family:          6
Model:               85
Model name:          Intel(R) Xeon(R) Platinum
BIOS Model name:     pc-i440fx-2.1
Stepping:            4
CPU MHz:             2500.002
BogoMIPS:            5000.00

## Tools
git: node: npm: pnpm: corepack: docker: /usr/bin/docker
podman: /usr/bin/podman
docker-compose: nginx: /usr/sbin/nginx
caddy: pm2: 
## Versions
podman version 4.9.4-rhel
podman version 4.9.4-rhel

## Ports
State  Recv-Q Send-Q Local Address:Port  Peer Address:PortProcess                                                                               
LISTEN 0      128          0.0.0.0:22         0.0.0.0:*    users:(("sshd",pid=1672,fd=3))                                                       
LISTEN 0      100          0.0.0.0:8888       0.0.0.0:*    users:(("BT-Panel",pid=1256,fd=3))                                                   
LISTEN 0      100        127.0.0.1:25         0.0.0.0:*    users:(("master",pid=1117,fd=13))                                                    
LISTEN 0      511          0.0.0.0:18081      0.0.0.0:*    users:(("node",pid=167784,fd=21))                                                    
LISTEN 0      511          0.0.0.0:80         0.0.0.0:*    users:(("nginx",pid=130287,fd=6),("nginx",pid=130286,fd=6),("nginx",pid=129503,fd=6))
LISTEN 0      128             [::]:22            [::]:*    users:(("sshd",pid=1672,fd=4))                                                       
LISTEN 0      100            [::1]:25            [::]:*    users:(("master",pid=1117,fd=14))                                                    
LISTEN 0      511             [::]:80            [::]:*    users:(("nginx",pid=130287,fd=7),("nginx",pid=130286,fd=7),("nginx",pid=129503,fd=7))

## Existing Freshpixxp
Exists: yes
Git remotes:
Git status:
not a git repo
Package scripts:
  "scripts": {
    "dev": "vite",
    "mock:api": "node scripts/mock-image-api.mjs",
    "build": "tsc -b && vite build",
    "deploy:cf": "npm run build && wrangler deploy",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "server:dev": "tsx server/index.ts",
    "start": "node dist-server/index.js",
    "build:server": "tsc -p tsconfig.server.json",
    "build:all": "npm run build && npm run build:server"
  },
Env files:
/opt/freshpixxp/app/.env.example

## Running Node
PID=167784 CWD=/opt/freshpixxp/app CMD=/opt/freshpixxp/node/bin/node dist-server/index.js 
PID=172064 CWD=/root CMD=bash -c set -euo pipefail
TS=$(date +%Y%m%d-%H%M%S)
mkdir -p /opt/xinxianpai-toolhub/docs /var/lib/xinxianpai-toolhub /var/log/xinxianpai-toolhub /var/backups/xinxianpai-toolhub/preflight
if [ -d /opt/freshpixxp/app ]; then tar -czf "/var/backups/xinxianpai-toolhub/preflight/freshpixxp-app-${TS}.tar.gz" -C /opt/freshpixxp app; fi
if [ -d /etc/nginx ]; then tar -czf "/var/backups/xinxianpai-toolhub/preflight/nginx-${TS}.tar.gz" -C /etc nginx; fi
{
  echo "# VPS Inventory"
  echo
  echo "Generated: $(date -Iseconds)"
  echo "Host: $(hostname)"
  echo "SSH: root@8.138.203.173"
  echo "Workdir: /opt/xinxianpai-toolhub"
  echo
  echo "## OS"
  cat /etc/os-release || true
  echo
  echo "## Resources"
  free -h
  df -hT
  echo
  echo "## CPU"
  nproc
  lscpu | sed -n "1,18p" || true
  echo
  echo "## Tools"
  for c in git node npm pnpm corepack docker podman docker-compose nginx caddy pm2; do printf "%s: " "$c"; command -v "$c" || true; done
  echo
  echo "## Versions"
  node -v 2>/dev/null || true
  npm -v 2>/dev/null || true
  pnpm -v 2>/dev/null || true
  docker --version 2>/dev/null || true
  podman --version 2>/dev/null || true
  echo
  echo "## Ports"
  ss -lntp || true
  echo
  echo "## Existing Freshpixxp"
  if [ -d /opt/freshpixxp/app ]; then
    echo "Exists: yes"
    echo "Git remotes:"
    git -C /opt/freshpixxp/app remote -v 2>/dev/null || true
    echo "Git status:"
    git -C /opt/freshpixxp/app status --short 2>/dev/null || echo "not a git repo"
    echo "Package scripts:"
    sed -n "/\"scripts\"/,/},/p" /opt/freshpixxp/app/package.json 2>/dev/null || true
    echo "Env files:"
    find /opt/freshpixxp/app -maxdepth 2 -name ".env*" -print 2>/dev/null || true
  else
    echo "Exists: no"
  fi
  echo
  echo "## Running Node"
  for p in $(pgrep -f node || true); do echo "PID=$p CWD=$(readlink /proc/$p/cwd 2>/dev/null || true) CMD=$(tr "\0" " " < /proc/$p/cmdline 2>/dev/null || true)"; done
  echo
  echo "## Backups"
  ls -lh /var/backups/xinxianpai-toolhub/preflight || true
} > /opt/xinxianpai-toolhub/docs/VPS_INVENTORY.md
chmod 700 /var/lib/xinxianpai-toolhub /var/log/xinxianpai-toolhub /var/backups/xinxianpai-toolhub
ls -lh /var/backups/xinxianpai-toolhub/preflight
sed -n "1,220p" /opt/xinxianpai-toolhub/docs/VPS_INVENTORY.md 
PID=172117 CWD= CMD=

## Backups
total 135M
-rw-r--r-- 1 root root 135M Jun  1 09:45 freshpixxp-app-20260601-094452.tar.gz
-rw-r--r-- 1 root root 6.2K Jun  1 09:45 nginx-20260601-094452.tar.gz
