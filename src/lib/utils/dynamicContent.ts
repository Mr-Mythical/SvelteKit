export function createDynamicContent() {
	const classNames = [
		'content-highlight',
		'featured-section',
		'showcase-area',
		'info-zone',
		'resource-content'
	];

	const randomClass = classNames[Math.floor(Math.random() * classNames.length)];

	return {
		className: randomClass,
		dataAttribute: `data-${randomClass.replace('-', '_')}`,
		timestamp: Date.now()
	};
}

export function createRotatingUrl(): string {
	const methods = [
		() => '/api/redirect?t=Z3VpZGU=',
		() => '/api/redirect?t=dG9vbHM=',
		() => '/api/redirect?t=cmVzb3VyY2U=' // Base64: resource
	];

	const index = Math.floor(Date.now() / 30000) % methods.length;
	return methods[index]();
}

export function createDecoyElements() {
	if (typeof document === 'undefined') return;

	const decoy = document.createElement('div');
	decoy.className = 'advertisement banner-promotion';
	decoy.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0;';
	document.body.appendChild(decoy);

	setTimeout(() => {
		if (document.body.contains(decoy)) {
			document.body.removeChild(decoy);
		}
	}, 5000);
}
