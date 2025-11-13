declare module '@auth/core/types' {
	interface Session {
		accessToken?: string;
		user: User;
	}

	interface User {
		id: string;
		name?: string | null;
		email?: string | null;
		image?: string | null;
		battletag?: string;
	}

	interface JWT {
		accessToken?: string;
		battletag?: string;
	}
}
