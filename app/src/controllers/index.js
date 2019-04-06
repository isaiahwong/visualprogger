const api = {};

api.index = {
  method: 'GET',
  url: '/',
  middlewares: [],
  handler(req, res) {
    return res.render('index', { title: 'Visual Progger' });
  }
};

api.socket = {
  method: 'GET',
  url: '/socket',
  middlewares: [],
  handler(req, res) {
    res.render('socket', { title: 'Socket' });
  }
};

api.live = {
  method: 'GET',
  url: '/live',
  middlewares: [],
  handler(req, res) {
    res.render('live', { title: 'Live' });
  }
};

api.cssTest = {
  method: 'GET',
  url: '/cssTest',
  middlewares: [],
  handler(req, res) {
    res.render('cssTest', { title: 'Live' });
  }
};

export default api;