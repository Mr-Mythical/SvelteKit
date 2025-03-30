import type { BlizzardCharacterSummary } from './blizzard';
import type { BlizzardCharacterMedia } from './blizzardMedia';

export interface BlizzardCharacterFull extends BlizzardCharacterSummary {
	media: BlizzardCharacterMedia;
}