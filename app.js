/**
 * Module dependencies.
 */

var express = require('express');
var mongoose = require('mongoose');
var connectTimeout = require('connect-timeout');

var models = require('./models');
var Plan;
var Tag;

var app = module.exports = express.createServer();

// Configuration

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(connectTimeout({ time: 10000 }));
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'topsecret', cookie: { maxAge: 3600000 }}));  // 1 hour expiration
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function() {
  app.use(express.logger({ format: '\x1b[1m:method\x1b[0m \x1b[33m:url\x1b[0m :response-time ms' }))
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  app.set('db-uri', 'mongodb://localhost/osc-development');
});

app.configure('production', function() {
  app.use(express.errorHandler());
  app.set('db-uri', 'mongodb://localhost/osc-production');
});

// Helpers

app.helpers({
  appName: 'Office Seating Chart',
  version: '0.1',

  nameAndVersion: function(name, version) {
    return name + ' v' + version;
  }
});

app.dynamicHelpers({
  session: function(req, res) {
    return req.session;
  },
  plans: function(req, res) {
    return req.plans;
  },
  url: function(req, res) {
    return req.url;
  }
});

// Models initialization

models.defineModels(mongoose, function() {
  mongoose.connect(app.set('db-uri'), function(err) {
    if (err) console.log(err);
  });
});

// Routes

app.get('/plan|admin/*|/|/login', function(req, res, next) {
  models.getPlans(function(err, plans) {
    if (err) console.log(err);
    req.plans = plans;
    next();
  });
});

// require admin
app.all('/admin/*', function(req, res, next) {
  if (req.session.admin) {
    next();
  } else {
    res.redirect('/login');
  }
});

function afterPlanAndTags(req, res, view) {
  models.getPlanById(req.params.id, function(err, plan) {
    models.getTagsByPlanId(req.params.id, function(err, tags) {
      if (err) console.log(err);
      res.render(view, {
        plan: plan, tags: tags
      });
    });
  });
}

// normal plan view
app.get('/plan/:id', function(req, res) {
  afterPlanAndTags(req, res, 'plan/index');
});

// administration page
app.get('/admin/tags/:id?', function(req, res) {
  if (req.params.id) {
    afterPlanAndTags(req, res, 'admin/tags');
  } else {
    models.getPlan(function(err, plan) {
      if (plan) {
        models.getTagsByPlanId(plan.id, function(err, tags) {
          res.render('admin/tags', {
            plan: plan, tags: tags
          });
        });
      } else {
        res.render('admin/tags', {
          plan: undefined
        });
      }
    });
  }
});

// ajax get tag
app.get('/admin/tag/:id', function(req, res) {
  models.getTag(req.params.id, function(err, tag) {
    res.send(tag.toObject());
  });
});

// create tag
app.post('/admin/tag', function(req, res) {
  models.createTag(req.body, function(err, tag) {
    res.send(tag.toObject());
  });
});

// update tag location
app.put('/admin/tag/:id/updateLocation', function(req, res) {
  models.updateTag(req.params.id,
                   { left: req.body.left, top: req.body.top }, function(err, tag) {
    res.send(tag.toObject());
  });
});

// update tag
app.put('/admin/tag/:id', function(req, res) {
  models.updateTag(req.params.id,
                   { name: req.body.name,
                     photo: req.body.photo,
                     color: req.body.color }, function(err, tag) {
    res.send(tag.toObject());
  });
});

// delete tag
app.del('/admin/tag/:id', function(req, res) {
  models.deleteTag(req.params.id, function(err) {
    res.send(null);
  });
});

// ajax get plan
app.get('/admin/plan/:id', function(req, res) {
  models.getPlanById(req.params.id, function(err, plan) {
    res.send(plan.toObject());
  });
});

// create plan
app.post('/admin/plan', function(req, res) {
  models.createPlan(req.body, function(err, plan) {
    res.send(plan.toObject());
  });
});

// update plan
app.put('/admin/plan/:id', function(req, res) {
  models.updatePlan(req.params.id,
                   { name: req.body.name,
                     url: req.body.url,
                     width: req.body.width,
                     height: req.body.height }, function(err, plan) {
    if (err) console.log(err);
    res.send(plan.toObject());
  });
});

// delete plan
app.del('/admin/plan/:id', function(req, res) {
  models.deletePlan(req.params.id, function(err) {
    res.send(null);
  });
});

// login page
app.get('/login', function(req, res) {
  if (req.session.admin) {
    res.redirect('/');
  } else {
    res.render('login');
  }
});

// login action
app.post('/login', function(req, res) {
  if (req.body.username === 'admin' && req.body.password === 'admin') {
    req.session.admin = true;
  } else {
    req.session.admin = false;
  }
  res.redirect('/admin');
});

// logout link
app.get('/logout', function(req, res) {
  req.session.admin = false;
  res.redirect('/');
});

// admin link redirect
app.get('/admin', function(req, res) {
  res.redirect('/admin/tags');
});

// home page
app.get('/', function(req, res) {
  if (req.plans.length == 0) {
    res.render('index', {
      title: 'Office Seating Chart'
    });
  } else {
    res.redirect('/plan/' + req.plans[0].id);
  }
});

app.listen(process.argv.length > 2 ? process.argv[2] : 3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
