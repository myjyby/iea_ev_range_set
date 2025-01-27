import { nest, strJoin, processData, getURLParams, valuesMap } from '/js/utils.mjs';

const hierarchy = [
	'region',
	'category',
	// 'vehicle_type',
	// 'available year',
	'distance',
];

export const draw = function (kwargs) {
	const filters = getURLParams();
	
	addTitleSection({ filters, ...kwargs });
	// const filters = { 'region': ['Europe', 'China'], 'category': 'HFT' };
	const unique = processData({ filters, ...kwargs });
	const maxDistance = Math.max(...unique.map(d => {
		let value = parseFloat(d['range (km)']);
		if (isNaN(value)) return 0;
		else return value;
	}));
	console.log(maxDistance)

	const container = d3.select('section.visualization')
		// .classed('offset-top', true);
	let parent = container.datum({ values: unique });
	console.log(unique)

	const groupCutOff = hierarchy.length - 1;

	for (let i = 0; i < hierarchy.length; i++) {
		parent = parent.addElems('div', `${hierarchy[i].replace(/[\s+\(\)]/g, '')}s flex group`, d => {
			const data = nest.call(d.values, hierarchy[i]);
			if (hierarchy[i] === 'distance') data.sort((a, b) => b.key - a.key);
			else if (hierarchy[i] === 'available year') {
				data.sort((a, b) => parseInt(a.key) - parseInt(b.key))
				data.forEach((c, j) => {
					if (j > 0 && !isNaN(parseInt(c.key))) c.key = `’${c.key.slice(-2)}`
				})
			} else data.sort((a, b) => a.key.toString().localeCompare(b.key.toString()));
			return [data];
		}).addElems('div', `${hierarchy[i].replace(/[\s+\(\)]/g, '')}`, d => d);
		
		if (i < groupCutOff) {
			parent.addElems('div', 'group-title')
				.styles({
					'top': `${i * 31}px`,
					'height': '30px',
				})
			.addElems('div', 'flex')
			.addElems('small')
				.style('font-size', `${12 - i * 2}px`)
			.html(d => d.key)
		} else if (i === hierarchy.length - 1) {
			parent.classed('flex', true)
		}
	}
	parent.each(function (d, i) {
		const sel = d3.select(this);
		if (i === 0) sel.classed('labeled', true);
	})
	const tracks = parent.addElems('div', 'track-container full-margin-bottom', d => d.values)
		.style('height', d => `${d.distance}px`)
	tracks.addElems('div', 'track')
	.each(function (d, i) {
		const sel = d3.select(this);
		sel.classed(d.technology.toLowerCase().trim(), true);
	}).style('height', d => `${d.distance}px`)
	tracks.addElems('div', 'vehicle')
		.attr('data-label', d => {
			if (d.distance === 0) return '';
			// else return `[${d.category}] ${d.vehicle_type}`;
			else return d.vehicle_type;
		})//.style('top', _ => `calc(45% - ${Math.floor(Math.random() * 100)}px)`)
	.each(function (d) {
		// Set up the information needed for detecting when the sticky element is stuck
		const stickyElementStyle = window.getComputedStyle(this);
		d.stickyTop = parseInt(stickyElementStyle.top, 10);
	}).html(d => '&nbsp;');

	// Set scale in background
	let axisgroup = container.addElems('div', 'axis')
	.style('top', `${groupCutOff * 30}px`);

	const scaleData = [new Array(Math.ceil(maxDistance / 100)).fill(0).map((d, i) => i * 100)];
	axisgroup.addElems('div', 'scale', scaleData)
	.addElems('div', 'tick', d => d)
	.styles({
		'height': `${100 * 2}px`,
	}).html(d => `${d} km`)
	
	// Set scroll behavior to show labels
	d3.select(window).on('scroll', determineStickyState);
}
function addTitleSection (kwargs) {
	const { filters, data } = kwargs;
	const section = d3.select('body')
	.insertElem(':first-child', 'section', 'title');
	
	section.addElems('h1')
	.html('How far do they go?')

	section.addElems('p')
	.html(`
		<i>Scroll down</i> to follow the race between different fleets of 
		<span class='filter' data-type='technology' data-def='green'>
			<button>green</button>
			<div class='options hide'></div>
		</span>
		<span class='filter' data-type='vehicle_type' data-def='vehicles'>
			<button>vehicles</button>
			<div class='options hide'></div>
		</span>
		available in 
		<span class='filter' data-type='region' data-def='different regions'>
			<button>different regions</button>
			<div class='options hide'></div>
		</span>
		and compare their range.
	`);
	section.selectAll('span.filter')
	.each(function () {
		const { type: key, def } = this.dataset;
		filterSelect.call(this, { key, ...kwargs });
		
		const sel = d3.select(this);
		sel.select('button')
		.html(_ => {
			const totalvalues = Array.from(new Set(data.map(d => d[key])));
			if (filters[key]?.length <= 3 && filters[key]?.length !== totalvalues.length) {
				const values = filters[key].map(d => valuesMap[d]?.lower || d)
				if (filters[key]?.length > 1) return `${values.slice(0, -1).join(', ')}, and ${values.slice(-1)}`;
				else return `${values.join(', ')}`;
			} else return def;
		});
	}).on('click', function () {
		d3.selectAll('div.options').classed('hide', true);
		d3.select(this).select('div.options').classed('hide', false);
	});
	d3.select(document).on('click', function (e) {
		if (!d3.select(e.srcElement).hasAncestor('filter')) d3.selectAll('span.filter div.options').classed('hide', true);
	});

	const legend = section.addElems('div', 'legend')
	.addElems('div', 'technology', Array.from(new Set(data.map(d => d['technology']))));
	
	legend.addElems('div', 'line')
	.each(function (d) {
		d3.select(this).classed(d.toLowerCase().trim(), true);
	});
	legend.addElems('div', 'vehicle');
	legend.addElems('label', null).html(d => `${(valuesMap[d]?.lower || d)} vehicle`);
}
function filterSelect (kwargs) {
	const { key, data, filters } = kwargs;
	const values = Array.from(new Set(data.map(d => d[key])));

	const options = d3.select(this)
	.select('div.options')
	.addElems('ul', null, [values])
	.addElems('li', null, d => d)

	options.addElems('input')
		.attrs({
			'type': 'checkbox',
			'id': d => d.toString().replace(/\s\./g, '').toLowerCase().trim(),
			'checked': d => {
				if (!filters[key]) return true;
				else if (filters[key]?.includes(d)) return true;
				else return null;
			},
		}).on('change', function (e, d) {
			const params = new URLSearchParams(window.location.search);
			if (this.checked) params.append(key, d);
			else if (!filters[key]) params.append(key, d);
			else params.delete(key, d);
			window.history.pushState('', '', `?${params.toString()}`);
			window.location.reload();
		});
	options.addElems('label')
		.attr('for', d => d.toString().replace(/\s\./g, '').toLowerCase().trim())
		.html(d => d);
}
function determineStickyState (e) {
	const scroll = this.scrollY;
	d3.selectAll('.vehicle')
	.each(function (d, i) {
		const { top, height } = this.getBoundingClientRect();
		const intTop = parseInt(top, 10);
		if ((intTop - 1) <= d.stickyTop && (intTop + 1) >= d.stickyTop && !d.startPos) {
			d.startPos = scroll - height;
		}
		// UPDATE THE HEIGHT OF THE TRACK
		const scale = Math.max(Math.min(((scroll - d.startPos) / d.distance) ?? 0, 1), 0);
		d3.select(this.previousElementSibling).style('transform', `scaleY(${scale})`);

		const { classList } = this;
		// classList.toggle('moving', Math.round(top) === Math.round(d.stickyTop));
		classList.toggle('stuck', top <= d.stickyTop);
	});
}