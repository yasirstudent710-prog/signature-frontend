import { FileText, PenLine, Replace, UploadCloud, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FILE_RULES, formatBytes, validateFile } from "../utils/fileValidation";

/**
 * Single-file evidence drop zone with validation, preview and remove/replace.
 * Controlled: the parent owns `file`; we call onChange(file | null). No API calls here.
 *
 * @param {"document"|"signature"} kind  selects the validation rules AND the visual style
 * @param {string} exhibit               small ledger label, e.g. "Exhibit A"
 */
export default function FileUploader({ kind, label, description, exhibit, file, onChange, disabled = false }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const rules = FILE_RULES[kind];
  const Illustration = kind === "document" ? FileText : PenLine;

  // Image preview via object URL; revoked on change/unmount to avoid leaks.
  useEffect(() => {
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
    return undefined;
  }, [file]);

  const accept = (files) => {
    const picked = files?.[0];
    if (!picked) return;
    if (files.length > 1) {
      setError("Please submit a single file.");
      return;
    }
    const problem = validateFile(picked, kind);
    if (problem) {
      setError(problem);
      return; // keep any previously valid file
    }
    setError(null);
    onChange(picked);
  };

  const remove = () => {
    setError(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const openPicker = () => !disabled && inputRef.current?.click();

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold text-burgundy">{label}</h3>
        <span className="label">{exhibit}</span>
      </div>
      <p className="mb-3 text-sm text-ink/70">{description}</p>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={rules.extensions.map((e) => `.${e}`).join(",")}
        disabled={disabled}
        aria-label={label}
        onChange={(e) => {
          accept(e.target.files);
          e.target.value = ""; // allow re-selecting the same file
        }}
      />

      {file ? (
        <div className="anim-settle flex items-center gap-3 rounded-md border border-brass/70 bg-white/60 p-3 shadow-sm">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded border border-brass/50 bg-parchment/60">
            {previewUrl ? (
              <img src={previewUrl} alt={`Preview of ${file.name}`} className="h-full w-full object-contain" />
            ) : (
              <FileText className="h-9 w-9 text-brass-dark" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium" title={file.name}>{file.name}</p>
            <p className="mono mt-0.5 text-xs text-ink/60">{formatBytes(file.size)}</p>
            <div className="mt-2 flex gap-1.5">
              <button type="button" onClick={openPicker} disabled={disabled} className="btn-ghost !px-2.5 !py-1 !text-xs" aria-label="Replace file">
                <Replace className="h-3.5 w-3.5" /> Replace
              </button>
              <button type="button" onClick={remove} disabled={disabled} className="btn-ghost !px-2.5 !py-1 !text-xs" aria-label="Remove file">
                <X className="h-3.5 w-3.5" /> Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={`${label}: drop a file here or press Enter to browse`}
          onClick={openPicker}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), openPicker())}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (!disabled) accept(e.dataTransfer.files);
          }}
          className={`group flex flex-col items-center justify-center rounded-md border-2 border-dashed px-4 py-8 text-center transition-all duration-200 ${
            dragging
              ? "scale-[1.015] border-burgundy bg-brass/20"
              : "border-brass bg-parchment/40 hover:border-brass-dark hover:bg-parchment/70"
          } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
        >
          {/* Illustration: papers stacked behind a brass medallion */}
          <div className="relative mb-3 h-16 w-16">
            <span className="absolute inset-0 rotate-6 rounded-sm border border-brass/50 bg-ivory transition-transform group-hover:rotate-12" />
            <span className="absolute inset-0 -rotate-3 rounded-sm border border-brass/60 bg-ivory transition-transform group-hover:-rotate-6" />
            <span className="absolute inset-0 flex items-center justify-center rounded-sm border border-brass bg-ivory text-burgundy">
              <Illustration className="h-7 w-7" strokeWidth={1.5} />
            </span>
            <UploadCloud className="absolute -bottom-1.5 -right-1.5 h-6 w-6 rounded-full border border-brass bg-ivory p-1 text-brass-dark" />
          </div>
          <p className="text-sm">
            Drop the file here, or <span className="font-semibold text-burgundy underline decoration-brass underline-offset-2">browse</span>
          </p>
          <p className="mono mt-1.5 text-[11px] text-ink/55">
            {rules.label} · up to {formatBytes(rules.maxBytes)}
          </p>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-oxblood" role="alert">{error}</p>}
    </div>
  );
}
