#!/bin/bash
# frpc-daemon.sh — Sakura Frp 持久化守护脚本
# 功能：代理可用时保持 frpc 运行，代理不可用时静默等待，frpc 崩溃后自动重启
# 部署：nohup ./frpc-daemon.sh > /tmp/frpc-daemon.log 2>&1 &
# 配合 monitor-frpc.sh 使用：monitor 负责检查僵死/高频断线，daemon 负责保活

set -u

TOKEN="86ds8pwv6hkq9galgi6hzpj1zhyvql47"
TUNNELS="27144107,27144120"
FRPC_DIR="/data/home/zju321/sakura-frp"
PROXY="socks5://127.0.0.1:7890"
DAEMON_LOG="/tmp/frpc-daemon.log"
FRPC_LOG="/tmp/frpc-run.log"
PID_FILE="/tmp/frpc-daemon.pid"

# 退避参数
RESTART_DELAY_MIN=5
RESTART_DELAY_MAX=300
restart_delay=$RESTART_DELAY_MIN

# 连续代理检测失败次数
proxy_fail_count=0
PROXY_FAIL_THRESHOLD=10

write_log() {
    local level="$1"
    local msg="$2"
    local now
    now=$(date '+%Y-%m-%d %H:%M:%S')
    echo "$now [$level] $msg" >> "$DAEMON_LOG"
}

check_proxy() {
    curl -s --socks5 127.0.0.1:7890 --connect-timeout 3 \
        -H 'User-Agent: FrpcDaemon/1.0' \
        http://www.baidu.com/ >/dev/null 2>&1
}

start_frpc() {
    cd "$FRPC_DIR" || return 1
    # 清理旧日志（保留最近5个）
    if [ -f "$FRPC_LOG" ]; then
        local size
        size=$(stat -c%s "$FRPC_LOG" 2>/dev/null || echo 0)
        if [ "$size" -gt 10485760 ]; then  # 10MB
            mv "$FRPC_LOG" "$FRPC_LOG.$(date +%s)"
            ls -t "$FRPC_LOG".* 2>/dev/null | tail -n +6 | xargs -r rm -f
        fi
    fi

    nohup ./frpc -f "${TOKEN}:${TUNNELS}" --proxy "$PROXY" >> "$FRPC_LOG" 2>&1 &
    local pid=$!
    sleep 3
    if pgrep -P "$pid" >/dev/null 2>&1 || pgrep -f "frpc -f ${TOKEN}:${TUNNELS}" >/dev/null 2>&1; then
        write_log "INFO" "frpc started, pid=$pid"
        restart_delay=$RESTART_DELAY_MIN
        return 0
    else
        write_log "ERROR" "frpc start failed"
        return 1
    fi
}

kill_frpc() {
    pkill -9 -f "frpc -f" 2>/dev/null || true
    pkill -9 -f "frpc -c" 2>/dev/null || true
    sleep 1
}

# 主循环
echo $$ > "$PID_FILE"
write_log "INFO" "frpc-daemon started, pid=$$"

while true; do
    # 1. 检查代理可用性
    if ! check_proxy; then
        proxy_fail_count=$((proxy_fail_count + 1))
        write_log "WARN" "proxy check failed ($proxy_fail_count/$PROXY_FAIL_THRESHOLD)"

        # 如果 frpc 还在运行但代理不可用，杀掉 frpc 避免它疯狂重试
        if pgrep -f "frpc -f ${TOKEN}:${TUNNELS}" >/dev/null 2>&1; then
            write_log "INFO" "killing frpc due to proxy unavailable"
            kill_frpc
        fi

        # 连续失败达到阈值，延长等待
        if [ "$proxy_fail_count" -ge "$PROXY_FAIL_THRESHOLD" ]; then
            write_log "WARN" "proxy unavailable for extended period, sleeping 60s"
            sleep 60
        else
            sleep 10
        fi
        continue
    fi

    # 代理恢复
    if [ "$proxy_fail_count" -gt 0 ]; then
        write_log "INFO" "proxy restored after $proxy_fail_count failures"
        proxy_fail_count=0
    fi

    # 2. 检查 frpc 是否运行
    if pgrep -f "frpc -f ${TOKEN}:${TUNNELS}" >/dev/null 2>&1; then
        # frpc 正常运行，重置退避
        restart_delay=$RESTART_DELAY_MIN
        sleep 30
        continue
    fi

    # 3. frpc 未运行，尝试启动
    write_log "INFO" "frpc not running, attempting restart (delay=${restart_delay}s)"
    sleep "$restart_delay"

    if start_frpc; then
        # 启动成功，但先观察一下是否稳定
        sleep 10
        if ! pgrep -f "frpc -f ${TOKEN}:${TUNNELS}" >/dev/null 2>&1; then
            write_log "WARN" "frpc exited immediately after start"
            # 增加退避
            restart_delay=$((restart_delay * 2))
            if [ "$restart_delay" -gt "$RESTART_DELAY_MAX" ]; then
                restart_delay=$RESTART_DELAY_MAX
            fi
        fi
    else
        # 启动失败，增加退避
        restart_delay=$((restart_delay * 2))
        if [ "$restart_delay" -gt "$RESTART_DELAY_MAX" ]; then
            restart_delay=$RESTART_DELAY_MAX
        fi
    fi
done
