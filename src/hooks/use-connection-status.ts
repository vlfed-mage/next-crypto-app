import { useAtomValue } from 'jotai';

import { connectionStatusAtom } from '@/atoms/connection';

export function useConnectionStatus() {
  return useAtomValue(connectionStatusAtom);
}
