import { each } from 'lodash';

import Process from '../models/process';
import Lines from '../models/lines';
import Live from '../models/live';

const api = {};

api.processes = {
  method: 'GET',
  url: '/processes',
  middlewares: [],
  async handler(req, res) {
    const _process = await Process.findOne({}, 'scanTimestamp')
      .sort('-scanTimestamp')
      .exec();

    if (!_process) throw new ServiceUnavailable('Fail to get processes. Check DB');

    const processes = await Process.find(
      { "scanTimestamp": _process.scanTimestamp },
      '_id scanTimestamp procPath procName score rank'
    );

    if (!processes) throw new ServiceUnavailable('Fail to get processes. Check DB');

    res.json(processes);
  }
};

api.rank = {
  method: 'GET',
  url: '/processes/:rank',
  middlewares: [],
  async handler(req, res) {
    const result = await Process
      .findOne({ "rank": parseInt(req.params.rank) },
        '_id scanTimestamp procPath procName score rank')
      .sort('-scanTimestamp')
      .exec();

    if (!result) throw new ServiceUnavailable('Fail to get result. Check DB');

    res.json(result);
  }
};

api.files = {
  method: 'GET',
  url: '/processes/:rank/files',
  middlewares: [],
  async handler(req, res) {
    const result = await Process
      .findOne({ "rank": parseInt(req.params.rank) }, 'rank files')
      .sort('-scanTimestamp')
      .exec();
    if (!result) throw new ServiceUnavailable('Fail to get result. Check DB');

    res.json(result.files);
  }
};

api.lines = {
  method: 'GET',
  url: '/processes/:rank/lines',
  middlewares: [],
  async handler(req, res) {
    const result = await Lines
      .findOne({ "rank": parseInt(req.params.rank) }, 'rank lines')
      .sort('-scanTimestamp')
      .exec();

    if (!result) throw new ServiceUnavailable('Fail to get result. Check DB');

    res.json(result.lines);
  }
};

api.traversals = {
  method: 'GET',
  url: '/processes/:rank/traversals',
  middlewares: [],
  async handler(req, res) {
    const result = await Process
      .findOne({ "rank": parseInt(req.params.rank) }, 'rank traversals')
      .sort('-scanTimestamp')
      .exec();

    if (!result) throw new ServiceUnavailable('Fail to get result. Check DB');

    res.json(result.traversals);
  }
};

api.libraries = {
  method: 'GET',
  url: '/processes/:rank/libraries',
  middlewares: [],
  async handler(req, res) {
    const result = await Process
    .findOne({"rank": parseInt(req.params.rank)}, 'rank libraries')
    .sort('-scanTimestamp')
    .exec();

    if (!result) throw new ServiceUnavailable('Fail to get result. Check DB');

    res.json(result.libraries);
  }
};

api.scanTime = {
  method: 'GET',
  url: '/scantime',
  middlewares: [],
  async handler(req, res) {
    const result = await Process
      .findOne({}, 'scanTimestamp')
      .sort('-scanTimestamp')
      .exec();

    if (!result) throw new ServiceUnavailable('Fail to get result. Check DB');

    res.json(result.scanTimestamp);
  }
};

api.livescans = {
  method: 'GET',
  url: '/livescans',
  middlewares: [],
  async handler(req, res) {
    const result = await Live.find({});

    if (!result) throw new ServiceUnavailable('Fail to get result. Check DB');

    const list = [];

    result.forEach((item) => {
        if (!(list.indexOf(item.scanId) > -1)) {
            list.push(item.scanId);
        }
    });

    list.sort((a, b) => b-a);

    res.json(list);
  }
};

// prepends /api to all api urls
each(api, fn => fn.url = `/api${fn.url}`);

export default api;