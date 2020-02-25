# travelog server

## Description

An express server that supports CRUDs operations for users and places.

Works with https://github.com/gaganssingh/travelog-app

## API Documentation

### Routes

-   /api/users/
-   /api/users/signup
-   /api/users/login
-   /api/places/
-   /api/places/{placeid}
-   /api/places/user/{userid}

### Whats included in this code base:

-   `do` and `undo` migrations to create tables in the database.
-   `trunc` files to seed and truncate data from the database (seeds are not included as users and places can be added after application is up and running).
-   Server configuration
-   Endpoint routers
-   Authentication and authorization
-   Testing for all endpoints

## Techenical stack

### Back end built using

-   Nodejs
-   Express
-   Winston
-   Morgan
-   Helmet
-   Dotenv

### Database built & hosted using

-   PostgreSQL
-   Knex
-   Postgrator
-   Heroku

### API testing done using

-   Chai
-   Mocha
-   Supertest

## Live page:

## Github repos:

### Client:

https://github.com/gaganssingh/travelog-app

### API:

https://github.com/gaganssingh/travelog-server
