#!/bin/bash
# Expo dev server with automatic bundle pre-warming for Expo Go

export EXPO_PACKAGER_PROXY_URL="https://$REPLIT_EXPO_DEV_DOMAIN"
export EXPO_PUBLIC_DOMAIN="$REPLIT_DEV_DOMAIN"
export EXPO_PUBLIC_REPL_ID="$REPL_ID"
export REACT_NATIVE_PACKAGER_HOSTNAME="$REPLIT_DEV_DOMAIN"

METRO_PORT="${PORT:-21930}"

warm_bundles() {
  echo "[prewarm] Waiting for Metro to be ready..."
  until curl -sf "http://localhost:$METRO_PORT/" -H "expo-platform: ios" -H "Accept: application/json" > /dev/null 2>&1; do
    sleep 2
  done
  echo "[prewarm] Metro ready — reading bundle URLs from manifest..."

  IOS_BUNDLE=$(curl -sf "http://localhost:$METRO_PORT/" \
    -H "expo-platform: ios" \
    -H "Accept: application/json" \
    | node -e "let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{ try { const m=JSON.parse(d); const u=m.launchAsset&&m.launchAsset.url; if(u){ const p=new URL(u); console.log(p.pathname+p.search); } } catch(e){} })" 2>/dev/null)

  ANDROID_BUNDLE=$(curl -sf "http://localhost:$METRO_PORT/" \
    -H "expo-platform: android" \
    -H "Accept: application/json" \
    | node -e "let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{ try { const m=JSON.parse(d); const u=m.launchAsset&&m.launchAsset.url; if(u){ const p=new URL(u); console.log(p.pathname+p.search); } } catch(e){} })" 2>/dev/null)

  if [ -n "$IOS_BUNDLE" ]; then
    echo "[prewarm] Pre-compiling iOS bundle..."
    curl -sf "http://localhost:$METRO_PORT$IOS_BUNDLE" -o /dev/null && echo "[prewarm] ✓ iOS bundle ready"
  fi

  if [ -n "$ANDROID_BUNDLE" ]; then
    echo "[prewarm] Pre-compiling Android bundle..."
    curl -sf "http://localhost:$METRO_PORT$ANDROID_BUNDLE" -o /dev/null && echo "[prewarm] ✓ Android bundle ready"
  fi

  echo "[prewarm] ✅ Bundles warm — scan QR code with Expo Go!"
}

warm_bundles &

pnpm exec expo start --offline --port "$METRO_PORT"
