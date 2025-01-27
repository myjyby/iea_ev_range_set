import { nest, processData } from '/js/utils.mjs';
import { setup as setupSVG } from '/js/svg.mjs';

export const draw = function (kwargs) {
	// const filters = {  };
	const filters = { 'region': ['Europe'], 'category': 'Bus' };
	const unique = processData({ filters, ...kwargs }).filter(d => d.distance > 0);
	const qt = d3.scaleQuantile(unique.map(d => d.distance), [1, 2, 3, 4]);
	const qtvalues = unique.map(d => { return [d.distance, qt(d.distance) ] });
	console.log(nest.call(qtvalues, d => d[1]))
	const quartiles = []

	qt.range().forEach(d => {
		const values = qtvalues.filter(c => c[1] === d);
		const min = Math.min(...values.map(c => c[0]));
		const max = Math.max(...values.map(c => c[0]));
		if (d === 2) quartiles.push(min);
		if (d === 3) quartiles.push(max);
	});
	console.log(quartiles)
	
	const { svg, width, height } = setupSVG();

	const sl = d3.scaleLinear([
		Math.min(...unique.map(d => d.distance)), 
		Math.max(...unique.map(d => d.distance))
	], [50, 200]);

	const g = svg.addElems('g')
	.attr('transform', `translate(${[ width / 2, height / 2 ]})`);

	const q3 = g.addElems('circle', 'q3', [Math.max(...quartiles)])
	.attrs({
		'cx': 0,
		'cy': 0,
		'r': d => sl(d),
	}).style('fill', 'orange');
	const q2 = g.addElems('circle', 'q2', [Math.min(...quartiles)])
	.attrs({
		'cx': 0,
		'cy': 0,
		'r': d => sl(d),
	}).style('fill', '#FFF');
	const q1q4 = g.addElems('circle', 'q1q4', sl.domain())
	.attrs({
		'cx': 0,
		'cy': 0,
		'r': d => sl(d),
	}).styles({
		'fill': 'none',
		'stroke': 'rgba(0,0,0,.25)',
	});
	const med = g.addElems('circle', 'median', [d3.median(unique, d => d.distance)])
	.attrs({
		'cx': 0,
		'cy': 0,
		'r': d => sl(d),
	}).styles({
		'fill': 'none',
		'stroke': 'rgba(0,0,0,.25)',
	});
	const whisker = g.addElems('line')
	.attrs({
		'x1': 0,
		'y1': -sl(Math.min(...unique.map(d => d.distance))),
		'x2': 0,
		'y2': -sl(Math.max(...unique.map(d => d.distance))),
	}).style('stroke', '#000')
	g.addElems('line', 'whisker-ends', [Math.min(...unique.map(d => d.distance)), Math.max(...unique.map(d => d.distance))])
	.attrs({
		'x1': -10,
		'y1': d => -sl(d),
		'x2': 10,
		'y2': d => -sl(d),
	}).style('stroke', '#000');

}