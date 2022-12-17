require("dotenv").config();
require("./config/database").connect();
const express = require("express");
const multer = require("multer")
const bcrypt  = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("./middleware/auth");
const User = require("./model/user");
const Appointment = require("./model/appointment");
const appointment = require("./model/appointment");
const ObjectId = require('mongoose').Types.ObjectId;
const app = express();


app.use(express.json());


// Register
app.post("/register", async(req,res) => {

  try {  
    const { first_name, last_name, email, password, role } = req.body;
    if (!(email && password && first_name && last_name && role)) {
      res.status(400).send("All input is required");
    }

    const oldUser = await User.findOne({ email });
    if (oldUser) {
      return res.status(409).send("User Already Exist. Please Login");
    }

    //Encrypt user password
    encryptedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      first_name,
      last_name,
      email: email.toLowerCase(), // sanitize: convert email to lowercase
      password: encryptedPassword,
      role
    });

    // Create token
    const token = jwt.sign(
      { user_id: user._id, email },
      process.env.TOKEN_KEY,
      {
        expiresIn: "2h",
      }
    );
 
    user.token = token;
    res.status(201).json(user);
  } catch (err) {
    console.log(err);
  }
});

// Login
app.post("/login",async(req,res) => {
    try {
        const { email, password } = req.body;
        if (!(email && password)) {
        res.status(400).send("All input is required");
        }
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            // Create token
            const token = jwt.sign(
                { user_id: user._id, email },
                process.env.TOKEN_KEY,
                {
                expiresIn: "2h",
                }
            );
            user.token = token;

            // user
            res.status(200).json({
                data: {email: user.email, role: user.role},
                token
            });
        }
        res.status(400).send("Invalid Credentials");
    } catch (err) {
        console.log(err);
    }
});

// Appointment CRUD

// create new appointment 
app.post("/appointment",auth, async(req,res) => {
    try{
        var userobj = ObjectId(req.user.user_id);
        const curruser = await User.findOne({_id: userobj});
        // console.log(curruser);
        var startTime = null;
        var endTime = null;
        var patientEmail = null;
        var doctorEmail = null;
        var patient = null;
        var doctor = null;

        // doctor making appointments 
        if(curruser.role == 'doctor'){
            startTime = req.body.startTime;
            endTime = req.body.endTime;
            patientEmail = req.body.patientEmail;
            if (!(startTime && endTime && patientEmail)) {
                res.status(400).send("All input is required");
            }
            patient = await User.findOne({email: patientEmail});
            if(!patient){
                res.status(400).send("Patient not found in database");
            }
            doctorEmail = curruser.email;
            doctor = curruser;
        }

        // receptionist making appointments
        else if(curruser.role == 'receptionist'){
            startTime = req.body.startTime;
            endTime = req.body.endTime;
            patientEmail = req.body.patientEmail;
            doctorEmail = req.body.doctorEmail;
            if (!(startTime && endTime && patientEmail && doctorEmail)) {
                res.status(400).send("All input is required");
            }
            patient = await User.findOne({email: patientEmail});
            doctor = await User.findOne({email: doctorEmail});
            if (!patient){
                res.status(400).send("Patient not found in database");
            }
            if(!doctor){
                res.status(400).send("Doctor not found in database");
            }
            
        }

        // patient making appointments
        else if(curruser.role == 'patient'){
            startTime = req.body.startTime;
            endTime = req.body.endTime;
            doctorEmail = req.body.doctorEmail;
            if (!(startTime && endTime && doctorEmail)) {
                res.status(400).send("All input is required");
            }
            doctor = await User.findOne({email: doctorEmail});
            if(!doctor){
                res.status(400).send("Doctor not found in database");
            }
            patientEmail = curruser.email;
            patient = curruser;
        }

        // finding if patient's appointment is already there
        const prevApp = await Appointment.findOne({patientEmail: patientEmail})
        if(prevApp){
            res.status(409).send("Appointment for this patient is already there");
        }
        
        // finding conflicting appointments
        const conflictingApps = await Appointment.find({doctorId: doctor._id })
                                            .where('startTime').lt(endTime)
                                            .where('endTime').gt(startTime)
                                            .exec();
        
        // creating appointments                                    
        if(conflictingApps.length === 0){
            const appointment = await new Appointment({
                startTime: startTime,
                endTime: endTime,
                patientId: patient._id,
                patientEmail: patientEmail,
                doctorId: doctor._id,
                doctorEmail: doctorEmail,
                author: userobj
            })
            appointment.save();
            res.status(201).send({appointment, msg: "Appointment created successfully"})
        }
        else{
            var response = "";
            conflictingApps.forEach( app => {
                response += (`There is already a booking from ${app.startTime} to ${app.endTime} of ${app.doctorEmail} with ${app.patientEmail} !`);
                response += '\n'              
            });
            res.status(400).send(response);
        }

    } catch (err){
        console.log(err);
    }
})


// Add medical record
const upload = multer({
    storage: multer.diskStorage({
        destination: "/home/isha/Desktop/healthblox/upload/",  // Storage location
    }),
    limits: {fileSize: 20000000}
}).single("file")

app.put("/uploadrecord/:appointmentId",auth,async(req,res)=>{
    try{
        var userobj = ObjectId(req.user.user_id);
        const curruser = await User.findOne({_id: userobj});
        const appId = req.params.appointmentId;
        // console.log("appID",appId);
        if(curruser.role === 'patient'){
            var appointment = await Appointment.findOne({_id: appId,patientEmail:curruser.email});
            console.log(appointment);
            if(!appointment){
                return res.send("Appointment id is invalid");
            }

            upload(req, res, (err) => {

                // console.log("output",req.file);
                appointment.medicalRecord = req.file;
                appointment.save();
                if(err){
                    return res.send(err)
                }
                else{
                    return res.send("File Uploaded Successfully")                
                }
            })
        }
        else{
            res.send("Action is not done by patient")
        }

    } catch(err){
        console.log(err);
    }
})

// fetch my appointments(doctor)
app.get("/myappointments",auth,async(req,res) => {
    try{
        var userobj = ObjectId(req.user.user_id);
        const curruser = await User.findOne({_id: userobj});

        const myappointments = await Appointment.find({doctorEmail:curruser.email});
        return res.status(200).json(myappointments);
          
    } catch(err){
        console.log(err);
    }
})

// get patient info using patient id
app.get("/user/:id", auth, async(req,res) =>{
    try{
        var userobj = ObjectId(req.user.user_id);
        const curruser = await User.findOne({_id: userobj});

        const patientId = req.params.id;
        if(curruser.role === 'doctor' ){
            const appointment = await Appointment.findOne({doctorEmail: curruser.email, patientId:patientId});
            if (!appointment){
                res.send("Appointment of this user doesn't exist under you");
            }
            else{
                const userinfo = await User.findOne({_id:patientId});
                res.status(200).json(userinfo);
            }
        }
        else{
            res.send("Action not allowed to current role");
        }
    } catch(err){
        console.log(err);
    }
})

module.exports = app;