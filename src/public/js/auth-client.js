(function () {
  var ACCESS_TOKEN_KEY = 'brpec_access_token';
  var SESSION_KEY = 'brpec_sessao';
  var originalFetch = window.fetch.bind(window);
  var refreshPromise = null;

  function getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  function setAccessToken(token) {
    if (token) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    }
  }

  function clearSession() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);
  }

  function shouldAttachToken(url) {
    var target = typeof url === 'string' ? url : url && url.url;
    return typeof target === 'string' && target.indexOf('/api/') === 0 && target.indexOf('/api/auth/') !== 0;
  }

  function cloneOptionsWithAuth(input, init) {
    var options = Object.assign({}, init || {});
    var token = getAccessToken();

    if (!token || !shouldAttachToken(typeof input === 'string' ? input : input.url)) {
      return options;
    }

    var headers = new Headers(options.headers || (input instanceof Request ? input.headers : undefined));
    headers.set('Authorization', 'Bearer ' + token);
    options.headers = headers;
    return options;
  }

  function refreshAccessToken() {
    if (!refreshPromise) {
      refreshPromise = originalFetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'same-origin',
      })
        .then(function (res) {
          if (!res.ok) {
            throw new Error('Refresh token invalido');
          }
          return res.json();
        })
        .then(function (data) {
          if (!data.accessToken) {
            throw new Error('Resposta de refresh invalida');
          }
          setAccessToken(data.accessToken);
          return data.accessToken;
        })
        .finally(function () {
          refreshPromise = null;
        });
    }

    return refreshPromise;
  }

  window.fetch = function (input, init) {
    var firstOptions = cloneOptionsWithAuth(input, init);

    return originalFetch(input, firstOptions).then(function (response) {
      if (response.status !== 401 || !shouldAttachToken(typeof input === 'string' ? input : input.url)) {
        return response;
      }

      return refreshAccessToken()
        .then(function () {
          return originalFetch(input, cloneOptionsWithAuth(input, init));
        })
        .catch(function () {
          clearSession();
          window.location.href = '/login-auth';
          return response;
        });
    });
  };

  window.authClient = {
    getAccessToken: getAccessToken,
    setAccessToken: setAccessToken,
    clearSession: clearSession,
    refreshAccessToken: refreshAccessToken,
  };
})();
