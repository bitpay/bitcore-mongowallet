'use strict';

var net = require('net');
var EventEmitter = require('events').EventEmitter;

var chai = require('chai');
var should = chai.should();
var sinon = require('sinon');
var proxyquire = require('proxyquire');
var bitcore = require('bitcore-lib');
var _ = require('lodash');

var WebWorker = require('../lib/web-workers');
var db = require('../lib/db');
var messages = require('../lib/messages');

describe('Wallet Web Worker', function() {
  var options = {
    network: 'testnet',
    bitcoinHeight: 200,
    bitcoinHash: 'f47dd62225a96d8306e9e3404efd7d35e3693c266db0c9ec5e1aaa88950dc41d',
    configPath: '/tmp/bwdb',
    clientsConfig: [{
      rpcport: 2000,
      rpcuser: 'user',
      rpcpassword: 'password'
    }],
    port: 20001,
    writerSocketPath: '/tmp/writer-1000.sock'
  };
  describe('@constructor', function() {
    it('will create a new instance', function() {
      var worker = new WebWorker(options);
      worker.port.should.equal(20001);
      worker.writerSocketPath.should.equal('/tmp/writer-1000.sock');
      worker.clientsConfig.should.deep.equal([{
        rpcport: 2000,
        rpcuser: 'user',
        rpcpassword: 'password'
      }]);
      worker.bitcoinHash.should.equal('f47dd62225a96d8306e9e3404efd7d35e3693c266db0c9ec5e1aaa88950dc41d');
      worker.bitcoinHeight.should.equal(200);
      worker.network.should.equal(bitcore.Networks.testnet);
      worker.config.network.should.equal(bitcore.Networks.testnet);
      worker.config.path.should.equal('/tmp/bwdb');
      worker._stopping.should.equal(false);
      worker.safeConfirmations.should.equal(12);
    });
    it('will set the safe confirmations setting', function() {
      var options2 = _.clone(options);
      options2.safeConfirmations = 32;
      var worker = new WebWorker(options2);
      worker.safeConfirmations.should.equal(32);
    });
  });
  describe('#start', function() {
    var sandbox = sinon.sandbox.create();
    afterEach(function() {
      sandbox.restore();
    });
    it('it will call all start methods', function(done) {
      var worker = new WebWorker(options);
      sandbox.stub(db, 'open').returns({});
      worker.config.getDatabasePath = sinon.stub();
      worker._connectWriterSocket = sinon.stub().callsArg(0);
      worker._startListener = sinon.stub().callsArg(0);
      worker.start(done);
    });
    it('it will give error from start methods', function(done) {
      var worker = new WebWorker(options);
      sandbox.stub(db, 'open').returns({});
      worker.config.getDatabasePath = sinon.stub();
      worker._connectWriterSocket = sinon.stub().callsArg(0);
      worker._startListener = sinon.stub().callsArgWith(0, new Error('test'));
      worker.start(function(err) {
        should.exist(err);
        err.message.should.equal('test');
        done();
      });
    });
  });
  describe('#stop', function() {
    var sandbox = sinon.sandbox.create();
    afterEach(function() {
      sandbox.restore();
    });
    it('it will close db if not stopping', function(done) {
      var worker = new WebWorker(options);
      sandbox.stub(db, 'close');
      worker.db = db;
      worker.stop(function(err) {
        if (err) {
          return done(err);
        }
        db.close.callCount.should.equal(1);
        done();
      });
    });
    it('it will not close db if already stopping', function(done) {
      var worker = new WebWorker(options);
      worker._stopping = true;
      sandbox.stub(db, 'close');
      worker.db = db;
      worker.stop(function(err) {
        if (err) {
          return done(err);
        }
        db.close.callCount.should.equal(0);
        done();
      });
    });
  });
  describe('#_connectWriterSocket', function() {
    var sandbox = sinon.sandbox.create();
    afterEach(function() {
      sandbox.restore();
    });
    it('will run callback function associated with writer task', function(done) {
      var worker = new WebWorker(options);
      var socket = new EventEmitter();
      sandbox.stub(net, 'connect').callsArg(1).returns(socket);
      var msg = {
        id: 'cgtbe3t',
        error: null,
        result: {hello: 'world'}
      };
      sandbox.stub(messages, 'parser', function(callback) {
        return function() {
          callback(msg);
        };
      });
      worker._connectWriterSocket(function(err) {
        if (err) {
          return done(err);
        }
        worker._writerCallbacks.cgtbe3t = function(err, result) {
          if (err) {
            return done(err);
          }
          result.should.deep.equal({
            hello: 'world'
          });
          done();
        };
        socket.emit('data');
      });
    });
    it('will give error from writer task callback', function(done) {
      var worker = new WebWorker(options);
      var socket = new EventEmitter();
      sandbox.stub(net, 'connect').callsArg(1).returns(socket);
      var msg = {
        id: 'cgtbe3t',
        error: {message: 'test'},
        result: {}
      };
      sandbox.stub(messages, 'parser', function(callback) {
        return function() {
          callback(msg);
        };
      });
      worker._connectWriterSocket(function(err) {
        if (err) {
          return done(err);
        }
        worker._writerCallbacks.cgtbe3t = function(err) {
          should.exist(err);
          err.message.should.equal('test');
          done();
        };
        socket.emit('data');
      });
    });
  });
  describe('#_queueWriterTask', function() {
    it('will log error from socket write', function() {
    });
    it('will write to socket with write task message', function() {
    });
  });
  describe('#_importTransaction', function() {
    it('queue a write task to save the transaction if above safe confirmations', function() {
    });
    it('will give back transaction directly if below safe confirmations', function() {
    });
    it('will handle error from bitcoind', function() {
    });
    it('will handle error from writer task', function() {
    });
  });
  describe('#getWalletTransactions', function() {
    it('will map over txids and get wallet transactions', function() {
    });
    it('will map over txids and import transactions that are missing', function() {
    });
  });
  describe('#_getLatestTxids', function() {
  });
  describe('#getBalance', function() {
    it('will get balance for wallet', function() {
    });
  });
  describe('#getWalletTxids', function() {
    it.skip('will give error if options are invalid', function(done) {
      var wallet = new Wallet({node: node});
      var txn = {
        abort: sinon.stub()
      };
      wallet.db = {
        env: {
          beginTxn: sinon.stub().returns(txn)
        }
      };
      wallet._checkTxidsQuery = sinon.stub().throws(new Error('test'));
      wallet.getWalletTxids({}, function(err) {
        err.should.be.instanceOf(Error);
        txn.abort.callCount.should.equal(1);
        done();
      });
    });
    it('will give buffers if option is set', function() {
    });
    it('will give hex strings if option buffer is not set', function() {
    });
  });
  describe('#_updateLatestTip', function() {
    it('will update with the latest bitcoin height and hash', function() {
    });
    it('will log error if there is not a tip', function() {
    });
  });

  describe('#_endpointBalance', function() {
    it('will set status to 200 with balance', function() {
    });
    it('will call sendError if error', function() {
    });
  });

  describe('#_endpointTxids', function() {
    it('will set status to 200 with txids', function() {
    });
    it('will call sendError if error', function() {
    });
  });

  describe('#_endpointTransactions', function() {
    it('will set status to 200 with txs', function() {
    });
    it('will call sendError if error', function() {
    });
  });

  describe('#_endpointUTXOs', function() {
    it('will set status to 200 with utxos', function() {
    });
    it('will call sendError if error', function() {
    });
  });

  describe('#_endpointPutAddress', function() {
    it('will set status to 201 if new address created', function() {
    });
    it('will set status to 200 without new address', function() {
    });
    it('will call sendError if error', function() {
    });
  });

  describe('#_endpointPostAddresses', function() {
    it('will set status to 201 if new addresses', function() {
    });
    it('will set status to 204 without new addresses', function() {
    });
    it('will call sendError if error', function() {
    });
  });

  describe('#_endpointPutWallet', function() {
    it('will set status to 204 if not a new walletId', function() {
    });
    it('will set status to 201 for new walletId', function() {
    });
    it('will call sendError if error', function() {
    });
  });

  describe('#_startListener', function() {
    it('will create express application, setup and start listening on port', function() {
      var listen = sinon.stub();
      var app = {listen: listen};
      var WebWorkerStubbed = proxyquire('../lib/web-workers', {
        express: sinon.stub().returns(app)
      });
      var worker = new WebWorkerStubbed(options);
      worker._setupMiddleware = sinon.stub();
      worker._setupRoutes = sinon.stub();
      worker._startListener();
      worker._setupMiddleware.callCount.should.equal(1);
      worker._setupMiddleware.args[0][0].should.equal(app);
      worker._setupRoutes.callCount.should.equal(1);
      worker._setupRoutes.args[0][0].should.equal(app);
      listen.callCount.should.equal(1);
      listen.args[0][0].should.equal(20001);
    });
  });
});
