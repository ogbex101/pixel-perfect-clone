import { useEffect, useRef, useState, type ChangeEvent } from "react";

interface FileUploadFieldProps {
  label: string;
  accept: string;
  currentUrl?: string | null;
  kind?: "image" | "video";
  /**
   * Fires with a File when the user picks one, or `null` when they explicitly
   * clear the field. Never fires on mount — "untouched" is represented by the
   * parent's own initial state, not a call here.
   */
  onFileChange: (file: File | null) => void;
}

export function FileUploadField({
  label,
  accept,
  currentUrl,
  kind = "image",
  onFileChange,
}: FileUploadFieldProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    onFileChange(file);
  }

  function handleClear() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
    onFileChange(null);
  }

  const displayUrl = previewUrl ?? currentUrl ?? null;

  return (
    <div>
      <label className="block text-sm text-muted-foreground mb-1">{label}</label>
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 shrink-0 border border-border bg-muted overflow-hidden flex items-center justify-center">
          {displayUrl ? (
            kind === "video" ? (
              <video src={displayUrl} className="w-full h-full object-cover" muted />
            ) : (
              <img src={displayUrl} alt="" className="w-full h-full object-cover" />
            )
          ) : (
            <span className="text-[10px] text-muted-foreground text-center px-1">No file</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleChange}
            className="text-sm text-muted-foreground file:mr-3 file:cursor-pointer file:border file:border-border file:bg-secondary file:px-3 file:py-1.5 file:text-foreground hover:file:border-primary"
          />
          {(previewUrl || currentUrl) && (
            <button
              type="button"
              onClick={handleClear}
              className="w-fit text-left text-xs text-muted-foreground hover:text-destructive"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
