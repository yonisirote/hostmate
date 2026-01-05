import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Guest, ALLERGIES, Allergy } from '../types';
import { Plus, Pencil, Trash2, Copy, Check, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { clsx } from 'clsx';

export function Guests() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);

  // Queries
  const { data: guests, isLoading } = useQuery<Guest[]>({
    queryKey: ['guests'],
    queryFn: async () => {
      const { data } = await api.get('/guests');
      return data;
    },
  });

  const { data: guestAllergies } = useQuery<Record<string, Allergy[]>>({
    queryKey: ['guestAllergies', guests],
    queryFn: async () => {
      if (!guests) return {};
      const allergiesMap: Record<string, Allergy[]> = {};
      await Promise.all(
        guests.map(async (guest) => {
          const { data } = await api.get(`/allergies/guests/${guest.id}`);
          allergiesMap[guest.id] = data;
        })
      );
      return allergiesMap;
    },
    enabled: !!guests,
  });

  // Mutations
  const addGuestMutation = useMutation({
    mutationFn: async (name: string) => {
      return await api.post('/guests', { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      setIsModalOpen(false);
      toast.success('Guest added!');
    },
  });

  const updateGuestMutation = useMutation({
    mutationFn: async ({ id, name, allergies }: { id: string; name: string, allergies: Allergy[] }) => {
      await api.put(`/guests/${id}`, { name });
      await api.put(`/allergies/guests/${id}`, { allergies });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      queryClient.invalidateQueries({ queryKey: ['guestAllergies'] });
      setIsModalOpen(false);
      setEditingGuest(null);
      toast.success('Guest updated!');
    },
  });

  const deleteGuestMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/guests/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      toast.success('Guest removed.');
    },
  });

  const copyInviteLink = (guest: Guest & { rankToken: string }) => {
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
      deleteGuestMutation.mutate(id);
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
              await updateGuestMutation.mutateAsync({ id: editingGuest.id, name, allergies });
            } else {
              // Create guest then set allergies
              // Note: our current addGuest handler doesn't accept allergies in one go.
              // So for "Add", we might need to do 2 calls or update the backend.
              // For simplicity: Create -> then update allergies immediately if any.
              const res = await addGuestMutation.mutateAsync(name);
              if (allergies.length > 0) {
                 await api.put(`/allergies/guests/${res.data.id}`, { allergies });
                 queryClient.invalidateQueries({ queryKey: ['guestAllergies'] });
              }
            }
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
  onSave 
}: { 
  guest: Guest | null, 
  existingAllergies: Allergy[], 
  onClose: () => void, 
  onSave: (name: string, allergies: Allergy[]) => Promise<void> 
}) {
  const [name, setName] = useState(guest?.name || '');
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
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity" aria-hidden="true" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <form onSubmit={handleSubmit}>
            <div className="absolute top-2 right-2">
              <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="pt-6">
              <div className="mt-3 text-center sm:mt-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  {guest ? 'Edit Guest' : 'Add Guest'}
                </h3>
                <div className="mt-4">
                  <div className="text-left">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
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
                            "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                            selectedAllergies.includes(allergy)
                              ? "bg-red-100 text-red-800 border-red-200"
                              : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                          )}
                        >
                          {allergy}
                          {selectedAllergies.includes(allergy) && <Check className="ml-1 h-3 w-3" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-warm-600 text-base font-medium text-white hover:bg-warm-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-warm-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-warm-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
