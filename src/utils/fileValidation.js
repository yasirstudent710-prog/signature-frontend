/**
 * Client-side file validation. This is a convenience only; the backend must
 * validate again. Adjust sizes/types here (ASSUMPTION: 10 MB documents, 5 MB signatures).
 */
export const FILE_RULES = {
  document: {
    label: "PDF, PNG, JPG or JPEG",
    extensions: ["pdf", "png", "jpg", "jpeg"],
    mimeTypes: ["application/pdf", "image/png", "image/jpeg"],
    maxBytes: 10 * 1024 * 1024,
  },
  signature: {
    label: "PNG, JPG or JPEG",
    extensions: ["png", "jpg", "jpeg"],
    mimeTypes: ["image/png", "image/jpeg"],
    maxBytes: 5 * 1024 * 1024,
  },
};

export const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

/** @returns {string|null} an error message, or null when the file is valid */
export const validateFile = (file, kind) => {
  const rules = FILE_RULES[kind];
  if (!file || !rules) return "No file selected.";
  const ext = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "";
  const typeOk = rules.mimeTypes.includes(file.type);
  const extOk = rules.extensions.includes(ext);
  // Require the extension; also reject a MIME type that is present but wrong.
  if (!extOk || (file.type && !typeOk)) {
    return `Unsupported file type. Allowed: ${rules.label}.`;
  }
  if (file.size === 0) return "This file is empty.";
  if (file.size > rules.maxBytes) {
    return `File is too large (${formatBytes(file.size)}). Maximum is ${formatBytes(rules.maxBytes)}.`;
  }
  return null;
};
