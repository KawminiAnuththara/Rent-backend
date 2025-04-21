import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config();

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