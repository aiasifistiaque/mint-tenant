import { TemplateProps } from '@/types';
import React, { FC } from 'react';
import { NotLoggedIn, ColorMode } from '@/components/library';

const PX_BASE = '16px';
const PX_MD = '64px';
const PX_LG = '128px';

const template: FC<TemplateProps> = ({ children }) => {
	return (
		<NotLoggedIn>
			{/* <Navbar borderBottomWidth={2} px={8}>
				<Heading size='md'>{labels.HEADER_TITLE}</Heading>
			</Navbar>
			<Body css={styles.body}>
				<Center flexDir='column' gap={2} textAlign='center'>
					<Heading>Login</Heading>
				</Center> */}
			{/* <Flex css={styles.container}> */}
			{children}
			{/* <Button variant='link'>Forgot Password?</Button> */}
			{/* </Flex>
			</Body> */}
			<ColorMode />
		</NotLoggedIn>
	);
};

const styles = {
	body: {
		py: 16,
		pt: 24,
		gap: 6,
		flexDir: 'column',
		w: '100%',
		minH: '100vh',
	},
	container: {
		gap: 6,
		flexDir: 'column',
		flex: 1,
		w: '100%',
		px: { base: PX_BASE, md: PX_MD, lg: PX_LG },
	},
};

export default template;
