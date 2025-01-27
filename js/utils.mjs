export const strJoin = '---';

export const nest = function (key, keep) {
  // THIS IS NOT QUITE THE SAME FUNCTION AS IN distances.js, THIS MORE CLOSELY RESEMBLES d3.nest
  const arr = [];
  this.forEach((d) => {
    const groupby = typeof key === 'function' ? key(d) : d[key];
    if (!arr.find((c) => c.key === groupby)) {
      if (keep) {
        const obj = {};
        obj.key = groupby;
        obj.values = [d];
        obj.count = 1;
        if (Array.isArray(keep)) keep.forEach((k) => (obj[k] = d[k]));
        else obj[keep] = d[keep];
        arr.push(obj);
      } else arr.push({ key: groupby, values: [d], count: 1 });
    } else {
      arr.find((c) => c.key === groupby).values.push(d);
      arr.find((c) => c.key === groupby).count++;
    }
  });
  return arr;
};

export const chunk = function (size) {
  const groups = [];
  for (let i = 0; i < this.length; i += size) {
    groups.push(this.slice(i, i + size));
  }
  return groups;
};

export const sequence = function (size) {
  const sequences = [];
  for (let i = 0; i < this.length; i++) {
    if (i + size <= this.length) {
      const sequence = this.slice(i, i + size);
      sequences.push(sequence);
    }
  }
  return sequences;
};

export const getObjKey = function (value) {
  return Object.keys(this).find(k => this[k] === value);
}

export const processData = function (kwargs) {
  let { data, columns, filters } = kwargs || {};
  if (!data || !columns) return [];

  data.forEach(d => {
    for (let key in d) {
      d[key] = d[key].toString().toLowerCase().trim();
    }
  })

  if (filters && Object.keys(filters).length > 0) {
    for (let key in filters) {
      if (key !== 'product') {
        let values = filters[key]?.map(d => d.toString().toLowerCase());
        if (!Array.isArray(values)) values = [values]
        data = data.filter(d => values.includes(d[key]));
      }
    }
  }

  const unique = nest.call(data, d => `${columns.map(c => d[c]).join(strJoin)}`)
  .flatMap(d => d.values[0]);
  
  unique.forEach(d => {
    d.distance = parseFloat(d['range (km)']);
    if (isNaN(d.distance)) d.distance = 0;
    else d.distance = d.distance * 2;
  });
  unique.sort((a, b) => b.distance - a.distance);

  return unique;
}

export const getURLParams = function () {
  const obj = {}
  const params = new URLSearchParams(window.location.search);
  params.forEach((d, k) => {
    if (obj[k]) obj[k].push(d);
    else obj[k] = [d];
  });
  return obj;
}

export const paramsMap = {
  'Europe': {
    key: 'Europe',
    geo: 'europe',
  },
  'U.S. & Canada': {
    key: 'U.S. & Canada',
    geo: 'north-america'
  },
  'China': {
    key: 'China',
    geo: 'china',
  },
  'India': {
    key: 'India',
    geo: 'india',
  },
  'Latin America': {
    key: 'Latin America',
    geo: 'latin-america',
  },
  'Australia': {
    key: 'Australia',
    geo: 'australia',
  },
}

export const valuesMap = {
  'Fuel Cell': {
    lower: 'fuel cell',
  },
  'Electric': {
    lower: 'electric',
  },
  'Transit bus': {
    lower: 'transit bus',
  },
  'Cargo van': {
    lower: 'cargo van',
  },
  'School bus': {
    lower: 'school bus',
  },
  'MD truck': {
    lower: 'MD truck',
  },
  'Other': {
    lower: 'other',
  },
  'HD truck': {
    lower: 'HD truck',
  },
  'Yard tractor': {
    lower: 'yard tractor',
  },
  'Shuttle bus': {
    lower: 'shuttle bus',
  },
  'School Bus': {
    lower: 'school bus',
  },
  'Cargo Van': {
    lower: 'cargo van',
  },
  'MD step van': {
    lower: 'MD step van',
  },
  'HD Truck': {
    lower: 'HD truck',
  },
  'Transit Bus': {
    lower: 'transit bus',
  },
  'MD Truck': {
    lower: 'MD truck',
  },
  'Bus': {
    lower: 'bus',
  },
  'MFT': {
    lower: 'MFT',
  },
  'Minibus': {
    lower: 'minibus',
  },
  'HFT': {
    lower: 'HFT',
  },
}