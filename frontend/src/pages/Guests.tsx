import { useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { clsx } from 'clsx';
import { Plus, Pencil, Trash2, Copy, Check } from 'lucide-react';

import type { Allergy, Guest } from '../types';
import { ALLERGIES } from '../types';

import { setGuestAllergies } from '../api/allergies';
import { Modal } from '../components/Modal';
import { ModalActions } from '../components/ModalActions';
import { useGuestAllergiesMap, useGuestMutations, useGuests } from '../hooks/useGuests';

export function Guests() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);

  const { data: guests, isLoading } = useGuests();

  const guestIds = useMemo(() => (guests ?? []).map((guest) => guest.id), [guests]);
  const { data: guestAllergies } = useGuestAllergiesMap(guestIds);

  const { addGuest, updateGuestWithAllergies, deleteGuestById } = useGuestMutations();

  const copyInviteLink = (guest: Guest) => {
    const url = `${window.location.origin}/rank/${guest.rankToken}`;
    navigator.clipboard.writeText(url);
    toast.success('Invite link copied!');
  };

  const handleEdit = (guest: Guest) => {
    setEditingGuest(guest);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this guest?')) {
      deleteGuestById.mutate(id, {
        onSuccess: () => {
          toast.success('Guest removed.');
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-warm-900">Guests</h1>
        <button
          onClick={() => { setEditingGuest(null); setIsModalOpen(true); }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-warm-600 hover:bg-warm-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Guest
        </button>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {guests?.map((guest) => (
            <div key={guest.id} className="bg-white rounded-lg shadow p-6 relative group">
              <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={() => copyInviteLink(guest)} className="p-1 text-gray-400 hover:text-warm-600" title="Copy Invite Link">
                  <Copy className="h-4 w-4" />
                </button>
                <button onClick={() => handleEdit(guest)} className="p-1 text-gray-400 hover:text-blue-600">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(guest.id)} className="p-1 text-gray-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-warm-200 flex items-center justify-center text-warm-700 font-bold text-lg">
                  {guest.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{guest.name}</h3>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Allergies</h4>
                <div className="flex flex-wrap gap-2">
                  {guestAllergies?.[guest.id]?.length ? (
                    guestAllergies[guest.id].map((allergy) => (
                      <span key={allergy} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 capitalize">
                        {allergy}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400 italic">None</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <GuestModal
          guest={editingGuest}
          existingAllergies={editingGuest ? guestAllergies?.[editingGuest.id] || [] : []}
          onClose={() => setIsModalOpen(false)}
          onSave={async (name, allergies) => {
            if (editingGuest) {
              await updateGuestWithAllergies.mutateAsync({ id: editingGuest.id, name, allergies });
              toast.success('Guest updated!');
              return;
            }

            const guest = await addGuest.mutateAsync(name);
            if (allergies.length > 0) {
              await setGuestAllergies(guest.id, allergies);
            }
            toast.success('Guest added!');
          }}
        />
      )}
    </div>
  );
}

function GuestModal({
  guest,
  existingAllergies,
  onClose,
  onSave,
}: {
  guest: Guest | null;
  existingAllergies: Allergy[];
  onClose: () => void;
  onSave: (name: string, allergies: Allergy[]) => Promise<void>;
}) {
  const [name, setName] = useState(guest?.name ?? '');
  const [selectedAllergies, setSelectedAllergies] = useState<Allergy[]>(existingAllergies);
  const [isSaving, setIsSaving] = useState(false);

  const toggleAllergy = (allergy: Allergy) => {
    if (selectedAllergies.includes(allergy)) {
      setSelectedAllergies(selectedAllergies.filter(a => a !== allergy));
    } else {
      setSelectedAllergies([...selectedAllergies, allergy]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(name, selectedAllergies);
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Failed to save guest");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal title={guest ? 'Edit Guest' : 'Add Guest'} onClose={onClose} footerInside>
      <form onSubmit={handleSubmit}>
        <div className="mt-4">
          <div className="text-left">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 shadow-sm focus:ring-warm-500 focus:border-warm-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
            />
          </div>

          <div className="text-left mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
            <div className="flex flex-wrap gap-2">
              {ALLERGIES.map((allergy) => (
                <button
                  key={allergy}
                  type="button"
                  onClick={() => toggleAllergy(allergy)}
                  className={clsx(
                    'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                    selectedAllergies.includes(allergy)
                      ? 'bg-red-100 text-red-800 border-red-200'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  )}
                >
                  {allergy}
                  {selectedAllergies.includes(allergy) && <Check className="ml-1 h-3 w-3" />}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 sm:mt-6">
            <ModalActions submitLabel="Save" isSubmitting={isSaving} onCancel={onClose} />
          </div>
        </div>
      </form>
    </Modal>
  );
}
