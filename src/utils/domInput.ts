export interface DomInputOptions {
  label: string;
  placeholder?: string;
  defaultValue?: string;
  maxLength?: number;
  submitLabel?: string;
}

export function showDomInput(options: DomInputOptions): Promise<string | null> {
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
    overlay.style.cssText = [
      'position:fixed',
      'inset:0',
      'background:rgba(0,0,0,0.55)',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'z-index:10000',
      'padding:16px',
      'touch-action:manipulation',
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
      'touch-action:manipulation',
    ].join(';');

    // Phaser にポインターが吸われないようにする
    panel.addEventListener('pointerdown', stopPhaserSteal);
    panel.addEventListener('pointerup', stopPhaserSteal);
    panel.addEventListener('touchstart', stopPhaserSteal, { passive: false });
    panel.addEventListener('touchend', stopPhaserSteal, { passive: false });

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
      'touch-action:manipulation',
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

    const cleanup = (value: string | null) => {
      if (closed) return;
      closed = true;
      document.removeEventListener('keydown', onKeyDown);
      overlay.remove();
      resolve(value);
    };

    const submit = () => {
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
        submit();
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        cleanup(null);
      }
    };

    bindButton(cancelBtn, () => cleanup(null));
    bindButton(submitBtn, submit);

    overlay.addEventListener('pointerup', (event) => {
      if (event.target === overlay) {
        event.preventDefault();
        event.stopPropagation();
        cleanup(null);
      }
    });

    document.addEventListener('keydown', onKeyDown);

    buttonRow.append(cancelBtn, submitBtn);
    panel.append(title, input, buttonRow);
    overlay.append(panel);
    document.body.append(overlay);

    // 少し遅らせてフォーカス（モバイルキーボード対策）
    window.setTimeout(() => {
      if (!closed) {
        input.focus();
        input.select();
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
    'cursor:pointer',
    'touch-action:manipulation',
    '-webkit-tap-highlight-color:transparent',
  ].join(';');
}

function stopPhaserSteal(event: Event): void {
  event.stopPropagation();
}

function bindButton(button: HTMLButtonElement, action: () => void): void {
  const handler = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    action();
  };

  // click だけだとタッチ端末で届かないことがあるため pointerup も使う
  button.addEventListener('pointerup', handler);
  button.addEventListener('click', handler);
}
