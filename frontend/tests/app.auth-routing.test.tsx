import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';

import { ProtectedRoute } from '../src/components/ProtectedRoute';
import { Home } from '../src/pages/Home';
import { Login } from '../src/pages/Login';
import { renderAppRoutes } from './utils/render-app';

describe('auth + routing', () => {
  it('redirects unauthenticated users to /login', async () => {
    renderAppRoutes({
      route: '/',
      routes: [
        {
          path: '*',
          element: (
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Home />} />
              </Route>
            </Routes>
          ),
        },
      ],
    });

    expect(await screen.findByText('Sign in to Hostmate')).toBeInTheDocument();
  });

  it('renders home after refresh token + stored user', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 'u_1', name: 'Host', username: 'host' }));

    renderAppRoutes({
      route: '/',
      routes: [
        {
          path: '*',
          element: (
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Home />} />
              </Route>
            </Routes>
          ),
        },
      ],
    });

    expect(await screen.findByText(/Welcome back, Host!/)).toBeInTheDocument();
  });
});
