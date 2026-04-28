const WCL_REPORT_CODE = /^[a-zA-Z0-9]{16}$/;

function maybeParseUrl(raw: string): URL | null {
	try {
		return new URL(raw);
	} catch (_err) {
		// Allow host-only inputs like "warcraftlogs.com/reports/...".
		if (/^warcraftlogs\.com\//i.test(raw) || /^www\.warcraftlogs\.com\//i.test(raw)) {
			try {
				return new URL(`https://${raw}`);
			} catch {
				return null;
			}
		}
		return null;
	}
}

export function extractWarcraftLogsReportCode(rawInput: string): string | null {
	const raw = rawInput.trim();
	if (!raw) return null;

	if (WCL_REPORT_CODE.test(raw)) return raw;

	const parsedUrl = maybeParseUrl(raw);
	if (parsedUrl) {
		const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
		for (let i = 0; i < pathParts.length - 1; i += 1) {
			if (pathParts[i].toLowerCase() !== 'reports') continue;
			const candidate = pathParts[i + 1];
			if (WCL_REPORT_CODE.test(candidate)) return candidate;
		}
	}

	// Fallback for malformed input that still contains a valid report slug.
	const match = raw.match(/(?:^|\/reports\/)([a-zA-Z0-9]{16})(?=$|[\/?#])/);
	if (match?.[1] && WCL_REPORT_CODE.test(match[1])) return match[1];

	return null;
}
