import type Phaser from 'phaser';

export interface DomInputOptions {
  label: string;
  placeholder?: string;
  defaultValue?: string;
  maxLength?: number;
  submitLabel?: string;
  /** 開いている間 Phaser の入力を止める用（任意） */
  game?: Phaser.Game;
}

/** 名前入力ダイアログ表示中か（キーボード表示によるリサイズ抑止用） */
let domInputOpen = false;

export function isDomInputOpen(): boolean {
  return domInputOpen || Boolean(document.querySelector('[data-dom-input]'));
}

/**
 * モバイルでも安定して動く名前入力ダイアログ。
 */
export function showDomInput(options: DomInputOptions): Promise<string | null> {
  document.querySelectorAll('[data-dom-input]').forEach((el) => el.remove());
  domInputOpen = true;

  const {
    label,
    placeholder = '',
    defaultValue = '',
    maxLength = 20,
    submitLabel = '決定',
    game,
  } = options;

  return new Promise((resolve) => {
    let closed = false;
    const prevEnabled = game?.input?.enabled ?? true;
    if (game?.input) {
      game.input.enabled = false;
    }

    const overlay = document.createElement('div');
    overlay.setAttribute('data-dom-input', '1');
    overlay.style.cssText = [
      'position:fixed',
      'inset:0',
      'background:rgba(0,0,0,0.55)',
      'display:flex',
      'align-items:flex-start',
      'justify-content:center',
      'z-index:10000',
      'padding:16px',
      'padding-top:max(16px, 12vh)',
      'touch-action:auto',
      '-webkit-user-select:auto',
      'user-select:auto',
      'overflow:auto',
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
      'touch-action:auto',
      '-webkit-user-select:auto',
      'user-select:auto',
    ].join(';');

    const title = document.createElement('p');
    title.textContent = label;
    title.style.cssText =
      'margin:0 0 12px;color:#ffe566;font-size:18px;font-weight:bold;text-align:center';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = defaultValue;
    input.placeholder = placeholder;
    input.maxLength = maxLength;
    input.autocomplete = 'off';
    input.autocapitalize = 'off';
    input.spellcheck = false;
    input.enterKeyHint = 'done';
    input.style.cssText = [
      'width:100%',
      'box-sizing:border-box',
      'padding:10px 12px',
      'border:1px solid #4a9ab0',
      'border-radius:8px',
      'font-size:16px',
      'margin-bottom:12px',
      'background:#ffffff',
      'color:#222222',
      'touch-action:auto',
      '-webkit-user-select:text',
      'user-select:text',
    ].join(';');

    const buttonRow = document.createElement('div');
    buttonRow.style.cssText = 'display:flex;gap:8px';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'キャンセル';
    cancelBtn.style.cssText = buttonStyle('#3a7a90');

    const submitBtn = document.createElement('button');
    submitBtn.type = 'button';
    submitBtn.textContent = submitLabel;
    submitBtn.style.cssText = buttonStyle('#ff5533');

    const forceRemoveOverlay = () => {
      try {
        input.blur();
      } catch {
        // ignore
      }
      overlay.style.display = 'none';
      overlay.style.pointerEvents = 'none';
      overlay.remove();
      document.querySelectorAll('[data-dom-input]').forEach((el) => el.remove());
    };

    const restoreGameInput = () => {
      if (game?.input) {
        window.setTimeout(() => {
          game.input.enabled = prevEnabled;
        }, 400);
      }
    };

    const cleanup = (value: string | null) => {
      if (closed) return;
      closed = true;
      domInputOpen = false;
      document.removeEventListener('keydown', onKeyDown, true);

      try {
        input.blur();
      } catch {
        // ignore
      }
      cancelBtn.disabled = true;
      submitBtn.disabled = true;
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';

      window.setTimeout(() => {
        forceRemoveOverlay();
        restoreGameInput();
        resolve(value);
      }, 50);
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
      if (closed) return;
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

    const bindTap = (button: HTMLButtonElement, action: () => void) => {
      let locked = false;
      const run = (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
        if (closed || locked) return;
        locked = true;
        action();
      };
      button.addEventListener('touchend', run, { passive: false });
      button.addEventListener('click', run);
    };

    bindTap(submitBtn, doSubmit);
    bindTap(cancelBtn, () => cleanup(null));

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay && !closed) {
        event.preventDefault();
        event.stopPropagation();
        cleanup(null);
      }
    });

    const stop = (event: Event) => {
      event.stopPropagation();
    };
    for (const type of [
      'pointerdown',
      'pointerup',
      'touchstart',
      'touchend',
      'mousedown',
      'mouseup',
    ] as const) {
      overlay.addEventListener(type, stop);
    }

    document.addEventListener('keydown', onKeyDown, true);

    buttonRow.append(cancelBtn, submitBtn);
    panel.append(title, input, buttonRow);
    overlay.append(panel);
    document.body.append(overlay);

    // select() はモバイルでキーボードが閉じる原因になるため使わない
    window.setTimeout(() => {
      if (!closed) {
        input.focus();
      }
    }, 50);
  });
}

function buttonStyle(background: string): string {
  return [
    'flex:1',
    'padding:12px 10px',
    'border:none',
    'border-radius:8px',
    `background:${background}`,
    'color:#fff',
    'font-size:15px',
    'font-weight:bold',
    'cursor:pointer',
    'touch-action:manipulation',
    '-webkit-tap-highlight-color:transparent',
    '-webkit-appearance:none',
  ].join(';');
}
