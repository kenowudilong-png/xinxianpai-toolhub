# Mac Mini Operations

This Mac mini hosts the Xinxianpai Toolhub self-hosted GitHub runner and local staging foundation.

## Runner Path

```text
/Users/Shared/xinxianpai/github-runner/toolhub-runner
```

## Runner Status

Check status:

```bash
cd /Users/Shared/xinxianpai/github-runner/toolhub-runner
./svc.sh status
```

Service commands are available from the same directory:

```bash
./svc.sh status
./svc.sh start
./svc.sh stop
```

Only run start or stop when intentionally operating the runner. Do not start or stop Toolhub app services as part of infrastructure dry-runs.

## No-Sleep Settings

Current inspected settings before attempted change:

```text
standby              0
Sleep On Power Button 1
autorestart          0
powernap             1
networkoversleep     0
disksleep            10
sleep                0 (sleep prevented by coreaudiod, UURemote, powerd)
ttyskeepawake        1
displaysleep         10 (display sleep prevented by UURemoteServer)
tcpkeepalive         1
lowpowermode         0
womp                 1
```

The attempted safe command could not run in this non-interactive session because sudo required a password.

Manual command for the human operator:

```bash
sudo pmset -a sleep 0 displaysleep 0 disksleep 0 womp 1
```

Current inspected settings after the blocked sudo attempt:

```text
standby              0
Sleep On Power Button 1
autorestart          0
powernap             1
networkoversleep     0
disksleep            10
sleep                0 (sleep prevented by coreaudiod, UURemote, powerd)
ttyskeepawake        1
displaysleep         10 (display sleep prevented by UURemoteServer)
tcpkeepalive         1
lowpowermode         0
womp                 1
```

## Staging Paths

```text
/Users/mima0000/Documents/xinxianpai/staging
/Users/mima0000/Documents/xinxianpai/staging/toolhub
/Users/mima0000/Documents/xinxianpai/staging/data
/Users/mima0000/Documents/xinxianpai/staging/logs
/Users/mima0000/Documents/xinxianpai/staging/runtime
/Users/mima0000/Documents/xinxianpai/staging/env
```

## Backup Paths

```text
/Users/mima0000/Documents/xinxianpai/backups
/Users/mima0000/Documents/xinxianpai/backups/staging
/Users/mima0000/Documents/xinxianpai/backups/prod
/Users/mima0000/Documents/xinxianpai/backups/releases
```

## If The Runner Goes Offline

Check local power and network first, then inspect the runner:

```bash
cd /Users/Shared/xinxianpai/github-runner/toolhub-runner
./svc.sh status
```

If the service is stopped and it is safe to restore CI capacity:

```bash
./svc.sh start
```

If GitHub still reports the runner offline, review the runner logs from the runner directory and confirm the Mac mini is awake, online, and signed in to the expected GitHub repository.
