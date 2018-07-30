import XHRmock from 'xhr-mock';
// Keen.debug = true;

import Keen from '../../../lib/browser';
import config from '../helpers/client-config';

describe('.recordEvent(s) methods (browser)', () => {
  let client;
  let mockFn1 = jest.fn();

  const batchData = {
        'pageview': [
          { page: 'this one' },
          { page: 'same!' }
        ],
        'click': [
          { page: 'tada!' },
          { page: 'same again' }
        ]
  };
  const batchResponse = JSON.stringify({
        click: [
          { 'success': true }
        ],
        pageview: [
          { 'success': true },
          { 'success': true }
        ]
  });
  const dummyResponse = { created: true };
  const dummyErrorResponse = { error: true };

  beforeEach(() => {
    fetch.resetMocks();
    XHRmock.setup();
    mockFn1.mockClear();
    client = new Keen({
      projectId: config.projectId,
      writeKey: config.writeKey,
      host: config.host,
      protocol: config.protocol
    });
  });

  afterEach(() => {
    XHRmock.teardown();
  });

  describe('.recordEvent', () => {

    it('should not send events if set to \'false\'', () => {
      Keen.enabled = false;
      client.recordEvent('not-going', { test: 'data' }, mockFn1);
      expect(mockFn1).toBeCalledWith(expect.any(String), null);
      Keen.enabled = true;
    });

    it('should return an error message if event collection is omitted', () => {
      client.recordEvent(null, { test: 'data' }, mockFn1);
      expect(mockFn1).toBeCalledWith(expect.any(String), null);
    });

    describe('via Fetch (default transport method)', () => {
      it('should send a POST request to the API', async () => {
        fetch.mockResponseOnce(JSON.stringify(dummyResponse));
        let res = await client.recordEvent(config.collection + '_succeed', config.properties);
        const fetchUrl = fetch.mock.calls[0][0];
        const fetchOptions = fetch.mock.calls[0][1];
        expect(fetchOptions).toMatchObject({
          method: 'POST',
          mode: 'cors',
          redirect: 'follow',
          referrerPolicy: 'unsafe-url',
          headers:
            { Authorization: 'bad71ffe8407322ab70559afef29508799ed64b3f75a1ba9e26',
              'Content-Type': 'application/json' },
          retry: undefined
        });
        expect(fetchOptions.body).toEqual(JSON.stringify(config.properties));
        expect(fetchUrl).toContain(config.collection + '_succeed');
        expect(res).toEqual(dummyResponse);
      });

      it('should return a Promise', (done) => {
        XHRmock.post(/./g, (req, res) => {
          return res.status(400);
        });
        client
          .recordEvent(config.collection + '_succeed', config.properties)
          .then(() => {}).catch(err => {
            done();
          });
      });
    });

    describe('*deprecated* via XHR/CORS (if supported)', () => {
      it('should send a POST request to the API using XHR', (done) => {
        const clientWithXHR = new Keen({
          projectId: config.projectId,
          writeKey: config.writeKey,
          host: config.host,
          protocol: config.protocol,
          requestType: 'xhr'
        });
        let mockFn1local = jest.fn((error, response) => {
          expect(error).toBe(null);
          expect(response).toBeInstanceOf(Object);
          done();
        });
        XHRmock.post(new RegExp(config.collection + '_succeed'), (req, res) => {
          return res.status(200).body(JSON.stringify({ created: true }));
        });
        clientWithXHR.recordEvent(config.collection + '_succeed', config.properties, mockFn1local);
      });

    });

  });

  describe('.recordEvents', () => {

    it('should not send events if Keen.enabled is set to \'false\'', () => {
      Keen.enabled = false;
      client.recordEvents(batchData, mockFn1);
      expect(mockFn1).toBeCalledWith(expect.any(String), null);
      Keen.enabled = true;
    });

    it('should return an error message if first argument is not an object', () => {
      client.recordEvents([], mockFn1);
      expect(mockFn1).toBeCalledWith(expect.any(String), null);
      mockFn1.mockClear();
      client.recordEvents('', mockFn1);
      expect(mockFn1).toBeCalledWith(expect.any(String), null);
    });

    describe('via Fetch (default transport method)', () => {
      it('should send a POST request to the API', async () => {
        fetch.mockResponseOnce(JSON.stringify(dummyResponse));
        let res = await client.recordEvents(batchData);
        const fetchOptions = fetch.mock.calls[0][1];
        expect(fetchOptions).toMatchObject({
          method: 'POST',
          mode: 'cors',
          redirect: 'follow',
          referrerPolicy: 'unsafe-url',
          headers:
            { Authorization: 'bad71ffe8407322ab70559afef29508799ed64b3f75a1ba9e26',
              'Content-Type': 'application/json' },
          retry: undefined
        });
        expect(fetchOptions.body).toEqual(JSON.stringify(batchData));
        expect(res).toEqual(dummyResponse);
      });

      it('should return a Promise', (done) => {
        XHRmock.post(/./g, (req, res) => {
          return res.status(400);
        });
        client
          .recordEvents(batchData)
          .then(() => {}).catch(err => {
            done();
          });
      });
    });

    describe('*Deprecated* via XHR/CORS (if supported)', () => {
      it('should send a POST request to the API using XHR', (done) => {
        const clientWithXHR = new Keen({
          projectId: config.projectId,
          writeKey: config.writeKey,
          host: config.host,
          protocol: config.protocol,
          requestType: 'xhr'
        });
        let mockFn1local = jest.fn((error, response) => {
          expect(error).toBe(null);
          expect(response).toBeInstanceOf(Object);
          done();
        });
        XHRmock.post(new RegExp('events'), (req, res) => {
          return res.status(200).body(JSON.stringify({ somkey: [{ success: true }] }));
        });
        clientWithXHR.recordEvents(batchData, mockFn1local);
      });
    });

  });

});
