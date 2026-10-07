import axios from 'axios';

const URL = {
	backend: process.env.NEXT_PUBLIC_BACKEND,
	api: process.env.NEXT_PUBLIC_BACKEND,
};

const imageHandler = async ({ ref }: any) => {
	const input = document.createElement('input');
	input.setAttribute('type', 'file');
	input.setAttribute('accept', 'image/*');
	input.click();

	input.onchange = async () => {
		const file = input.files ? input.files[0] : null;
		const quillObj: any = (ref as any)?.current?.getEditor();
		const range = quillObj?.getSelection();

		if (file) {
			const formData = new FormData();
			formData.append('image', file);
			try {
				const { data } = await axios.post(`${URL.backend}/api/upload`, formData, {
					headers: {
						'Content-Type': 'multipart/form-data',
					},
				});

				if (data) {
					quillObj.editor.insertEmbed(range.index, 'image', data?.Location);
				}
			} catch (e) {
				console.log(e);
			}
		}
	};
};

export default imageHandler;
