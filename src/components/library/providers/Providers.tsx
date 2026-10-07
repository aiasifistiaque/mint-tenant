'use client';

import { ChakraProvider } from '@chakra-ui/react';
import { Provider } from 'react-redux';

import { store } from '../store/store';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
	return children;
}
