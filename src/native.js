// The Android app (Capacitor) around the same web game. On the web every
// export here is a no-op, so the browser build behaves as before.
import { Capacitor } from '@capacitor/core';
import { App as NativeApp } from '@capacitor/app';
import { Haptics } from '@capacitor/haptics';

export const isNative = Capacitor.isNativePlatform();

// Back button and backgrounding: the app pauses a level when it goes to the
// background, and Back walks out one step at a time (see App.back).
export function connectNative(app) {
  if (!isNative) return;
  NativeApp.addListener('backButton', () => app.back(() => NativeApp.exitApp()));
  NativeApp.addListener('pause', () => app.pause());
}

// A vibration through the native haptics engine; `pattern` is a duration in
// ms or [on, off, on, ...] like navigator.vibrate.
export function nativeVibrate(pattern) {
  const steps = [pattern].flat();
  let at = 0;
  steps.forEach((ms, i) => {
    if (i % 2 === 0) setTimeout(() => Haptics.vibrate({ duration: ms }).catch(() => {}), at);
    at += ms;
  });
}
