import { randomBytes } from "crypto";

// Generar un token CSRF (esto coincide con lo que hace /api/csrf-token)
export function generateCsrfToken() {
  return randomBytes(32).toString("hex");
}

// Verificar el token CSRF enviado en el header contra el almacenado en la cookie
export function verifyCsrfToken(request) {
  const cookieStore = request.cookies;
  const csrfTokenFromCookie = cookieStore.get("csrf_token")?.value;
  const csrfTokenFromHeader = request.headers.get("x-csrf-token");

  if (!csrfTokenFromCookie || !csrfTokenFromHeader) {
    throw new Error("Falta el token CSRF en la solicitud");
  }

  if (csrfTokenFromCookie !== csrfTokenFromHeader) {
    throw new Error("El token CSRF no coincide");
  }

  return true;
}
