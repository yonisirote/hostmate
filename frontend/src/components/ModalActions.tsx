type ModalActionsProps = {
  submitLabel: string;
  isSubmitting?: boolean;
  onCancel: () => void;
};

export function ModalActions({ submitLabel, isSubmitting, onCancel }: ModalActionsProps) {
  return (
    <div className="sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
      <button
        type="submit"
        disabled={Boolean(isSubmitting)}
        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-warm-600 text-base font-medium text-white hover:bg-warm-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-warm-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
      >
        {isSubmitting ? 'Saving...' : submitLabel}
      </button>
      <button
        type="button"
        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-warm-500 sm:mt-0 sm:col-start-1 sm:text-sm"
        onClick={onCancel}
      >
        Cancel
      </button>
    </div>
  );
}
