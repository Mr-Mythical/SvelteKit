export const handleError = ({ error, event }: { error: any; event: any }) => {
	console.error('An error occurred on the client side:', error, event);
};
