import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import axios from "axios";
import nodemailer from "nodemailer";
import OTP from "../models/Otp.js";

dotenv.config();

const transport = nodemailer.createTransport({
  service : "gmail",
  host :"smtp.gmail.com",
  port :587,
  secure :false,
  auth:{
    user : "anuththarakawmini@gmail.com",
    pass : "kcieepywtnpbzfsx",
  }
})

const registerUser = async (req, res) => {
  try {
    const { name, email, password ,firstName,lastName,phone,address,role} = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const saltRounds = 10;
    const hashedPassword = bcrypt.hashSync(password, saltRounds);

    // ✅ Actually save user in MongoDB
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      address,
      role
    });

    res.status(201).json({ message: "User registered successfully!", user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error during registration" });
  }
};


export { registerUser };

export function loginUser(req, res) {
    const data = req.body;

    User.findOne({ email: data.email }) // Corrected typo
        .then((user) => {
            if (user == null) {
                return res.status(404).json({ error: "User not found" });
            }

            if(user.isBlocked){
              res.status(403).json({error:"Your account is blocked please contact the admin"});
              return;
            }

            const isPasswordCorrect = bcrypt.compareSync(data.password, user.password);

            if (isPasswordCorrect) {

                const token =jwt.sign({
                    firstName:user.firstName,
                    lastName:user.lastName,
                    email:user.email,
                    role:user.role,
                    profilePicture:user.profilePicture,
                    phone:user.phone,
                    emailVerified : user.emailVerified
                },process.env.JWT_SECRET)
                res.json({ message: "Login successful",token:token ,user:user});
            } else {
                res.status(401).json({ error: "Invalid email or password" });
            }
        })
        .catch(() => {
            res.status(500).json({ error: "Server error" });
        });
}
//admin checking always doing in this code to prevent that commonly used function 

export function isItAdmin(req){
    let isAdmin = false;
  
    if(req.user != null){
      if(req.user.role == "admin"){
        isAdmin=true;
      }
    }
    return isAdmin;
  }

  //check  user is customer

  export function isItCustomer(req){
    let isCustomer = false;
  
    if(req.user != null){
      if(req.user.role == "customer"){
        isCustomer=true;
      }
    }
    return isCustomer;
  }

  //get all user details
  export async function getAllUsers(req,res){
    if(isItAdmin(req)){
      try{
      const users = await User.find();
      res.json(users);
      }catch(e){
        res.status(500).json({error:"Failed to get user"});
      }
    }else{
      res.status(403).json({error:"Unauthorized user"});
    }
  }

  export async function blockOrUnblockUser(req,res){
    const email = req.params.email;

    if(isItAdmin(req)){
      try{
        const user = await User.findOne(
          {
            email : email
          }
        )
        if(user == null){
          res.status(404).json({error:"User not found"});
          return;
        }

        const isBlocked = !user.isBlocked;

        await User.updateOne(
          {
            email:email
          },
          {
            isBlocked : isBlocked
          }
        );

        res.json({message:"User blocked/unblocked successfully"});
      }catch(e){
        res.status(500).json({error:"Failed to get user"});
      }
    }else{
      res.status(403).json({error:"Unauthorized"});
    }
  }

  export function getUser(req,res){
    if(req.user != null){
      res.json(req.user);
    }else{
      res.status(403).json({error:"User not Found"});
    }
  }

  export async function loginWithGoogle(req,res){
    const accessToken = req.body.accessToken;
    console.log(accessToken);
    try{
    const response = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo",{
      headers:{
        Authorization : `Bearer ${accessToken}`
      }
    })
    console.log(response.data);
    const user = await User.findOne({
      email :response.data.email,
    });
    if(user !=null){
      const token =jwt.sign({
        firstName:user.firstName,
        lastName:user.lastName,
        email:user.email,
        role:user.role,
        profilePicture:user.profilePicture,
        phone:user.phone,
        emailVerified:true
    },process.env.JWT_SECRET)
    res.json({ message: "Login successful",token:token ,user:user});
    }else{
      const newUser = new User({
        email :response.data.email,
        password :"123",
        firstName : response.data.given_name,
        lastName :response.data.family_name,
        role : "customer",
        address :"Not Given",
        phone : "Not Given",
        profilePicture : response.data.picture,
        emailVerified :true
      });
      const saveUser = await newUser.save();
      const token = jwt.sign(
        {
          firstName : saveUser.firstName,
          lastName :saveUser.lastName,
          email :saveUser.email,
          role : saveUser.role,
          profilePicture : saveUser.profilePicture,
          phone : saveUser.phone,
        },
        process.env.JWT_SECRET
      );
      res.json({message:"Login successful",token:token,user:saveUser});
    }
  }catch(e){
    console.log(e);
    res.status(500).json({error:"Failed to login "})
  }
  }

  export async function sendOTP(req,res){

    if(req.user == null){
      res.status(403).json({error:"Unauthorization"})
      return;
    }
    const otp = Math.floor(Math.random()*9000)+1000;
    const newOTP = new OTP({
      email : req.user.email,
      otp :otp
    })
    await newOTP.save();

    const message = {
      from : "anuththarakawmini@gmail.com",
      to : req.user.email,
      subject :"Validating OTP",
      text : "Your otp code is"+otp
    }

    transport.sendMail(message,(err,info)=>{
      if(err){
        console.log(err);
        res.status(500).json({error : "Failed to send OTP"})
      }else{
        console.log(info)
        res.json({message : "OTP sent successfully"})
      }
    });
  }

  export async function verifyOTP(res,req){
    if(req.user == null){
      res.status(403).json({error : "Unauthorized"})
      return;
    }
    const code = req.body.code;

    const otp = await OTP.findOne({
      email :req.user.email,
      otp :code
    })

    if(otp == null){
      res.status(404).json({error : "Invalid OTP"})
      return;
    }else{
      await OTP.deleteOne({
        email : req.user.email,
        otp :code
      })

      await User.updateOne({
        email : req.user.email
      },{
        emailVerified : true
      })

      res.status(200).json({message : "Email verified successfully"})
    }
  }