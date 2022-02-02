var moment = require('moment');
var fs = require('fs');
var path = require('path');

var testrun = process.argv.includes("--test");

function walk(dir, action, done) {
  var results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    var pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, action, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          action(file);
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
};

function touch(f, matches) {
	if (!matches || matches.length<2) return;
  matches.shift();
  try {
  if (matches[0]<"1900" || matches[0]>"2100") return;
  if (matches[1]<"01" || matches[1]>"12") return;
  if (matches[2]<"01" || matches[2]>"31") return;
  matches[1] = parseInt(matches[1])-1;
  var m = moment(matches);
  // console.log(f, matches.join(" .. "), m);
  var s = fs.statSync(f);
  var prev = moment(s.mtime).format("YYYY-MM-DD HH:mm:ss");
  var next = m.format("YYYY-MM-DD HH:mm:ss")
  console.log(f, ":", prev, "==>", next, prev!=next ? "!":"");
  if (!testrun) {
    var t = m.toDate();
    fs.utimesSync(f, t, t);
  }
  } catch(err) {
    console.error(f, "can't touch this", err);
  }
}

function action(f) {
	// console.log(f);
	var m; 
  m = /((\d{4})\-(\d{2})\-(\d{2}))\-((\d{2})\-(\d{2})\-(\d{2}))/ig.exec(f);
  if (m) return touch(f, m);
  m = /(\d{4})\-(\d{2})\-(\d{2}) (\d{2})\.(\d{2})\.(\d{2})/ig.exec(f);
  if (m) return touch(f, m);
  m = /(\d{4})\-(\d{2})\-(\d{2}) (\d{2})-(\d{2})-(\d{2})/ig.exec(f);
  if (m) return touch(f, m);
  m = /(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/ig.exec(f);
  if (m) return touch(f, m);
  m = /(\d{4})(\d{2})(\d{2})/ig.exec(f);
  if (m) return touch(f, m);
  m = /(\d{4})-(\d{2})-(\d{2})/ig.exec(f);
  if (m) return touch(f, m);
  m = /(\d{4})-(\d{2})/ig.exec(f);
  if (m) return touch(f, m);
}

function done(err,results) {
	if (err) {
		console.error(err);
	} else {
		// results.forEach(f=>{ console.log(f); });		
	}
}

// - - - - - - - - - - - - - - - - - - - - - 
var dir = process.argv[2] || ".";
console.log("setting dates for",dir);
walk(dir, action, done);