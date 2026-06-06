import "./fancy-chip-button.css";

type Props = {
  label: string;
  hoverLabel?: string;
  hint1?: string;
  hint2?: string;
  disabled?: boolean;
  onClick?: () => void;
};

export function FancyChipButton({
  label,
  hoverLabel,
  hint1 = "Hover to reveal",
  hint2 = "Click to use",
  disabled,
  onClick,
}: Props) {
  return (
    <div className="fcb-wrapper">
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="fcb-btn"
        aria-label={label}
      >
        <div className="fcb-txt-box">
          <div className="fcb-point top left" />
          <div className="fcb-point top right" />
          <div className="fcb-point bottom left" />
          <div className="fcb-point bottom right" />
        </div>
        <div className="fcb-frame" />
        <span className="fcb-txt">{label}</span>
        <span className="fcb-txt">{hoverLabel ?? label}</span>
      </button>
      <span className="fcb-hint" id="fcb-hint1">{hint1}</span>
      <span className="fcb-hint" id="fcb-hint2">{hint2}</span>
    </div>
  );
}
