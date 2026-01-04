/**
 * Xstar Mail OAuth 2.0 SDK
 * Integración simple tipo "Iniciar sesión con Xstar Mail"
 * 
 * Uso simple:
 * <script 
 *   src="https://xstarmail.es/xstar-oauth.js"
 *   data-client-id="tu-client-id"
 *   data-redirect-uri="https://tu-sitio.com/callback"
 *   data-button-text="Iniciar sesión con Xstar Mail"
 * ></script>
 * 
 * O con configuración manual:
 * <script src="https://xstarmail.es/xstar-oauth.js"></script>
 * <script>
 *   XstarOAuth.init({
 *     clientId: 'tu-client-id',
 *     redirectUri: 'https://tu-sitio.com/callback'
 *   });
 * </script>
 */

(function(window, document) {
  'use strict';

  const XSTAR_OAUTH_BASE_URL = window.XSTAR_OAUTH_BASE_URL || 'https://xstarmail.es/api/oauth';
  
  const XstarOAuth = {
    config: {
      clientId: null,
      redirectUri: null,
      state: null,
    },
    initialized: false,

    /**
     * Inicializar el SDK
     */
    init: function(options) {
      if (!options.clientId) {
        throw new Error('clientId is required');
      }
      if (!options.redirectUri) {
        throw new Error('redirectUri is required');
      }

      this.config = {
        clientId: options.clientId,
        redirectUri: options.redirectUri,
        state: options.state || this.generateState(),
      };

      // Guardar state en sessionStorage para validación
      if (typeof Storage !== 'undefined') {
        sessionStorage.setItem('xstar_oauth_state', this.config.state);
      }

      this.initialized = true;
    },

    /**
     * Generar un state aleatorio para seguridad
     */
    generateState: function() {
      return Math.random().toString(36).substring(2, 15) + 
             Math.random().toString(36).substring(2, 15);
    },

    /**
     * Iniciar el flujo de autenticación
     */
    login: function() {
      if (!this.config.clientId || !this.config.redirectUri) {
        throw new Error('XstarOAuth.init() must be called first');
      }

      const params = new URLSearchParams({
        client_id: this.config.clientId,
        redirect_uri: this.config.redirectUri,
        response_type: 'code',
        state: this.config.state,
      });

      window.location.href = `${XSTAR_OAUTH_BASE_URL}/authorize?${params.toString()}`;
    },

    /**
     * Renderizar un botón de login personalizado estilo Xstar
     */
    renderButton: function(selector, options) {
      options = options || {};
      const element = typeof selector === 'string' 
        ? document.querySelector(selector) 
        : selector;

      if (!element) {
        throw new Error('Element not found: ' + selector);
      }

      const button = document.createElement('button');
      button.type = 'button';
      button.className = options.className || 'xstar-oauth-button';
      
      // Crear contenido del botón con logo e icono
      const buttonContent = document.createElement('div');
      buttonContent.style.cssText = 'display: flex; align-items: center; justify-content: center; gap: 10px;';
      
      // Logo/Icono de Xstar (puedes usar un SVG o imagen)
      const icon = document.createElement('div');
      icon.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"/>
          <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      icon.style.cssText = 'display: flex; align-items: center;';
      
      const text = document.createElement('span');
      text.textContent = options.text || 'Iniciar sesión con Xstar Mail';
      
      buttonContent.appendChild(icon);
      buttonContent.appendChild(text);
      button.appendChild(buttonContent);
      
      // Estilos por defecto - Diseño moderno tipo Google/PayPal
      if (!options.noStyles) {
        button.style.cssText = `
          background: linear-gradient(135deg, #14b4a1 0%, #0f9d8a 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 500;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(20, 180, 161, 0.2), 0 1px 2px rgba(0, 0, 0, 0.1);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 200px;
          outline: none;
        `;
        
        button.addEventListener('mouseenter', function() {
          this.style.transform = 'translateY(-1px)';
          this.style.boxShadow = '0 4px 8px rgba(20, 180, 161, 0.3), 0 2px 4px rgba(0, 0, 0, 0.1)';
        });
        
        button.addEventListener('mouseleave', function() {
          this.style.transform = 'translateY(0)';
          this.style.boxShadow = '0 2px 4px rgba(20, 180, 161, 0.2), 0 1px 2px rgba(0, 0, 0, 0.1)';
        });
        
        button.addEventListener('mousedown', function() {
          this.style.transform = 'translateY(0)';
          this.style.boxShadow = '0 1px 2px rgba(20, 180, 161, 0.2)';
        });
        
        button.addEventListener('mouseup', function() {
          this.style.transform = 'translateY(-1px)';
          this.style.boxShadow = '0 4px 8px rgba(20, 180, 161, 0.3), 0 2px 4px rgba(0, 0, 0, 0.1)';
        });
      }

      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.login();
      });
      
      element.innerHTML = '';
      element.appendChild(button);
    },

    /**
     * Intercambiar código por token (usado en la página de callback)
     */
    exchangeCode: async function(code, clientSecret) {
      if (!code) {
        throw new Error('Authorization code is required');
      }
      if (!clientSecret) {
        throw new Error('clientSecret is required');
      }

      const response = await fetch(`${XSTAR_OAUTH_BASE_URL}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          client_id: this.config.clientId,
          client_secret: clientSecret,
          redirect_uri: this.config.redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Token exchange failed');
      }

      return await response.json();
    },

    /**
     * Obtener información del usuario
     */
    getUserInfo: async function(accessToken) {
      if (!accessToken) {
        throw new Error('Access token is required');
      }

      const response = await fetch(`${XSTAR_OAUTH_BASE_URL}/userinfo`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get user info');
      }

      return await response.json();
    },
  };

    /**
     * Auto-renderizar botones con data attributes
     */
    autoRender: function() {
      // Buscar todos los elementos con data-xstar-oauth
      const containers = document.querySelectorAll('[data-xstar-oauth]');
      
      containers.forEach(container => {
        const clientId = container.getAttribute('data-client-id') || 
                        document.querySelector('script[data-client-id]')?.getAttribute('data-client-id');
        const redirectUri = container.getAttribute('data-redirect-uri') || 
                           document.querySelector('script[data-redirect-uri]')?.getAttribute('data-redirect-uri');
        const buttonText = container.getAttribute('data-button-text') || 
                          'Iniciar sesión con Xstar Mail';
        
        if (!clientId || !redirectUri) {
          console.warn('XstarOAuth: clientId and redirectUri are required');
          return;
        }
        
        // Inicializar si no está inicializado
        if (!this.initialized) {
          this.init({ clientId, redirectUri });
        }
        
        // Renderizar botón
        this.renderButton(container, { text: buttonText });
      });
    },
  };

  // Exponer globalmente
  window.XstarOAuth = XstarOAuth;

  // Auto-inicializar desde data attributes del script tag
  function autoInitFromScript() {
    const script = document.currentScript || 
                   document.querySelector('script[src*="xstar-oauth.js"]');
    
    if (script) {
      const clientId = script.getAttribute('data-client-id');
      const redirectUri = script.getAttribute('data-redirect-uri');
      
      if (clientId && redirectUri) {
        XstarOAuth.init({
          clientId,
          redirectUri,
          state: script.getAttribute('data-state') || undefined,
        });
      }
    }
  }

  // Auto-renderizar cuando el DOM esté listo
  function autoRenderButtons() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        autoInitFromScript();
        XstarOAuth.autoRender();
      });
    } else {
      autoInitFromScript();
      XstarOAuth.autoRender();
    }
  }

  // Manejar callback OAuth
  function handleCallback() {
    if (typeof window !== 'undefined' && window.location) {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      
      if (code) {
        // Disparar evento para que el desarrollador maneje el callback
        window.dispatchEvent(new CustomEvent('xstar-oauth-callback', {
          detail: { code, state }
        }));
      }
    }
  }

  // Inicializar automáticamente
  autoRenderButtons();
  handleCallback();

})(window, document);

