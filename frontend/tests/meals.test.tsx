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

  it('updates menu based on per-category counts', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 'u_1', name: 'Host', username: 'host' }));

    const user = userEvent.setup();
    renderAppRoutes({ route: '/meals', routes: [{ path: '/meals', element: <Meals /> }] });

    const mealRow = await screen.findByText('Friday Dinner');
    await user.click(mealRow);

    // default is 3, but MSW db only has 1 main
    expect(await screen.findByText('Roast Chicken')).toBeInTheDocument();

    const mainsInput = screen.getByLabelText('Mains');
    await user.clear(mainsInput);
    await user.type(mainsInput, '0');

    expect(await screen.findByText('No suitable main found.')).toBeInTheDocument();
  });
});
