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
    // Get translation by key (dot notation)
    // ─────────────────────────────────────────────────────────────────

    const getTranslation = (key) => {
        const keys = key.split('.');
        let value = translations;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return null;
            }
        }

        return typeof value === 'string' ? value : null;
    };

    // ─────────────────────────────────────────────────────────────────
    // Apply translations to DOM
    // ─────────────────────────────────────────────────────────────────

    const applyTranslations = () => {
        // Update HTML lang attribute
        document.documentElement.lang = currentLang;

        // Find all elements with data-i18n attributes
        document.querySelectorAll('[data-i18n]').forEach((element) => {
            const key = element.getAttribute('data-i18n');
            const translation = getTranslation(key);

            // Use translation if available, otherwise keep HTML text as fallback
            if (translation) {
                element.textContent = translation;
            }
        });

        // Find all inputs with data-i18n-placeholder
        document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
            const key = element.getAttribute('data-i18n-placeholder');
            const translation = getTranslation(key);

            if (translation) {
                element.placeholder = translation;
            }
        });

        // Find all elements with data-i18n-title
        document.querySelectorAll('[data-i18n-title]').forEach((element) => {
            const key = element.getAttribute('data-i18n-title');
            const translation = getTranslation(key);

            if (translation) {
                element.title = translation;
            }
        });

        // Update language switcher to show current language
        updateLanguageSwitcher();
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
            if (code === currentLang) {
                option.classList.add('active');
            }

            option.innerHTML = `
                <span>${name}</span>
                ${
                    code === currentLang
                        ? `<svg class="checkmark" viewBox="0 0 24 24" width="14" height="14">
                           <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>`
                        : ''
                }
            `;

            option.addEventListener('click', (e) => {
                e.preventDefault();
                setLang(code);
            });

            dropdown.appendChild(option);
        }

        switcher.appendChild(btn);
        switcher.appendChild(dropdown);
        container.appendChild(switcher);
    };

    const updateLanguageSwitcher = () => {
        const btn = document.querySelector('.lang-btn');
        if (btn) {
            const span = btn.querySelector('span');
            if (span) {
                span.textContent = currentLang.toUpperCase();
            }
        }

        document.querySelectorAll('.lang-option').forEach((option) => {
            const code = Array.from(SUPPORTED_LANGUAGES.keys()).find(
                (c) => SUPPORTED_LANGUAGES[c] === option.textContent.trim().split('\n')[0]
            );

            if (code === currentLang) {
                option.classList.add('active');
                if (!option.querySelector('.checkmark')) {
                    const checkmark = document.createElement('svg');
                    checkmark.className = 'checkmark';
                    checkmark.setAttribute('viewBox', '0 0 24 24');
                    checkmark.setAttribute('width', '14');
                    checkmark.setAttribute('height', '14');
                    checkmark.innerHTML = '<polyline points="20 6 9 17 4 12"></polyline>';
                    option.appendChild(checkmark);
                }
            } else {
                option.classList.remove('active');
                const checkmark = option.querySelector('.checkmark');
                if (checkmark) {
                    checkmark.remove();
                }
            }
        });
    };

    // ─────────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────────

    const init = async () => {
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
