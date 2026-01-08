document.addEventListener('DOMContentLoaded', function() {
    // Check if map element exists
    if (!document.getElementById('map-meta')) return;

    // Initialize Map centered on Meta, Colombia
    const map = L.map('map-meta').setView([3.8, -73.5], 8);

    // Add Tile Layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    // Custom Icon for Campaign
    const campaignIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    // Data: Municipalities with coordinates and info
    const municipios = [
        {
            name: "Villavicencio",
            coords: [4.1420, -73.6266],
            info: "Sede Principal. Inicio del emprendimiento."
        },
        {
            name: "Acacías",
            coords: [3.9868, -73.7580],
            info: "Conectividad Regional y Fibra Óptica."
        },
        {
            name: "Granada",
            coords: [3.5458, -73.7063],
            info: "Educación Rural e Infraestructura."
        },
        {
            name: "Puerto López",
            coords: [4.0847, -72.9566],
            info: "Defensa del Medio Ambiente y Humedales."
        },
        {
            name: "San Martín",
            coords: [3.6948, -73.6996],
            info: "Liderazgo Comunitario y Red de Jóvenes."
        }
    ];

    // Add Markers
    municipios.forEach(muni => {
        const marker = L.marker(muni.coords, { icon: campaignIcon }).addTo(map);
        
        const popupContent = `
            <div class="text-center p-2">
                <h3 class="font-bold text-primary text-lg mb-1">${muni.name}</h3>
                <p class="text-gray-600 text-sm mb-3">${muni.info}</p>
                <button onclick="filterTimeline('${muni.name}')" class="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full hover:bg-green-800 transition-colors shadow-sm">
                    Ver Gestión Aquí
                </button>
            </div>
        `;
        
        marker.bindPopup(popupContent);
    });

    // Add "Reset Filter" button to the timeline header dynamically if not present
    const timelineHeader = document.querySelector('.lg\\:w-1\\/2 h3'); // "Nuestra Trayectoria"
    if (timelineHeader) {
        const resetButton = document.createElement('button');
        resetButton.id = 'reset-timeline-btn';
        resetButton.className = 'hidden ml-4 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-1 px-3 rounded-full transition-colors';
        resetButton.innerText = 'Mostrar Todos';
        resetButton.onclick = () => filterTimeline('all');
        timelineHeader.parentNode.appendChild(resetButton); // Append next to the header or in the container
    }
});

// Global function to handle "Navigation" from map
function filterTimeline(municipio) {
    const cards = document.querySelectorAll('.timeline-card');
    const resetButton = document.getElementById('reset-timeline-btn');
    const timelineSection = document.getElementById('trayectoria-list'); // We might need to add this ID to the container
    
    // Fallback if ID is not on container, select the parent of the first card
    const container = cards.length > 0 ? cards[0].parentNode : null;

    let matchCount = 0;

    cards.forEach(card => {
        const cardMunicipio = card.getAttribute('data-municipio');
        
        if (municipio === 'all' || cardMunicipio === municipio) {
            card.classList.remove('hidden');
            card.classList.add('animate-fade-in'); // Optional animation class
            matchCount++;
        } else {
            card.classList.add('hidden');
            card.classList.remove('animate-fade-in');
        }
    });

    // Toggle Reset Button
    if (resetButton) {
        if (municipio === 'all') {
            resetButton.classList.add('hidden');
        } else {
            resetButton.classList.remove('hidden');
            resetButton.innerText = `Mostrando: ${municipio} (Ver todos)`;
        }
    }

    // Scroll to timeline
    if (container) {
        container.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}
