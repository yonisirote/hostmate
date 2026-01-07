import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { clsx } from 'clsx';
import { Plus, Pencil, Trash2, Calendar, Users as UsersIcon, ChefHat, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

import type { Meal } from '../types';

import { Modal } from '../components/Modal';
import { ModalActions } from '../components/ModalActions';
import { useGuests } from '../hooks/useGuests';
import { useMealGuests, useMealMenu, useMealMutations, useMeals } from '../hooks/useMeals';

export function Meals() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(searchParams.get('id'));

  const { data: meals, isLoading: isLoadingMeals } = useMeals();
  const { data: guests } = useGuests();

  const { data: mealGuests } = useMealGuests(selectedMealId);
  const { data: menu, isLoading: isLoadingMenu } = useMealMenu(selectedMealId, false);

  const { addMeal, updateMealById, deleteMealById, updateMealGuests } = useMealMutations();

  const selectedMeal = useMemo(() => meals?.find((meal) => meal.id === selectedMealId), [meals, selectedMealId]);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMeal(null);
  };

  const selectMealById = (mealId: string | null) => {
    setSelectedMealId(mealId);
    if (mealId) {
      setSearchParams({ id: mealId });
    } else {
      setSearchParams({});
    }
  };

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
                onClick={() => selectMealById(meal.id)}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Delete meal?')) {
                              deleteMealById.mutate(meal.id, {
                                onSuccess: () => {
                                  if (selectedMealId === meal.id) {
                                    selectMealById(null);
                                  }
                                  toast.success('Meal deleted.');
                                },
                              });
                            }
                          }}
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
                                  updateMealGuests.mutate(
                                    {
                                      mealId: selectedMeal.id,
                                      guestIds: newIds,
                                      currentGuestIds: currentIds,
                                    },
                                    {
                                      onSuccess: () => {
                                        toast.success('Guest list updated!');
                                      },
                                    }
                                  );
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
          onClose={closeModal}
          onSave={async (data) => {
            if (editingMeal) {
              await updateMealById.mutateAsync({ id: editingMeal.id, data });
              toast.success('Meal updated!');
              closeModal();
              return;
            }

            const created = await addMeal.mutateAsync(data);
            toast.success('Meal created!');
            closeModal();
            selectMealById(created.id);
          }}
        />
      )}
    </div>
  );
}

function MealModal({
  meal,
  onClose,
  onSave,
}: {
  meal: Meal | null;
  onClose: () => void;
  onSave: (data: { name: string; date: string; description: string | null }) => Promise<void>;
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
    <Modal title={meal ? 'Edit Meal' : 'Plan New Meal'} onClose={onClose} footerInside>
      <form onSubmit={handleSubmit}>
        <div className="mt-4 space-y-4">
          <div className="text-left">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
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
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">
              Date
            </label>
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
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 shadow-sm focus:ring-warm-500 focus:border-warm-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
            />
          </div>

          <div className="mt-5 sm:mt-6">
            <ModalActions submitLabel="Save" isSubmitting={isSaving} onCancel={onClose} />
          </div>
        </div>
      </form>
    </Modal>
  );
}
