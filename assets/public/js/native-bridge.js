import { Capacitor, registerPlugin } from '@capacitor/core';
import { Keyboard, KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { App } from '@capacitor/app';

// Register only the native Dialog bridge. Avoid importing its browser fallback
// so this bundle never invokes a browser confirmation UI.
const NativeDialog = registerPlugin('Dialog');

export const isNative = () => Capacitor.isNativePlatform();

/**
 * Starts the native shell integrations once. Each call is individually guarded
 * so the same bundle remains fully usable in a standard browser preview.
 */
export async function initializeNativeShell() {
  const root = document.documentElement;
  root.classList.toggle('native-platform', isNative());
  if (!isNative()) return;

  try {
    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setBackgroundColor({ color: '#03040B' });
    await StatusBar.setStyle({ style: Style.Dark });
  } catch { /* Status bar is platform/version dependent. */ }

  try {
    await Keyboard.setResizeMode({ mode: KeyboardResize.Native });
    await Keyboard.setStyle({ style: KeyboardStyle.Dark });
  } catch { /* Android handles resize through the Activity soft-input mode. */ }

  try {
    Keyboard.addListener('keyboardWillShow', ({ keyboardHeight }) => {
      root.classList.add('keyboard-visible');
      root.style.setProperty('--keyboard-height', `${keyboardHeight || 0}px`);
    });
    Keyboard.addListener('keyboardWillHide', () => {
      root.classList.remove('keyboard-visible');
      root.style.removeProperty('--keyboard-height');
    });
  } catch { /* Browser/web fallback has no native keyboard events. */ }
}

export const tactile = {
  light() {
    if (isNative()) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
  },
  medium() {
    if (isNative()) Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
  },
  success() {
    if (isNative()) Haptics.notification({ type: NotificationType.Success }).catch(() => {});
  },
  warning() {
    if (isNative()) Haptics.notification({ type: NotificationType.Warning }).catch(() => {});
  }
};

/** Uses Capacitor's native Material dialog on Android. */
export async function confirmNative({ title, message, okButtonTitle = 'Confirm', cancelButtonTitle = 'Cancel' }) {
  if (!isNative()) return false;
  try {
    const result = await NativeDialog.confirm({ title, message, okButtonTitle, cancelButtonTitle });
    return Boolean(result.value);
  } catch {
    // The web preview deliberately declines instead of showing a browser dialog.
    return false;
  }
}

/**
 * Native Android back events are handled centrally by the app router. Returning
 * the listener handle makes the bridge safe to dispose during a hot reload.
 */
export async function registerNativeBackHandler(handler) {
  if (!isNative()) return null;
  try {
    return await App.addListener('backButton', handler);
  } catch {
    return null;
  }
}

export async function exitNativeApp() {
  if (!isNative()) return;
  try { await App.exitApp(); } catch { /* no-op outside Android */ }
}
