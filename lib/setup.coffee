#
# Sets up intial project settings, middleware, mounted apps, and
# global configuration such as overriding Backbone.sync and
# populating sharify data
#

{ API_URL, NODE_ENV, ARTSY_ID, ARTSY_SECRET, SESSION_SECRET,
  SESSION_COOKIE_MAX_AGE, PORT, FACEBOOK_APP_NAMESPACE,
  MOBILE_MEDIA_QUERY, MOBILE_URL, APP_URL, OPENREDIS_URL, DEFAULT_CACHE_TIME,
  CANONICAL_MOBILE_URL, IMAGES_URL_PREFIX, SECURE_IMAGES_URL,
  GOOGLE_ANALYTICS_ID, SNOWPLOW_COLLECTOR_HOST, GOOGLE_SEARCH_CX,
  GOOGLE_SEARCH_KEY, COOKIE_DOMAIN, AUTO_GRAVITY_LOGIN, GOOGLE_MAPS_API_KEY,
  ADMIN_URL, CMS_URL, MAX_SOCKETS, ARTWORK_EMBED_URL, DELTA_HOST,
  ENABLE_AB_TEST, KIOSK_MODE, KIOSK_PAGE, SESSION_COOKIE_KEY, SENTRY_DSN,
  SENTRY_PUBLIC_DSN, SHOW_AUCTIONS_IN_HEADER, EMPTY_COLLECTION_SET_ID,
  GEMINI_S3_ACCESS_KEY, GEMINI_APP, GEMINI_ACCOUNT_KEY, BIDDER_H1_COPY,
  BIDDER_H2_COPY, APPLICATION_NAME, EMBEDLY_KEY, DISABLE_IMAGE_PROXY,
  POSITRON_URL, CHECK_FOR_AUCTION_REMINDER, GENOME_URL,
  EDITORIAL_ADMINS, STRIPE_PUBLISHABLE_KEY,
  SEGMENT_WRITE_KEY, MAILCHIMP_KEY, GALLERY_INSIGHTS_SLUG, GALLERY_INSIGHTS_LIST } = config = require "../config"
{ parse, format } = require 'url'
_ = require 'underscore'
express = require "express"
Backbone = require "backbone"
sharify = require "sharify"
http = require 'http'
path = require "path"
artsyPassport = require 'artsy-passport'
redirectMobile = require './middleware/redirect_mobile'
proxyGravity = require './middleware/proxy_to_gravity'
proxyReflection = require './middleware/proxy_to_reflection'
proxySitemaps = require './middleware/proxy_sitemaps'
localsMiddleware = require './middleware/locals'
micrositeMiddleware = require './middleware/microsite'
ensureSSL = require './middleware/ensure_ssl'
ensureWWW = require './middleware/ensure_www'
escapedFragmentMiddleware = require './middleware/escaped_fragment'
sameOriginMiddleware = require './middleware/same_origin'
hstsMiddleware = require './middleware/hsts'
unsupportedBrowserCheck = require "./middleware/unsupported_browser"
flash = require 'connect-flash'
flashMiddleware = require './middleware/flash'
robotsMiddleware = require './middleware/robots'
bodyParser = require 'body-parser'
cookieParser = require 'cookie-parser'
session = require 'cookie-session'
favicon = require 'serve-favicon'
logger = require 'morgan'
editRequest = require './edit_request'
raven = require 'raven'
artsyXapp = require 'artsy-xapp'
fs = require 'fs'
artsyError = require 'artsy-error-handler'
cache = require './cache'
timeout = require 'connect-timeout'
bucketAssets = require 'bucket-assets'
splitTestMiddleware = require '../components/split_test/middleware'

# Setup sharify constants & require dependencies that use sharify data
sharify.data =
  JS_EXT: (if ("production" is NODE_ENV or "staging" is NODE_ENV) then ".min.js.cgz" else ".js")
  CSS_EXT: (if ("production" is NODE_ENV or "staging" is NODE_ENV) then ".min.css.cgz" else ".css")
  APP_URL: APP_URL
  POSITRON_URL: POSITRON_URL
  API_URL: API_URL
  NODE_ENV: NODE_ENV
  MOBILE_MEDIA_QUERY: MOBILE_MEDIA_QUERY
  CANONICAL_MOBILE_URL: CANONICAL_MOBILE_URL
  MOBILE_URL: MOBILE_URL
  FACEBOOK_APP_NAMESPACE: FACEBOOK_APP_NAMESPACE
  SECURE_IMAGES_URL: SECURE_IMAGES_URL
  IMAGES_URL_PREFIX: IMAGES_URL_PREFIX
  GOOGLE_ANALYTICS_ID: GOOGLE_ANALYTICS_ID
  SNOWPLOW_COLLECTOR_HOST: SNOWPLOW_COLLECTOR_HOST
  AUTO_GRAVITY_LOGIN: AUTO_GRAVITY_LOGIN
  GOOGLE_MAPS_API_KEY: GOOGLE_MAPS_API_KEY
  ADMIN_URL: ADMIN_URL
  GENOME_URL: GENOME_URL
  CMS_URL: CMS_URL
  DELTA_HOST: DELTA_HOST
  ENABLE_AB_TEST: ENABLE_AB_TEST
  KIOSK_PAGE: KIOSK_PAGE
  KIOSK_MODE: KIOSK_MODE
  EMPTY_COLLECTION_SET_ID: EMPTY_COLLECTION_SET_ID
  GEMINI_S3_ACCESS_KEY: GEMINI_S3_ACCESS_KEY
  GEMINI_APP: GEMINI_APP
  GEMINI_ACCOUNT_KEY: GEMINI_ACCOUNT_KEY
  BIDDER_H1_COPY: BIDDER_H1_COPY
  BIDDER_H2_COPY: BIDDER_H2_COPY
  SENTRY_PUBLIC_DSN: SENTRY_PUBLIC_DSN
  GOOGLE_SEARCH_CX: GOOGLE_SEARCH_CX
  APPLICATION_NAME: APPLICATION_NAME
  EMBEDLY_KEY: EMBEDLY_KEY
  DISABLE_IMAGE_PROXY: DISABLE_IMAGE_PROXY
  SHOW_AUCTIONS_IN_HEADER: SHOW_AUCTIONS_IN_HEADER
  CDN_URL: process.env.CDN_URL
  CHECK_FOR_AUCTION_REMINDER: CHECK_FOR_AUCTION_REMINDER
  EDITORIAL_ADMINS: EDITORIAL_ADMINS
  STRIPE_PUBLISHABLE_KEY: STRIPE_PUBLISHABLE_KEY
  SEGMENT_WRITE_KEY: SEGMENT_WRITE_KEY
  MAILCHIMP_KEY: MAILCHIMP_KEY
  GALLERY_INSIGHTS_SLUG: GALLERY_INSIGHTS_SLUG
  GALLERY_INSIGHTS_LIST: GALLERY_INSIGHTS_LIST

CurrentUser = require '../models/current_user'

module.exports = (app) ->

  # Increase max sockets. The goal of this is to improve app -> api
  # performance but the downside is it limits client connection reuse with keep-alive
  if typeof MAX_SOCKETS == 'number' and MAX_SOCKETS > 0
    http.globalAgent.maxSockets = MAX_SOCKETS
  else
    http.globalAgent.maxSockets = Number.MAX_VALUE

  # Override Backbone to use server-side sync, inject the XAPP token,
  # add redis caching, and augment sync with Q promises.
  Backbone.sync = require "backbone-super-sync"
  Backbone.sync.editRequest = editRequest
  Backbone.sync.cacheClient = cache.client
  Backbone.sync.defaultCacheTime = DEFAULT_CACHE_TIME

  # Inject sharify data before anything
  app.use sharify

  # Development / Test only middlewares that compile assets, mount antigravity, and
  # allow a back door to log in for tests.
  if "development" is NODE_ENV
    app.use require("stylus").middleware
      src: path.resolve(__dirname, "../")
      dest: path.resolve(__dirname, "../public")
    app.use require("browserify-dev-middleware")
      src: path.resolve(__dirname, "../")
      transforms: [require("jadeify"), require('caching-coffeeify')]
      insertGlobals: true
  if "test" is NODE_ENV
    app.use (req, res, next) ->
      return next() unless req.query['test-login']
      req.user = new CurrentUser(
        require('antigravity').fabricate('user', accessToken: 'footoken')
      )
      next()
    app.use "/__gravity", require("antigravity").server

  # Body parser has to be after proxy middleware for
  # node-http-proxy to work with POST/PUT/DELETE
  app.all '/api*', proxyGravity.api

  # Setup Passport middleware for authentication along with the
  # body/cookie parsing middleware needed for that.
  app.use bodyParser.json()
  app.use bodyParser.urlencoded(extended: true)
  app.use cookieParser()
  app.use session
    cookie: secure: true
    secret: SESSION_SECRET
    domain: COOKIE_DOMAIN
    key: SESSION_COOKIE_KEY
    maxage: SESSION_COOKIE_MAX_AGE
    # secure uses req.connection.encrypted, but heroku has nginx terminating SSL
    # secureProxy just sets secure=true
    secureProxy: "production" is NODE_ENV or "staging" is NODE_ENV

  app.use artsyPassport _.extend config,
    CurrentUser: CurrentUser
    signupRedirect: '/personalize'
    SECURE_ARTSY_URL: API_URL
    XAPP_TOKEN: artsyXapp.token

  # Static file middleware above apps & redirects to ensure we don't try to
  # fetch /assets/:pkg.js in an attempt to check for profile or redirect assets
  # fetches to the mobile website for responsive pages.
  fs.readdirSync(path.resolve __dirname, '../apps').forEach (fld) ->
    app.use express.static(path.resolve __dirname, "../apps/#{fld}/public")
  fs.readdirSync(path.resolve __dirname, '../components').forEach (fld) ->
    app.use express.static(path.resolve __dirname, "../components/#{fld}/public")
  app.use express.static(path.resolve __dirname, '../public')
  app.use favicon(path.resolve __dirname, '../public/images/favicon.ico')

  # Proxy / redirect requests before they even have to deal with Force routing
  # (This must be after the auth middleware to be able to proxy auth routes)
  app.use proxySitemaps.app
  app.use redirectMobile
  app.use proxyReflection
  app.use ensureSSL
  app.use ensureWWW

  # General helpers and express middleware
  app.use bucketAssets()
  app.use flash()
  app.use flashMiddleware
  app.use localsMiddleware
  app.use micrositeMiddleware
  app.use artsyError.helpers
  app.use sameOriginMiddleware
  app.use hstsMiddleware
  app.use escapedFragmentMiddleware
  app.use logger('dev')
  app.use unsupportedBrowserCheck
  app.get '/robots.txt', robotsMiddleware
  app.use splitTestMiddleware

  # Mount apps
  app.use require "../apps/legacy_routes"
  app.use require "../apps/home"
  # Needs to be above artwork and artist routes to support the /type/:id/* routes
  app.use require "../apps/apply"
  app.use require "../apps/auction"
  app.use require "../apps/auction_lots"
  app.use require "../apps/auction_support"
  app.use require "../apps/auctions"
  app.use require "../apps/artist"
  app.use require "../apps/artists"
  app.use require "../apps/artwork"
  app.use require "../apps/artwork_2"
  app.use require "../apps/about"
  app.use require "../apps/browse"
  app.use require "../apps/categories"
  app.use require "../apps/contact"
  app.use require "../apps/dev"
  app.use require "../apps/how_auctions_work"
  app.use require "../apps/fairs"
  app.use require "../apps/feature"
  app.use require "../apps/flash"
  app.use require "../apps/galleries_institutions"
  app.use require "../apps/gallery_insights"
  app.use require "../apps/partnerships"
  app.use require "../apps/gene"
  app.use require "../apps/jobs"
  app.use require "../apps/notifications"
  app.use require "../apps/order"
  app.use require "../apps/personalize"
  app.use require "../apps/page"
  app.use require "../apps/press"
  app.use require "../apps/search"
  app.use require "../apps/show"
  app.use require "../apps/shows"
  app.use require "../apps/tag"
  app.use require "../apps/favorites_follows"
  app.use require "../apps/unsubscribe"
  app.use require "../apps/unsupported_browser"
  app.use require "../apps/profile"
  app.use require "../apps/organization"
  app.use require "../apps/user_profile"
  app.use require "../apps/partner"
  app.use require "../apps/articles"
  app.use require "../apps/fair"
  app.use require "../apps/fair_organizer"
  app.use require "../apps/user"
  app.use require "../apps/style_guide"
  app.use require "../apps/auth"
  app.use require "../apps/static"
  app.use require "../apps/shortcuts"
  app.use require "../apps/clear_cache"
  app.use require "../apps/sitemaps"

  # route to ping for system time
  app.get '/system/time', timeout('25s'), (req, res)->
    res.send 200, {time: Date.now()}

  # Route to ping for system up
  app.get '/system/up', (req, res) ->
    res.send 200, { nodejs: true }

  if SENTRY_DSN
    client = new raven.Client SENTRY_DSN, {
      stackFunction: Error.prepareStackTrace
    }
    app.use raven.middleware.express(client)
    client.patchGlobal ->
      console.log('Uncaught Exception. Process exited by raven.patchGlobal.')
      process.exit(1)

  # Finally 404 and error handling middleware when the request wasn't handled
  # successfully by anything above.
  artsyError.handlers app,
    template: path.resolve(__dirname, '../components/main_layout/templates/error.jade')
