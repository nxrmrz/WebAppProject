// //all route handlers for final project

// module.exports = function(app){

//     //homepage
// app.get('/', function(req, res) {
//     res.render('homepage');
// });

// //login page
// app.get('/login', function(req, res){

//     res.render('login');
// });

// app.post('/loginsubmit', function(req, res){
    
//     //check if username is in DB
//     var username = req.body.username;
//     db.all("SELECT * FROM users WHERE username = ?", [username]), function (err, rows) {
//         console.log(this.changes + " row(s) affected.");
//         console.log(rows);
//     }
//     //if yes - retrieve password hash from db and store as 
//     var hashedPassword
//     //check if password matches db password
//     if(passwordHash.verify(req.body.pwd, hashedPassword)){
//     //if yes create session with below json data
    
//     //first name
//     //username
app.get('/newuser', function(req,res){

    res.render('newuser');
});

app.get('/newpost', function(req,res){

    res.render('newpost');
});

//image gallery
app.get('/gallery', function(req,res){

    res.render('gallery');
});

app.post('/submit', function(req, res){
    //hashing password

//     // ELSE redirect back to login page
    
    });



// })

// };