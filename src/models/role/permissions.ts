const data: any = [
	'order',
	'product',
	'category',
	'brand',
	'content',
	'attribute',
	'user',
	'role',
	'customer',
	'collection',
	'content',
	'payment',
	'delivery',
	'ledger',
	'coupon',
	'review',
];

const transformData = (data: any) => {
	let result: any[] = [];
	data.forEach((item: any) => {
		const newPermission = [
			{
				label: `Add ${item}`,
				value: `add_${item}`,
			},
			{
				label: `View ${item}`,
				value: `view_${item}`,
			},
			{
				label: `Edit ${item}`,
				value: `edit_${item}`,
			},
			{
				label: `Delete ${item}`,
				value: `delete_${item}`,
			},
		];
		const newResult = [...result, ...newPermission];
		result = newResult;
	});
	return result;
};

const permissions = transformData(data);

export default permissions;
