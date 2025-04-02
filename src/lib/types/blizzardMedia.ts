export interface BlizzardCharacterMedia {
	_links: {
		self: {
			href: string;
		};
	};
	character: {
		key: {
			href: string;
		};
		name: string;
		id: number;
		realm: {
			key: {
				href: string;
			};
			name: string;
			id: number;
			slug: string;
		};
	};
	assets: {
		key: string;
		value: string;
	}[];
}
