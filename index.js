var RSVP             = require('rsvp');
var gitty            = require("gitty");
var DeployPluginBase = require('ember-cli-deploy-plugin');

'use strict';

module.exports = {
  name: require('./package').name,

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
        this.log('validating config', { verbose: true });
        ['deployTag', 'revisionKey'].forEach(this.applyDefaultConfigProperty.bind(this));
        this.log('config ok', { verbose: true });
      },

      didDeploy: function(context) {
        var tag   = this.readConfig("deployTag");
        var repo  = (context._Git || gitty)(".");
        var _this = this;

        return new RSVP.Promise(function(resolve, reject) {
          repo.createTag(tag, function(e) {
            if (e) {
              _this.log(e, { color: 'red' });
              reject(e);
            } else {
              _this.log("tagged "+tag, { verbose: true });
              resolve();
            }
          });
        });
      }
    });
    return new DeployPlugin();
  }
};
