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
    input.style.cssText = [
      'width:100%',
      'box-sizing:border-box',
      'padding:10px 12px',
      'border:1px solid #4a9ab0',
      'border-radius:8px',
      'font-size:16px',
      'margin-bottom:12px',
    ].join(';');

    const buttonRow = document.createElement('div');
    buttonRow.style.cssText = 'display:flex;gap:8px';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'キャンセル';
    cancelBtn.style.cssText = [
      'flex:1',
      'padding:10px',
      'border:none',
      'border-radius:8px',
      'background:#3a7a90',
      'color:#fff',
      'font-size:15px',
      'cursor:pointer',
    ].join(';');

    const submitBtn = document.createElement('button');
    submitBtn.type = 'button';
    submitBtn.textContent = submitLabel;
    submitBtn.style.cssText = [
      'flex:1',
      'padding:10px',
      'border:none',
      'border-radius:8px',
      'background:#ff5533',
      'color:#fff',
      'font-size:15px',
      'cursor:pointer',
    ].join(';');

    const cleanup = (value: string | null) => {
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
        cleanup(null);
      }
    };

    cancelBtn.addEventListener('click', () => cleanup(null));
    submitBtn.addEventListener('click', submit);
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        cleanup(null);
      }
    });
    document.addEventListener('keydown', onKeyDown);

    buttonRow.append(cancelBtn, submitBtn);
    panel.append(title, input, buttonRow);
    overlay.append(panel);
    document.body.append(overlay);

    input.focus();
    input.select();
  });
}
