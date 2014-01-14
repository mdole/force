_             = require 'underscore'
sinon         = require 'sinon'
Backbone      = require 'backbone'
routes        = require '../routes'
CurrentUser   = require '../../../models/current_user.coffee'
{ fabricate } = require 'antigravity'

describe 'Order routes', ->
  beforeEach ->
    @req = { params: {}, user: new CurrentUser fabricate 'user' }
    @res = { render: sinon.stub(), redirect: sinon.stub(), locals: { sd: {} } }
    sinon.stub Backbone, 'sync'

  afterEach ->
    Backbone.sync.restore()

  describe '#shipping', ->

    describe 'with a pending order', ->

      beforeEach ->
        @order = fabricate 'order'
        routes.shipping @req, @res
        Backbone.sync.args[0][2].success(@order)

      it 'renders the order page', ->
        @res.render.args[0][0].should.equal 'templates/shipping'

      it 'passes the order to the template', ->
        @res.render.args[0][1]['order'].toJSON().id.should.equal @order.id
        @res.render.args[0][1]['order'].toJSON().user.should.equal @order.user

    describe 'without a pending order', ->

      it 'redirects to the home page', ->
        routes.shipping @req, @res
        Backbone.sync.args[0][2].error()
        @res.redirect.args[0][0].should.equal '/'

  describe '#checkout', ->

    describe 'with a pending order', ->

      it 'renders the order page order has shipping address', ->
        @order = fabricate('order')
        @order.shipping_address =
          city: 'New York'
          region: "NY"
          postal_code: '10012'
          name: 'Artsy'
          street: '401 Broadway'
        routes.checkout @req, @res
        Backbone.sync.args[0][2].success(@order)
        @res.render.args[0][0].should.equal 'templates/checkout'

      it 'redirects to the shipping page unless order has shipping address', ->
        @order = fabricate('order')
        routes.checkout @req, @res
        Backbone.sync.args[0][2].success(@order)

        Backbone.sync.args[0][2].error()
        @res.redirect.args[0][0].should.equal '/order'

    describe 'without a pending order', ->

      it 'redirects to the home page', ->
        routes.checkout @req, @res
        Backbone.sync.args[0][2].error()
        @res.redirect.args[0][0].should.equal '/'

  describe '#complete', ->

    describe 'with a pending order', ->

      beforeEach ->
        @order = fabricate 'order'
        routes.complete @req, @res
        Backbone.sync.args[0][2].success(@order)

      it 'renders the order page', ->
        @res.render.args[0][0].should.equal 'templates/complete'

      it 'passes the order to the template', ->
        @res.render.args[0][1]['order'].toJSON().id.should.equal @order.id
        @res.render.args[0][1]['order'].toJSON().user.should.equal @order.user

    describe 'without a pending order', ->

      it 'redirects to the home page', ->
        routes.complete @req, @res
        Backbone.sync.args[0][2].error()
        @res.redirect.args[0][0].should.equal '/'
