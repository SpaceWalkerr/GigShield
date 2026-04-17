function normalizeBasePath(basePath) {
  if (!basePath || basePath === "/") {
    return "";
  }
  const withLeadingSlash = basePath.startsWith("/") ? basePath : `/${basePath}`;
  return withLeadingSlash.endsWith("/")
    ? withLeadingSlash.slice(0, -1)
    : withLeadingSlash;
}

function normalizeRoutePath(routePath) {
  if (!routePath) {
    return "/";
  }
  return routePath.startsWith("/") ? routePath : `/${routePath}`;
}

export function getRouterBasename() {
  return import.meta.env.BASE_URL || "/";
}

export function toAppRoute(routePath) {
  const basePath = normalizeBasePath(getRouterBasename());
  const normalizedRoute = normalizeRoutePath(routePath);
  return `${basePath}${normalizedRoute}` || "/";
}

export function buildAuthCallbackUrl(options = {}) {
  const callbackPath = toAppRoute("/auth/callback");

  const publicSiteUrl = (import.meta.env.VITE_PUBLIC_SITE_URL || "").trim();
  const baseUrl = publicSiteUrl || window.location.origin;
  const normalizedBaseUrl = baseUrl.endsWith("/")
    ? baseUrl.slice(0, -1)
    : baseUrl;

  const url = new URL(`${normalizedBaseUrl}${callbackPath}`);
  if (options.planId) {
    url.searchParams.set("plan", options.planId);
  }
  return url.toString();
}
