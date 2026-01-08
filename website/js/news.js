const newsData = [
    {
        id: 1,
        title: "La Ley de Humedales 2025: Una prioridad legislativa innegociable",
        category: "Política",
        date: "2025-05-15",
        displayDate: "Hace 2 horas",
        image: "assets/alvaro.png",
        excerpt: "Nuestra propuesta clave para la protección de los recursos hídricos y la biodiversidad local avanza en el senado. Conoce los detalles del proyecto que transformará la gestión ambiental.",
        featured: true,
        type: "article"
    },
    {
        id: 2,
        title: "Entrevista en Radio Nacional",
        category: "Prensa",
        date: "2025-05-14",
        displayDate: "Ayer",
        icon: "mic",
        iconBg: "bg-gray-900",
        iconColor: "text-gray-700", // For opacity handling
        excerpt: "Discusión profunda sobre energías renovables, el futuro sostenible de nuestra región y los desafíos climáticos.",
        linkText: "Escuchar ahora",
        type: "standard"
    },
    {
        id: 3,
        title: "Encuentro Vecinal en San José",
        category: "Eventos",
        date: "2025-05-02",
        displayDate: "2 de Mayo",
        icon: "groups",
        iconBg: "bg-gray-100",
        iconColor: "text-gray-400",
        excerpt: "Una tarde escuchando las preocupaciones de la comunidad local y construyendo soluciones conjuntas.",
        linkText: "Ver galería",
        type: "standard"
    },
    {
        id: 4,
        title: "Lanzamiento de Campaña Verde",
        category: "Campaña",
        date: "2025-04-28",
        displayDate: "28 de Abril",
        icon: "flag",
        iconBg: "bg-green-900",
        iconColor: "text-white/20",
        excerpt: "Presentación oficial de la plataforma electoral 2025 ante miles de simpatizantes comprometidos.",
        linkText: "Leer propuestas",
        type: "standard"
    },
    {
        id: 5,
        title: "Informe de Gestión Ambiental 2024",
        category: "Documento Oficial",
        date: "2024-12-31",
        displayDate: "Diciembre 2024",
        type: "document",
        excerpt: "Descarga el PDF completo con nuestro análisis del último año."
    }
];

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('news-feed');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const monthFilter = document.getElementById('monthFilter');
    const yearFilter = document.getElementById('yearFilter');

    function renderNews(news) {
        container.innerHTML = '';

        if (news.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <span class="material-icons-round text-6xl text-gray-200 mb-4">search_off</span>
                    <h3 class="text-xl font-bold text-gray-400">No se encontraron noticias</h3>
                    <p class="text-gray-400">Intenta con otros filtros o términos de búsqueda.</p>
                </div>
            `;
            return;
        }

        // Separate featured (first item) if it's the initial view or if it matches filters
        // For simplicity in filtering, we'll try to keep the layout:
        // First item -> Large Card
        // Rest -> Grid
        
        const firstItem = news[0];
        const restItems = news.slice(1);

        // Render First Item (Large)
        if (firstItem) {
            const firstCard = createLargeCard(firstItem);
            container.appendChild(firstCard);
        }

        // Render Rest (Grid)
        if (restItems.length > 0) {
            const gridContainer = document.createElement('div');
            gridContainer.className = "grid md:grid-cols-2 gap-8";
            
            restItems.forEach(item => {
                gridContainer.appendChild(createStandardCard(item));
            });
            container.appendChild(gridContainer);
        }
    }

    function createLargeCard(item) {
        const article = document.createElement('article');
        article.className = "bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow group animate-fade-in";
        
        let imageSection = '';
        if (item.image) {
            imageSection = `
                <div class="h-64 md:h-auto relative overflow-hidden">
                    <img src="${item.image}" alt="${item.title}" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 object-top">
                </div>
            `;
        } else {
            // Fallback if featured item has no image (unlikely based on data, but good for safety)
            imageSection = `
                <div class="h-64 md:h-auto relative overflow-hidden bg-primary flex items-center justify-center">
                    <span class="material-icons-round text-white text-6xl">article</span>
                </div>
            `;
        }

        article.innerHTML = `
            <div class="grid md:grid-cols-2">
                ${imageSection}
                <div class="p-8 flex flex-col justify-center">
                    <div class="flex items-center space-x-2 text-xs font-bold uppercase tracking-wide mb-4">
                        <span class="bg-green-100 text-primary px-2 py-1 rounded-md">${item.category}</span>
                        <span class="text-gray-400">${item.displayDate}</span>
                    </div>
                    <h2 class="font-display font-bold text-2xl text-gray-900 mb-4 leading-tight group-hover:text-primary transition-colors">
                        ${item.title}
                    </h2>
                    <p class="text-gray-600 mb-6 line-clamp-3">
                        ${item.excerpt}
                    </p>
                    <a href="#" class="inline-flex items-center text-primary font-bold hover:text-secondary transition-colors">
                        Leer artículo completo <span class="material-icons-round text-sm ml-1">arrow_forward</span>
                    </a>
                </div>
            </div>
        `;
        return article;
    }

    function createStandardCard(item) {
        const article = document.createElement('article');
        
        if (item.type === 'document') {
            article.className = "bg-green-50 rounded-2xl p-6 border border-green-100 flex flex-col animate-fade-in";
            article.innerHTML = `
                <div class="flex items-start justify-between mb-4">
                    <div class="text-xs font-bold text-primary uppercase tracking-wide">${item.category}</div>
                    <div class="bg-white p-2 rounded-lg shadow-sm">
                        <span class="material-icons-round text-primary">description</span>
                    </div>
                </div>
                <h3 class="font-display font-bold text-xl text-gray-900 mb-2">${item.title}</h3>
                <p class="text-gray-600 text-sm mb-6 flex-grow">
                    ${item.excerpt}
                </p>
                <button class="w-full py-2 border-2 border-primary text-primary font-bold rounded-lg hover:bg-primary hover:text-white transition-colors text-sm">
                    Descargar PDF
                </button>
            `;
        } else {
            article.className = "bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow flex flex-col animate-fade-in";
            
            // Visual header (Image or Icon)
            let header = '';
            if (item.image) {
                header = `
                    <div class="h-48 relative overflow-hidden">
                        <img src="${item.image}" class="w-full h-full object-cover">
                    </div>
                `;
            } else {
                header = `
                    <div class="h-48 ${item.iconBg || 'bg-gray-100'} relative">
                        <div class="absolute inset-0 flex items-center justify-center ${item.iconColor || 'text-gray-400'}">
                            <span class="material-icons-round text-6xl opacity-50">${item.icon || 'article'}</span>
                        </div>
                    </div>
                `;
            }

            article.innerHTML = `
                ${header}
                <div class="p-6 flex-grow flex flex-col">
                    <div class="flex items-center space-x-2 text-xs font-bold uppercase tracking-wide mb-3">
                        <span class="${getCategoryColor(item.category)}">${item.category}</span>
                        <span class="text-gray-300">•</span>
                        <span class="text-gray-400">${item.displayDate}</span>
                    </div>
                    <h3 class="font-display font-bold text-xl text-gray-900 mb-3">${item.title}</h3>
                    <p class="text-gray-600 text-sm mb-4 flex-grow">
                        ${item.excerpt}
                    </p>
                    <a href="#" class="text-primary font-bold text-sm hover:underline">${item.linkText || 'Leer más'}</a>
                </div>
            `;
        }
        
        return article;
    }

    function getCategoryColor(category) {
        switch(category) {
            case 'Prensa': return 'text-accent';
            case 'Eventos': return 'text-blue-600';
            case 'Campaña': return 'text-secondary';
            default: return 'text-primary';
        }
    }

    function filterNews() {
        const searchTerm = searchInput.value.toLowerCase();
        const category = categoryFilter.value;
        const month = monthFilter.value;
        const year = yearFilter.value;

        const filtered = newsData.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(searchTerm) || 
                                  item.excerpt.toLowerCase().includes(searchTerm);
            const matchesCategory = category === '' || item.category === category;
            
            const itemDate = new Date(item.date);
            // Month is 0-indexed in JS Date, but value is 0-11.
            const matchesMonth = month === '' || itemDate.getMonth().toString() === month;
            const matchesYear = year === '' || itemDate.getFullYear().toString() === year;

            return matchesSearch && matchesCategory && matchesMonth && matchesYear;
        });

        renderNews(filtered);
    }

    // Event Listeners
    searchInput.addEventListener('input', filterNews);
    categoryFilter.addEventListener('change', filterNews);
    monthFilter.addEventListener('change', filterNews);
    yearFilter.addEventListener('change', filterNews);

    // Initial Render
    renderNews(newsData);
});
