import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Users, UtensilsCrossed, Calendar, PlusCircle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

import { useAuth } from '../context/useAuth';
import { useMeals } from '../hooks/useMeals';

export function Home() {
  const { user } = useAuth();

  const { data: meals } = useMeals();

  const now = useMemo(() => new Date(), []);

  const upcomingMeal = useMemo(() => {
    return meals
      ?.filter((meal) => new Date(meal.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  }, [meals, now]);

  const recentMeals = useMemo(() => {
    return meals
      ?.filter((meal) => new Date(meal.date) < now)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
  }, [meals, now]);

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-warm-900 shadow-xl isolate">
        {/* Darkened overlay for better text contrast */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-warm-900 via-warm-800 to-warm-900" />
        
        {/* Decorative elements made more subtle */}
        <div className="absolute inset-y-0 right-1/2 -z-10 mr-16 w-[200%] origin-bottom-left skew-x-[-30deg] bg-white/5 shadow-xl shadow-warm-900/10 ring-1 ring-white/10 sm:mr-28 lg:mr-0 xl:mr-16 xl:origin-center" />
        
        <div className="px-6 py-12 sm:px-12 sm:py-16 lg:flex lg:items-center lg:gap-x-10 lg:px-16">
          <div className="mx-auto max-w-2xl lg:mx-0 lg:flex-auto">
             <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Welcome back, {user?.name}!
            </h1>
            <p className="mt-4 text-lg leading-8 text-warm-50">
              Hostmate helps you craft the perfect menu for every guest. Manage preferences, track allergies, and host with confidence.
            </p>
            <div className="mt-8 flex items-center gap-x-6">
              <Link
                to="/meals"
                className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-warm-900 shadow-sm hover:bg-warm-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Plan a Meal
              </Link>
              <Link to="/dishes" className="text-sm font-semibold leading-6 text-white hover:text-warm-100">
                Browse Dishes <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Upcoming Meal Card */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-warm-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-warm-600" />
            Next Event
          </h2>
          {upcomingMeal ? (
            <div className="bg-white rounded-2xl shadow-sm border border-warm-100 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">Upcoming</span>
                  <span className="text-sm text-gray-500">{format(new Date(upcomingMeal.date), 'EEEE, MMMM do')}</span>
                </div>
                <h3 className="text-2xl font-bold text-warm-900">{upcomingMeal.name}</h3>
                <p className="text-gray-600 mt-2 max-w-xl">{upcomingMeal.description || "No description provided."}</p>
              </div>
              <div className="flex-shrink-0">
                <Link 
                  to={`/meals?id=${upcomingMeal.id}`}
                  className="inline-flex items-center justify-center rounded-lg bg-warm-50 px-6 py-3 text-sm font-semibold text-warm-700 hover:bg-warm-100 hover:text-warm-800 transition-colors border border-warm-200"
                >
                  Manage Event
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : (
             <div className="bg-warm-50 rounded-2xl border-2 border-dashed border-warm-200 p-8 text-center">
                <Calendar className="mx-auto h-12 w-12 text-warm-300" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No upcoming meals</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by planning your next gathering.</p>
                <div className="mt-6">
                  <Link
                    to="/meals"
                    className="inline-flex items-center rounded-md bg-warm-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-warm-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warm-600"
                  >
                    <PlusCircle className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                    New Meal
                  </Link>
                </div>
              </div>
          )}

          {/* Recent History */}
          {recentMeals && recentMeals.length > 0 && (
            <div className="mt-10">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Past Events</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                 {recentMeals.map(meal => (
                    <Link key={meal.id} to={`/meals?id=${meal.id}`} className="block group">
                      <div className="bg-white rounded-lg p-4 shadow-sm border border-warm-100 hover:border-warm-300 transition-colors">
                        <div className="text-sm text-gray-400 mb-1">{format(new Date(meal.date), 'MMM d, yyyy')}</div>
                        <div className="font-medium text-warm-900 group-hover:text-warm-700 truncate">{meal.name}</div>
                      </div>
                    </Link>
                 ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats / Actions Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-warm-100 p-6">
             <div className="flex items-center gap-4 mb-4">
                <div className="bg-warm-100 p-3 rounded-lg">
                   <Users className="h-6 w-6 text-warm-600" />
                </div>
                <div>
                   <h3 className="font-semibold text-gray-900">Your Guests</h3>
                   <p className="text-xs text-gray-500">Manage preferences & invites</p>
                </div>
             </div>
             <Link to="/guests" className="block w-full text-center bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-2 rounded-lg transition-colors text-sm">
                Manage Guest List
             </Link>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-warm-100 p-6">
             <div className="flex items-center gap-4 mb-4">
                <div className="bg-warm-100 p-3 rounded-lg">
                   <UtensilsCrossed className="h-6 w-6 text-warm-600" />
                </div>
                <div>
                   <h3 className="font-semibold text-gray-900">Recipe Box</h3>
                   <p className="text-xs text-gray-500">Curate dishes & allergens</p>
                </div>
             </div>
             <Link to="/dishes" className="block w-full text-center bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-2 rounded-lg transition-colors text-sm">
                View All Dishes
             </Link>
          </div>
          
           <div className="bg-warm-50 rounded-xl p-6 border border-warm-200">
              <h4 className="font-medium text-warm-900 mb-2">Did you know?</h4>
              <p className="text-sm text-warm-700">
                You can send ranking links to guests without them needing an account. Their ratings help you build the perfect menu.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
