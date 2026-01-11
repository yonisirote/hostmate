import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';

import { ProtectedRoute } from '../src/components/ProtectedRoute';
import { Home } from '../src/pages/Home';
import { Login } from '../src/pages/Login';
import { server } from './msw/server';
import { renderAppRoutes } from './utils/render-app';

describe('auth refresh loop prevention', () => {
  it('redirects to /login when refresh returns 401 (no infinite refresh)', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 'u_1', name: 'Host', username: 'host' }));

    let refreshCalls = 0;

    server.use(
      http.post('/api/auth/refresh', () => {
        refreshCalls += 1;
        return HttpResponse.json({ message: 'Invalid refresh token' }, { status: 401 });
      })
    );

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
    expect(refreshCalls).toBe(1);
  });
});
