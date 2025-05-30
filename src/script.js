mapboxgl.accessToken = 'pk.eyJ1IjoiaGFzaWFiZXdhcmRhbmEiLCJhIjoiY21iN3JycXZjMGZraDJscHQ3czdwdGQ1aiJ9.HLtIx8mK74V9DPmVsP9M8A'; // Replace with your token
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v11',
  center: [174.886, -41.286],
  zoom: 4,
  pitch: 45
});

map.on('load', () => {
  // Earthquake points
  map.addSource('earthquakes', {
    type: 'geojson',
    data: '/data/cleaned_earthquakes.geojson'
  });
  map.addLayer({
    id: 'earthquakes-layer',
    type: 'circle',
    source: 'earthquakes',
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['get', 'magnitude'], 3, 3, 10, 10],
      'circle-color': ['interpolate', ['linear'], ['get', 'depth'], 0, '#00ffcc', 100, '#008066'],
      'circle-opacity': 0.8,
      'circle-stroke-color': '#006652',
      'circle-stroke-width': 1
    }
  });
  // Regional boundaries
  map.addSource('regions', {
    type: 'geojson',
    data: '/data/regional_council_2022.geojson'
  });
  map.addLayer({
    id: 'regions-layer',
    type: 'fill',
    source: 'regions',
    paint: {
      'fill-color': '#888888',
      'fill-opacity': 0.4,
      'fill-outline-color': '#000000'
    }
  });
  // Major earthquakes
  map.addSource('major-earthquakes', {
    type: 'geojson',
    data: '/data/major_earthquakes.geojson'
  });
  map.addLayer({
    id: 'major-earthquakes-layer',
    type: 'circle',
    source: 'major-earthquakes',
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['get', 'magnitude'], 7, 15, 10, 40],
      'circle-color': '#ff0000',
      'circle-opacity': 0.8,
      'circle-stroke-color': '#660000',
      'circle-stroke-width': 1
    }
  });
});

// Timeline slider
const slider = document.getElementById('year-slider');
const yearDisplay = document.getElementById('year-display');
slider.addEventListener('input', () => {
  const year = slider.value;
  yearDisplay.textContent = year;
  map.setFilter('earthquakes-layer', ['<=', ['get', 'origintime'], `${year}-12-31`]);
  map.setFilter('major-earthquakes-layer', ['<=', ['get', 'origintime'], `${year}-12-31`]);
});

// Pulse animation
let pulseInterval;
let pulseEnabled = true;

map.on('load', () => {
  // Initially add pulse layer
  // addPulseLayer();

  // Toggle checkbox listener
  document.getElementById('toggle-pulse').addEventListener('change', function () {
    pulseEnabled = this.checked;
    if (pulseEnabled) {
      addPulseLayer();
    } else {
      removePulseLayer();
    }
  });
});

function addPulseLayer() {
  if (!map.getLayer('earthquakes-pulse')) {
    map.addLayer({
      id: 'earthquakes-pulse',
      type: 'circle',
      source: 'earthquakes',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['get', 'magnitude'], 3, 5, 10, 12],
        'circle-opacity': 0.8,
        'circle-color': '#004d3d'
      }
    });
  }

  startPulseAnimation();
}

function startPulseAnimation() {
  stopPulseAnimation(); // Clear any existing interval
  pulseInterval = setInterval(() => {
    if (map.getLayer('earthquakes-pulse')) {
      map.setPaintProperty('earthquakes-pulse', 'circle-opacity', Math.random() * 0.8);
    }
  }, 500);
}

function stopPulseAnimation() {
  clearInterval(pulseInterval);
}

function removePulseLayer() {
  stopPulseAnimation();
  if (map.getLayer('earthquakes-pulse')) {
    map.removeLayer('earthquakes-pulse');
  }
}

// Filters
const magFilter = document.getElementById('mag-filter');
const depthFilter = document.getElementById('depth-filter');
const regionFilter = document.getElementById('region-filter');
function updateFilters() {
  const mag = magFilter.value;
  const depth = depthFilter.value;
  const region = regionFilter.value;
  let filter = ['all', true];
  if (mag !== 'all') {
    if (mag.includes('+')) {
      const min = parseFloat(mag.replace('+', ''));
      filter.push(['>=', ['get', 'magnitude'], min]);
    } else {
      const [min, max] = mag.split('-').map(parseFloat);
      filter.push(['>=', ['get', 'magnitude'], min]);
      filter.push(['<', ['get', 'magnitude'], max]);
    }
  }
  if (depth !== 'all') {
    if (depth.includes('+')) {
      const min = parseFloat(depth.replace('+', ''));
      filter.push(['>=', ['get', 'depth'], min]);
    } else {
      const [min, max] = depth.split('-').map(parseFloat);
      filter.push(['>=', ['get', 'depth'], min]);
      filter.push(['<', ['get', 'depth'], max]);
    }
  }
  /* if (region !== 'all') {
    filter = ['all', filter, ['==', ['get', 'Region'], region]];
  } */
  map.setFilter('earthquakes-layer', filter);
  map.setFilter('major-earthquakes-layer', filter);
  if (region === 'Northland') map.flyTo({ center: [173.88, -35.57], zoom: 7 });
  else if (region === 'Auckland') map.flyTo({ center: [174.76, -36.85], zoom: 8 });
  else if (region === 'Waikato') map.flyTo({ center: [175.28, -37.78], zoom: 8 });
  else if (region === 'Bay of Plenty') map.flyTo({ center: [176.25, -38.15], zoom: 8 });
  else if (region === 'Gisborne') map.flyTo({ center: [178.02, -38.66], zoom: 8 });
  else if (region === 'Hawkes Bay') map.flyTo({ center: [176.84, -39.49], zoom: 8 });
  else if (region === 'Taranaki') map.flyTo({ center: [174.07, -39.06], zoom: 8 });
  else if (region === 'Manawatu-Whanganui') map.flyTo({ center: [175.51, -39.92], zoom: 8 });
  else if (region === 'Wellington') map.flyTo({ center: [174.78, -41.29], zoom: 8 });
  else if (region === 'Tasman') map.flyTo({ center: [172.62, -41.30], zoom: 8 });
  else if (region === 'Nelson') map.flyTo({ center: [173.28, -41.27], zoom: 9 });
  else if (region === 'Marlborough') map.flyTo({ center: [173.95, -41.58], zoom: 8 });
  else if (region === 'West Coast') map.flyTo({ center: [171.21, -42.45], zoom: 8 });
  else if (region === 'Canterbury') map.flyTo({ center: [172.64, -43.53], zoom: 8 });
  else if (region === 'Otago') map.flyTo({ center: [169.72, -45.52], zoom: 8 });
  else if (region === 'Southland') map.flyTo({ center: [168.87, -46.41], zoom: 8 });
  else map.flyTo({ center: [174.886, -41.286], zoom: 4 });  // Default view (NZ)
}
magFilter.addEventListener('change', updateFilters);
depthFilter.addEventListener('change', updateFilters);
regionFilter.addEventListener('change', updateFilters);

// Pop-ups
map.on('click', ['earthquakes-layer', 'major-earthquakes-layer'], (e) => {
  const props = e.features[0].properties;
  new mapboxgl.Popup()
    .setLngLat(e.lngLat)
    .setHTML(`<h3>M${props.magnitude}</h3><p>Date: ${props.origintime}<br>Depth: ${props.depth}km<br>Region: ${props.Region || 'Unknown'}</p>`)
    .addTo(map);
});
map.on('mouseenter', ['earthquakes-layer', 'major-earthquakes-layer'], () => {
  map.getCanvas().style.cursor = 'pointer';
});
map.on('mouseleave', ['earthquakes-layer', 'major-earthquakes-layer'], () => {
  map.getCanvas().style.cursor = '';
});

// Reset button
document.getElementById('reset').addEventListener('click', () => {
  map.setFilter('earthquakes-layer', null);
  map.setFilter('major-earthquakes-layer', null);
  map.flyTo({ center: [174.886, -41.286], zoom: 4 });
  magFilter.value = 'all';
  depthFilter.value = 'all';
  regionFilter.value = 'all';
  slider.value = 1900;
  yearDisplay.textContent = 1900;
  updateFilters();
});

// Timeline chart
fetch('/data/quake_frequency.csv')
  .then(response => response.text())
  .then(data => {
    const rows = data.split('\n').slice(1).map(row => row.split(','));
    const years = rows.map(row => row[0]);
    const counts = rows.map(row => row[1]);
    new Chart(document.getElementById('timeline-chart'), {
      type: 'bar',
      data: {
        labels: years,
        datasets: [{ label: 'Quake Frequency', data: counts, backgroundColor: '#cc3300' }]
      },
      options: { scales: { y: { beginAtZero: true } } }
    });
  });