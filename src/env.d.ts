declare module '$env/static/private' {
	export const BLIZZARD_CLIENT_ID: string;
	export const BLIZZARD_CLIENT_SECRET: string;
	export const AUTH_SECRET: string;
	export const WCL_CLIENT_ID: string;
	export const WCL_CLIENT_SECRET: string;
	export const DATABASE_USER_URL: string;
}

declare module '$env/dynamic/private' {
	export const env: {
		BLIZZARD_CLIENT_ID: string;
		BLIZZARD_CLIENT_SECRET: string;
		AUTH_SECRET: string;
		WCL_CLIENT_ID: string;
		WCL_CLIENT_SECRET: string;
		DATABASE_USER_URL: string;
		[key: string]: string | undefined;
	};
}
