//using sqlite3 for database
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./blogdata.db', function (err) {
    if (err) {
        console.error(err.message);
    }
    console.log('connected to the blogdata database.');
});

//=======================================================================================================================================
//User functions
//=======================================================================================================================================

module.exports.getAllUsers = function (callback) {
    db.all("SELECT username, password FROM users", function (err, rows) {
        callback(rows);

    });
};

module.exports.getUserDetails = function (userID, callback) {
    // db.all("SELECT username, firstname, lastname, password, birthday, bio, country, avatar FROM users WHERE userID IS ?", userID, function (err, user) {
    db.all("SELECT * FROM users WHERE userID IS ?", userID, function (err, user) {

        console.log("loaded getUserDetail");
        callback(user);

    });
};

module.exports.createUser = function (username, firstname, lastname, password, birthday, country, bio, avatar) {
    db.run("INSERT INTO users (username, firstname, lastname, password, birthday, country, bio, avatar) VALUES (?,?,?,?,?,?,?,?)",
        [username, firstname, lastname, password, birthday, country, bio, avatar],
        function (err) {

            console.log(this.changes + "rows affected.");
        }
    );
}

module.exports.getuserID = function (username, callback) {
    db.all("SELECT userID FROM users WHERE username IS ?", username, function (err, rows) {
        console.log("loaded userID's");
        console.log(rows);
        callback(rows[0]);
    });
}

module.exports.editUser = function (username, firstname, lastname, password, birthday, country, bio, avatar, userID) {
    db.run('UPDATE users SET username = ?, firstname = ?, lastname = ?, password = ?, birthday = ?, country = ?, bio = ?, avatar = ? WHERE userID IS ?',
        [username, firstname, lastname, password, birthday, country, bio, avatar, userID],
        function (err) {

            console.log(this.changes + "rows affected.");
        }
    );
}

module.exports.deleteUser = function (userID){
    db.run('DELETE FROM users WHERE userID IS ?',
    userID, function (err){
        console.log(userID + "has been deleted");
    });
}

//=======================================================================================================================================
//Article functions
//=======================================================================================================================================

module.exports.getAllArticles = function (callback) {
    db.all("SELECT articleid, created, title, content, authorID FROM articles", function (err, rows) {

        console.log("loaded articles");
        console.log(rows);
        callback(rows);
    });
};

// A function which gets the article with the given id from the database, then sends it to the given callback.
module.exports.getArticle = function (articleid, callback) {
    db.all("SELECT * FROM articles WHERE articleid = ?", [articleid], function (err, rows) {

        var article = rows[0]; // ensures only 1 article selected.

        callback(article);
    });
};

// / A function that adds a new article with the given title and content to the database, then sends its automatically generated id to the given callback.
module.exports.addArticle = function (title, content, authorid, callback) {
    db.run("INSERT INTO articles (title, content, authorid) VALUES (?, ?, ?)", [title,content,authorid], function (err) {

        // Within this function, you can use this.lastID to get the automatically-generated ID that was just inserted into the db.
        // console.log("New article added with id = " + this.lastID);

        // Within this function, you can use this.changes to get the number of rows affected by the query.
        console.log(this.changes + " row(s) affected.");

        callback(this.lastID);
    });
};

//A function that edits the article with the given id. 
module.exports.editArticle = function (title, content, articleid, callback) {
    db.run("UPDATE articles SET title = ?, content = ? WHERE articleid IS ?", [title, content, articleid], function (err) {
        console.log(this.changes + " row(s) affected");
    });
};

// / A function that deletes the article with the given id from the database, then sends the number of rows affected (probably 0 or 1) to the given callback.
module.exports.deleteArticle = function (articleid, callback) {
    db.run("DELETE FROM articles WHERE articleid = ?", [articleid], function (err) {

        callback(this.changes);
    });
};

//=======================================================================================================================================
//Comments functions
//=======================================================================================================================================

module.exports.addComment = function(content, username, articleid, callback){
    db.run("INSERT INTO comments (content, username, articleid) VALUES (?, ?, ?)", [content, username, articleid], function (err){
        callback(this.lastID);
    });
}

module.exports.deleteComment = function (commentid, callback) {
    db.run("DELETE FROM comments WHERE commentid = ?"), [commentid], function (err) {
        callback(this.changes);
    }
};

module.exports.editComment = function (content, commentid, callback) {
    db.run("UPDATE comments SET content =? WHERE commentid IS ?"), [content, commentid], function (err) {
        callback(this.changes);
    }
};

module.exports.getComments= function(articleid, callback){
    db.all('SELECT content FROM comments WHERE articleid = ?', articleid, function (err, rows) {
        callback(rows);
    })
}
