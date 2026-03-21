import type { ConnectionStatus } from '@/transport/types';

import { atom } from 'jotai';

export const connectionStatusAtom = atom<ConnectionStatus>('disconnected');
