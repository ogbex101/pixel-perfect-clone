interface StringListEditorProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

export function StringListEditor({ label, values, onChange, placeholder }: StringListEditorProps) {
  function updateAt(i: number, v: string) {
    const next = [...values];
    next[i] = v;
    onChange(next);
  }
  function removeAt(i: number) {
    onChange(values.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...values, ""]);
  }

  return (
    <div>
      <label className="block text-sm text-muted-foreground mb-1">{label}</label>
      <div className="space-y-2">
        {values.map((v, i) => (
          <div key={i} className="flex gap-2">
            <textarea
              value={v}
              onChange={(e) => updateAt(i, e.target.value)}
              placeholder={placeholder}
              rows={2}
              className="flex-1 border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary resize-y"
            />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="mt-2 shrink-0 self-start text-xs text-muted-foreground hover:text-destructive"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="mt-2 text-sm text-primary hover:text-[color:var(--brand-gold-bright)]"
      >
        + Add
      </button>
    </div>
  );
}
