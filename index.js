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
        }
      },

      configure: function(/*context*/) {
        this.log('validating config');
        ['deployTag', 'revisionKey'].forEach(this.applyDefaultConfigProperty.bind(this));
        this.log('config ok');
      },

      didDeploy: function(context) {
        var tag   = this.readConfig("deployTag");
        var repo  = (context._Git || gitty)(".");
        var _this = this;

        return new Promise(function(resolve, reject) {
          repo.createTag(tag, function(e) {
            if (e) {
              reject(e);
            } else {
              _this.log("tagged "+tag);
              resolve();
            }
          });
        });
      }
    });
    return new DeployPlugin();
  }
};