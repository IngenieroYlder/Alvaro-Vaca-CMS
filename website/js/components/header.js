function renderHeader(activePage) {
    const navHTML = `
    <nav class="fixed w-full z-50 top-0 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-20 md:h-auto py-2">
                <!-- Logo -->
                <a href="index.html" class="flex items-center space-x-3">
                    <img src="assets/1_LOGO.png" alt="Logo Alvaro Vaca" class="h-16 md:h-20 w-auto object-contain">
                    <img src="assets/5_LOGO.png" alt="Partido Alianza Verde #75" class="h-16 md:h-20 w-auto object-contain">
                </a>

                <!-- Desktop Menu -->
                <div class="hidden lg:flex items-center space-x-8">
                    <a href="index.html" class="${activePage === 'index' ? 'text-primary font-bold' : 'text-gray-600 hover:text-primary font-semibold'} transition-colors">Inicio</a>
                    <a href="biografia.html" class="${activePage === 'biografia' ? 'text-primary font-bold' : 'text-gray-600 hover:text-primary font-semibold'} transition-colors">Biografía</a>
                    <a href="propuestas.html" class="${activePage === 'propuestas' ? 'text-primary font-bold' : 'text-gray-600 hover:text-primary font-semibold'} transition-colors">Propuestas</a>
                    <a href="noticias.html" class="${activePage === 'noticias' ? 'text-primary font-bold' : 'text-gray-600 hover:text-primary font-semibold'} transition-colors">Noticias</a>
                    <a href="contacto.html" class="${activePage === 'contacto' ? 'text-primary font-bold' : 'text-gray-600 hover:text-primary font-semibold'} transition-colors">Contacto</a>
                </div>

                <!-- CTA Button -->
                <div class="flex items-center space-x-4">
                    <button onclick="openJoinModal()" class="hidden lg:inline-flex items-center px-6 py-2 border border-transparent text-sm font-bold rounded-full text-white bg-accent hover:bg-orange-600 shadow-md transform hover:-translate-y-0.5 transition-all cursor-pointer">
                        <span class="material-icons-round text-sm mr-2">how_to_vote</span>
                        Súmate
                    </button>
                    <!-- Mobile Menu Button -->
                    <button onclick="toggleMobileMenu()" class="lg:hidden p-2 text-gray-600 hover:text-primary focus:outline-none">
                        <span class="material-icons-round text-3xl">menu</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Mobile Menu -->
        <div id="mobile-menu" class="hidden lg:hidden fixed inset-0 z-50 bg-white h-screen w-full transform transition-transform duration-300 ease-in-out">
            <div class="flex flex-col h-full">
                <div class="flex justify-between items-center p-4 border-b border-gray-100">
                    <img src="assets/1_LOGO.png" alt="Logo Alvaro Vaca" class="h-12 w-auto object-contain">
                    <button onclick="toggleMobileMenu()" class="p-2 text-gray-600 hover:text-primary focus:outline-none">
                        <span class="material-icons-round text-3xl">close</span>
                    </button>
                </div>
                <div class="flex flex-col space-y-4 p-6 text-center text-lg font-medium overflow-y-auto">
                    <a href="index.html" class="${activePage === 'index' ? 'text-primary' : 'text-gray-600 hover:text-primary'} py-2">Inicio</a>
                    <a href="biografia.html" class="${activePage === 'biografia' ? 'text-primary' : 'text-gray-600 hover:text-primary'} py-2">Biografía</a>
                    <a href="propuestas.html" class="${activePage === 'propuestas' ? 'text-primary' : 'text-gray-600 hover:text-primary'} py-2">Propuestas</a>
                    <a href="noticias.html" class="${activePage === 'noticias' ? 'text-primary' : 'text-gray-600 hover:text-primary'} py-2">Noticias</a>
                    <a href="contacto.html" class="${activePage === 'contacto' ? 'text-primary' : 'text-gray-600 hover:text-primary'} py-2">Contacto</a>
                    <button onclick="openJoinModal(); toggleMobileMenu()" class="bg-primary text-white px-6 py-3 rounded-full font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 mt-4">
                        ¡Súmate!
                    </button>
                </div>
            </div>
        </div>
    </nav>
    `;

    document.getElementById('global-header').innerHTML = navHTML;
}
