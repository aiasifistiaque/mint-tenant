const generateFormSections = (data: any) => {
	let section: any[] = [];
	let sections: any[][] = [];

	data.forEach((field: any, i: number) => {
		section.push(field);

		if (field.endOfSection || i === data.length - 1) {
			sections.push(section);
			section = [];
		}
	});

	return sections;
};

export default generateFormSections;
