'use client';

interface SendButtonProps {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}

export function SendButton({ onClick, disabled = false, label = 'Send' }: SendButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '8px 16px',
        border: '1px solid var(--border)',
        borderRadius: 8,
        background: disabled ? 'var(--bg-subtle)' : 'var(--accent)',
        color: disabled
          ? 'var(--text-muted)'
          : 'var(--accent-foreground, #fff)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 13,
        fontFamily: 'inherit',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        transition: 'background 0.15s, opacity 0.15s',
      }}
    >
      {label}
    </button>
  );
