import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    isBlocked:{
        type:Boolean,
        required :true,
        default:false
    },
    role:{
        type:String,
        required:true,
        default:"customer"
    },
    firstName:{
        type:String,
        required:true
    },
    lastName:{
        type:String,
        required:true
    },
    address:{
        type:String,
        required:true
    },
    phone:{
        type:String,
        required:true
    },
    profilePicture : {
        type : String,
        required : true,
        default :"https://static.vecteezy.com/system/resources/previews/009/734/564/non_2x/default-avatar-profile-icon-of-social-media-user-vector.jpg"
    },
    emailVerified : {
        type : Boolean,
        required :true,
        default :false
    }
});

const User = mongoose.models.User || mongoose.model("user",userSchema);

export default User;