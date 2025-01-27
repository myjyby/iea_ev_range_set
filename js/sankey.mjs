import { nest, sequence, getObjKey, strJoin } from '/js/utils.mjs';
import { setup as setupSVG } from '/js/svg.mjs';

export const draw = function (kwargs) {
	const { nodes, links } = processData(kwargs);
	// SET UP SVG
	const { svg, width, height } = setupSVG();
	console.log(nodes)

	const xscale = d3.scaleLinear()
		.domain([0, nodes.length - 1])
		.range([0, width]);
	const yscale = d3.scaleLinear()
		.domain([0, Math.max(...nodes.map(d => d.count))])
		.range([0, height]);

	const paths = links.map(d => {
		return d.map(c => {
			const path = c.shape.map((b, j) => {
				const [ x, y ] = b;
				// if (j === 1 || j === c.shape.length - 2) return `Q ${xscale(x)} ${yscale(y)}`;
				// else return `${xscale(x)} ${yscale(y)}`;
				return `${xscale(x)} ${yscale(y)}`;
			});
			return { path: `M ${path.join(' ')} Z`, data: c };
		});
	});
	
	const gLinks = svg.addElems('g', 'link-group', paths)
	.on('mouseover', function () {
		d3.select(this).moveToFront();
	});
	gLinks.addElems('path', 'link', d => d)
	.attr('d', d => {
		return d.path;
	}).on('click', (e, d) => {
		console.log(d.data);
	});

	const gNodes = svg.addElems('g', 'node-group', nodes)
	.attr('transform', (d, i) => `translate(${[xscale(i), 0]})`)
	gNodes.addElems('path', 'node', d => d.data)
	.attr('d', d => `M 0 ${yscale(d.start) + 3} 0 ${yscale(d.end) - 3}`);
}

function processData (kwargs) {
	let { data, columns } = kwargs;
	
	const categoryMap = new Map();
	const categories = columns.map(d => {
		const nesting = nest.call(data, c => c[d].toLowerCase().trim());
		nesting.sort((a, b) => b.count - a.count);
		const total = d3.sum(nesting, c => c.count);
		const positions = generatePositions(nesting, total, 0);
		// INSTANTIATE THE MAP
		positions.forEach(c => {
			categoryMap.set(c.key, c.start);
		});
		return { key: d, data: positions, count: total };
	});
	console.log(categories)
	console.log(categoryMap)

	const full_connections = nest.call(data, d => `${columns.map(c => d[c]).join(strJoin)}`);
	const category_indexes = categories.flatMap(d => {
		return d.data.map((c, j) => {
			return { key: c.key, index: j };
		});
	});
	console.log(category_indexes)
	full_connections.forEach(d => {
		d.indexes = d.key.split(strJoin).map(c => {
			return category_indexes.find(b => b.key === c.toLowerCase().trim()).index;
		});
	});
	full_connections.sort((a, b) => {
		return b.indexes[0] - a.indexes[0]
		|| a.indexes[1] - b.indexes[1]
		|| a.indexes[2] - b.indexes[2]
		|| a.indexes[3] - b.indexes[3]
		|| a.indexes[4] - b.indexes[4]
		|| a.indexes[5] - b.indexes[5]
		|| b.count - a.count;
	})
	console.log(full_connections) // this shows duplicate entries

	const links = full_connections.map((d, i) => {
		const seq = sequence.call(d.key.split(strJoin), 2);
		const innerMap = new Map();
		const data = seq.map(s => {
			let [ source, target ] = s;
			const sCat = getObjKey.call(d.values[0], source);
			const tCat = getObjKey.call(d.values[0], target);
			// need to transform source and target here to get the values in categoryMap
			source = source.toLowerCase().trim();
			target = target.toLowerCase().trim();
			const sStart = categoryMap.get(source);
			const sEnd = sStart + d.count;
			const tStart = +categoryMap.get(target);
			const tEnd = tStart + d.count;
			innerMap.set(source, sEnd);
			innerMap.set(target, tEnd);
			const xStart = categories.findIndex(c => c.key === sCat);
			const xEnd = categories.findIndex(c => c.key === tCat);
			// establish the index weight
			// const idxWeight = d3.mean([
			// 	categories.find(c => c.key === sCat).data.findIndex(c => c.key === source), 
			// 	categories.find(c => c.key === tCat).data.findIndex(c => c.key === target),
			// ])
			
			return { 
				source: { 
					category: sCat, 
					value: source,
					y_start: sStart,
					y_end: sEnd,
					x: xStart,
				}, 
				target: {
					category: tCat,
					value: target,
					y_start: tStart,
					y_end: tEnd,
					x: xEnd,
				}, 
				count: d.count, 
				path_id: i,
				shape: [
					[xStart, sStart],
					// [xStart + (xEnd - xStart) / 2, sStart + Math.abs(tStart - sStart) / 2],
					[xEnd, tStart],
					[xEnd, tEnd],
					// [xStart + (xEnd - xStart) / 2, sEnd + Math.abs(tEnd - sEnd) / 2],
					[xStart, sEnd],
				],
				// idxWeight,
			};
		});

		innerMap.forEach((v, k) => {
			categoryMap.set(k, v);
		});

		return data;
	});
	
	return { nodes: categories, links };
}

function generatePositions (data, total, prev) {
	if (!prev) prev = 0;
	const data_total = d3.sum(data, d => d.count);
	if (data_total !== total) return console.log('There is a discrepancy between totals. This means there are missing values in the data.');

	const positions = [];

	data.forEach((d, i) => {
		if (i > 0) prev = positions[positions.length - 1].end;
		positions.push({ key: d.key, start: prev, end: prev + d.count, count: d.count });
	});
	return positions;
}