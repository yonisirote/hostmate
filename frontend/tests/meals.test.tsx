import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Meals } from '../src/pages/Meals';
import { renderAppRoutes } from './utils/render-app';

describe('meals page', () => {
  it('shows meals list and suggested menu', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 'u_1', name: 'Host', username: 'host' }));

    renderAppRoutes({ route: '/meals', routes: [{ path: '/meals', element: <Meals /> }] });

    expect(await screen.findByText('Your Meals')).toBeInTheDocument();
    const user = userEvent.setup();

    const mealRow = await screen.findByText('Friday Dinner');
    expect(mealRow).toBeInTheDocument();

    await user.click(mealRow);

    expect(await screen.findByText('Suggested Menu')).toBeInTheDocument();
  });
});
