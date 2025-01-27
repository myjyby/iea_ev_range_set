export const get = function () {
	return d3.select('section.visualization')
	.addElem('svg')
		.attr('id', 'canvas');
}
export const setup = function () {
	const { clientWidth: cw, clientHeight: ch, offsetWidth: ow, offsetHeight: oh } = d3.select('.visualization').node();
	const width = Math.round(Math.min(cw ?? ow, ch ?? oh));
	const height = width;
	
	const svg = get();

	if (!svg.classed('setup')) {
		svg.classed('setup', true)
		.attrs({ 
			'x': 0,
			'y':0,
			'viewBox': `0 0 ${width} ${height}`,
			'preserveAspectRatio': 'xMidYMid meet'
		}).append('g');
	}
	return { svg, width, height };
}