import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { Home, Users, UtensilsCrossed, Calendar, LogOut } from 'lucide-react';
import { cn } from '../lib/api';

export function Layout() {
  const { logout, user } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Guests', href: '/guests', icon: Users },
    { name: 'Dishes', href: '/dishes', icon: UtensilsCrossed },
    { name: 'Meals', href: '/meals', icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col">
      <nav className="bg-white border-b border-warm-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-bold text-warm-700">Hostmate</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        isActive
                          ? 'border-warm-500 text-warm-900'
                          : 'border-transparent text-gray-500 hover:border-warm-300 hover:text-warm-700',
                        'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium'
                      )}
                    >
                      <item.icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center">
              <span className="mr-4 text-sm text-gray-500">Hi, {user?.name}</span>
              <button
                onClick={logout}
                className="p-2 rounded-full text-gray-400 hover:text-warm-600 focus:outline-none"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
