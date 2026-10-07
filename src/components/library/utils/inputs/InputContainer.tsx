import { Grid, Flex, FlexProps } from '@chakra-ui/react';
import { ReactNode, FC } from 'react';

import { Label, Column, FormControl } from '../..';

type InputContainerProps = FlexProps & {
	children: ReactNode;
	label?: string;
	isRequired?: boolean;
	helper?: string;
};

const InputContainer: FC<InputContainerProps> = ({
	children,
	label,
	isRequired,
	helper,
	...props
}) => {
	return (
		<FormControl
			label={label}
			helper={helper}
			as={Grid}
			isRequired={isRequired}
			css={styles.container}>
			{/* // {label && (
			// 	<Flex align='center'>
			// 		<Label>{label}</Label>
			// 	</Flex>
			// )} */}
			<Column>
				{children}
				{/* {helper && <FormHelperText css={styles.helper}>{helper}</FormHelperText>} */}
			</Column>
		</FormControl>
	);
};

export default InputContainer;

const styles = {
	container: {
		gridTemplateColumns: '1fr 5fr',
		gap: 1,
		_notLast: {
			borderBottomWidth: 1,
			borderColor: 'border.muted',
		},
		py: 4,
		_last: { pb: 0 },
		_first: { pt: 0 },
	},
	label: {
		m: 0,
		fontWeight: '700',
	},
	helper: {
		fontSize: '12px',
		px: 3,
		color: 'fg.muted',
	},
};
