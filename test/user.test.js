// const regeneratorRuntime = require("regenerator-runtime");
import 'regenerator-runtime'
const request = require('supertest');
const server = require('../server');

// user router test
describe('user api test', () => {
  const url = '/users';
  const user_ssuproject1031_id = 'n24xv8SIorOECPYpl7lcypB2Yiu2';

  it('User get should be 200', async () => {
    const user_url = url + '/' + user_ssuproject1031_id;
    const result =  await request(server).get(user_url);
    expect(result.statusCode).toBe(200);
  });
});

afterAll((done) => {
  server.close();
  done();
});