var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Plan;
var Tag;

exports.defineModels = function(mongoose, fn) {

  // Plan

  var PlanSchema = new Schema({
    'name': { type: String, required: true },
    'url': String,
    'width': Number,
    'height': Number
  });

  PlanSchema.virtual('id').get(function() {
    return this._id.toHexString();
  });

  // Tag

  var TagSchema = new Schema({
    'name': { type: String, required: true },
    'left': { type: Number, required: true },
    'top': { type: Number, required: true },
    'photo': String,
    'color': { type: String, default: 'DarkOrange' },
    '_plan' : { type: Schema.ObjectId, ref: 'Plan' }
  });

  TagSchema.virtual('id').get(function() {
    return this._id.toHexString();
  });

  mongoose.model('Plan', PlanSchema);
  mongoose.model('Tag', TagSchema);

  Plan = mongoose.model('Plan');
  Tag = mongoose.model('Tag');

  fn();
}

exports.getTag = function(tagId, callback) {
  Tag.findById(tagId, function(err, tag) {
    callback(err, tag);
  });
}

exports.getTagsByPlanId = function(planId, callback) {
  Tag.find({ _plan: planId }).run(function(err, tags) {
    callback(err, tags);
  });
}

exports.createTag = function(fields, callback) {
  var tag = new Tag(fields);
  tag.save(function(err) {
    if (err) console.log(err);
    callback(err, tag);
  });
}

exports.updateTag = function(tagId, fields, callback) {
  Tag.findById(tagId, function(err, tag) {
    if (tag) {
      for (var field in fields) {
        tag[field] = fields[field];
      }
      tag.save(function(err) {
        callback(err, tag);
      });
    }
  });
}

exports.deleteTag = function(tagId, callback) {
  Tag.findById(tagId, function(err, tag) {
    if (tag) {
      tag.remove(function() {
        callback(err);
      });
    }
  });
}

exports.getPlans = function(callback) {
  Plan.find({}, ['id', 'name'], {}, function(err, plans) {
    callback(err, plans);
  });
}

exports.getPlan = function(callback) {
  Plan.findOne(function(err, plan) {
    callback(err, plan);
  });
}

exports.getPlanById = function(planId, callback) {
  Plan.findById(planId, function(err, plan) {
    callback(err, plan);
  });
}

exports.createPlan = function(fields, callback) {
  var plan = new Plan(fields);
  plan.save(function(err) {
    callback(err, plan);
  });
}

exports.updatePlan = function(planId, fields, callback) {
  Plan.findById(planId, function(err, plan) {
    if (plan) {
      for (var field in fields) {
        plan[field] = fields[field];
      }
      plan.save(function(err) {
        callback(err, plan);
      });
    }
  });
}

exports.deletePlan = function(planId, callback) {
  Plan.findById(planId, function(err, plan) {
    if (plan) {
      plan.remove(function(err) {
        Tag.remove({ _plan: planId }).run(function(err) {
          callback(err);
        });
      });
    }
  });
}
