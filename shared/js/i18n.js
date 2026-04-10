/**
 * TrueApp Internationalization Engine (i18n)
 *
 * This module handles multi-language support across the truetapp.github.io site.
 *
 * Usage in HTML:
 *   - Set data-i18n-page="landing" data-i18n-base="/snapsong/i18n/" on <html>
 *   - Add data-i18n="key.path" to elements for text translation
 *   - Add data-i18n-placeholder="key.path" to inputs
 *   - Add data-i18n-title="key.path" to elements for title attributes
 *
 * Language Support: en, pt-br, es, fr, de
 * Storage: localStorage (key: 'truetapp-lang')
 * Fallback: navigator.language or 'en'
 *
 * API:
 *   TrueTappI18n.init()           - Initialize on page load
 *   TrueTappI18n.setLang(code)    - Change language (persists)
 *   TrueTappI18n.getLang()        - Get current language code
 *   TrueTappI18n.t(key)           - Get translation by key
 */

const TrueTappI18n = (() => {
    // ─────────────────────────────────────────────────────────────────
    // Configuration
    // ─────────────────────────────────────────────────────────────────

    const STORAGE_KEY = 'truetapp-lang';
    const DEFAULT_LANG = 'en';

    const SUPPORTED_LANGUAGES = {
        en: 'English',
        'pt-br': 'Português',
        es: 'Español',
        fr: 'Français',
        de: 'Deutsch'
    };

    // ─────────────────────────────────────────────────────────────────
    // Internal State
    // ─────────────────────────────────────────────────────────────────

    let currentLang = DEFAULT_LANG;
    let translations = {};
    let originalTexts = {}; // Stores original English text from HTML

    // ─────────────────────────────────────────────────────────────────
    // Helper: Detect user's preferred language
    // ─────────────────────────────────────────────────────────────────

    const detectLanguage = () => {
        // 1. Check localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && SUPPORTED_LANGUAGES[stored]) {
            return stored;
        }

        // 2. Check browser language
        let navLang = navigator.language || navigator.userLanguage || '';
        navLang = navLang.toLowerCase().replace('_', '-');

        // Direct match (e.g., 'pt-br' or 'en')
        if (SUPPORTED_LANGUAGES[navLang]) {
            return navLang;
        }

        // Prefix match (e.g., 'pt' maps to 'pt-br')
        const langPrefix = navLang.split('-')[0];
        for (const [code] of Object.entries(SUPPORTED_LANGUAGES)) {
            if (code.startsWith(langPrefix)) {
                return code;
            }
        }

        // 3. Fallback to English
        return DEFAULT_LANG;
    };

    // ─────────────────────────────────────────────────────────────────
    // Helper: Load translations from JSON
    // ─────────────────────────────────────────────────────────────────

    const loadTranslations = async (lang) => {
        const htmlElement = document.documentElement;
        const page = htmlElement.getAttribute('data-i18n-page') || 'landing';
        const base = htmlElement.getAttribute('data-i18n-base') || '/snapsong/i18n/';

        // Skip loading for English (use HTML text as-is)
        if (lang === 'en') {
            translations = {};
            return true;
        }

        const pageFile = `${base}${page}.${lang}.json`;
        const commonFile = '/shared/i18n/common.' + lang + '.json';

        try {
            // Load page-specific translations
            const pageResponse = await fetch(pageFile);
            const pageTranslations = pageResponse.ok ? await pageResponse.json() : {};

            // Load common/shared translations
            const commonResponse = await fetch(commonFile);
            const commonTranslations = commonResponse.ok ? await commonResponse.json() : {};

            // Merge: page-specific overrides common
            translations = { ...commonTranslations, ...pageTranslations };
            return true;
        } catch (error) {
            console.warn(`Failed to load translations for ${lang}:`, error);
            return false;
        }
    };

    // ─────────────────────────────────────────────────────────────────
    // Get translation by key (flat lookup — keys contain dots literally)
    // ─────────────────────────────────────────────────────────────────

    const getTranslation = (key) => {
        // Direct flat key lookup (keys are like "hero.title.line1" as strings)
        if (key in translations) {
            return translations[key];
        }
        return null;
    };

    // ─────────────────────────────────────────────────────────────────
    // Apply translations to DOM
    // ─────────────────────────────────────────────────────────────────

    // Store original English texts from HTML on first run
    const storeOriginalTexts = () => {
        if (Object.keys(originalTexts).length > 0) return; // Already stored

        document.querySelectorAll('[data-i18n]').forEach((element) => {
            const key = element.getAttribute('data-i18n');
            // Store innerHTML to preserve any inner HTML tags (like spans)
            originalTexts[key] = {
                html: element.innerHTML,
                text: element.textContent
            };
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
            const key = element.getAttribute('data-i18n-placeholder');
            originalTexts['__ph__' + key] = { text: element.placeholder };
        });

        document.querySelectorAll('[data-i18n-title]').forEach((element) => {
            const key = element.getAttribute('data-i18n-title');
            originalTexts['__title__' + key] = { text: element.title };
        });
    };

    const applyTranslations = () => {
        // Update HTML lang attribute
        const langAttr = currentLang === 'pt-br' ? 'pt-BR' : currentLang;
        document.documentElement.lang = langAttr;

        // Find all elements with data-i18n attributes
        document.querySelectorAll('[data-i18n]').forEach((element) => {
            const key = element.getAttribute('data-i18n');

            if (currentLang === 'en') {
                // Restore original English text
                const original = originalTexts[key];
                if (original) {
                    element.innerHTML = original.html;
                }
            } else {
                const translation = getTranslation(key);
                if (translation) {
                    // Check if translation contains HTML
                    if (translation.includes('<')) {
                        element.innerHTML = translation;
                    } else {
                        element.textContent = translation;
                    }
                }
            }
        });

        // Find all inputs with data-i18n-placeholder
        document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
            const key = element.getAttribute('data-i18n-placeholder');

            if (currentLang === 'en') {
                const original = originalTexts['__ph__' + key];
                if (original) element.placeholder = original.text;
            } else {
                const translation = getTranslation(key);
                if (translation) element.placeholder = translation;
            }
        });

        // Find all elements with data-i18n-title
        document.querySelectorAll('[data-i18n-title]').forEach((element) => {
            const key = element.getAttribute('data-i18n-title');

            if (currentLang === 'en') {
                const original = originalTexts['__title__' + key];
                if (original) element.title = original.text;
            } else {
                const translation = getTranslation(key);
                if (translation) element.title = translation;
            }
        });

        // Update language switcher to show current language
        updateLanguageSwitcher();

        // Swap App Store badge images based on language
        document.querySelectorAll('[data-i18n-badge="appstore"]').forEach((img) => {
            const lang = currentLang === 'en' ? 'en' : currentLang;
            img.src = '/snapsong/assets/img/appstore-badge-' + lang + '.svg';
        });
    };

    // ─────────────────────────────────────────────────────────────────
    // Language Switcher UI
    // ─────────────────────────────────────────────────────────────────

    const createLanguageSwitcher = () => {
        const container = document.getElementById('lang-switcher-mount');
        if (!container) {
            return; // No mount point, skip
        }

        const switcher = document.createElement('div');
        switcher.className = 'lang-switcher';

        // Button
        const btn = document.createElement('button');
        btn.className = 'lang-btn';
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" width="14" height="14">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            <span>${currentLang.toUpperCase()}</span>
        `;

        // Dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'lang-dropdown';

        for (const [code, name] of Object.entries(SUPPORTED_LANGUAGES)) {
            const option = document.createElement('button');
            option.className = 'lang-option';
            option.setAttribute('data-lang', code);
            if (code === currentLang) {
                option.classList.add('active');
            }

            const nameSpan = document.createElement('span');
            nameSpan.textContent = name;
            option.appendChild(nameSpan);

            if (code === currentLang) {
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.classList.add('checkmark');
                svg.setAttribute('viewBox', '0 0 24 24');
                svg.setAttribute('width', '14');
                svg.setAttribute('height', '14');
                const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
                polyline.setAttribute('points', '20 6 9 17 4 12');
                svg.appendChild(polyline);
                option.appendChild(svg);
            }

            option.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropdown.classList.remove('visible');
                setLang(code);
            });

            dropdown.appendChild(option);
        }

        // Toggle dropdown on click
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropdown.classList.toggle('visible');
        });

        // Close dropdown on outside click
        document.addEventListener('click', () => {
            dropdown.classList.remove('visible');
        });

        switcher.appendChild(btn);
        switcher.appendChild(dropdown);
        container.appendChild(switcher);
    };

    const updateLanguageSwitcher = () => {
        const btn = document.querySelector('.lang-btn');
        if (btn) {
            const span = btn.querySelector('span');
            if (span) {
                const displayCode = currentLang === 'pt-br' ? 'PT-BR' : currentLang.toUpperCase();
                span.textContent = displayCode;
            }
        }

        document.querySelectorAll('.lang-option').forEach((option) => {
            const code = option.getAttribute('data-lang');

            if (code === currentLang) {
                option.classList.add('active');
                if (!option.querySelector('.checkmark')) {
                    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    svg.classList.add('checkmark');
                    svg.setAttribute('viewBox', '0 0 24 24');
                    svg.setAttribute('width', '14');
                    svg.setAttribute('height', '14');
                    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
                    polyline.setAttribute('points', '20 6 9 17 4 12');
                    svg.appendChild(polyline);
                    option.appendChild(svg);
                }
            } else {
                option.classList.remove('active');
                const checkmark = option.querySelector('.checkmark');
                if (checkmark) checkmark.remove();
            }
        });
    };

    // ─────────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────────

    const init = async () => {
        // Store original English texts from HTML before any translation
        storeOriginalTexts();

        // Detect preferred language
        currentLang = detectLanguage();

        // Load translations
        await loadTranslations(currentLang);

        // Apply to DOM
        applyTranslations();

        // Create language switcher
        createLanguageSwitcher();

        return currentLang;
    };

    const setLang = async (code) => {
        if (!SUPPORTED_LANGUAGES[code]) {
            console.warn(`Language ${code} not supported`);
            return false;
        }

        currentLang = code;

        // Persist choice
        localStorage.setItem(STORAGE_KEY, code);

        // Load new translations
        await loadTranslations(code);

        // Apply to DOM
        applyTranslations();

        return true;
    };

    const getLang = () => {
        return currentLang;
    };

    const t = (key) => {
        const translation = getTranslation(key);
        // Return translation if found, otherwise return key as fallback
        return translation || key;
    };

    // ─────────────────────────────────────────────────────────────────
    // Auto-initialize on DOMContentLoaded
    // ─────────────────────────────────────────────────────────────────

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // Already loaded
        init();
    }

    // ─────────────────────────────────────────────────────────────────
    // Export Public API
    // ─────────────────────────────────────────────────────────────────

    return {
        init,
        setLang,
        getLang,
        t,
        // For debugging
        _getSupportedLanguages: () => SUPPORTED_LANGUAGES,
        _getTranslations: () => translations
    };
})();

// Make globally available
window.TrueTappI18n = TrueTappI18n;
