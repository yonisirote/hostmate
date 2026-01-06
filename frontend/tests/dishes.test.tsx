import { screen } from '@testing-library/react';

import { Dishes } from '../src/pages/Dishes';
import { renderAppRoutes } from './utils/render-app';

import userEvent from '@testing-library/user-event';

import { db } from './msw/server';

describe('dishes page', () => {
  it('shows dishes grouped by filters', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 'u_1', name: 'Host', username: 'host' }));

    renderAppRoutes({ route: '/dishes', routes: [{ path: '/dishes', element: <Dishes /> }] });

    expect(await screen.findByText('My Dishes')).toBeInTheDocument();
    expect(await screen.findByText('Roast Chicken')).toBeInTheDocument();
    expect(await screen.findByText('Garden Salad')).toBeInTheDocument();
    expect(await screen.findByText('Chocolate Cake')).toBeInTheDocument();
  });

  it('filters dishes by category chips', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 'u_1', name: 'Host', username: 'host' }));

    const user = userEvent.setup();
    renderAppRoutes({ route: '/dishes', routes: [{ path: '/dishes', element: <Dishes /> }] });

    await screen.findByText('My Dishes');

    await user.click(screen.getByRole('button', { name: 'dessert' }));

    expect(await screen.findByText('Chocolate Cake')).toBeInTheDocument();
    expect(screen.queryByText('Roast Chicken')).not.toBeInTheDocument();
  });

  it('creates a dish and shows it in the list', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 'u_1', name: 'Host', username: 'host' }));

    const user = userEvent.setup();
    renderAppRoutes({ route: '/dishes', routes: [{ path: '/dishes', element: <Dishes /> }] });

    await screen.findByText('My Dishes');

    await user.click(screen.getByRole('button', { name: 'Create Dish' }));

    await user.type(screen.getByLabelText('Name'), 'Miso Soup');
    await user.type(screen.getByLabelText('Description'), 'Savory');

    await user.selectOptions(screen.getByLabelText('Category'), 'other');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Miso Soup')).toBeInTheDocument();
    expect(db.dishes.some((d) => d.name === 'Miso Soup')).toBe(true);
  });
});
