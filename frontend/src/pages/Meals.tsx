import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Meal, Guest, Menu } from '../types';
import { Plus, Pencil, Trash2, Calendar, Users as UsersIcon, ChefHat, AlertTriangle, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { clsx } from 'clsx';

export function Meals() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(searchParams.get('id'));

  // Sync URL with selected meal
  useEffect(() => {
    if (selectedMealId) {
      setSearchParams({ id: selectedMealId });
    } else {
      setSearchParams({});
    }
  }, [selectedMealId, setSearchParams]);

  // Queries
  const { data: meals, isLoading: isLoadingMeals } = useQuery<Meal[]>({
    queryKey: ['meals'],
    queryFn: async () => {
      const { data } = await api.get('/meals');
      return data;
    },
  });

  const { data: guests } = useQuery<Guest[]>({
    queryKey: ['guests'],
    queryFn: async () => {
      const { data } = await api.get('/guests');
      return data;
    },
  });

  // Selected Meal Details
  const { data: mealGuests } = useQuery<Guest[]>({
    queryKey: ['mealGuests', selectedMealId],
    queryFn: async () => {
      if (!selectedMealId) return [];
      const { data } = await api.get(`/meals/${selectedMealId}`);
      return data;
    },
    enabled: !!selectedMealId,
  });

  const { data: menu, isLoading: isLoadingMenu } = useQuery<Menu>({
    queryKey: ['mealMenu', selectedMealId],
    queryFn: async () => {
      if (!selectedMealId) return { main: [], side: [], dessert: [], other: [] };
      const { data } = await api.get(`/meals/${selectedMealId}/menu?includeUnsafe=false`);
      return data;
    },
    enabled: !!selectedMealId,
  });

  // Mutations
  const addMealMutation = useMutation({
    mutationFn: async (data: Partial<Meal>) => {
      return await api.post('/meals', data);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
      setIsModalOpen(false);
      toast.success('Meal created!');
      setSelectedMealId(res.data.id);
    },
  });

  const updateMealMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Meal> }) => {
      await api.put(`/meals/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
      setIsModalOpen(false);
      setEditingMeal(null);
      toast.success('Meal updated!');
    },
  });

  const deleteMealMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/meals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
      if (selectedMealId) setSelectedMealId(null);
      toast.success('Meal deleted.');
    },
  });

  const updateMealGuestsMutation = useMutation({
    mutationFn: async ({ mealId, guestIds }: { mealId: string; guestIds: string[] }) => {
      // Since API is additive/subtractive, we need to diff.
      // But API has bulk add. Removing is one by one.
      // Let's rely on a simpler approach: 
      // 1. Get current guests (already have in `mealGuests`)
      // 2. Identify to add and to remove
      
      const currentIds = mealGuests?.map(g => g.id) || [];
      const toAdd = guestIds.filter(id => !currentIds.includes(id));
      const toRemove = currentIds.filter(id => !guestIds.includes(id));

      if (toAdd.length) {
        await api.post(`/meals/${mealId}`, { guestIds: toAdd });
      }
      
      // Parallel deletes
      await Promise.all(toRemove.map(gid => api.delete(`/meals/${mealId}/guests/${gid}`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealGuests'] });
      queryClient.invalidateQueries({ queryKey: ['mealMenu'] });
      toast.success('Guest list updated!');
    },
  });

  const selectedMeal = meals?.find((m) => m.id === selectedMealId);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] gap-6">
      {/* Sidebar List */}
      <div className="w-full lg:w-1/3 bg-white rounded-lg shadow flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-warm-50">
          <h2 className="text-lg font-bold text-warm-900">Your Meals</h2>
          <button
            onClick={() => { setEditingMeal(null); setIsModalOpen(true); }}
            className="p-2 bg-warm-600 text-white rounded-full hover:bg-warm-700 shadow-sm"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoadingMeals ? (
            <div className="text-center text-gray-500 py-4">Loading meals...</div>
          ) : meals?.length === 0 ? (
            <div className="text-center text-gray-500 py-10">No meals planned yet.</div>
          ) : (
            meals?.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(meal => (
              <div 
                key={meal.id}
                onClick={() => setSelectedMealId(meal.id)}
                className={clsx(
                  "cursor-pointer p-4 rounded-lg border transition-all hover:shadow-md",
                  selectedMealId === meal.id
                    ? "border-warm-500 bg-warm-50 ring-1 ring-warm-500"
                    : "border-gray-200 bg-white hover:border-warm-300"
                )}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{meal.name}</h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      {format(new Date(meal.date), 'MMM d, yyyy')}
                    </div>
                  </div>
                  {selectedMealId === meal.id && (
                     <div className="flex space-x-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setEditingMeal(meal); setIsModalOpen(true); }} 
                          className="p-1 text-gray-400 hover:text-blue-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); if(confirm('Delete meal?')) deleteMealMutation.mutate(meal.id); }} 
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                     </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white rounded-lg shadow p-6 overflow-y-auto">
        {selectedMeal ? (
          <div className="space-y-8">
            <div className="border-b border-gray-100 pb-4">
               <h1 className="text-3xl font-bold text-warm-900">{selectedMeal.name}</h1>
               <p className="text-gray-500 mt-2">{selectedMeal.description}</p>
               <div className="mt-4 flex items-center text-warm-700">
                  <Calendar className="h-5 w-5 mr-2" />
                  <span className="font-medium">{format(new Date(selectedMeal.date), 'EEEE, MMMM do, yyyy')}</span>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Guest Management */}
              <div>
                <div className="flex items-center justify-between mb-4">
                   <h2 className="text-xl font-semibold flex items-center">
                     <UsersIcon className="h-5 w-5 mr-2 text-warm-600" />
                     Guest List
                   </h2>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                    {guests?.map(guest => {
                       const isInvited = mealGuests?.some(mg => mg.id === guest.id);
                       return (
                         <label key={guest.id} className="flex items-center space-x-3 p-2 hover:bg-white rounded cursor-pointer">
                            <input 
                              type="checkbox"
                              checked={isInvited || false}
                              onChange={(e) => {
                                 const currentIds = mealGuests?.map(g => g.id) || [];
                                 const newIds = e.target.checked 
                                   ? [...currentIds, guest.id]
                                   : currentIds.filter(id => id !== guest.id);
                                 updateMealGuestsMutation.mutate({ mealId: selectedMeal.id, guestIds: newIds });
                              }}
                              className="h-4 w-4 text-warm-600 focus:ring-warm-500 border-gray-300 rounded"
                            />
                            <span className={clsx("text-sm", isInvited ? "text-gray-900 font-medium" : "text-gray-500")}>
                              {guest.name}
                            </span>
                         </label>
                       );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    Select guests to invite. The menu will update automatically based on their preferences and allergies.
                  </p>
                </div>
              </div>

              {/* Menu Suggestion */}
              <div>
                <div className="flex items-center justify-between mb-4">
                   <h2 className="text-xl font-semibold flex items-center">
                     <ChefHat className="h-5 w-5 mr-2 text-warm-600" />
                     Suggested Menu
                   </h2>
                </div>

                {isLoadingMenu ? (
                  <div className="text-gray-500 italic">Calculating optimal menu...</div>
                ) : (
                  <div className="space-y-6">
                    {(['main', 'side', 'dessert'] as const).map(category => {
                      const dishes = menu?.[category] || [];
                      return (
                        <div key={category}>
                          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">{category}s</h3>
                          {dishes.length > 0 ? (
                            <ul className="space-y-2">
                              {dishes.map(dish => (
                                <li key={dish.id} className="bg-warm-50 border border-warm-100 rounded-md p-3">
                                  <div className="font-medium text-warm-900">{dish.name}</div>
                                  {dish.description && <div className="text-xs text-gray-500 mt-1">{dish.description}</div>}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="text-sm text-gray-400 italic">No suitable {category} found.</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {mealGuests?.length === 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 text-sm rounded-md flex items-start">
                    <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    Add guests to generate a menu suggestion based on their rankings and allergies.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <Calendar className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg">Select a meal to view details or plan a new one.</p>
          </div>
        )}
      </div>

       {isModalOpen && (
        <MealModal
          meal={editingMeal}
          onClose={() => setIsModalOpen(false)}
          onSave={async (data) => {
            if (editingMeal) {
              await updateMealMutation.mutateAsync({ id: editingMeal.id, data });
            } else {
              await addMealMutation.mutateAsync(data);
            }
          }}
        />
      )}
    </div>
  );
}

function MealModal({ 
  meal, 
  onClose, 
  onSave 
}: { 
  meal: Meal | null, 
  onClose: () => void, 
  onSave: (data: Partial<Meal>) => Promise<void> 
}) {
  const [name, setName] = useState(meal?.name || '');
  const [date, setDate] = useState(meal?.date || format(new Date(), 'yyyy-MM-dd'));
  const [description, setDescription] = useState(meal?.description || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({ name, date, description });
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Failed to save meal");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity" aria-hidden="true" onClick={onClose}></div>
        <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <button type="button" onClick={onClose} className="absolute top-2 right-2 p-2 text-gray-400 hover:text-gray-600" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
          <div className="pt-6 text-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {meal ? 'Edit Meal' : 'Plan New Meal'}
            </h3>
          </div>
          <form onSubmit={handleSubmit} className="mt-3">
            <div className="text-center sm:mt-2">
              <div className="mt-4 space-y-4">
                <div className="text-left">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Summer BBQ"
                    className="mt-1 shadow-sm focus:ring-warm-500 focus:border-warm-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                  />
                </div>

                <div className="text-left">
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    id="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-1 shadow-sm focus:ring-warm-500 focus:border-warm-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                  />
                </div>

                <div className="text-left">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    id="description"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 shadow-sm focus:ring-warm-500 focus:border-warm-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                  />
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
