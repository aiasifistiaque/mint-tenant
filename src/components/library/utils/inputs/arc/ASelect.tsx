// import { Portal } from '@ark-ui/react/portal';
// import { Select, createListCollection } from '@ark-ui/react/select';
// import { ChevronDownIcon } from 'lucide-react';
// ;
// import { FormControl } from '..';

// type InputContainerProps = any & {
// 	label: string;
// 	isRequired?: boolean;
// 	helper?: string;
// 	value: string | boolean | number;
// 	children: ReactNode;
// 	placeholder?: any;
// 	options: { value: string; label: string }[];
// };

// const ASelect: FC<InputContainerProps> = ({
// 	label,
// 	isRequired,
// 	placeholder,
// 	value,
// 	helper,
// 	children,
// 	options,
// 	...props
// }) => {
// 	const collection = createListCollection({ items: options });

// 	return (
// 		<FormControl
// 			isRequired={isRequired}
// 			label={label}
// 			helper={helper}>
// 			<Select.Root collection={collection}>
// 				<Select.Label style={{ backgroundColor: 'red' }}>{label}</Select.Label>
// 				<Select.Control>
// 					<Select.Trigger>
// 						<Select.ValueText placeholder={placeholder || label} />
// 						<Select.Indicator>
// 							<ChevronDownIcon />
// 						</Select.Indicator>
// 					</Select.Trigger>
// 					{/* <Select.ClearTrigger>Clear</Select.ClearTrigger> */}
// 				</Select.Control>
// 				<Portal>
// 					<Select.Positioner>
// 						<Select.Content>
// 							<Select.ItemGroup>
// 								{/* <Select.ItemGroupLabel>Frameworks</Select.ItemGroupLabel> */}
// 								{collection.items.map((item: any) => (
// 									<Select.Item
// 										key={item.value}
// 										item={item}>
// 										<Select.ItemText>{item?.label}</Select.ItemText>
// 										<Select.ItemIndicator>✓</Select.ItemIndicator>
// 									</Select.Item>
// 								))}
// 							</Select.ItemGroup>
// 						</Select.Content>
// 					</Select.Positioner>
// 				</Portal>
// 				<Select.HiddenSelect />
// 			</Select.Root>
// 		</FormControl>
// 	);
// };

// export default ASelect;

const ASelect = () => {
	return <div>ASelect</div>;
};

export default ASelect;
