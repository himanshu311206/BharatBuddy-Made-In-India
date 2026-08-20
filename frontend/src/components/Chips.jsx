export function InterestChip({ name, isCommon = false, size = 'md' }) {
  return (
    <span
      className={`chip-tag interest-chip ${isCommon ? 'common' : ''} ${size}`}
    >
      <i className="fa-solid fa-fire text-amber-500"></i>
      <span>{name}</span>
      {isCommon && <span className="common-badge">Common</span>}
    </span>
  );
}

export function LanguageChip({ name, isCommon = false, size = 'md' }) {
  return (
    <span
      className={`chip-tag language-chip ${isCommon ? 'common' : ''} ${size}`}
    >
      <i className="fa-solid fa-language text-indigo-500"></i>
      <span>{name}</span>
    </span>
  );
}
