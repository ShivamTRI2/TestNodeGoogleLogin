
const express = require('express');
const app = express();
const session = require('express-session');
aws.config.update({
  secretAccessKey: process.env.ACCESS_SECRET,
  accessKeyId: process.env.ACCESS_KEY,
  region: process.env.REGION,

});
const BUCKET = process.env.BUCKET
const s3 = new aws.S3();

app.set('view engine', 'ejs');

app.use(session({
  resave: false,
  saveUninitialized: true,
  secret: 'SECRET' 
}));

app.get('/', function(req, res) {
  res.render('pages/auth');
});

const port = process.env.PORT || 3000;
app.listen(port , () => console.log('App listening on port ' + port));

const passport = require('passport');
var userProfile;

app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'ejs');
app.get('/success', (req, res) => res.render('pages/success',{user:userProfile}));
app.get('/error', (req, res) => res.send("error logging in"));

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});


const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const GOOGLE_CLIENT_ID = '398294156799-jadlud1l4klhtf461dpive9gak8b2bjb.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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';
passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
      userProfile=profile;
      return done(null, userProfile);
  }
));
 
app.get('/auth/google', 
  passport.authenticate('google', { scope : ['profile', 'email'] }));
 
app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/error' }),
  function(req, res) {
    // Successful authentication, redirect success.
    res.redirect('/success');
  });

  const aws = require('aws-sdk')
const multer = require('multer')
const multerS3 = require('multer-s3');




const upload = multer({
    storage: multerS3({
        s3: s3,
        acl: "public-read",
        bucket: BUCKET,
        key: function (req, file, cb) {
            console.log(file);
            cb(null, file.originalname)
        }
    })
})

app.post('/upload', upload.single('file'), async function (req, res, next) {

    res.send('Successfully uploaded ' + req.file.location + ' location!')

})

app.get("/list", async (req, res) => {

    let r = await s3.listObjectsV2({ Bucket: BUCKET }).promise();
    let x = r.Contents.map(item => item.Key);
    res.send(x)
})


app.get("/download/:filename", async (req, res) => {
    const filename = req.params.filename
    let x = await s3.getObject({ Bucket: BUCKET, Key: filename }).promise();
    res.send(x.Body)
})

app.delete("/delete/:filename", async (req, res) => {
    const filename = req.params.filename
    await s3.deleteObject({ Bucket: BUCKET, Key: filename }).promise();
    res.send("File Deleted Successfully")

})