export const backgroundColorPlugin = {
	id: 'customBackgroundColor',
	beforeDraw: (chart: any) => {
		const { ctx, canvas } = chart;
		const borderRadius = 20;
		const padding = 1;

		const width = canvas.width;
		const height = canvas.height;

		ctx.save();
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		ctx.fillStyle = '#333333';
		ctx.strokeStyle = '#333333';
		ctx.lineWidth = 5;

		ctx.beginPath();
		ctx.moveTo(padding + borderRadius, padding);
		ctx.lineTo(padding + width - borderRadius, padding);
		ctx.quadraticCurveTo(padding + width, padding, padding + width, padding + borderRadius);
		ctx.lineTo(padding + width, padding + height - borderRadius);
		ctx.quadraticCurveTo(
			padding + width,
			padding + height,
			padding + width - borderRadius,
			padding + height
		);
		ctx.lineTo(padding + borderRadius, padding + height);
		ctx.quadraticCurveTo(padding, padding + height, padding, padding + height - borderRadius);
		ctx.lineTo(padding, padding + borderRadius);
		ctx.quadraticCurveTo(padding, padding, padding + borderRadius, padding);
		ctx.closePath();

		ctx.fill();
		ctx.stroke();

		ctx.restore();
	}
};
