export interface BlizzardCharacterSummary {
	_links: {
		self: {
			href: string;
		};
	};
	id: number;
	name: string;
	gender: {
		type: 'MALE' | 'FEMALE';
		name: string;
	};
	faction: {
		type: 'ALLIANCE' | 'HORDE';
		name: string;
	};
	race: {
		key: {
			href: string;
		};
		name: string;
		id: number;
	};
	character_class: {
		key: {
			href: string;
		};
		name: string;
		id: number;
	};
	active_spec: {
		key: {
			href: string;
		};
		name: string;
		id: number;
	};
	realm: {
		key: {
			href: string;
		};
		name: string;
		id: number;
		slug: string;
	};
	guild?: {
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
		faction: {
			type: string;
			name: string;
		};
	};
	level: number;
	experience: number;
	achievement_points: number;
}
