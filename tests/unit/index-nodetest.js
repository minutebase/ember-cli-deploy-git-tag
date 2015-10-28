/* jshint node: true */

'use strict';

var Promise = require('ember-cli/lib/ext/promise');
var assert  = require('ember-cli/tests/helpers/assert');

var stubProject = {
  name: function(){
    return 'my-project';
  }
};

var mockCreateTag = function(tag, cb) { cb(); }
var mockGit = function() {
  return {
    createTag: mockCreateTag
  };
};

describe('redis plugin', function() {
  var subject, mockUi;

  beforeEach(function() {
    subject = require('../../index');
    mockUi = {
      verbose: true,
      messages: [],
      write: function() { },
      writeLine: function(message) {
        this.messages.push(message);
      }
    };
  });

  it('has a name', function() {
    var result = subject.createDeployPlugin({
      name: 'test-plugin'
    });

    assert.equal(result.name, 'test-plugin');
  });

  it('implements the correct hooks', function() {
    var plugin = subject.createDeployPlugin({
      name: 'test-plugin'
    });
    assert.ok(plugin.didDeploy);
  });

  describe('configure hook', function() {
    it('runs without error if config is ok', function() {
      var plugin = subject.createDeployPlugin({
        name: 'tag-git'
      });

      var context = {
        ui: mockUi,
        project: stubProject,
        config: {
          "tag-git": {
            app: 'some-app',
            token: 'super-secret-token'
          }
        }
      };
      plugin.beforeHook(context);
      plugin.configure(context);
      assert.ok(true); // didn't throw an error
    });

    describe('resolving revisionKey from the pipeline', function() {
      it('uses the config data if it already exists', function() {
        var plugin = subject.createDeployPlugin({
          name: 'tag-git'
        });

        var config = {
          deployTag: 'some-tag',
          revisionKey: '12345'
        };
        var context = {
          ui: mockUi,
          project: stubProject,
          config: {
            "tag-git": config
          },
          commandOptions: {},
          revisionData: {
            revisionKey: 'something-else'
          }
        };

        plugin.beforeHook(context);
        plugin.configure(context);
        assert.equal(plugin.readConfig('revisionKey'), '12345');
        assert.equal(plugin.readConfig('deployTag'), 'some-tag');
      });

      it('uses the commandOptions value if it exists', function() {
        var plugin = subject.createDeployPlugin({
          name: 'tag-git'
        });

        var config = {
        };
        var context = {
          ui: mockUi,
          project: stubProject,
          config: {
            "tag-git": config
          },
          commandOptions: {
            revision: 'abcd'
          },
          revisionData: {
            revisionKey: 'something-else'
          }
        };

        plugin.beforeHook(context);
        plugin.configure(context);
        assert.typeOf(config.revisionKey, 'function');
        assert.equal(config.revisionKey(context), 'abcd');
      });

      it('uses the context value if it exists and commandOptions doesn\'t', function() {
        var plugin = subject.createDeployPlugin({
          name: 'tag-git'
        });

        var config = {
        };
        var context = {
          ui: mockUi,
          project: stubProject,
          config: {
            "tag-git": config
          },
          commandOptions: { },
          revisionData: {
            revisionKey: 'something-else'
          }
        };

        plugin.beforeHook(context);
        plugin.configure(context);
        assert.typeOf(config.revisionKey, 'function');
        assert.equal(config.revisionKey(context), 'something-else');
      });
    });
    describe('without providing config', function () {
      var config, plugin, context;
      beforeEach(function() {
        config = { };
        plugin = subject.createDeployPlugin({
          name: 'tag-git'
        });
        context = {
          ui: mockUi,
          project: stubProject,
          config: config
        };
        plugin.beforeHook(context);
      });
      it('warns about missing optional config', function() {
        plugin.configure(context);
        var messages = mockUi.messages.reduce(function(previous, current) {
          if (/- Missing config:\s.*, using default:\s/.test(current)) {
            previous.push(current);
          }

          return previous;
        }, []);
        assert.equal(messages.length, 2);
      });
      it('adds default config to the config object', function() {
        plugin.configure(context);
        assert.isDefined(config["tag-git"].deployTag);
        assert.isDefined(config["tag-git"].revisionKey);
      });
    });

    describe('didDeploy hook', function() {
      it('tags git with revisionKey and environment', function() {
        var plugin = subject.createDeployPlugin({
          name: 'tag-git'
        });

        var taggedWith;
        mockCreateTag = function(tag, cb) {
          taggedWith = tag;
          cb();
        };

        var config = {
          revisionKey: '123abc'
        };

        var context = {
          ui: mockUi,
          project: stubProject,
          config: {
            "tag-git": config,
          },
          _Git: mockGit,
          deployTarget: "development",
          commandOptions: { }
        };

        plugin.beforeHook(context);
        plugin.configure(context);

        return assert.isFulfilled(plugin.didDeploy(context))
          .then(function() {
            assert.equal(taggedWith, "deploy-development-123abc")
          })
      });

    });
  });
});
