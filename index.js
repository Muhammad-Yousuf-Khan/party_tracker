import dotenv from 'dotenv';
import express from 'express';
import pg from 'pg';
import session from 'express-session'
dotenv.config();
const app = express()
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({extended:true}))

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

const {PGHOST, PGDATABASE, PGUSER, PGPASSWORD} = process.env;


const db = new pg.Pool({
    user: PGUSER,
    host: PGHOST,
    database: PGDATABASE,
    password: PGPASSWORD,
    port: 5432,
    ssl:{
        require: true,
    }
  });


  app.get('/', async (req,res)=>{
    res.render('index.ejs')
  })
  
  app.post('/',(req,res)=>{
    if(req.body.password == 5050){
        req.session.loggedIn = true
        res.redirect('/home')
    }
    else
        res.render('index.ejs',{message:" Login Failed... Enter Correct credentials."})
  })

  let Message 

  app.get('/home',async (req,res)=>{
    if(req.session.loggedIn){
        let response1 = await db.query("SELECT reg FROM party")
        let t_stds = response1.rows.length
        let response2 = await db.query("SELECT reg FROM party WHERE isentered = 1")
        let e_stds = response2.rows.length
        let response3 = await db.query("SELECT reg FROM party WHERE isentered = 0")
        let o_stds = response3.rows.length

        let sendMessage = Message
        Message = ''
        res.render('home.ejs',{ t_stds:t_stds , e_stds:e_stds , o_stds:o_stds , message:sendMessage})
    }
    else
        res.redirect('/')
  })

  app.post('/entry',async (req,res)=>{

    if(req.session.loggedIn){

        let idd = req.body.studentId
        let response = await db.query("SELECT * FROM party WHERE reg = $1 ",[idd])
        if(response.rows.length < 1){
            Message = " ❌ Student not found in Record with Id " + idd ;
        }
        else{
            let rec = response.rows[0] 
            if(rec.isentered == 1){
                Message = " ❌ " + rec.name + " with Id " + idd + " is already Entered.";
            }
            else{
                await db.query("UPDATE party SET isentered = 1 WHERE reg = $1",[idd])
                Message = " ✅ "+ rec.name + " with Id "+ idd + " is Successfully Entered.";
            }
        }   
        res.redirect('/home')
    }
    else{
        res.redirect('/')
    }
  })

  app.post('/exit',async (req,res)=>{

    if(req.session.loggedIn){

        let iid = req.body.StudentId
        let responsee = await db.query("SELECT * FROM party WHERE reg = $1 ",[iid])
        if(responsee.rows.length < 1){
            Message = " ❌ Student not found in Record with Id " + iid ;
        }
        else{
            let recc = responsee.rows[0] 
            if(recc.isentered == 0){
                Message = " ❌ " + recc.name + " with Id " + iid + " is already Outside.";
            }
            else{
                await db.query("UPDATE party SET isentered = 0 WHERE reg = $1",[iid])
                Message = " ✅ "+ recc.name + " with Id "+ iid + " is Successfully Exited.";
            }
        }   
        res.redirect('/home')
    }
    else{
        res.redirect('/')
    }
  })


app.use((req,res,next)=>{
    req.session.loggedIn = false
    next()
})

app.listen(PORT)
