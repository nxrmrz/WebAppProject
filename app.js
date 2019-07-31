//setting server to localhost:3000
var express = require('express');
var app = express();
app.set('port', process.env.PORT || 3000);

//specifying handlebars to be used
var handlebars = require('express-handlebars');
app.engine('handlebars', handlebars({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

// //using bodyparser to read form data
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

// Process file uploads
var formidable = require("formidable");

// Image thumbnnails
var jimp = require("jimp");

//using sessions to store login verification accross pages
var session = require('express-session');
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: "compsci719"

}));
//all db functions are accessible through db variable
var db = require('./dao-module.js');

//using password-hash to encrypt password data
var passwordHash = require('password-hash');

//using bcrypt to encrypt password data
var bcrypt = require('bcrypt');

//using local passport for Authentication
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

//checks username and password entered into login page and grants or refuses access respectively
var localStrategy = new LocalStrategy(
    function (username, password, done) {
        //getting all usernames and hashed passwords from blogdata.db
        db.getAllUsers(function (users) {
            //find the correct user in users arrayn and store in user variable
            console.log(users)
            var user = users.find(function (user) {
                console.log('user.username')
                console.log(user.username)
                console.log('username')
                console.log(username)
                return user.username == username;
            });
            //if the username entered does not exist
            if (!user) {
                console.log("No such user");
                return done(null, false, { message: 'Invalid user' });
            };
            //checks if password is incorrect
            if (!bcrypt.compareSync(password, user.password)) {
                console.log("password incorrect");
                return done(null, false, { message: 'Invalid password' });
            }
            //grants access as username exists and password matches
            console.log("authentication successfull");
            done(null, user);
        });
    }
);

//function called to save the authenticated users username to the session
passport.serializeUser(function (user, done) {
    done(null, user.username);
});

//function that gets all data in the database relating to the user with the given username
passport.deserializeUser(function (username, done) {
    db.getAllUsers(function (users) {
        var validate;
        var user = users.find(function (user) {
            if (user.username == username) {
                validate = true
                return username;
            }
            else{
                validate = false
            }
        });
        if(validate){
        done(null, user);
        }
        else{
            done(null, false)
        }
    });
});

//setting passport to use the above local strategy
passport.use('local', localStrategy);

//start passport and set storage inside session
app.use(passport.initialize());
app.use(passport.session());

//a helper function that will check if a user is authenticated and redirect them to the login page if not
function isLoggedin(req, res, next) {
    if (req.isAuthenticated()) {
        console.log('islogged in calling next()');
        return next();
    }
    console.log("isloggedIn redirectig to /login page")
    res.redirect(301, "/login");
}

//a helper function to check if a username is in the userlist and return a boolean value
function checkUsername(array, username) {
    for (var object in array) {
        if (array[object].username == username) {
            return true
        }
    }
    return false;
}

// ========================================================================================================================================
// Route Handlers
// ========================================================================================================================================

//homepage
app.get('/', function (req, res) {
    if (req.isAuthenticated()) {
        console.log("hit is authenticated if statement");

        db.getuserID(req.user.username, function (userID) {
            db.getUserDetails(userID.userID, function (user) {
                db.getAllArticles(function (articles) {
                    db.getComments(articles.articleid, function (comments) {
                        console.log("getting into getComments function in /, article id is: " + articles.articleid);
                        res.render('homepage', { user: user[0], username: user[0].username, articles: articles, comments: comments});
                    })
                });
            });
        });
    }
    else {
        db.getAllArticles(function (articles) {
            db.getComments(articles.articleid, function (comments){
                var data = {

                    articles: articles,
                    comments: comments,
                    loggedOut: req.query.loggedOut,
                    loginFail: req.query.loginFail
    
                }
                console.log(data);
                res.render('homepage', data);
            })
        });
    }
});

//user handlers 
// login page
app.get('/login', function (req, res) {
    console.log('hit login')
    if (req.isAuthenticated()) {
        console.log("redirecting to homepage");
        res.redirect(301, '/');
    }else{
        res.render('login');
    }
});

//login submit validation
app.post('/loginsubmit', passport.authenticate('local',

    {
        successRedirect: '/',
        failureRedirect: '/login?loginFail=true',
        //failureFlash: true 
    }
));

//logout process 
app.get('/logout', function (req, res) {
    console.log(req);
    // req.logOut();
    req.session.destroy(function() {
        res.clearCookie('connect.sid');
        res.redirect('/?loggedOut=true');
    });
});

//new user registration page
app.get('/newuser', function (req, res) {

    res.render('newuser');
});

//new user submitting process
app.post('/usersubmit', function (req, res) {
    var form = new formidable.IncomingForm();
    var fileName;

    form.on("fileBegin", function (name, file) {
        console.log("inside form.on");
        if (file.name) {
            file.path = __dirname + "/public/avatars/" + file.name;
        }
    });

    form.parse(req, function (err, fields, files) {
        // Save uploaded files in the ./public folder.
        console.log(files);
        console.log(fields);

        if (files.avatarselect.name != "") {
            fileName = files.avatarselect.name;

            // Read the uploaded image from disk
            jimp.read(__dirname + "/public/avatars/" + fileName, function (err, image) {

                // When the image has been read, create thumbnail by resizing to fit in a 400 x 400 box, then save it.
                image.resize(400, 400).write(__dirname + "/public/avatars/" + fileName, function (err) {
                });
            });
        } else {
            console.log("hit else")
            fileName = fields.avatarselect
        }
        //hashing supplied password and all supplied details in database
        bcrypt.hash(fields.password, 10, function (err, hash) {
            db.createUser(fields.username, fields.firstname, fields.lastname, hash, fields.birthday, fields.country, fields.bio, fileName);
        });
        //sending user to the login page where their login should give them access
        res.redirect('/login');
    });
});

//page displays userdata stored in database
app.get('/userprofile', isLoggedin, function (req, res) {
    console.log(req.user.username);

    db.getuserID(req.user.username, function (userID) {
        db.getUserDetails(userID.userID, function (user) {
            res.render('userprofile', { user: user[0], username: req.user.username })
        });
    });
});

//update user details in database
app.post("/userupdate", isLoggedin, function (req, res) {
    db.getuserID(req.user.username, function (userID) {
        db.getUserDetails(userID.userID, function (user) {

            var form = new formidable.IncomingForm();
            form.parse(req, function (err, fields, files) {
                // Save uploaded files in the ./public folder.
                console.log(files);
                console.log(fields);
                var dbUser = user[0];
                console.log(dbUser)

                //overwriting dbData with changed user info
                for (var item in dbUser) {
                    if (fields[item] != "") {
                        dbUser[item] = fields[item];
                        console.log(item + "has changed");
                    }
                }
                //writing uploaded image to server
                form.on("fileBegin", function (name, file) {
                    console.log("inside form.on");
                    if (file.name) {
                        file.path = __dirname + "/public/avatars/" + file.name;
                    }
                });

                //if user has replaced avatar with a custom image
                if (files.avatarselect.name != "") {
                    fileName = files.avatarselect.name;

                    // Read the uploaded image from disk
                    jimp.read(__dirname + "/public/avatars/" + fileName, function (err, image) {

                        // When the image has been read, create thumbnail by resizing to fit in a 400 x 400 box, then save it.
                        image.resize(400, 400).write(__dirname + "/public/avatars/" + fileName, function (err) {
                        });
                    });
                //if the avatar has been changed by a preselected avatar
                } else if (fields.avatarselect != ""){
                    console.log("hit else")
                    fileName = fields.avatarselect
                }
                //if the avatar has not been changed
                else{
                    fileName = dbUser.avatar;
                }
                console.log("req.user.password");
                console.log(req.user.password);

                if (dbUser.password != req.user.password) {
                    bcrypt.hash(dbUser.password, 10, function (err, hash) {
                        console.log('password changed')
                        db.editUser(dbUser.username, dbUser.firstname, dbUser.lastname, hash, dbUser.birthday, dbUser.country, dbUser.bio, fileName, userID.userID);
                    });
                } else {
                    //bcrypt.hash(dbUser.password, 10, function (err, hash) {
                        console.log('password unchanged')
                        db.editUser(dbUser.username, dbUser.firstname, dbUser.lastname, dbUser.password, dbUser.birthday, dbUser.country, dbUser.bio, fileName, userID.userID);
                    //});
                }
                // sending user to the login page where their login should give them access
                res.redirect(301, '/userprofile');
            });
        });
    });
});

//checks for whether username exists in database or not, sends boolean to AJAX request
app.post('/usercheck', function (req, res) {

    var username = req.body.username;
    db.getAllUsers(function (users) {
        if (checkUsername(users, username)) {
            res.send(true);
        }
        else {
            res.send(false);
        };
    });
});

app.get('/userdelete', isLoggedin, function (req, res) {
    db.getuserID(req.user.username, function (userID) {
        console.log(userID)
        db.deleteUser(userID.userID);
        res.redirect('/logout');
    });
});

//posting a comment on an article with a given id
app.post('/addComment/:id', function (req,res){

    var username = req.user.username;
    db.getuserID(username, function (userID){
        console.log("getting into getUserID function");
        db.addComment(req.body.comment, username, req.params.id, function(commentID){
            console.log("comment id: " + commentID);
            res.redirect("/");
        });
    });
});

//deleting a comment from a given article (with articleid)
app.post('/deleteComment/:id', function (req,res){
    db.deleteComment(req.params.id, function(rowsAffected){
        console.log(rowsAffected + " row(s) affected");
    });
});

// When the user POSTs to "/postsubmit", add a new article, then redirect back to articles display.
app.post('/postsubmit', function (req, res) {

    var articleTitle = req.body.posttitle;
    var articleContent = req.body.postcontent;
    var username = req.user.username;

    db.getuserID(username, function (userID) {

        db.addArticle(articleTitle, articleContent, userID.userID, function (articleid) {
            console.log("New article added with id = " + articleid);
            res.redirect("/");
        });
    });
});

app.get('/articles/:id', function (req, res) {
    if (req.isAuthenticated()) {
        db.getuserID(req.user.username, function (userID) {
            db.getUserDetails(userID.userID, function (user) {
                console.log(user);
                db.getArticle(req.params.id, function (article) {
                    console.log(article)
                    db.getComments(req.params.id, function (comments) {

                        if (article.authorid == user.userID) {
                            res.render('article', { article: article, comments: comments, validuser: true });
                        }
                        else {
                            res.render('article', { article: article, comments: comments });
                        }
                    });
                });
            });
        });
    }
    else {
        db.getArticle(req.params.id, function (article) {
            db.getComments(req.params.id, function (comments) {
                res.render('article', { article: article, comments: comments });
            });
        });
    }
});

// When the user POSTs to "/delete/:id", delete the article with the given id, then redirect to /.
app.post('/delete/:id', function (req, res) {

    db.deleteArticle(req.params.id, function (rowsAffected) {
        console.log(rowsAffected + " row(s) affected.");

        res.redirect('/');
    });
});

//new post page
app.get('/newpost', function (req, res) {
    res.render('newpost');
});

//making public folder accessible to the client
app.use(express.static(__dirname + "/public"));

// Error handling
// //404 response 
// app.use(function (req, res, next) {
//     res.status(404);
//     res.render('404');
// });

// //500 response
// app.use(function (err, req, res, next) {
//     console.error(err.stack);
//     res.status(500);
//     res.render('500');
// });


//making all files in public available to client
app.use(express.static(__dirname + "/public"));
//editing the article title and content - pre-edit
app.post('/edit/:id', function (req, res) {

    //grab the article from the database and allows editing of the article title and post
    db.getArticle(req.params.id, function (article) {
        res.render('newpost', { title: article.title, content: article.content, articleid: req.params.id });
        console.log("getting to the db.getArticle function");
    });
});

//editing article title and content - sends edits to database and renders homepage post-edit
app.post('/afterEdit/:id', function (req, res) {
    db.editArticle(req.body.posttitle, req.body.postcontent, req.params.id);
    res.redirect('/');
});

//set localhost to listen to port 3000
app.listen(app.get('port'), function () {
    console.log('Express started on http://localhost:' + app.get('port'));
});