_           = require 'underscore'
Backbone    = require 'backbone'
sinon       = require 'sinon'
CurrentUser = require '../../models/current_user'
fabricate   = require('antigravity').fabricate
should      = require 'should'

describe 'CurrentUser', ->

  beforeEach ->
    require('sharify').data.SESSION_ID = 'cool-session-id'
    sinon.stub Backbone, 'sync'
    @user = new CurrentUser fabricate 'user'

  afterEach ->
    Backbone.sync.restore()

  describe '#defaultArtworkCollection', ->

    it 'throws a sensible error when you forget to initialize artwork collections', ->
      (=> @user.defaultArtworkCollection()).should.throw /Must call/

  describe '#saveArtwork', ->

    it 'makes the correct api call', ->
      @user.initializeDefaultArtworkCollection()
      @user.saveArtwork('masterpiece', null)
      Backbone.sync.args[1][0].should.equal 'create'

  describe '#removeArtwork', ->

    it 'makes the correct api call', ->
      @user.initializeDefaultArtworkCollection()
      @user.removeArtwork('masterpiece', null)
      Backbone.sync.args[1][0].should.equal 'delete'

  describe '#fetchSuggestedHomepageArtworks', ->

    it 'fetches homepages artworks', ->
      @user.fetchSuggestedHomepageArtworks({})
      Backbone.sync.args[0][2].url.should.include 'suggested/artworks/homepage'

  describe '#followArtist', ->

    it 'follows an artist', ->
      @user.followArtist 'andy-foobar', {}
      _.last(Backbone.sync.args)[1].url().should.include 'me/follow/artist'

    it 'injects the access token', ->
      @user.set accessToken: 'xfoobar'
      @user.followArtist 'andy-foobar', {}
      _.last(Backbone.sync.args)[2].access_token.should.equal 'xfoobar'

  describe '#addToPendingOrder', ->

    it 'includes session_id if user does not have access_token', ->
      # @user.set accessToken: null
      @user.addToPendingOrder
        editionSetId: '123'
        artworkId: 'artwork-id'
        quantity: 1
        success: sinon.stub()
        error: sinon.stub()

      _.last(Backbone.sync.args)[1].attributes.session_id.should.equal 'cool-session-id'

    it 'does not include session_id if user has access token', ->
      @user.set accessToken: 'xfoobar'
      @user.addToPendingOrder
        editionSetId: '123'
        artworkId: 'artwork-id'
        quantity: 1
        success: sinon.stub()
        error: sinon.stub()
      _.isUndefined(_.last(Backbone.sync.args)[1].attributes.session_id).should.be.ok
