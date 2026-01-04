# Xstar Mail OAuth 2.0 - Guía de Integración

Integración súper simple tipo "Iniciar sesión con Google" - Solo agrega un script y listo! 🚀

## 🎯 Integración en 30 Segundos

### Método Ultra Simple (Recomendado)

```html
<!-- 1. Agrega el contenedor donde quieres el botón -->
<div data-xstar-oauth 
     data-client-id="tu-client-id"
     data-redirect-uri="https://tu-sitio.com/callback"
     data-button-text="Iniciar sesión con Xstar Mail">
</div>

<!-- 2. Agrega el script de Xstar -->
<script 
  src="https://xstarmail.es/xstar-oauth.js"
  data-client-id="tu-client-id"
  data-redirect-uri="https://tu-sitio.com/callback">
</script>
```

¡Eso es todo! El botón aparecerá automáticamente con el diseño de Xstar Mail. ✨

## 📋 Requisitos Previos

1. Tener una cuenta en Xstar Mail
2. Registrar tu aplicación para obtener `client_id` y `client_secret`

## 🔧 Paso 1: Registrar tu Aplicación

### Opción A: Desde la API (Recomendado para desarrolladores)

```bash
POST /api/oauth/register
Authorization: Bearer YOUR_XSTAR_TOKEN
Content-Type: application/json

{
  "name": "Mi Aplicación",
  "description": "Descripción de mi app",
  "website": "https://mi-sitio.com",
  "redirectUris": [
    "https://mi-sitio.com/callback",
    "http://localhost:3000/callback"
  ]
}
```

**Respuesta:**
```json
{
  "id": 1,
  "name": "Mi Aplicación",
  "clientId": "xstar_abc123...",
  "clientSecret": "secret_xyz789...", // ⚠️ Guarda esto de forma segura
  "redirectUris": ["https://mi-sitio.com/callback"],
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

⚠️ **IMPORTANTE**: Guarda el `clientSecret` de forma segura. Solo se muestra una vez.

### Opción B: Desde el Panel de Administración

1. Inicia sesión en Xstar Mail
2. Ve a "Configuración" > "Aplicaciones OAuth"
3. Haz clic en "Nueva Aplicación"
4. Completa el formulario y guarda tus credenciales

## 🚀 Paso 2: Integrar el SDK

### Incluir el Script

Agrega el SDK de Xstar OAuth en tu HTML:

```html
<script src="https://xstarmail.es/xstar-oauth.js"></script>
```

### Inicializar el SDK

```javascript
// Configurar la URL base (solo si no usas el dominio por defecto)
window.XSTAR_OAUTH_BASE_URL = 'https://xstarmail.es/api/oauth';

// Inicializar
XstarOAuth.init({
  clientId: 'tu-client-id',
  redirectUri: 'https://tu-sitio.com/callback',
  state: 'opcional-state-para-seguridad'
});
```

## 🎨 Paso 3: Agregar el Botón de Login

### Método 1: Botón Automático (Recomendado)

```html
<div id="xstar-login-button"></div>

<script>
  XstarOAuth.renderButton('#xstar-login-button', {
    text: 'Iniciar sesión con Xstar Mail',
    theme: 'default'
  });
</script>
```

### Método 2: Botón Personalizado

```html
<button id="my-login-btn">Iniciar sesión con Xstar</button>

<script>
  document.getElementById('my-login-btn').addEventListener('click', function() {
    XstarOAuth.login();
  });
</script>
```

## 🔄 Paso 4: Manejar el Callback

Cuando el usuario autoriza tu aplicación, será redirigido a tu `redirectUri` con un código:

```
https://tu-sitio.com/callback?code=AUTHORIZATION_CODE&state=STATE
```

### Intercambiar Código por Token

```javascript
// En tu página de callback
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const state = urlParams.get('state');

// Validar state (opcional pero recomendado)
const savedState = sessionStorage.getItem('xstar_oauth_state');
if (state !== savedState) {
  console.error('State mismatch - possible CSRF attack');
  return;
}

// Intercambiar código por token
try {
  const tokenResponse = await XstarOAuth.exchangeCode(code, 'tu-client-secret');
  
  // tokenResponse contiene:
  // {
  //   access_token: "...",
  //   token_type: "Bearer",
  //   expires_in: 3600,
  //   refresh_token: "..."
  // }
  
  // Guardar el token de forma segura
  localStorage.setItem('xstar_access_token', tokenResponse.access_token);
  
  // Redirigir al usuario a tu aplicación
  window.location.href = '/dashboard';
} catch (error) {
  console.error('Error exchanging code:', error);
}
```

### Obtener Información del Usuario

```javascript
const accessToken = localStorage.getItem('xstar_access_token');

try {
  const userInfo = await XstarOAuth.getUserInfo(accessToken);
  
  // userInfo contiene:
  // {
  //   id: 1,
  //   email: "usuario@xstarmail.es",
  //   name: "Nombre del Usuario"
  // }
  
  console.log('Usuario autenticado:', userInfo);
} catch (error) {
  console.error('Error getting user info:', error);
}
```

## 📝 Ejemplo Completo

```html
<!DOCTYPE html>
<html>
<head>
  <title>Login con Xstar Mail</title>
</head>
<body>
  <div id="login-container">
    <h1>Bienvenido</h1>
    <div id="xstar-login-button"></div>
  </div>

  <script src="https://xstarmail.es/xstar-oauth.js"></script>
  <script>
    // Inicializar
    XstarOAuth.init({
      clientId: 'tu-client-id',
      redirectUri: window.location.origin + '/callback'
    });

    // Renderizar botón
    XstarOAuth.renderButton('#xstar-login-button');

    // Manejar callback
    window.addEventListener('xstar-oauth-callback', async function(event) {
      const { code, state } = event.detail;
      
      try {
        const tokenResponse = await XstarOAuth.exchangeCode(
          code, 
          'tu-client-secret' // ⚠️ En producción, esto debe estar en el backend
        );
        
        const userInfo = await XstarOAuth.getUserInfo(tokenResponse.access_token);
        console.log('Usuario:', userInfo);
        
        // Redirigir o actualizar UI
        window.location.href = '/dashboard';
      } catch (error) {
        console.error('Error:', error);
        alert('Error al iniciar sesión');
      }
    });
  </script>
</body>
</html>
```

## 🔒 Seguridad

### ⚠️ IMPORTANTE: Nunca expongas tu `client_secret` en el frontend

El intercambio de código por token **debe hacerse en el backend**:

```javascript
// ❌ MAL - No hagas esto en el frontend
const token = await XstarOAuth.exchangeCode(code, 'client-secret');

// ✅ BIEN - Hazlo en tu backend
// Frontend: Envía el código a tu servidor
fetch('/api/auth/xstar-callback', {
  method: 'POST',
  body: JSON.stringify({ code }),
  headers: { 'Content-Type': 'application/json' }
});

// Backend: Intercambia el código por token
app.post('/api/auth/xstar-callback', async (req, res) => {
  const { code } = req.body;
  const tokenResponse = await fetch('https://xstarmail.es/api/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      client_id: process.env.XSTAR_CLIENT_ID,
      client_secret: process.env.XSTAR_CLIENT_SECRET, // Seguro en el backend
      redirect_uri: process.env.XSTAR_REDIRECT_URI,
      grant_type: 'authorization_code'
    })
  });
  // ...
});
```

## 📚 API Reference

### `XstarOAuth.init(options)`
Inicializa el SDK con las credenciales de tu aplicación.

**Parámetros:**
- `clientId` (string, requerido): Tu Client ID
- `redirectUri` (string, requerido): URI de redirección después de la autorización
- `state` (string, opcional): Estado para prevenir CSRF

### `XstarOAuth.login()`
Inicia el flujo de autenticación OAuth.

### `XstarOAuth.renderButton(selector, options)`
Renderiza un botón de login estilizado.

**Parámetros:**
- `selector` (string|Element): Selector CSS o elemento DOM
- `options` (object, opcional):
  - `text` (string): Texto del botón
  - `className` (string): Clase CSS personalizada
  - `noStyles` (boolean): Deshabilitar estilos por defecto

### `XstarOAuth.exchangeCode(code, clientSecret)`
Intercambia un código de autorización por un token de acceso.

⚠️ **Debe ejecutarse en el backend por seguridad.**

### `XstarOAuth.getUserInfo(accessToken)`
Obtiene información del usuario autenticado.

## 🐛 Solución de Problemas

### Error: "Invalid client_id"
- Verifica que tu `clientId` sea correcto
- Asegúrate de que tu aplicación esté activa

### Error: "Invalid redirect_uri"
- El `redirect_uri` debe coincidir exactamente con uno de los URIs registrados
- Verifica que no haya espacios o caracteres especiales

### Error: "Code expired"
- Los códigos de autorización expiran en 10 minutos
- El usuario debe autorizar nuevamente

## 📞 Soporte

Para más ayuda, contacta a soporte@xstarmail.es

