import express from "express";
import { blockOrUnblockUser, getAllUsers, loginUser, registerUser } from "../controllers/userController.js";

const userRouter=express.Router();

userRouter.post("/register",registerUser);

userRouter.post("/login",loginUser);

userRouter.get("/all",getAllUsers);

userRouter.put("/block/:email",blockOrUnblockUser);

export default userRouter;