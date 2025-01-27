import { nest, strJoin } from '/js/utils.mjs';
import { draw as drawSankey } from '/js/sankey.mjs';
import { draw as drawRace } from '/js/race.mjs';
import { draw as drawRange } from '/js/rangeplot.mjs';
import { draw as drawMap } from '/js/map.mjs';

async function onLoad () {
	const data = await d3.csv('/data/data.csv');
	const { columns } = data;
	// console.log(data.filter(d => d['technology'] === 'Fuel Cell').length)

	const values = columns.filter(d => !['range (km)'].includes(d)).map(d => {
		return { col: d, values: Array.from(new Set(data.flatMap(c => c[d]))) }
	});
	console.log(Array.from(new Set(values.flatMap(d => d.values))))

	// drawSankey({ data, columns });
	drawRace({ data, columns });
	// drawRange({ data, columns });
	// drawMap({ data, columns });
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', function () {
		onLoad();
	});
} else {
	(async () => { await onLoad() })();
}