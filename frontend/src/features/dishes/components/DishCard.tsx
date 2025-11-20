import { useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { EditIcon, DeleteIcon } from "../../../components/Icons";
import type { Dish } from "../types";
import { deleteDish } from "../api/dishesApi";
import { EditDishModal } from "./EditDishModal";

type DishCardProps = {
  dish: Dish;
  onRefresh: () => Promise<void>;
};

export function DishCard({ dish, onRefresh }: DishCardProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const portalTarget = typeof window === "undefined" ? null : document.body;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteDish(dish.id);
      toast.success("Dish deleted");
      setShowDelete(false);
      await onRefresh();
    } catch (error: unknown) {
      let message = "Failed to delete dish";
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
    <li className="relative rounded-2xl border border-[#f5d8b4]/70 bg-white/80 p-5 shadow-[0_20px_45px_-30px_rgba(167,112,68,0.55)] transition duration-150 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="text-base font-semibold text-[#2b1c12]">{dish.name}</div>
          {dish.description ? <div className="text-sm leading-relaxed text-[#6f5440]">{dish.description}</div> : null}
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d37655]/30 text-[#d37655] transition hover:bg-[#fbe0d4]"
              onClick={() => setShowEdit(true)}
              aria-label="Edit dish"
            >
              <EditIcon className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d37655]/30 text-[#d37655] transition hover:bg-[#fbe0d4]"
              onClick={() => {
                if (isDeleting) return;
                setShowDelete(true);
              }}
              aria-label={showDelete ? "Cancel delete" : "Delete dish"}
            >
              <DeleteIcon className="h-5 w-5" aria-hidden />
            </button>
          </div>
          <div className="flex flex-col items-end gap-1 text-xs uppercase tracking-widest text-[#a77044]/80">
            {dish.created_at ? <span>Added {new Date(dish.created_at).toLocaleDateString()}</span> : null}
            {dish.updated_at ? <span>Updated {new Date(dish.updated_at).toLocaleDateString()}</span> : null}
          </div>
        </div>
      </div>
      {showEdit && portalTarget
        ? createPortal(
            <EditDishModal
              dish={dish}
              onClose={() => setShowEdit(false)}
              onUpdated={onRefresh}
            />, 
            portalTarget
          )
        : null}
      {showDelete && portalTarget
        ? createPortal(
            <DeleteDishModal
              dishName={dish.name}
              onCancel={() => {
                if (isDeleting) return;
                setShowDelete(false);
              }}
              onConfirm={() => {
                if (isDeleting) return;
                void handleDelete();
              }}
              isDeleting={isDeleting}
            />, 
            portalTarget
          )
        : null}
    </li>
  );
}

type DeleteDishModalProps = {
  dishName: string;
  onCancel: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
};

function DeleteDishModal({ dishName, onCancel, onConfirm, isDeleting }: DeleteDishModalProps) {
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
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-[#a77044]">Delete dish</h3>
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
            <p className="text-sm font-semibold text-[#2b1c12]">Remove {dishName}?</p>
            <p className="text-xs text-[#6f5440]">
              This deletes the dish and any data attached to it. This action cannot be undone.
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
