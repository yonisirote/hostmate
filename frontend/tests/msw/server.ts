import { setupServer } from 'msw/node';

import { createDb, createHandlers } from './handlers';

export const db = createDb();
export const server = setupServer(...createHandlers(db));
