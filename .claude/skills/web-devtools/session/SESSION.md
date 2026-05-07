# Browser Use Session Management Guide

## Session Architecture

Browser Use CLI employs a multi-session daemon architecture:

1. **First command** - Launches a background daemon for that session (browser stays open)
2. **Subsequent commands** - Communicate via Unix Socket (macOS/Linux) or TCP (Windows)
3. **Browser persistence** - Keeps browser open across commands (~50ms latency)
4. **Multi-session support** - Each `--session` has independent daemon, socket, and PID file
5. **Auto management** - Auto-starts when needed, auto-exits on browser death, or manual `browser-use close`

## Listing Active Sessions

View all current browser sessions:

```bash
browser-use sessions
```

**Output example:**
```
SESSION   STATUS    BROWSER      URL
default   active    chromium     https://example.com
work      active    chrome       https://github.com
cloud     active    cloud        https://example.com
```

## Closing Sessions

### Close Current Session

```bash
browser-use close
```

### Close All Sessions

```bash
browser-use close --all
```

### Close Specific Session

```bash
browser-use --session work close
```

## Multi-Session Management

### Default Session

Without `--session`, uses default session `default`:

```bash
browser-use open https://example.com
browser-use state
```

### Named Sessions

Use `--session` to create multiple independent sessions:

```bash
browser-use --session work open https://github.com
browser-use --session work state
browser-use --session personal open https://gmail.com
browser-use --session personal state
browser-use --session cloud cloud connect
```

### Environment Variable Configuration

Set default session via environment variable:

```bash
export BROWSER_USE_SESSION=work
browser-use state
```

## File Layout

All CLI-managed files in `~/.browser-use/` (overrideable via `BROWSER_USE_HOME`):

```
~/.browser-use/
├── config.json          # API key, settings (shared with profile-use)
├── bin/
│   └── profile-use      # Managed Go binary (auto-downloaded)
├── tunnels/
│   ├── {port}.json      # Tunnel metadata
│   └── {port}.log       # Tunnel logs
├── default.sock         # Daemon socket (temporary)
├── default.pid          # Daemon PID (temporary)
├── work.sock            # Named session socket
├── work.pid             # Named session PID
└── cli.log              # Daemon logs
```

## Troubleshooting

### Issue 1: No Active Session

**Symptoms:**
```
Error: No active session
```

**Causes:**
- Daemon not running
- Session expired
- Browser crashed

**Solutions:**
```bash
browser-use sessions
browser-use open https://example.com
browser-use close --all
browser-use open https://example.com
```

### Issue 2: Failed to Start Daemon

**Symptoms:**
```
Failed to start daemon
```

**Causes:**
- Zombie processes consuming resources
- Port conflicts
- Permission issues

**Solutions:**

**macOS/Linux:**
```bash
ps aux | grep browser-use
kill -9 <pid>
rm ~/.browser-use/*.pid
rm ~/.browser-use/*.sock
```

**Windows:**
```powershell
wmic process where "name='python.exe' and commandline like '%browser%use%'" get processid
taskkill /PID <pid> /F
Remove-Item -Recurse -Force "$env:USERPROFILE\.browser-use-env"
```

### Issue 3: Session Conflicts

**Symptoms:**
Multiple commands operating on same session causing conflicts.

**Solutions:**
```bash
browser-use --session task1 open https://site1.com
browser-use --session task2 open https://site2.com
browser-use --session task1 state
browser-use --session task2 state
```

## Typical Workflows

### Scenario 1: Parallel Tasks

```bash
browser-use --session monitor open https://status.example.com
browser-use --session automation open https://app.example.com
browser-use --session monitor screenshot screenshots/web/status.png
browser-use --session automation click 5
```

### Scenario 2: Switching Sessions

```bash
browser-use sessions
browser-use --session work state
browser-use state
```

### Scenario 3: Cleaning Up Sessions

```bash
browser-use --session old-task close
browser-use close --all
```

## Command Quick Reference

| Command | Action |
|---------|--------|
| `browser-use sessions` | List active sessions |
| `browser-use close` | Close current session |
| `browser-use close --all` | Close all sessions |
| `browser-use --session NAME` | Specify session for operation |
