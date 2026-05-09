#!/bin/bash
cd "/data/home/zju321/321/DHL/Scholar's_Tea/public/hermes"
for f in idle.png happy.png thinking.png sleepy.png; do
  echo -n "$f: "
  file "$f"
done

echo "---"
cd "/data/home/zju321/321/DHL/Scholar's_Tea/public/stickers"
for f in *.png; do
  echo -n "$f: "
  file "$f"
done
