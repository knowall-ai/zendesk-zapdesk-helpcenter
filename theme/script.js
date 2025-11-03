/**
 * KnowAll AI - Zapdesk Theme Bootstrap Script
 * This script initializes the Zapdesk embedded app based on theme settings
 */

(function() {
  'use strict';

  /**
   * Initialize Zapdesk app when DOM is ready
   */
  function initializeZapdeskApp() {
    const container = document.querySelector('.zapdesk-app-container');

    if (!container) {
      console.log('Zapdesk: No container found');
      return;
    }

    const enabled = container.dataset.enable === 'true';

    if (!enabled) {
      console.log('Zapdesk: App is disabled in theme settings');
      return;
    }

    const config = {
      apiBase: container.dataset.apiBase || '',
      lnurlEndpoint: container.dataset.lnurlEndpoint || '',
      brandColor: container.dataset.brandColor || '#F7931A',
      placement: container.dataset.placement || 'article_footer'
    };

    console.log('Zapdesk: Initializing app with config', config);

    // Load the app CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = container.dataset.cssUrl;
    document.head.appendChild(link);

    // Load the app JS
    const script = document.createElement('script');
    script.src = container.dataset.jsUrl;
    script.onload = function() {
      if (window.ZapdeskApp && typeof window.ZapdeskApp.mount === 'function') {
        console.log('Zapdesk: Mounting app');
        window.ZapdeskApp.mount(container, config);
      } else {
        console.error('Zapdesk: App bundle loaded but mount function not found');
      }
    };
    script.onerror = function() {
      console.error('Zapdesk: Failed to load app bundle');
    };
    document.body.appendChild(script);
  }

  /**
   * Utility function to get current article ID
   */
  function getCurrentArticleId() {
    const match = window.location.pathname.match(/\/articles\/(\d+)/);
    return match ? match[1] : null;
  }

  /**
   * Initialize on DOM ready
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeZapdeskApp);
  } else {
    initializeZapdeskApp();
  }

  // Expose utilities to global scope if needed
  window.ZapdeskTheme = {
    getCurrentArticleId: getCurrentArticleId
  };

})();
