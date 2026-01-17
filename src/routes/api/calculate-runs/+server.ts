import type { RequestHandler } from '@sveltejs/kit';
import {
	scoreFormula,
	calculateKeystoneBreakdown,
	type KeystoneBreakdown
} from '$lib/utils/keystoneCalculations';
import { dungeonCount } from '$lib/types/dungeons';

interface CalculateRunsResponse {
	targetScore: number;
	totalScore: number;
	breakdown: KeystoneBreakdown[];
	error?: string;
}

export const GET: RequestHandler = async ({ url }) => {
	const scoreParam = url.searchParams.get('score');

	if (!scoreParam) {
		return new Response(
			JSON.stringify({
				error: 'Missing score parameter',
				breakdown: [],
				totalScore: 0,
				targetScore: 0
			} as CalculateRunsResponse),
			{
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}

	const targetScore = parseInt(scoreParam, 10);

	if (isNaN(targetScore) || targetScore < 0) {
		return new Response(
			JSON.stringify({
				error: 'Invalid score parameter. Must be a positive number.',
				breakdown: [],
				totalScore: 0,
				targetScore: 0
			} as CalculateRunsResponse),
			{
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}

	const breakdown = calculateKeystoneBreakdown(targetScore, dungeonCount);

	// Calculate actual total score from breakdown
	let totalScore = 0;
	for (const item of breakdown) {
		totalScore += scoreFormula(item.level, 1) * item.count;
	}

	return new Response(
		JSON.stringify({
			targetScore,
			totalScore,
			breakdown
		} as CalculateRunsResponse),
		{
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		}
	);
};
