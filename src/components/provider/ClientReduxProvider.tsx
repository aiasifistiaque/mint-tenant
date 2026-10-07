'use client';

import { store } from '@/components/library';
import { Provider } from 'react-redux';

export default function ClientReduxProvider({ children }: { children: React.ReactNode }) {
	return <Provider store={store}>{children}</Provider>;
}
