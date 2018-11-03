'use strict'

const chai = require('chai');
const chaiHTTP = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const expect = chai.expect;

const {BlogPost} = require('../models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHTTP);

// used to seed test database with fake blogposts
// using generateBlogPostData() function
// the blogpost generator uses the faker library
// will be used before each test to create a new
// database for each test
function seedBlogPostData() {
    console.info('seeding blogpost data');
    const seedData = [];

    for(let i = 0; i <= 10; i++) {
        seedData.push(generateBlogPostData());
    }
    
    return BlogPost.insertMany(seedData);
}

// generate an object representing a blogpost
// can be used to generate seed data for db
// or request.body data
function generateBlogPostData() {
    return {
        title: faker.random.word(),
        author: {
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName()
        },
        content: faker.lorem.sentence()
    };
}

// function to delete entire database 
// will be called after each test using 'afterEach'
// ensures each test will get data that has not
// already been tampered with
function tearDownDb() {
    console.warn('Deleting database');
    return mongoose.connection.dropDatabase();
}

describe('Blogpost API resource', function() {

    // make sure server is running before tests begin
    before(function() {
        return runServer(TEST_DATABASE_URL);
    })

    // beforeEach and afterEach below toegether resets
    // the database for each test

    // repopulate the database for each test
    beforeEach(function() {
        return seedBlogPostData();
    })

    // erase the database after each test 
    afterEach(function() {
        return tearDownDb();
    })

    // close server once all tests have finished
    after(function() {
        return closeServer();
    })

    // using nested 'describe' blocks for clarity and 
    // providing something small
    describe('GET Endpoint', function() {
        
        it('should return all existing blogposts', function() {
            // strategy: 
            // 1. Make sure the number of posts returned is correct
            // 2. Make sure each post has the correct fields
            // 3. confirm data type and status of returned data
        
            let res;
            return chai.request(app)
                .get('/posts')
                .then(function(blogposts) {
                    res = blogposts;
                    expect(res).to.have.status(200);
                    // if test below doesn't pass, means seeding didn't work
                    expect(res.body).to.have.lengthOf.at.least(1);
                    return BlogPost.count();
                })
                .then(function(count) {
                    expect(res.body).to.have.lengthOf(count);
                })
        });

        it('should return posts with right fields', function() {

            let resPost;
            return chai.request(app)
            .get('/posts')
            .then(function(res) {
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res.body).to.be.a('array');
                expect(res.body).to.have.lengthOf.at.least(1);

                res.body.forEach(function(post) {
                    expect(post).to.be.a('object');
                    expect(post).to.include.keys(
                        'title', 'author', 'content');
                });
                resPost = res.body[0];
                return BlogPost.findById(resPost.id);
            })
            .then(function(post) {
                expect(resPost.id).to.equal(post.id);
                expect(resPost.title).to.equal(post.title);
                expect(resPost.author).to.equal(post.author.firstName 
                + ' ' + post.author.lastName);
                expect(resPost.content).to.equal(post.content);
            });
        });
    });

    describe('Post endpoint', function() {
        // test strategy:
        // make sure the returned object has the right fields 
        // make sure the returned object has the same values as given
        // make sure there is an object within the database with the
        // same id as the returned object

        it('Should add a new post', function() {
        const newPost = generateBlogPostData();
        return chai.request(app)
            .post('/posts')
            .send(newPost)
            .then(function(res) {
                expect(res).to.have.status(201);
                expect(res).to.be.json;
                expect(res.body).to.be.a('object');
                expect(res.body).to.include.keys(
                    'id', 'title', 'author', 'content');
                // compare newpost to post returned by POST request
                expect(res.body.title).to.equal(newPost.title);
                expect(res.body.author).to.equal(newPost.author.firstName
                + ' ' + newPost.author.lastName);
                expect(res.body.content).to.equal(newPost.content);
                return BlogPost.findById(res.body.id)
            })
            .then(function(post) {
                // compare newPost to post stored within database
                expect(post.title).to.equal(newPost.title);
                expect(post.author.firstName).to.equal(newPost.author.firstName);
                expect(post.author.lastName).to.equal(newPost.author.lastName);
                expect(post.content).to.equal(newPost.content)
            });
        });
    });

    describe('PUT endpoint', function() {

        // test stragegy:
        // get existing post from db
        // make PUT request
        // make sure returned post has updated data
        // make sure post in db has updated data

        it('Should update post', function() {
            const update = {
                title: "updated title",
                content: "updated content"
            };

            return BlogPost
            .findOne()
            .then(function(post) {
                update.id = post.id;

                return chai.request(app)
                    .put(`/posts/${update.id}`)
                    .send(update)
            })
            .then(function(res) {
                expect(res).to.have.status(204);
                return BlogPost.findById(update.id);
            })
            .then(function(post) {
                expect(post.title).to.equal(update.title);
                expect(post.content).to.equal(update.content);
            });
        });
    });
});