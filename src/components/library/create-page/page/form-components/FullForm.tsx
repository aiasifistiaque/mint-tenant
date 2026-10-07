import { FC, ReactNode } from 'react';
import { VInput, VSelect, VDataMenu } from '../../..';
import { Grid, GridProps } from '@chakra-ui/react';

type FullFormProps = {
	layout: number[];
	dataModel: any;
	formData: any;
	setFormData: any;
	children?: ReactNode;
};

const FullForm: FC<FullFormProps> = ({ layout, dataModel, formData, setFormData, children }) => {
	const handleChange = (e: any) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};
	return (
		<>
			{layout?.map((item: number, i: number) => {
				const startIndex = layout.slice(0, i).reduce((acc, val) => acc + val, 0);
				const endIndex = startIndex + item;

				const fieldsArray = Object.values(dataModel);
				const rowFields = fieldsArray.slice(startIndex, endIndex);

				return (
					<Row
						cols={`repeat(${item}, 1fr)`}
						key={i}>
						{rowFields.map((field: any, j: number) => {
							if (!field) return null;
							if (field?.type === 'text') {
								return (
									<VInput
										key={j}
										{...field}
										value={formData[field?.name]}
										onChange={handleChange}
									/>
								);
							}
							if (field?.type === 'select') {
								return (
									<VSelect
										key={j}
										{...field}
										value={formData[field?.name]}
										onChange={handleChange}>
										<option
											value=''
											disabled
											selected>
											Select option
										</option>
										{field?.options?.map((option: any, i: number) => (
											<option
												key={i}
												value={option?.value}>
												{option?.label}
											</option>
										))}
									</VSelect>
								);
							}
							if (field?.type === 'date') {
								return (
									<VInput
										key={j}
										{...field}
										value={formData[field?.name]}
										onChange={handleChange}
									/>
								);
							}
							if (field?.type === 'data-menu') {
								return (
									<VDataMenu
										key={j}
										{...field}
										value={formData[field?.name]}
										onChange={handleChange}
									/>
								);
							}
							return (
								<VInput
									key={j}
									{...field}
									value={formData[field?.name]}
									onChange={handleChange}
								/>
							);
						})}
					</Row>
				);
			})}
			{children}
		</>
	);
};

const Row = ({ children, cols, ...props }: GridProps & { children: ReactNode; cols?: string }) => (
	<Grid
		pb={4}
		gridTemplateColumns={{ base: '1fr', md: cols || '1fr 1fr' }}
		gap={2}
		{...props}>
		{children}
	</Grid>
);

export default FullForm;
