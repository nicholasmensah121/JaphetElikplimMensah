const config = require('../config/config');

const serializeCookie = (name, value, options = {}) => {
  const encodedValue = encodeURIComponent(value);
  const parts = [`${name}=${encodedValue}`];

  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${options.maxAge}`);
  }

  parts.push(`Path=${options.path || '/'}`);
  parts.push(`SameSite=${options.sameSite || config.COOKIE_SAME_SITE}`);

  if (options.httpOnly !== false) {
    parts.push('HttpOnly');
  }

  if (options.secure ?? config.COOKIE_SECURE) {
    parts.push('Secure');
  }

  return parts.join('; ');
};

const setAuthCookie = (res, token) => {
  res.setHeader(
    'Set-Cookie',
    serializeCookie(config.AUTH_COOKIE_NAME, token, {
      maxAge: 60 * 60 * 24 * 7,
    })
  );
};

const clearAuthCookie = (res) => {
  res.setHeader(
    'Set-Cookie',
    serializeCookie(config.AUTH_COOKIE_NAME, '', {
      maxAge: 0,
    })
  );
};

const parseCookies = (cookieHeader = '') => {
  return cookieHeader.split(';').reduce((cookies, part) => {
    const [rawName, ...rawValue] = part.trim().split('=');
    if (!rawName) {
      return cookies;
    }

    cookies[rawName] = decodeURIComponent(rawValue.join('=') || '');
    return cookies;
  }, {});
};

const getAuthTokenFromCookies = (req) => {
  const cookies = parseCookies(req.headers.cookie || '');
  return cookies[config.AUTH_COOKIE_NAME];
};

module.exports = {
  setAuthCookie,
  clearAuthCookie,
  getAuthTokenFromCookies,
};
