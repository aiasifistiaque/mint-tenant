import mainApi from './mainApi';
import { User, ListType, TableProps } from '../store.types';

const BASE_LIMIT = 16;

export const ordersApi = mainApi.injectEndpoints({
	endpoints: builder => ({
		getAllOrders: builder.query<ListType<any>, TableProps>({
			query: ({
				sort = '-createdAt',
				page = 1,
				limit = BASE_LIMIT,
				search = '',
				isActive,
				filters = {},
			}) => ({
				url: 'orders',
				params: { sort, page, limit, search, isActive, ...filters },
			}),
			providesTags: ['orders'],
		}),
		addOrder: builder.mutation<any, any>({
			query: body => ({
				url: 'orders',
				method: 'POST',
				body,
			}),
			invalidatesTags: ['orders'],
		}),
		getCartTotal: builder.mutation<any, any>({
			query: body => ({
				url: 'orders/cart-total',
				method: 'POST',
				body,
			}),
			invalidatesTags: ['orders'],
		}),
	}),
});

export const { useGetAllOrdersQuery, useAddOrderMutation, useGetCartTotalMutation } = ordersApi;
