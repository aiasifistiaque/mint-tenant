import { Center, Flex } from '@chakra-ui/react';
import { FC } from 'react';

import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import { HiArrowUturnLeft, HiArrowUturnRight } from 'react-icons/hi2';

import { useIsMobile, useAppDispatch, useAppSelector } from '../../hooks';
import { SelectContainer, SquareButton, TableHeading, updateTable } from '../..';
import { SHOW_PER_PAGE_OPTIONS } from '../..';
import { SelectInput, CurrentPage } from './_components';

//Migration Checked

type PaginationProps = {
	data: any;
	showPerPage?: boolean;
};

const Pagination: FC<PaginationProps> = ({ data, showPerPage = true }) => {
	const { page, limit } = useAppSelector(state => state.table);
	const dispatch = useAppDispatch();
	const isMobile = useIsMobile();

	const update = ({ setPage, setLimit }: { setPage?: number; setLimit?: number }) => {
		dispatch(updateTable({ page: setPage, limit: setLimit }));
	};

	const toStart = () => update({ setPage: 1 });

	const toLast = () => update({ setPage: data?.totalPages });

	const next = () => {
		if (page < data?.totalPages) update({ setPage: page + 1 });
	};

	const back = () => update({ setPage: page - 1 });

	const perpage = (
		<>
			{!isMobile && (
				<TableHeading
					fontSize='11px'
					letterSpacing='0.06em'
					color='fg.muted'
					whiteSpace='nowrap'>
					ROWS
				</TableHeading>
			)}
			<SelectContainer
				size='xs'
				w='76px'
				value={limit}
				onChange={(e: any) => update({ setLimit: e.target.value })}>
				{SHOW_PER_PAGE_OPTIONS.map(({ value, label }) => (
					<option
						key={value}
						value={value}>
						{label}
					</option>
				))}
			</SelectContainer>
		</>
	);

	const isFirstPage = page <= 1;
	const isLastPage = !data?.totalPages || page >= data?.totalPages;

	return (
		<Flex
			justify='flex-end'
			align='center'
			gap={{ base: 2, md: 4 }}>
			{showPerPage && (
				<Center
					gap={2}
					display={{ base: 'none', md: 'flex' }}>
					{perpage}
				</Center>
			)}

			<Flex
				align='center'
				gap={0.5}>
				<SquareButton
					label='To the beginning'
					onClick={toStart}
					disabled={isFirstPage}>
					<HiArrowUturnLeft size={15} />
				</SquareButton>
				<SquareButton
					label='Previous Page'
					onClick={back}
					disabled={isFirstPage}>
					<IoIosArrowBack size={17} />
				</SquareButton>

				<CurrentPage>
					{!isMobile
						? `Page ${page} of ${data?.totalPages || '--'}`
						: `${page}/${data?.totalPages || '--'}`}
				</CurrentPage>
				<SquareButton
					label='Next Page'
					onClick={next}
					disabled={isLastPage}>
					<IoIosArrowForward size={17} />
				</SquareButton>
				<SquareButton
					label='To the end'
					onClick={toLast}
					disabled={isLastPage}>
					<HiArrowUturnRight size={15} />
				</SquareButton>
			</Flex>
		</Flex>
	);
};

export default Pagination;
