import { Flex, Text } from '@chakra-ui/react';
import { FaStar } from 'react-icons/fa';

const UserRating = ({ rating, setRating }: { rating: number; setRating: any }) => {
	//const [rating, setRating] = useState(0);

	return (
		<Flex
			flexDir='column'
			gap={2}
			pt='15px'
			fontFamily='Bebas Neue'>
			<Text>Rate Us</Text>
			<Flex gap={1}>
				{[...Array(5)].map((star, i) => {
					const ratingValue = i + 1;

					return (
						<label
							key={i}
							onClick={() => setRating(ratingValue)}>
							<input
								style={{ display: 'none' }}
								type='radio'
								name='rating'
								value={ratingValue}
							/>
							<FaStar
								color={ratingValue <= rating ? '#ffc107' : '#e4e5e9'}
								size={30}
							/>
						</label>
					);
				})}
			</Flex>
		</Flex>
	);
};

export default UserRating;
