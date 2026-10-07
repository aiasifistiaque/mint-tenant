type TableObjectProps = {
	padding: {
		bottom: number;
	};
	border: {
		color: {
			light: string;
			dark: string;
		};
		width: number;
		radius: number;
	};
	bg: {
		light: string;
		dark: string;
	};
	stroke: {
		light: string;
		dark: string;
	};
	row: {
		height: string;
		hover: {
			light: string;
			dark: string;
		};
	};
	cell: {
		paddingX: number;
		paddingY: number;
		fontSize: { base: string; md: string };
	};
	head: {
		fontSize: string;
		letterSpacing: string;
		fontWeight: string;
		height: string;
		paddingY: number;
	};
};

const TABLE: TableObjectProps = {
	padding: {
		bottom: 0,
	},

	border: {
		color: {
			light: 'table.outerBorder.light',
			dark: 'table.outerBorder.dark',
		},
		width: 1,
		// Matches `radius.CONTAINER`, so a table and a panel sitting on the same
		// page share a corner instead of being 2px apart.
		radius: 8,
	},
	bg: {
		light: 'container.newLight',
		dark: 'table.dark',
	},
	stroke: {
		// light: 'container.borderLight',
		light: 'red',
		dark: 'transparent',
	},
	row: {
		// A minimum, not a fixed height — a cell that wraps still grows. It only
		// sets how tall a single-line row is, so it wants to be the tightest
		// height that still reads as a row rather than a list item.
		height: '40px',
		hover: {
			light: 'table.row.hoverLight',
			dark: 'table.row.hoverDark',
		},
	},
	cell: {
		paddingX: 3,
		paddingY: 2,
		// 13px on desktop. The previous `.9rem` (14.4px) sat awkwardly between
		// body copy and data — close enough to the 14px prose size that a table
		// read as a paragraph rather than as a grid of values.
		fontSize: { base: '1rem', md: '13px' },
	},
	head: {
		fontSize: '11px',
		letterSpacing: '0.04em',
		// 500, not 600. At 11px uppercase, semibold column labels compete with
		// the data they are labelling; the uppercasing and letter-spacing are
		// already doing the work of making them read as headers.
		fontWeight: '500',
		height: '36px',
		// Applied to the `th` itself. Chakra's table recipe already pads the
		// column header, so Title used to stack its own `py` on top of that and
		// the label ended up with 16px of air on each side; this replaces the
		// recipe's padding instead of adding to it.
		paddingY: 2,
	},
};

export default TABLE;
