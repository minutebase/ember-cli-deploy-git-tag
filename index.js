var Promise          = require('ember-cli/lib/ext/promise');
var gitty            = require("gitty");
var DeployPluginBase = require('ember-cli-deploy-plugin');

module.exports = {
  name: 'ember-cli-deploy-git-tag',

  createDeployPlugin: function(options) {
    var DeployPlugin = DeployPluginBase.extend({
      name: options.name,

      defaultConfig: {
        revisionKey: function(context) {
          return context.commandOptions.revision || (context.revisionData && context.revisionData.revisionKey);
        },
        deployTag: function(context) {
          var revisionKey  = this.readConfig("revisionKey");
          var deployTarget = context.deployTarget;
          return ["deploy", deployTarget, revisionKey].join('-');
        },
        deployBranch: "master"
      },

      configure: function(/*context*/) {
        this.log('validating config', { verbose: true });
        ['deployTag', 'revisionKey'].forEach(this.applyDefaultConfigProperty.bind(this));
        this.log('config ok', { verbose: true });
      },

      didDeploy: function(context) {
        var tag    = this.readConfig("deployTag");
        var branch = this.readConfig("deployBranch")
        var repo   = (context._Git || gitty)(".");
        var _this  = this;

        return new Promise(function(resolve, reject) {
          repo.createTag(tag, function(error) {
            if (error) {
              reject(error);
            } else {
              resolve(repo, tag);
            }
          });
        }).then(function(repo, tag) {
          repo.push("origin", branch, ["--tags", tag], function(error, success) {
            if (error) {
              _this.log(error, { color: 'red' });
              return Promise.reject(error)
            } else {
              _this.log("tagged "+tag, { verbose: true });
              return Promise.resolve()
            }
          });
        }, function(error) {
          _this.log(error, { color: 'red' });
        });
      }
    });
    return new DeployPlugin();
  }
};
