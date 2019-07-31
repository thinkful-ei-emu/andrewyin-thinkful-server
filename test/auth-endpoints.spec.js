// require('dotenv').config();
const knex = require('knex');
const jwt = require('jsonwebtoken');

const app = require('../src/app');
const helpers = require('./test-helpers');

describe('Auth Endpoints', function () {
  let db;

  const { testUsers } = helpers.makeThingsFixtures();
  const testUser = testUsers[0];

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());

  before('cleanup', () => helpers.cleanTables(db));

  afterEach('cleanup', () => helpers.cleanTables(db));

  describe('POST /api/auth/login', () => {
    beforeEach('insert users', () =>
      helpers.seedUsers(
        db,
        testUsers,
      )
    );

    const requiredFields = ['user_name', 'password'];

    requiredFields.forEach(field => {
      const loginBody = {
        user_name: testUser.user_name,
        password: testUser.password
      };

      it(`responds with 400 required error when ${field} is missing`, async () => {
        delete loginBody[field];

        return supertest(app)
          .post('/api/auth/login')
          .send(loginBody)
          .expect(400, { error: `missing ${field}` });
      });
    });

    it('responds 400 invalid login when given invalid username', () => {
      const invalidUser = {
        user_name: 'invalid-user',
        password: 'invalid-password'
      };

      return supertest(app)
        .post('/api/auth/login')
        .send(invalidUser)
        .expect(400, { error: 'invalid login' });
    });

    it('responds 400 invalid login when given invalid password', () => {
      const invalidPassword = {
        user_name: testUser.user_name,
        password: 'invalid-password'
      };

      return supertest(app)
        .post('/api/auth/login')
        .send(invalidPassword)
        .expect(400, { error: 'invalid login' });
    });

    it('responds 200 and JWT auth token when valid login', () => {
      const userValidCreds = {
        user_name: testUser.user_name,
        password: testUser.password
      };

      const expectedToken = jwt.sign(
        { user_id: testUser.id },
        process.env.JWT_SECRET,
        {
          subject: testUser.user_name,
          algorithm: 'HS256'
        }
      );

      return supertest(app)
        .post('/api/auth/login')
        .send(userValidCreds)
        .expect(200, {
          authToken: expectedToken
        });
    });
  });
});