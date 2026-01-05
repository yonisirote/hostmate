import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';

import { GuestRank } from '../src/pages/GuestRank';
import { db } from './msw/server';
import { renderAppRoutes } from './utils/render-app';

describe('guest ranking portal', () => {
  it('lets a guest rank dishes and persists via API', async () => {
    const user = userEvent.setup();

    renderAppRoutes({
      route: '/rank/token_alice',
      routes: [{ path: '/rank/:rankToken', element: <GuestRank /> }],
    });

    expect(await screen.findByText('Hi, Alice!')).toBeInTheDocument();

    // Find the row for Roast Chicken and select a different rating.
    expect(await screen.findByText('Roast Chicken')).toBeInTheDocument();

    const roast = screen.getByText('Roast Chicken');
    const container = roast.closest('li');
    expect(container).not.toBeNull();

    const buttons = container!.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(3);

    // Click 3-star
    await user.click(buttons[2] as HTMLButtonElement);

    // MSW db was updated
    const alice = db.guestByToken['token_alice'];
    expect(alice).toBeTruthy();
    expect(db.guestRanks[alice!.id]!.d_1).toBe(3);
  });
});
