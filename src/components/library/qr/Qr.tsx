// import  { FC } from 'react';
// import { Box, Skeleton } from '@chakra-ui/react';
// import { QRCode } from 'react-qrcode-logo';

// type QrProps = {
// 	outerEyeRadius?: number;
// 	quietZone?: number;
// 	qrStyle?: 'squares' | 'dots' | 'fluid';
// 	bgColor?: string;
// 	fgColor?: string;
// 	pixelColor?: string;
// 	innerEyeRadius?: number;
// 	size?: number;
// 	target: string;
// 	isLoading: boolean;
// 	id?: string;
// };

// const uri =
// 	'https://thumbs.dreamstime.com/b/plate-fork-spoon-restaurant-logo-white-background-eps-plate-fork-spoon-restaurant-logo-193685698.jpg';

// const Qr: FC<QrProps> = ({
// 	outerEyeRadius = 4,
// 	bgColor = '#fff',
// 	fgColor = '#000',
// 	pixelColor = '#000',
// 	quietZone = 10,
// 	innerEyeRadius = 4,
// 	qrStyle = 'squares',
// 	size = 300,
// 	target,
// 	isLoading,
// 	id,
// }) => {
// 	const calculateBorderRadius = (outerEyeRadius: number): number => {
// 		const borderRadius = outerEyeRadius * 2;
// 		return borderRadius > 16 ? 16 : borderRadius;
// 	};

// 	if (isLoading) {
// 		return (
// 			<Skeleton
// 				borderRadius={16}
// 				height={size}
// 				width={size}
// 			/>
// 		);
// 	}

// 	return (
// 		<Box
// 			p={2}
// 			borderRadius={16}
// 			borderWidth={1}
// 			overflow='hidden'>
// 			<Box
// 				id={id}
// 				bg={bgColor}
// 				borderRadius={calculateBorderRadius(outerEyeRadius)}>
// 				<QRCode
// 					{...{
// 						logoPadding: 30,
// 					}}
// 					ecLevel='H'
// 					// logoImage={uri}
// 					//logoPadding={30}
// 					logoWidth={100}
// 					removeQrCodeBehindLogo={true}
// 					logoPaddingStyle='circle'
// 					quietZone={quietZone}
// 					size={size - quietZone * 2}
// 					qrStyle={qrStyle}
// 					eyeRadius={{
// 						outer: outerEyeRadius,
// 						inner: innerEyeRadius,
// 					}}
// 					bgColor={'transparent'}
// 					fgColor={fgColor}
// 					eyeColor={pixelColor}
// 					value={target}
// 				/>
// 			</Box>
// 		</Box>
// 	);
// };

// export default Qr;

const Qr = () => {
	return <div>Qr</div>;
};

export default Qr;
