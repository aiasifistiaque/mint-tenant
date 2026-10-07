import { FC, useMemo } from 'react';
import {
	FormDivision,
	FormInput,
	getFieldValue,
	getOnChangeHandler as resolveOnChangeHandler,
	FormDivisionAccordion,
	FormItemAccordion,
} from '../../..';
import { Accordion, Text } from '@chakra-ui/react';
import { hiddenFormFields } from '../../../functions/formRules';
import { withFormulaValues } from '../../../functions/formula';

type FormMainType = {
	fields: any;
	formData: any;
	setFormData: any;
	setChangedData: any;
	isModal?: boolean;
};

const FormMain: FC<FormMainType> = ({
	fields,
	formData,
	setFormData,
	setChangedData,
	isModal = false,
}) => {
	const sections = useMemo(() => {
		let section: any[] = [];
		let sections: any[][] = [];

		if (!fields || !Array.isArray(fields)) return [];

		fields.forEach((field: any, i: number) => {
			section.push(field);
			if (field.endOfSection || i === fields.length - 1) {
				sections.push(section);
				section = [];
			}
		});

		return sections;
	}, [fields]);

	// WO-12: was a local duplicate of functions/getOnChangeHandler.ts that had
	// drifted (extra icon/video cases FormPage.tsx's copy never got). Both shells
	// now call the one shared resolver.
	const getOnChangeHandler = (type: string, key?: string) =>
		resolveOnChangeHandler({ type, key, formData, setFormData, setChangedData });

	// return <Text>{JSON.stringify(fields)}</Text>;

	// return sections.map((section: any, i: number) => (
	// 	<FormDivision
	// 		key={i}
	// 		isModal={isModal}>
	// 		{section?.map((item: any, i: number) => (
	// 			<FormItem
	// 				isHidden={item?.renderCondition && !item?.renderCondition(formData)}
	// 				item={item}
	// 				key={i}>
	// 				<>
	// 					<FormInput
	// 						formData={formData}
	// 						setFormData={setFormData}
	// 						setChangedData={setChangedData}
	// 						isRequired={item?.isRequired || false}
	// 						name={item?.name}
	// 						label={item?.label}
	// 						type={item?.type}
	// 						value={getFieldValue({ name: item?.name, formData })}
	// 						onChange={getOnChangeHandler(item?.type, item?.name)}
	// 						model={item?.model}
	// 						placeholder={item?.placeholder}
	// 						options={item?.options}
	// 						dataModel={item?.dataModel}
	// 						item={item}
	// 					/>
	// 				</>
	// 				{/* // )} */}
	// 			</FormItem>
	// 		))}
	// 	</FormDivision>
	// ));

	const FormContainer = ({ children, collapsible, section }: any) => {
		if (collapsible) {
			return (
				<FormDivisionAccordion
					title={section?.[0]?.sectionTitle || 'Section Title'}
					isModal={isModal}>
					{children}
				</FormDivisionAccordion>
			);
		}
		return (
			<FormDivision
				mb={4}
				isModal={isModal}>
				{children}
			</FormDivision>
		);
	};

	// Conditional fields (functions/formRules.ts): hidden while their rule
	// doesn't hold. Rules chain — a hidden field reads as empty to the rules
	// that depend on it — so if A shows B and B shows C, clearing A hides both.
	const hidden = hiddenFormFields(fields, formData);

	// Formula inputs show their value from the form as it will be saved: every
	// formula calculated, so one that uses another reads its result, not 0.
	const calculated = useMemo(() => withFormulaValues(formData, fields), [formData, fields]);

	return (
		<Accordion.Root
			display='flex'
			flexDirection='column'
			gap={isModal ? 0 : 4}
			multiple
			defaultValue={sections.map((_, i) => String(i))}>
			{sections.map((section: any, i: number) => (
				<FormDivisionAccordion
					title={section?.[0]?.sectionTitle || (sections.length > 1 ? `Section ${i + 1}` : 'Details')}
					description={section?.[0]?.sectionTitle ? section?.[0]?.description : undefined}
					value={String(i)}
					key={i}
					isModal={isModal}>
					{section?.map((item: any, i: number) => (
						<FormItemAccordion
							collapsible={true}
							isHidden={
								hidden.has(item?.name) ||
								(item?.renderCondition && !item?.renderCondition(formData))
							}
							item={item}
							key={i}>
							<>
								<FormInput
									formData={item?.type === 'formula' ? calculated : formData}
									setFormData={setFormData}
									setChangedData={setChangedData}
									isRequired={item?.isRequired || false}
									name={item?.name}
									label={item?.label}
									type={item?.type}
									value={getFieldValue({ name: item?.name, formData })}
									onChange={getOnChangeHandler(item?.type, item?.name)}
									model={item?.model}
									placeholder={item?.placeholder}
									options={item?.options}
									dataModel={item?.dataModel}
									item={item}
								/>
							</>
						</FormItemAccordion>
					))}
				</FormDivisionAccordion>
			))}
		</Accordion.Root>
	);
};

export default FormMain;
