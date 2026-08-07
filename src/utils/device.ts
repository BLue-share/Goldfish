/** タッチ端末かどうか（スマホ・タブレット向けの判定ゆとりに使う） */
export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || (navigator.maxTouchPoints ?? 0) > 0;
}
