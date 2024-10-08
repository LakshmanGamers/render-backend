import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import pg from 'pg'; // Import Client from 'pg'
import bcrypt from 'bcrypt'; // For hashing passwords
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import session from 'express-session'; // Import express-session
import mongoose  from 'mongoose';
import UserModel from './models/UserModel.js';
import  {fetch ,create , updateCol , addBoard}  from './controllers/UserController.js';
import { addTask  } from './controllers/TaskController.js';
import { updateBoard } from './controllers/BoardController.js';
import { createHomeBoard } from './controllers/TaskController.js';



dotenv.config(); // Initialize environment variables

const app = express();
const port = 3000;
const MONGO_URL = process.env.MONGO_URL ;

mongoose.connect(MONGO_URL).then(()=>{
  console.log('Connected to MongoDB');
}).catch((err)=>{
  console.log('Error connecting');
});


// Initialize PostgreSQL client
// const db = new pg.Client({
//   user: process.env.PG_USER,
//   host: process.env.PG_HOST,
//   database: process.env.PG_DATABASE,
//   password: process.env.PG_PASSWORD,
//   port: process.env.PG_PORT,
// });

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
  ssl: {
        rejectUnauthorized: false
      }
});
// Connect to PostgreSQL
db.connect()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch(err => console.error('Connection error', err.stack));

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// const corsOptions = {
//   origin: 'https://task-master1.onrender.com',  // Replace with your allowed origin
//   credentials: true              // Enable credentials (cookies, headers)
// };

// Use the CORS middleware with options
const allowedOrigins = ['http://localhost:5173', 'https://task-master-app-xkeo.onrender.com','https://effortless-naiad-22f798.netlify.app','https://task-master-app-24w9.onrender.com'];

const corsOptions = {
  origin: (origin, callback) => {
    // If no origin (like for some requests such as mobile apps) or origin is in allowedOrigins
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,  // Allow credentials (cookies, authorization headers)
};

app.use(cors(corsOptions));
// Initialize session
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key', // Use a secure secret
  resave: true,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // Cookie valid for 24 hours
    secure: true,               // Set to true in production with HTTPS
    sameSite: 'None'  ,           // Allow cookies to be sent in cross-site requests
        httpOnly: true              // Prevent client-side scripts from accessing the cookie

  }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
  },
  async (email, password, done) => {
    try {
      const result = await db.query('SELECT * FROM users WHERE email=$1', [email]);
      const user = result.rows[0];

      if (!user) {
        return done(null, false, { message: 'User not found' });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return done(null, false, { message: 'Invalid password' });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id); // Store the user ID in the session
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    const user = result.rows[0];
    done(null, user); // Pass the user object to the done callback
  } catch (err) {
    done(err); // Pass any errors to the done callback
  }
});

app.get("/", (req, res) => {
  res.send("Hello");
});

app.post("/signup", async (req, res) => {
  console.log("came here in signup");
  const { email, password, name } = req.body;

  try {
    const result = await db.query('SELECT * FROM users WHERE email=$1', [email]);
    if (result.rows.length > 0) {
      return res.json({ result: "", error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id';
    const values = [name, email, hashedPassword];

    const resp = await db.query(query, values);
    console.log(resp);
    const newUser = resp.rows[0];
    
    const mongoresp = await createHomeBoard('Home',newUser.id)
    console.log(mongoresp);
    await db.query('INSERT INTO projects(name, uid) VALUES($1, $2)', ["Inbox", newUser.id]);

    req.login(newUser, (err) => {
      if (err) {
        return res.status(500).json({ result: "", error: "An error occurred while logging in" });
      }
      return res.json({ result: "User created and logged in successfully", error: "", id: newUser.id });
    });
   
  } catch (err) {
    console.error('Error during signup:', err);
    return res.json({ result: "", error: "An error occurred during signup" });
  }
});

app.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return res.status(500).json({ result: "", error: "An error occurred during login." });
    }
    if (!user) {
      return res.status(401).json({ result: "", error: info.message || "Invalid credentials." });
    }
    req.logIn(user, (err) => {
      if (err) {
        return res.status(500).json({ result: "", error: "An error occurred during login." });
      }
      res.json({ result: "User authenticated", error: "", id: user.id });
    });
  })(req, res, next);
});

app.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ result: "", error: "Logout failed" });
    res.json({ result: "Logged out successfully", error: "" });
  });
});



app.listen(port, () => {



  console.log(`Server is running on port ${port}`);
});


app.get("/getdata",async (req,res)=>{
  console.log(req.isAuthenticated())
  try{
   
    const userId = req.query.userId;
    const resp = await db.query("SELECT t.id, t.heading, t.description, t.duedate, t.priority, t.uid, p.name AS project, t.completed FROM tasks t JOIN projects p ON t.project_id = p.id WHERE t.uid = $1" ,[ userId]);
    return res.json({taskdata : resp.rows} );
  
  }
  catch(err){
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
})

app.post("/addProject",async (req,res)=>{


    try{
    const { name  , userId } = req.body;
    const query = "INSERT INTO projects( name , uid ) VALUES ($1, $2 )";
    const values = [ name , userId];
    const result = await db.query(query , values);
    console.log(result);
    return res.json({message:"Inserted Sucessfully"});
    }
    catch(err){
        console.error(err);
       

      return  res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get("/getProjects",async (req,res)=>{
  try{
    
    const userId = req.query.userId;
    console.log("sdasd"+userId);
    const resp = await db.query("SELECT id, name FROM projects WHERE uid = $1" ,[ userId]);
    console.log(JSON.stringify(resp.rows));
    return res.json({projects : resp.rows} );
  
 
}
  catch(err){
    console.error(err);
   return res.status(500).json({ error:err});
  }
})


app.post("/add",async (req,res)=>{
    try{
    var { heading , description  , duedate , priority  , completed , userId , project} = req.body;
    console.log(project, userId);
    
    const resp = await db.query('SELECT id from projects where name = $1 and uid = $2',[project, userId]);
    const projectId = resp.rows[0].id;
    const query = "INSERT INTO Tasks( heading , description , duedate , priority ,uid, project_id ,completed ) VALUES ($1, $2, $3, $4, $5, $6 , $7 )";
    const values = [ heading , description , duedate , priority , userId,projectId , completed];
      console.log(values);
    const result = await db.query(query , values);
    console.log(JSON.stringify(result));
    return res.status(200).json({result: "Inserted successfully"})
    }
    catch(err){
        console.error(err);
      return  res.status(500).json({ error: "Internal Server Error" });
    }
});

app.put("/task/:id", async(req,res)=>{

  try{
    
const id = req.params.id;


const { heading , description  , duedate , priority  , completed , userId , project} = req.body;


const resp = await db.query("select id from projects where name=$1",[project]);
const projectId = resp.rows[0].id;
const values = [heading , description  , duedate , priority  , completed , userId , projectId ,id];
const output = await db.query('UPDATE tasks set heading = $1, description = $2, duedate = $3  , priority = $4, completed = $5 , uid = $6, project_id = $7 where id =$8',values);
return res.status(200).json({"message": "Edit Successfully" , "error" : "" });
  }
  catch(err){
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }



})

app.delete("/task/:id",async (req,res)=>{

  
  console.log(req.body , req.paramas);
  try{
    
    
const id = req.params.id;
const values = [id];
const output = await db.query('DELETE from  tasks  where id =$1',values);
return res.status(200).json({"message": "Deleted Successfully" , "error" : "" });
  }
  catch(err){
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }


})



app.get('/getUsers/:id', fetch)
app.post("/createUser", create)

app.post('/addBoard', addBoard)
app.get("/update",updateCol);

app.post('/addTask',addTask);
app.post('/updateBoard', updateBoard)
