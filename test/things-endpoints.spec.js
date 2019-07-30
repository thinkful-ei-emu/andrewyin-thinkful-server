const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');

describe('Things Endpoints', function () {
  let db;

  const {
    testUsers,
    testThings,
    testReviews,
  } = helpers.makeThingsFixtures();

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


  describe('GET /api/things', () => {
    context('Given no things', () => {
      it('responds with 200 and an empty list', () => {
        return supertest(app)
          .get('/api/things')
          .expect(200, []);
      });
    });

    context('Given there are things in the database', () => {
      beforeEach('insert things', () =>
        helpers.seedThingsTables(
          db,
          testUsers,
          testThings,
          testReviews
        )
      );

      it('responds with 200 and all of the things', () => {
        const expectedThings = testThings.map(thing =>
          helpers.makeExpectedThing(
            testUsers,
            thing,
            testReviews,
          )
        );
        return supertest(app)
          .get('/api/things')
          .expect(200, expectedThings);
      });
    });

    context('Given an XSS attack thing', () => {
      const testUser = helpers.makeUsersArray()[1];
      const {
        maliciousThing,
        expectedThing,
      } = helpers.makeMaliciousThing(testUser);

      beforeEach('insert malicious thing', () => {
        return helpers.seedMaliciousThing(
          db,
          testUser,
          maliciousThing,
        );
      });

      it('removes XSS attack content', () => {
        return supertest(app)
          .get('/api/things')
          .expect(200)
          .expect(res => {
            expect(res.body[0].title).to.eql(expectedThing.title);
            expect(res.body[0].content).to.eql(expectedThing.content);
          });
      });

    });
  });


  describe('API calls to protected endpoint', () => {
    const missingBasicToken = { error: 'missing basic token' };
    const unauthorizedRequest = { error: 'unauthorized request' };

    describe('GET /api/things/:thing_id', () => {
      context('Given invalid or missing credentials', () => {
        beforeEach(() =>
          helpers.seedThingsTables(
            db,
            testUsers,
            testThings
          )
        );

        it('responds 401 "Missing basic token" when missing basic token', () => {
          return supertest(app)
            .get('/api/things/123')
            .expect(401, missingBasicToken);
        });
      });
    });

    describe('GET /api/things/:thing_id/reviews', () => {
      context('Given invalid or missing credentials', () => {
        beforeEach(() =>
          helpers.seedThingsTables(
            db,
            testUsers,
            testThings
          )
        );

        it('responds 401 "unauthorized request" when no credentials provided', () => {
          const userNoCreds = { user_name: '', password: '' };
          return supertest(app)
            .get('/api/things/123')
            .set('Authorization', helpers.makeAuthHeader(userNoCreds))
            .expect(401, unauthorizedRequest);
        });

        it('responds 401 unauthorized request when invalid user', () => {
          const invalidUser = { user_name: 'invalid-user', password: 'something' };

          return supertest(app)
            .get('/api/things/123')
            .set('Authorization', helpers.makeAuthHeader(invalidUser))
            .expect(401, unauthorizedRequest);
        });

        it('respondes 401 "unauthorized request" when invalid password', () => {
          const testUser = testUsers[0];
          const invalidPassword = { user_name: testUser.user_name, password: 'invalid-password' };

          return supertest(app)
            .get('/api/things/123')
            .set('Authorization', helpers.makeAuthHeader(invalidPassword))
            .expect(401, unauthorizedRequest);
        });
      });


      context('Given no reviews for things in the database', () => {

        beforeEach(() =>
          helpers.seedThingsTables(
            db,
            testUsers,
            testThings
          )
        );

        it('responds with 404', () => {
          const thingId = 123456;
          return supertest(app)
            .get(`/api/things/${thingId}/reviews`)
            .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
            .expect(404, { error: 'Thing doesn\'t exist' });
        });

      });


      context('Given there are reviews for things in the database', () => {

        beforeEach('insert things', () =>
          helpers.seedThingsTables(
            db,
            testUsers,
            testThings,
            testReviews,
          )
        );

        it('responds with 200 and the specified reviews', () => {
          const thingId = 1;
          const expectedReviews = helpers.makeExpectedThingReviews(
            testUsers, thingId, testReviews
          );

          return supertest(app)
            .get(`/api/things/${thingId}/reviews`)
            .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
            .expect(200, expectedReviews);
        });

      });
    });
  });
});
