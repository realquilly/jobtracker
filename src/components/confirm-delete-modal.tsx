"use client";

export function ConfirmDeleteModal({
  open,
  company,
  onClose,
  onConfirm,
}: {
  open: boolean;
  company: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  // Keep the native dialog in sync with the `open` prop.
  const setDialog = (el: HTMLDialogElement | null) => {
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  };

  return (
    <dialog ref={setDialog} className="modal" onClose={onClose}>
      <div className="modal-box max-w-sm">
        <h3 className="text-lg font-semibold">Delete application</h3>
        <p className="py-4 text-base-content/70">
          Delete your application to <strong>{company}</strong>? This cannot be
          undone.
        </p>
        <div className="modal-action">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-error"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Delete
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}
