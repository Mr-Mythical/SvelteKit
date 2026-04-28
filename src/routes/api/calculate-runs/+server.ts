import type { RequestHandler } from '@sveltejs/kit';
import {
	scoreFormula,
	calculateKeystoneBreakdown,
	type KeystoneBreakdown
} from '$lib/calculations/keystoneCalculations';
import { dungeonCount } from '$lib/types/dungeons';
import { apiError, apiOk } from '$lib/server/apiResponses';

interface CalculateRunsResponse {
	targetScore: number;
	totalScore: number;
	breakdown: KeystoneBreakdown[];
}

export const GET: RequestHandler = ({ url }) => {
	const scoreParam = url.searchParams.get('score');

	if (!scoreParam) {
		return apiError('Missing score parameter', 400);
	}

	const targetScore = parseInt(scoreParam, 10);

	if (isNaN(targetScore) || targetScore < 0) {
		return apiError('Invalid score parameter. Must be a positive number.', 400);
	}

	const breakdown = calculateKeystoneBreakdown(targetScore, dungeonCount);

	// Calculate actual total score from breakdown
	let totalScore = 0;
	for (const item of breakdown) {
		totalScore += scoreFormula(item.level, 1) * item.count;
	}

	return apiOk<CalculateRunsResponse>({
		targetScore,
		totalScore,
		breakdown
	});
};
