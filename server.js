var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars"); 
// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/unit18Populater", { useNewUrlParser: true });

// Routes


app.get("/", function(req, res) {

    res.render("home");
});

app.get("/saved", function(req, res) {

    res.render("saved");
});


// Scraping the website
app.get("/scrape", function(req, res) {
  //Used New York Times because I was most familiar with it
  request("https://www.nytimes.com/", function(error, response, html) {
    var $ = cheerio.load(html);
    $("article").each(function(i, element) {
      var result = {};

      summary = ""
      if ($(this).find("ul").length) {
        summary = $(this).find("li").first().text();
      } else {
        summary = $(this).find("p").text();
      };

      result.title = $(this).find("h2").text();
      result.summary = summary;
      result.link = "https://www.nytimes.com" + $(this).find("a").attr("href");

      // creates a new Article!!!!!
      var entry = new Article(result);

      // Now, save that entry to the db
      entry.save(function(err, dbPost) {
        if (err) {
          console.log(err);
        }
        else {
          console.log(dbPost);
        }
      });

    });
      // Tell the browser that we finished scraping the text
       res.send("Scrape Complete");

  });
});

// This will get the articles we scraped from the mongoDB
app.get("/articles", function(req, res) {
  Article.find({}, function(error, dbPost) {
    if (error) {
      console.log(error);
    }
    else {
      res.json(dbPost);
    }
  });
});

app.get("/articles/:id", function(req, res) {
  Article.findOne({ "_id": req.params.id })
  .populate("note")
  .exec(function(error, dbPost) {
    if (error) {
      console.log(error);
    }
    else {
      res.json(dbPost);
    }
  });
});


// Save an article
app.post("/articles/save/:id", function(req, res) {
      Article.findOneAndUpdate({ "_id": req.params.id }, { "saved": true})
      // Execute the above query
      .exec(function(err, dbPost) {
        if (err) {
          console.log(err);
        }
        else {
          res.send(dbPost);
        }
      });
});

// Delete an article
app.post("/articles/delete/:id", function(req, res) {
      Article.findOneAndUpdate({ "_id": req.params.id }, {"saved": false, "notes": []})
      .exec(function(err, dbPost) {
        if (err) {
          console.log(err);
        }
        else {
          res.send(dbPost);``
        }
      });
});


// app.post("/notes/save/:id", function(req, res) {

// });

// app.delete("/notes/delete/:note_id/:article_id", function(req, res) {

// });

// Listen on port
app.listen(PORT, function() {
  console.log("App running on port " + PORT);
});
