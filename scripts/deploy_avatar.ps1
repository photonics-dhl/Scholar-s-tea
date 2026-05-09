# 中转脚本：通过 SSH 在服务器上构建并重启
$env:SSH_COMMAND = @'
cd "/data/home/zju321/321/DHL/Scholar's_Tea" && git add -A && git commit -m "avatar: V3 Kakao粗描边Q版风格" || true && PATH=/data/home/zju321/miniconda3/envs/ai_agent/bin:/usr/bin:/bin LD_PRELOAD=/data/home/zju321/miniconda3/envs/ai_agent/lib/libstdc++.so.6.0.34 npx next build 2>&1 && pm2 restart scholars-tea && echo "DEPLOY_OK"
'@

Write-Host "Connecting to server..."
ssh zju321@10.72.212.33 $env:SSH_COMMAND
