interface TabsProps<T extends string> {
  current: T;
  options: { id: T; label: string }[];
  onChange: (id: T) => void;
}

export function Tabs<T extends string>({ current, options, onChange }: TabsProps<T>) {
  return (
    <div role="tablist" className="tab-bar">
      {options.map((opt) => (
        <button
          key={opt.id}
          role="tab"
          aria-selected={current === opt.id}
          onClick={() => onChange(opt.id)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
