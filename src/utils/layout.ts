/** ビューポート実寸（visualViewport 優先） */
export function getViewportSize(): { w: number; h: number } {
  const vv = window.visualViewport;
  return {
    w: Math.max(1, vv?.width ?? window.innerWidth),
    h: Math.max(1, vv?.height ?? window.innerHeight),
  };
}

/**
 * 端末画面のアスペクト比に合わせた論理解像度。
 * FIT でもレターボックスが出ない（画面いっぱいに表示される）。
 */
export function getGameSize(): { width: number; height: number } {
  const { w, h } = getViewportSize();
  const aspect = w / h;

  if (h >= w) {
    // 縦長: 幅を基準に高さを合わせる
    const width = 540;
    const height = Math.round(width / aspect);
    return { width, height: Math.max(640, height) };
  }

  // 横長: 高さを基準に幅を合わせる
  const height = 600;
  const width = Math.round(height * aspect);
  return { width: Math.max(800, width), height };
}

export function isPortraitLayout(width: number, height: number): boolean {
  return height > width;
}
