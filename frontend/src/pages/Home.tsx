import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { Users, UtensilsCrossed, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Meal } from '../types';

export function Home() {
  const { user } = useAuth();
  
  const { data: meals } = useQuery<Meal[]>({
    queryKey: ['meals'],
    queryFn: async () => {
      const { data } = await api.get('/meals');
      return data;
    },
  });

  // Get upcoming meal (closest future date)
  const upcomingMeal = meals
    ?.filter(m => new Date(m.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  return (
    <div className="space-y-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-3xl font-bold text-warm-900">Welcome home, {user?.name}!</h1>
        <p className="mt-2 text-gray-600">Ready to plan your next gathering?</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Quick Actions */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-warm-100 rounded-md p-3">
                <Users className="h-6 w-6 text-warm-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Manage Guests</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      <Link to="/guests" className="text-warm-600 hover:text-warm-500">View all guests &rarr;</Link>
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-warm-100 rounded-md p-3">
                <UtensilsCrossed className="h-6 w-6 text-warm-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Curate Dishes</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      <Link to="/dishes" className="text-warm-600 hover:text-warm-500">View your recipes &rarr;</Link>
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-warm-100 rounded-md p-3">
                <Calendar className="h-6 w-6 text-warm-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Plan Meals</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      <Link to="/meals" className="text-warm-600 hover:text-warm-500">Start planning &rarr;</Link>
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {upcomingMeal && (
        <div className="bg-gradient-to-r from-warm-500 to-warm-600 rounded-lg shadow-lg text-white p-6">
          <h2 className="text-xl font-bold">Upcoming: {upcomingMeal.name}</h2>
          <p className="mt-1 opacity-90">{format(new Date(upcomingMeal.date), 'EEEE, MMMM do, yyyy')}</p>
          <p className="mt-4">{upcomingMeal.description}</p>
          <div className="mt-6">
            <Link 
              to={`/meals?id=${upcomingMeal.id}`} // We might handle query params in Meals page to open it
              className="bg-white text-warm-600 px-4 py-2 rounded-md font-medium hover:bg-warm-50 transition-colors"
            >
              View Details
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
