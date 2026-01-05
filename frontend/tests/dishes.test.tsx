import { screen } from '@testing-library/react';

import { Dishes } from '../src/pages/Dishes';
import { renderAppRoutes } from './utils/render-app';

describe('dishes page', () => {
  it('shows dishes grouped by filters', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 'u_1', name: 'Host', username: 'host' }));

    renderAppRoutes({ route: '/dishes', routes: [{ path: '/dishes', element: <Dishes /> }] });

    expect(await screen.findByText('My Dishes')).toBeInTheDocument();
    expect(await screen.findByText('Roast Chicken')).toBeInTheDocument();
    expect(await screen.findByText('Garden Salad')).toBeInTheDocument();
    expect(await screen.findByText('Chocolate Cake')).toBeInTheDocument();
  });
});
