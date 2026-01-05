import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import { vi } from 'vitest';

const getClipboard = () => {
  const maybeNav = navigator as unknown as { clipboard?: { writeText?: (text: string) => Promise<void> } };
  return maybeNav.clipboard;
};

import { Guests } from '../src/pages/Guests';
import { renderAppRoutes } from './utils/render-app';

describe('guests page', () => {
  it('loads and displays guests', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 'u_1', name: 'Host', username: 'host' }));

    renderAppRoutes({ route: '/guests', routes: [{ path: '/guests', element: <Guests /> }] });

    expect(await screen.findByText('Guests')).toBeInTheDocument();
    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(await screen.findByText('Bob')).toBeInTheDocument();
  });

  it('copies an invite link', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 'u_1', name: 'Host', username: 'host' }));

    const user = userEvent.setup();

    const clipboard = getClipboard();
    if (!clipboard?.writeText) {
      throw new Error('Missing navigator.clipboard.writeText (test env)');
    }

    const writeTextSpy = vi.spyOn(clipboard, 'writeText');

    renderAppRoutes({ route: '/guests', routes: [{ path: '/guests', element: <Guests /> }] });

    await screen.findByText('Alice');

    const copyButtons = await screen.findAllByTitle('Copy Invite Link');
    await user.click(copyButtons[0]!);

    await vi.waitFor(() => {
      expect(writeTextSpy).toHaveBeenCalledWith(expect.stringMatching(/\/rank\//));
    });
  });
});
