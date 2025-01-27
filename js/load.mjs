import { nest, strJoin, getURLParams } from './utils.mjs';
import { draw as drawSankey } from './sankey.mjs';
import { draw as drawRace } from './race.mjs';
import { draw as drawRange } from './rangeplot.mjs';
import { draw as drawMap } from './map.mjs';

async function onLoad () {
	const data = await d3.csv('./data/data.csv');
	const { columns } = data;

	const filters = getURLParams();
	if (+filters['product']?.[0] === 2) drawMap({ data, columns });
	else drawRace({ data, columns });

	// drawSankey({ data, columns });
	// drawRange({ data, columns });
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', function () {
		onLoad();
	});
} else {
	(async () => { await onLoad() })();
}