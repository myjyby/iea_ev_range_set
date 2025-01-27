import { processData, getURLParams, paramsMap } from './utils.mjs';
import { setup as setupSVG } from './svg.mjs';
import { selectRegion, filtersMenu } from './ui.mjs';

export const draw = async function (kwargs) {
	selectRegion(kwargs);
	filtersMenu(kwargs);

	const filters = getURLParams();
	const { region } = filters;
	
	const geo = await d3.json(`./data/geo/${paramsMap[region[0]].geo}.geojson`);
	const { svg, width, height } = setupSVG();

	const padding = 25;
	// REF: https://observablehq.com/@ericmauviere/le-fond-de-carte-simplifie-des-communes-2021-avec-droms-rapp
	// const proj = d3.geoConicConformal()
	// 	.parallels([33, 45])
	// 	.rotate([0, 0])
	// 	.fitExtent([[padding, padding],[width - padding, height - padding * 2]], geo);

	const proj = d3.geoMercator()
	.fitExtent([[padding, padding],[width - padding, height - padding * 2]], geo);

	const path = d3.geoPath(proj);
	
	svg.addElems('g', 'basemap')
	.addElems('path', 'outline', geo.features)
	.attr('d', path)
	.styles({
		'stroke': '#CACACA',
		'fill': 'transparent',
	});

	const centroid = turf.centroid(geo);
	overlay({ path, centroid, proj, width, height, filters, ...kwargs });
}
function overlay (kwargs) {
	const { path, centroid, proj, width, height, filters } = kwargs;
	const unique = processData({ filters, ...kwargs }).filter(d => d.distance > 0);

	const drag = d3.drag()
	.on('drag', function (e, d) {
		d[0] += e.dx;
		d[1] += e.dy;
		return overlay({ ...kwargs, centroid: turf.point(proj.invert(d)) });
	});

	const q1proj = turf.buffer(centroid, d3.quantile(unique.map(d => d.distance), 0), { units: 'kilometers' })
		.geometry.coordinates.map(d => {
		return d.map(c => {
			return proj(c);
		});
	});
	const q2proj = turf.buffer(centroid, d3.quantile(unique.map(d => d.distance), 0.25), { units: 'kilometers' })
		.geometry.coordinates.map(d => {
		return d.map(c => {
			return proj(c);
		});
	});
	const q3proj = turf.buffer(centroid, d3.quantile(unique.map(d => d.distance), 0.75), { units: 'kilometers' })
		.geometry.coordinates.map(d => {
		return d.map(c => {
			return proj(c);
		});
	});
	const q4proj = turf.buffer(centroid, d3.quantile(unique.map(d => d.distance), 1), { units: 'kilometers' })
		.geometry.coordinates.map(d => {
		return d.map(c => {
			return proj(c);
		});
	});
	const medproj = turf.buffer(centroid, d3.quantile(unique.map(d => d.distance), 0.5), { units: 'kilometers' })
		.geometry.coordinates.map(d => {
		return d.map(c => {
			return proj(c);
		});
	});

	const rangeplot = d3.select('svg')
	.addElems('g', 'rangeplot', [proj(centroid.geometry.coordinates)])
	.attr('transform', d => `translate(${d})`)
	.call(drag);

	rangeplot.addElems('circle', 'centroid')
	.attr('r', 5)
	.style('fill', '#000')

	const offset = rangeplot.addElems('g')
	.attr('transform', `translate(${proj(centroid.geometry.coordinates).map(d => -d)})`)

	const q2mask = offset.addElems('mask')
		.attr('id', 'percentile-mask')
	q2mask.addElems('rect')
		.attrs({
			'x': 0,
			'y': 0,
			'width': width,
			'height': height,
		}).style('fill', '#FFF');
	q2mask.addElems('path', 'q2', [q2proj])
	.attr('d', d => `M${d.join(' ')} z`)
	.style('fill', '#000');

	const q3 = offset.addElems('path', 'q3', [q3proj])
	.attrs({
		'd': d => `M${d.join(' ')} z`,
		'mask': 'url(#percentile-mask)',
	}).style('fill', 'rgba(0,0,0,.25)');

	const whiskers = offset.addElems('g', 'whiskers')
	whiskers.addElems('path', null, [q1proj, q4proj, medproj])
	.attr('d', d => `M${d.join(' ')} z`)
	.styles({
		'fill': 'none',
		'stroke': 'rgba(0,0,0,.75)',
	});
	whiskers.addElems('line', 'main', [[q1proj[0][0], q4proj[0][0]]])
	.attrs({
		'x1': d => d[0][0],
		'y1': d => d[0][1],
		'x2': d => d[1][0],
		'y2': d => d[1][1],
	}).styles({
		'fill': 'none',
		'stroke': 'rgba(0,0,0,.75)',
	});

	const bps = d3.scaleLinear(d3.extent(unique.map(d => d.distance)), [0, 200])
	const legend = d3.select('svg')
	.addElems('g', 'legend', [[d3.quantile(unique.map(d => d.distance), 0), d3.quantile(unique.map(d => d.distance), 0.25), d3.quantile(unique.map(d => d.distance), 0.5), d3.quantile(unique.map(d => d.distance), 0.75), d3.quantile(unique.map(d => d.distance), 1)]])
	.attr('transform', `translate(${[0, height - 120]})`)
	legend.addElems('rect', 'box')
	.attrs({
		'width': d => bps(d[3]) - bps(d[1]),
		'height': 40,
		'x': d => bps(d[1]),
	}).style('fill', 'rgba(0,0,0,.25)');
	legend.addElems('line', 'median')
	.attrs({
		'x1': d => bps(d[2]),
		'y1': 0,
		'x2': d => bps(d[2]),
		'y2': 40,
	}).styles({
		'fill': 'none',
		'stroke': 'rgba(0,0,0,.75)',
	});
	legend.addElems('text', 'label', d => d)
	.attr('transform', (d, i) => {
		return `translate(${[bps(d), -5 -(10 * (i === 2 ? 1 : 0))]})`
	})
	.text((d, i) => {
		if (i === 4) return `${Math.round(+d)} km`;
		else return Math.round(+d)
	});
	const legend_whiskers = legend.addElems('g', 'whiskers')
	.attr('transform', d => `translate(${[0, 20]})`)
	legend_whiskers.addElems('line', 'main')
	.attrs({
		'x1': 0,
		'y1': 0,
		'x2': d => bps(d[4]),
		'y2': 0,
	}).styles({
		'fill': 'none',
		'stroke': 'rgba(0,0,0,.75)',
	});
	legend_whiskers.addElems('line', 'sides', d => [d[0], d[4]])
	.attrs({
		'x1': d => bps(d),
		'y1': -10,
		'x2': d => bps(d),
		'y2': 10,
	}).styles({
		'fill': 'none',
		'stroke': 'rgba(0,0,0,.75)',
	});
}
function regionSelect () {

}