'use strict'

const chai = require('chai');
const chaiHTTP = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const expect = chai.expect;

const {BlogPost} = require('../models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

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
    }
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

    

});