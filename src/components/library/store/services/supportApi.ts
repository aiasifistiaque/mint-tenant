import mainApi from './mainApi';

/**
 * The Support page (backend controllers/support/supportTickets). Any signed-in
 * admin opens tickets and talks to the support team in each ticket's thread;
 * the team's table is the ordinary `support-tickets` route.
 */

export type TicketStatus = 'open' | 'in-progress' | 'waiting' | 'resolved' | 'closed';

export type TicketReply = {
	_id: string;
	author?: { _id: string; name?: string } | null;
	message: string;
	images?: string[];
	staff?: boolean;
	createdAt: string;
};

export type SupportTicket = {
	_id: string;
	code?: string;
	name: string;
	description: string;
	category?: string;
	priority?: string;
	status: TicketStatus;
	images?: string[];
	addedBy?: { _id: string; name?: string } | null;
	assignedTo?: { _id: string; name?: string } | null;
	replies?: TicketReply[];
	replyCount?: number;
	lastReplyAt?: string;
	lastReplyBy?: 'staff' | 'requester';
	createdAt: string;
	updatedAt: string;
};

export type TicketThread = { doc: SupportTicket; viewer: { staff: boolean; owner: boolean } };

export type NewTicket = {
	name: string;
	description: string;
	category?: string;
	priority?: string;
	images?: string[];
};

const threadTags = (id: string) => [{ type: 'ticket-thread' as const, id }, 'my-tickets', 'support-tickets'];

export const supportApi = mainApi.injectEndpoints({
	endpoints: builder => ({
		getMyTickets: builder.query<{ doc: SupportTicket[] }, void>({
			query: () => 'support-tickets/open/mine',
			providesTags: ['my-tickets'],
		}),
		openTicket: builder.mutation<{ _id: string; code?: string; status: TicketStatus }, NewTicket>({
			query: body => ({ url: 'support-tickets/open', method: 'POST', body }),
			invalidatesTags: ['my-tickets', 'support-tickets'],
		}),
		getTicketThread: builder.query<TicketThread, string>({
			query: id => `support-tickets/thread/${id}`,
			providesTags: (_r, _e, id) => [{ type: 'ticket-thread', id }],
		}),
		replyToTicket: builder.mutation<TicketThread, { id: string; message: string; images?: string[] }>({
			query: ({ id, ...body }) => ({ url: `support-tickets/thread/${id}/reply`, method: 'POST', body }),
			invalidatesTags: (_r, _e, { id }) => threadTags(id),
		}),
		setTicketStatus: builder.mutation<TicketThread, { id: string; status: TicketStatus }>({
			query: ({ id, status }) => ({ url: `support-tickets/thread/${id}/status`, method: 'POST', body: { status } }),
			invalidatesTags: (_r, _e, { id }) => threadTags(id),
		}),
	}),
});

export const {
	useGetMyTicketsQuery,
	useOpenTicketMutation,
	useGetTicketThreadQuery,
	useReplyToTicketMutation,
	useSetTicketStatusMutation,
} = supportApi;
