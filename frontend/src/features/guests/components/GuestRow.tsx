import { useState } from "react";
import toast from "react-hot-toast";
import { EditIcon, DeleteIcon } from "../../../components/Icons";
import type { Guest } from "../types";
import { deleteGuest } from "../api/guestsApi";
import { GuestDishesModal } from "./GuestDishesModal";
import { GuestShareModal } from "./GuestShareModal";
import { EditGuestModal } from "./EditGuestModal";

type GuestRowProps = {
  guest: Guest;
  onRefresh: () => Promise<void>;
};

export function GuestRow({ guest, onRefresh }: GuestRowProps) {
  const [showDishes, setShowDishes] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteGuest(guest.id);
      toast.success("Guest deleted");
      setConfirmDelete(false);
      await onRefresh();
    } catch (error: unknown) {
      let message = "Failed to delete guest";
      if (error && typeof error === "object" && "response" in error) {
        const response = (error as { response?: { data?: { message?: string } } }).response;
        message = response?.data?.message ?? message;
      } else if (error instanceof Error && error.message) {
        message = error.message;
      }
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <li className="relative flex items-center justify-between gap-4 px-1 py-3 transition duration-150 hover:bg-white/40">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d37655]/80 text-sm font-semibold text-white">
          {guest.name.charAt(0).toUpperCase()}
        </span>
        <span className="text-base font-medium text-[#2b1c12]">{guest.name}</span>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-full border border-[#d37655]/30 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#d37655] transition hover:bg-[#fbe0d4]"
          onClick={() => setShowShare(true)}
        >
          Share link
        </button>
        <button
          type="button"
          className="rounded-full border border-[#d37655]/30 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#d37655] transition hover:bg-[#fbe0d4]"
          onClick={() => setShowDishes(true)}
        >
          View rankings
        </button>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d37655]/30 text-[#d37655] transition hover:bg-[#fbe0d4]"
          onClick={() => setShowEdit(true)}
          aria-label="Edit guest"
        >
          <EditIcon className="h-5 w-5" aria-hidden />
        </button>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d37655]/30 text-[#d37655] transition hover:bg-[#fbe0d4]"
          onClick={() => {
            if (isDeleting) return;
            setConfirmDelete((previous) => !previous);
          }}
          aria-label={confirmDelete ? "Cancel delete" : "Delete guest"}
        >
          <DeleteIcon className="h-5 w-5" aria-hidden />
        </button>
      </div>
      {confirmDelete ? (
        <DeleteGuestModal
          guestName={guest.name}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            if (isDeleting) return;
            void handleDelete();
          }}
          isDeleting={isDeleting}
        />
      ) : null}
      {showDishes ? <GuestDishesModal guest={guest} onClose={() => setShowDishes(false)} /> : null}
      {showShare ? <GuestShareModal guest={guest} onClose={() => setShowShare(false)} /> : null}
      {showEdit ? (
        <EditGuestModal
          guest={guest}
          onClose={() => setShowEdit(false)}
          onUpdated={onRefresh}
        />
      ) : null}
    </li>
  );
}

type DeleteGuestModalProps = {
  guestName: string;
  onCancel: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
};

function DeleteGuestModal({ guestName, onCancel, onConfirm, isDeleting }: DeleteGuestModalProps) {
  const canDismiss = !isDeleting;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#2b1c12]/40 px-3 py-6 sm:px-4 sm:py-8"
      onClick={() => {
        if (!canDismiss) return;
        onCancel();
      }}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-white/70 bg-white/95 p-5 shadow-[0_35px_80px_-35px_rgba(167,112,68,0.6)] backdrop-blur-sm sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-[#a77044]">Delete guest</h3>
            <button
              type="button"
              className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d37655] underline decoration-dotted disabled:opacity-60"
              onClick={() => {
                if (!canDismiss) return;
                onCancel();
              }}
              disabled={!canDismiss}
            >
              Close
            </button>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[#2b1c12]">Remove {guestName}?</p>
            <p className="text-xs text-[#6f5440]">
              This deletes the guest and any rankings they have saved. This action cannot be undone.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <button
              type="button"
              className="rounded-full border border-[#d37655]/30 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#d37655] transition hover:bg-[#fbe0d4] disabled:opacity-60"
              onClick={() => {
                if (!canDismiss) return;
                onCancel();
              }}
              disabled={!canDismiss}
            >
              Cancel
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full bg-[#d37655] px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white transition hover:-translate-y-0.5 disabled:opacity-70"
              onClick={() => {
                if (isDeleting) return;
                onConfirm();
              }}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
