import { processData, getURLParams, paramsMap } from '/js/utils.mjs';
import { draw as drawMap } from '/js/map.mjs';

export const selectRegion = function (kwargs) {
	const { data, multiple, fn } = kwargs || {};
	const filters = getURLParams();
	const regions = Array.from(new Set(data.map(d => d['region'])));

	const select = d3.select('section.visualization')
	.addElems('select', 'select-region')
		// .attr('multiple', multiple || null)
	.on('change', function (e, d) {
		const params = new URLSearchParams();
		params.set('region', this.value)
		window.history.pushState('', '', `?${params.toString()}`);
		window.location.reload();
	})
	select.addElems('option', null, regions)
		.attr('value', d => d)
		.html(d => d);

	select.node().value = filters['region'][0];
}
export const filtersMenu = function (kwargs) {
	const filters = getURLParams();
	const unique = processData({ filters: { region: filters['region'] }, ...kwargs }).filter(d => d.distance > 0);

	const columns = Array.from(new Set(unique.flatMap(d => Object.keys(d))))
	.filter(d => !['range (km)', 'distance', 'region'].includes(d))
	.sort((a, b) => a.localeCompare(b));
	
	const filter_categories = d3.select('section.filters')
	.addElems('ul', null, [columns])
	.addElems('li', 'category', d => { 
		return d.map(c => {
			const values = Array.from(new Set(unique.map(b => b[c])));
			return { key: c, values };
		})
	})
	filter_categories.addElems('input')
		.each(d => console.log(d))
		.attrs({
			'type': 'checkbox',
			'id': d => d.key.toString().replace(/\s\./g, '').toLowerCase().trim(),
			'checked': d => {
				if (!filters[d.key]) return true;
				else if (d.values.every(c => filters[d.key]?.includes(c))) return true;
				else return null;
			},
		})
	.on('change', function (e, d) {
		const params = new URLSearchParams(window.location.search);
		d.values.forEach(c => {
			params.append(d.key, c);
		});
		window.history.pushState('', '', `?${params.toString()}`);
		window.location.reload();
	});
	filter_categories.addElems('label')
		.attr('for', d => d.key.toString().replace(/\s\./g, '').toLowerCase().trim())
		.html(d => d.key.replace(/_/g, ' '));
	
	const filters_values = filter_categories.addElems('ul', null, d => {
		if (d.key === 'available year') d.values.sort((a, b) => parseInt(a) - parseInt(b));
		else d.values.sort((a, b) => a.localeCompare(b));
		return [d.values.map(c => { return { key: d.key, value: c } })];
	}).addElems('li', 'value', d => d);
	filters_values.addElems('input')
		.attrs({
			'type': 'checkbox',
			'id': d => d.value.toString().replace(/\s\./g, '').toLowerCase().trim(),
			'checked': d => {
				if (!filters[d.key]) return true;
				else if (filters[d.key]?.includes(d.value)) return true;
				else return null;
			},
		})
	.on('change', function (e, d) {
		const params = new URLSearchParams(window.location.search);
		if (this.checked) params.append(d.key, d.value);
		else if (!filters[d.key]) params.append(d.key, d.value);
		else params.delete(d.key, d.value);
		window.history.pushState('', '', `?${params.toString()}`);
		window.location.reload();
	});
	filters_values.addElems('label')
		.attr('for', d => d.value.toString().replace(/\s\./g, '').toLowerCase().trim())
		.html(d => d.value)
}