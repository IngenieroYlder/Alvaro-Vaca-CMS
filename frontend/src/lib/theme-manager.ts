import axios from './cliente-axios';
import { resolveAssetUrl } from './utils';

export const ThemeManager = {
    async loadTheme() {
        try {
            // Load CSS
            const { data: css } = await axios.get('/theme/css');
            let styleTag = document.getElementById('dynamic-theme');
            if (!styleTag) {
                styleTag = document.createElement('style');
                styleTag.id = 'dynamic-theme';
                document.head.appendChild(styleTag);
            }
            styleTag.innerHTML = css;

            // Load Metadata (SEO)
            const { data: config } = await axios.get('/theme/config');
            if (config) {
                // Title
                if (config.tituloPagina) document.title = config.tituloPagina;

                // Description
                let metaDesc = document.querySelector('meta[name="description"]');
                if (!metaDesc) {
                    metaDesc = document.createElement('meta');
                    metaDesc.setAttribute('name', 'description');
                    document.head.appendChild(metaDesc);
                }
                metaDesc.setAttribute('content', config.descripcionPagina || '');

                // Favicon Priority: Configured Favicon -> Vertical Logo -> Horizontal Logo
                const faviconUrl = config.favicon || config.logoVertical || config.logoHorizontal;

                if (faviconUrl) {
                    let linkIcon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
                    if (!linkIcon) {
                        linkIcon = document.createElement('link');
                        linkIcon.rel = 'icon';
                        document.head.appendChild(linkIcon);
                    }
                    // Use resolveAssetUrl (needs import) or manual resolution logic if import is tricky here (circular deps?) 
                    // To be safe and clean, let's use the same logic as utils but inline or imported. 
                    // Since this is a simple object, importing might be fine.
                    // However, let's check imports first.
                    // Actually, let's assume we add the import in a separate block or just use the logic inline if needed.
                    // Ideally, we import it.
                    linkIcon.href = resolveAssetUrl(faviconUrl);

                    // Fix: Remove specific type to allow browser to detect mime type from file extension
                    // or force a refresh if the type was previously set to svg
                    linkIcon.removeAttribute('type');
                }
            }

        } catch (error) {
            console.error('Failed to load theme', error);
        }
    },

    async updateConfig(config: any) {
        await axios.put('/theme/config', config);
        // Reload CSS to reflect changes immediately
        await this.loadTheme();
    }
};
