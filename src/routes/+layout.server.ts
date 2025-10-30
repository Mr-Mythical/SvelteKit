export const load = async (event: any) => {
	const session = await event.locals.getSession();

	return {
		session
	};
};
