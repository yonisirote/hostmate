import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Dish, ALLERGIES, Allergy, DishCategory } from '../types';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { clsx } from 'clsx';

const CATEGORIES: DishCategory[] = ['main', 'side', 'dessert', 'other'];

export function Dishes() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<DishCategory | 'all'>('all');

  // Queries
  const { data: dishes, isLoading } = useQuery<Dish[]>({
    queryKey: ['dishes'],
    queryFn: async () => {
      const { data } = await api.get('/dishes');
      return data;
    },
  });

  const { data: dishAllergens } = useQuery<Record<string, Allergy[]>>({
    queryKey: ['dishAllergens', dishes],
    queryFn: async () => {
      if (!dishes) return {};
      const allergensMap: Record<string, Allergy[]> = {};
      await Promise.all(
        dishes.map(async (dish) => {
          const { data } = await api.get(`/allergies/dishes/${dish.id}`);
          allergensMap[dish.id] = data;
        })
      );
      return allergensMap;
    },
    enabled: !!dishes,
  });

  // Mutations
  const addDishMutation = useMutation({
    mutationFn: async (dish: Partial<Dish>) => {
      return await api.post('/dishes', dish);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dishes'] });
      setIsModalOpen(false);
      toast.success('Dish created!');
    },
  });

  const updateDishMutation = useMutation({
    mutationFn: async ({ id, data, allergies }: { id: string; data: Partial<Dish>, allergies: Allergy[] }) => {
      await api.put(`/dishes/${id}`, data);
      await api.put(`/allergies/dishes/${id}`, { allergies });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dishes'] });
      queryClient.invalidateQueries({ queryKey: ['dishAllergens'] });
      setIsModalOpen(false);
      setEditingDish(null);
      toast.success('Dish updated!');
    },
  });

  const deleteDishMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/dishes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dishes'] });
      toast.success('Dish deleted.');
    },
  });

  const filteredDishes = dishes?.filter((d) => selectedCategory === 'all' || d.category === selectedCategory);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-warm-900">My Dishes</h1>
        <button
          onClick={() => { setEditingDish(null); setIsModalOpen(true); }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-warm-600 hover:bg-warm-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Dish
        </button>
      </div>

      {/* Filters */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={clsx(
            "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap",
            selectedCategory === 'all' 
              ? "bg-warm-600 text-white" 
              : "bg-white text-gray-700 hover:bg-warm-50 border border-gray-200"
          )}
        >
          All Dishes
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={clsx(
              "px-4 py-2 rounded-full text-sm font-medium capitalize whitespace-nowrap",
              selectedCategory === cat 
                ? "bg-warm-600 text-white" 
                : "bg-white text-gray-700 hover:bg-warm-50 border border-gray-200"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDishes?.map((dish) => (
            <div key={dish.id} className="bg-white overflow-hidden shadow rounded-lg flex flex-col h-full group relative">
               <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => { setEditingDish(dish); setIsModalOpen(true); }} 
                  className="p-1 bg-white rounded-full shadow text-gray-400 hover:text-blue-600"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => { if(confirm('Delete this dish?')) deleteDishMutation.mutate(dish.id) }} 
                  className="p-1 bg-white rounded-full shadow text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="p-6 flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warm-100 text-warm-800 capitalize">
                    {dish.category}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{dish.name}</h3>
                <p className="text-gray-500 text-sm line-clamp-3">{dish.description || 'No description provided.'}</p>
              </div>
              <div className="bg-gray-50 px-6 py-4">
                <div className="flex flex-wrap gap-2">
                   {dishAllergens?.[dish.id]?.length ? (
                    dishAllergens[dish.id].map((allergy) => (
                      <span key={allergy} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 capitalize">
                        Contains {allergy}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 italic">No declared allergens</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <DishModal
          dish={editingDish}
          existingAllergies={editingDish ? dishAllergens?.[editingDish.id] || [] : []}
          onClose={() => setIsModalOpen(false)}
          onSave={async (data, allergies) => {
            if (editingDish) {
              await updateDishMutation.mutateAsync({ id: editingDish.id, data, allergies });
            } else {
              const res = await addDishMutation.mutateAsync(data);
              if (allergies.length > 0) {
                 await api.put(`/allergies/dishes/${res.data.id}`, { allergies });
                 queryClient.invalidateQueries({ queryKey: ['dishAllergens'] });
              }
            }
          }}
        />
      )}
    </div>
  );
}

function DishModal({ 
  dish, 
  existingAllergies, 
  onClose, 
  onSave 
}: { 
  dish: Dish | null, 
  existingAllergies: Allergy[], 
  onClose: () => void, 
  onSave: (data: Partial<Dish>, allergies: Allergy[]) => Promise<void> 
}) { // onClose is required; add a visible close button in modal header
  const [name, setName] = useState(dish?.name || '');
  const [description, setDescription] = useState(dish?.description || '');
  const [category, setCategory] = useState<DishCategory>(dish?.category || 'main');
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
      await onSave({ name, description, category }, selectedAllergies);
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Failed to save dish");
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
          <div className="pt-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 text-center">
              {dish ? 'Edit Dish' : 'Create Dish'}
            </h3>
          </div>
          <form onSubmit={handleSubmit} className="mt-3">
            <div>
              <div className="text-center sm:mt-2">
                <div className="mt-4 space-y-4">
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

                  <div className="text-left">
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as DishCategory)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-warm-500 focus:border-warm-500 sm:text-sm rounded-md border"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                    </select>
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

                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contains Allergens</label>
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
