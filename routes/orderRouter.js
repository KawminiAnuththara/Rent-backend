import express from 'express';
import { createOrder, getOrders, getQuote } from '../controllers/orderController.js';

const orderRouter = express.Router();

orderRouter.post("/",createOrder);
orderRouter.post("/quote",getQuote);
orderRouter.get("/",getOrders);

export default orderRouter;