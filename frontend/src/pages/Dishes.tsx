import { useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { clsx } from 'clsx';
import { Plus, Pencil, Trash2, Check } from 'lucide-react';

import type { Allergy, Dish, DishCategory } from '../types';
import { ALLERGIES } from '../types';

import { setDishAllergens } from '../api/allergies';
import { Modal } from '../components/Modal';
import { ModalActions } from '../components/ModalActions';
import { useDishAllergensMap, useDishMutations, useDishes } from '../hooks/useDishes';

const CATEGORIES: DishCategory[] = ['main', 'side', 'dessert', 'other'];

export function Dishes() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<DishCategory | 'all'>('all');

  const { data: dishes, isLoading } = useDishes();

  const dishIds = useMemo(() => (dishes ?? []).map((dish) => dish.id), [dishes]);
  const { data: dishAllergens } = useDishAllergensMap(dishIds);

  const { addDish, updateDishWithAllergies, deleteDishById } = useDishMutations();

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
                  onClick={() => {
                    if (confirm('Delete this dish?')) {
                      deleteDishById.mutate(dish.id, {
                        onSuccess: () => {
                          toast.success('Dish deleted.');
                        },
                      });
                    }
                  }}
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
              await updateDishWithAllergies.mutateAsync({ id: editingDish.id, data, allergies });
              toast.success('Dish updated!');
              return;
            }

            const dish = await addDish.mutateAsync(data);
            if (allergies.length > 0) {
              await setDishAllergens(dish.id, allergies);
            }
            toast.success('Dish created!');
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
  onSave,
}: {
  dish: Dish | null;
  existingAllergies: Allergy[];
  onClose: () => void;
  onSave: (data: { name: string; description: string | null; category: DishCategory }, allergies: Allergy[]) => Promise<void>;
}) {
  const [name, setName] = useState(dish?.name ?? '');
  const [description, setDescription] = useState(dish?.description ?? '');
  const [category, setCategory] = useState<DishCategory>(dish?.category ?? 'main');
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
      await onSave({ name, description: description || null, category }, selectedAllergies);
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Failed to save dish");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal title={dish ? 'Edit Dish' : 'Create Dish'} onClose={onClose} footerInside>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
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

          <div className="text-left">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as DishCategory)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-warm-500 focus:border-warm-500 sm:text-sm rounded-md border"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="capitalize">
                  {c}
                </option>
              ))}
            </select>
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

          <div className="text-left">
            <label className="block text-sm font-medium text-gray-700 mb-2">Contains Allergens</label>
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
