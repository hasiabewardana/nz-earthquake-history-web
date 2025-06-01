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
      'circle-radius': [
        'step',
        ['get', 'magnitude'],
        3,   // default for magnitudes < 3
        3, 4, // mag >= 3 → radius 4
        4, 6, // mag >= 4 → radius 6
        5, 8, // mag >= 5 → radius 8
        6, 10, // mag >= 6 → radius 10
        7, 12, // mag >= 7 → radius 12
        8, 14  // mag >= 8 → radius 14
      ],
      'circle-color': [
        'step',
        ['get', 'depth'],
        '#00ffcc',   // 0–15 km
        15, '#00e6b8', // 15–40 km
        40, '#00cca3', // 40–100 km
        100, '#00b38f', // 100–200 km
        200, '#00997a'  // 200+ km
      ],
      'circle-opacity': 1,
      'circle-stroke-color': '#008066',
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
      'fill-opacity': 0.2,
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
      'circle-radius': [
        'step',
        ['get', 'magnitude'],
        12,
        7, 12,
        8, 14
      ],
      'circle-color': '#ff0000',
      'circle-opacity': 1,
      'circle-stroke-color': '#660000',
      'circle-stroke-width': 1
    },
    layout: { visibility: 'none' }
  });

  let pulseInterval;
  const togglePulse = document.getElementById('toggle-pulse');
  const toggleMajor = document.getElementById('toggle-major-quakes');

  function startPulse() {
    clearInterval(pulseInterval); // clear any existing interval to prevent duplicates

    if (toggleMajor.checked) {
      pulseInterval = setInterval(() => {
        if (map.getLayer('major-earthquakes-layer')) {
          map.setPaintProperty('major-earthquakes-layer', 'circle-opacity', Math.random() * 1);
        }
      }, 500);
    } else {
      pulseInterval = setInterval(() => {
        if (map.getLayer('earthquakes-layer')) {
          map.setPaintProperty('earthquakes-layer', 'circle-opacity', Math.random() * 1);
        }
      }, 500);
    }
  }

  function stopPulse() {
    clearInterval(pulseInterval);

    // Restore default opacity
    if (toggleMajor.checked) {
      if (map.getLayer('major-earthquakes-layer')) {
        map.setPaintProperty('major-earthquakes-layer', 'circle-opacity', 1);
      }
    } else {
      if (map.getLayer('earthquakes-layer')) {
        map.setPaintProperty('earthquakes-layer', 'circle-opacity', 1);
      }
    }
  }

  // Toggle pulse checkbox listener
  togglePulse.addEventListener('change', () => {
    if (togglePulse.checked) {
      startPulse();
    } else {
      stopPulse();
    }
  });

  // Toggle major checkbox listener
  toggleMajor.addEventListener('change', () => {
    if (togglePulse.checked) {
      startPulse(); // Restart pulse for the correct layer
    } else {
      stopPulse();  // Restore original style
    }
  });
});

// Major earthquakes visiility
const toggleMajor = document.getElementById('toggle-major-quakes');
toggleMajor.addEventListener('change', () => {
  if (toggleMajor.checked) {
    map.setLayoutProperty('major-earthquakes-layer', 'visibility', 'visible');
    map.setLayoutProperty('earthquakes-layer', 'visibility', 'none');
  } else {
    map.setLayoutProperty('major-earthquakes-layer', 'visibility', 'none');  // optional: hide if you want
    map.setLayoutProperty('earthquakes-layer', 'visibility', 'visible');
  }
});

// Timeline slider
const slider = document.getElementById('year-slider');
const yearDisplay = document.getElementById('year-display');
const yearToggle = document.getElementById('year-mode-toggle');

slider.addEventListener('input', () => {
  updateYearFilter();
  updateFilters();  // Call your additional function here
});
yearToggle.addEventListener('change', () => {
  updateYearFilter();
  updateFilters(); // Call your additional function here
});

function updateYearFilter() {
  const year = slider.value;
  const onlySelectedYear = yearToggle.checked;
  yearDisplay.textContent = year;

  let filter;
  if (onlySelectedYear) {
    // Show earthquakes from exactly the selected year
    filter = [
      'all',
      ['>=', ['get', 'origintime'], `${year}-01-01`],
      ['<=', ['get', 'origintime'], `${year}-12-31`]
    ];
  } else {
    // Show earthquakes up to and including the selected year
    filter = ['<=', ['get', 'origintime'], `${year}-12-31`];
  }

  map.setFilter('earthquakes-layer', filter);
  map.setFilter('major-earthquakes-layer', filter);
}

// Filters
const magFilter = document.getElementById('mag-filter');
const depthFilter = document.getElementById('depth-filter');
const regionFilter = document.getElementById('region-filter');
function updateFilters() {
  const mag = magFilter.value;
  const depth = depthFilter.value;
  const region = regionFilter.value;
  const year = parseInt(slider.value);
  const onlySelectedYear = yearToggle.checked;
  yearDisplay.textContent = year;
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

  // --- Year (origintime) filter ---
  if (onlySelectedYear) {
    filter.push(['>=', ['get', 'origintime'], `${year}-01-01`]);
    filter.push(['<=', ['get', 'origintime'], `${year}-12-31`]);
  } else {
    filter.push(['<=', ['get', 'origintime'], `${year}-12-31`]);
  }

  map.setFilter('earthquakes-layer', filter);
  map.setFilter('major-earthquakes-layer', filter);
}
magFilter.addEventListener('change', updateFilters);
depthFilter.addEventListener('change', updateFilters);
regionFilter.addEventListener('change', updateFilters);

// Pop-ups
map.on('click', ['earthquakes-layer', 'major-earthquakes-layer'], (e) => {
  const props = e.features[0].properties;
  new mapboxgl.Popup()
    .setLngLat(e.lngLat)
    .setHTML(`<h3>Date: ${props.origintime}</h3><p>Magnitude: ${props.magnitude}<br>Depth: ${props.depth}km</p>`)
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
  slider.value = 2025;
  yearDisplay.textContent = 2025;
  document.getElementById('toggle-pulse').checked = false;
  document.getElementById('year-mode-toggle').checked = false;
  document.getElementById('toggle-major-quakes').checked = false;
  map.setLayoutProperty('major-earthquakes-layer', 'visibility', 'none');
  map.setLayoutProperty('earthquakes-layer', 'visibility', 'visible');
  // Disable pulsing by reverting the paint/style (if needed)
  if (map.getLayer('earthquakes-pulse')) {
    map.removeLayer('earthquakes-pulse');
  }
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