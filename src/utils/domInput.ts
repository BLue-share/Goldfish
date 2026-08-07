export interface DomInputOptions {
  label: string;
  placeholder?: string;
  defaultValue?: string;
  maxLength?: number;
  submitLabel?: string;
}

let activeOverlay: HTMLDivElement | null = null;

export function showDomInput(options: DomInputOptions): Promise<string | null> {
  // 既に開いていれば閉じる（二重表示防止）
  if (activeOverlay) {
    activeOverlay.remove();
    activeOverlay = null;
  }

  const {
    label,
    placeholder = '',
    defaultValue = '',
    maxLength = 20,
    submitLabel = '決定',
  } = options;

  return new Promise((resolve) => {
    let closed = false;

    const overlay = document.createElement('div');
    activeOverlay = overlay;
    overlay.style.cssText = [
      'position:fixed',
      'inset:0',
      'background:rgba(0,0,0,0.55)',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'z-index:10000',
      'padding:16px',
    ].join(';');

    const panel = document.createElement('div');
    panel.style.cssText = [
      'background:#1a5a78',
      'border:2px solid #4a9ab0',
      'border-radius:12px',
      'padding:20px',
      'width:min(320px,100%)',
      'box-shadow:0 8px 24px rgba(0,0,0,0.35)',
      'font-family:Arial,sans-serif',
    ].join(';');

    const title = document.createElement('p');
    title.textContent = label;
    title.style.cssText = 'margin:0 0 12px;color:#ffe566;font-size:18px;font-weight:bold;text-align:center';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = defaultValue;
    input.placeholder = placeholder;
    input.maxLength = maxLength;
    input.autocomplete = 'off';
    input.enterKeyHint = 'done';
    input.style.cssText = [
      'width:100%',
      'box-sizing:border-box',
      'padding:10px 12px',
      'border:1px solid #4a9ab0',
      'border-radius:8px',
      'font-size:16px',
      'margin-bottom:12px',
      'background:#fff',
      'color:#222',
    ].join(';');

    const buttonRow = document.createElement('div');
    buttonRow.style.cssText = 'display:flex;gap:8px';

    const cancelBtn = createStyledButton('キャンセル', '#3a7a90');
    const submitBtn = createStyledButton(submitLabel, '#ff5533');

    const cleanup = (value: string | null) => {
      if (closed) return;
      closed = true;
      if (activeOverlay === overlay) {
        activeOverlay = null;
      }
      document.removeEventListener('keydown', onKeyDown, true);
      overlay.remove();
      resolve(value);
    };

    const doSubmit = () => {
      const trimmed = input.value.trim();
      if (!trimmed) {
        input.focus();
        return;
      }
      cleanup(trimmed);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        doSubmit();
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        cleanup(null);
      }
    };

    // 全イベントを overlay でキャプチャし Phaser に伝搬させない
    const blockForPhaser = (e: Event) => {
      e.stopPropagation();
    };
    for (const evt of ['pointerdown', 'pointerup', 'pointermove', 'touchstart', 'touchend', 'touchmove', 'mousedown', 'mouseup', 'click'] as const) {
      overlay.addEventListener(evt, blockForPhaser, true);
    }

    // ボタンのアクションを touchend / click で確実に拾う
    attachAction(submitBtn, doSubmit);
    attachAction(cancelBtn, () => cleanup(null));

    // オーバーレイ背景タップで閉じる
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) cleanup(null);
    });
    overlay.addEventListener('touchend', (e) => {
      if (e.target === overlay) cleanup(null);
    });

    // キーボード（キャプチャフェーズで Phaser より先に拾う）
    document.addEventListener('keydown', onKeyDown, true);

    buttonRow.append(cancelBtn, submitBtn);
    panel.append(title, input, buttonRow);
    overlay.append(panel);
    document.body.append(overlay);

    window.setTimeout(() => {
      if (!closed) {
        input.focus();
        input.select();
      }
    }, 80);
  });
}

function createStyledButton(text: string, background: string): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = text;
  btn.style.cssText = [
    'flex:1',
    'padding:12px 10px',
    'border:none',
    'border-radius:8px',
    `background:${background}`,
    'color:#fff',
    'font-size:15px',
    'font-weight:bold',
    'cursor:pointer',
    '-webkit-tap-highlight-color:transparent',
    '-webkit-appearance:none',
    'user-select:none',
  ].join(';');
  return btn;
}

function attachAction(button: HTMLButtonElement, action: () => void): void {
  let handled = false;

  // touchend が最も確実（モバイル）
  button.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!handled) {
      handled = true;
      action();
      window.setTimeout(() => { handled = false; }, 300);
    }
  }, { passive: false });

  // click はデスクトップのフォールバック
  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!handled) {
      handled = true;
      action();
      window.setTimeout(() => { handled = false; }, 300);
    }
  });
}
