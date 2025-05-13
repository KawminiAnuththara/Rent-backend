import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { isItAdmin, isItCustomer } from "./userController.js";

export async function createOrder(req, res) {
    try {
        const data = req.body;
        const orderInfo = { orderedItems: [] };

        if (!req.user) {
            return res.status(401).json({ message: "Please login and try again" });
        }
        orderInfo.email = req.user.email;

        // Find last order
        const lastOrder = await Order.find().sort({ orderId: -1 }).limit(1);
        if (lastOrder.length === 0) {
            orderInfo.orderId = "ORD0001";
        } else {
            const lastOrderId = lastOrder[0].orderId; // e.g., "ORD0065"
            const lastOrderNumber = parseInt(lastOrderId.replace("ORD", ""), 10) || 0;
            const formattedNumber = String(lastOrderNumber + 1).padStart(4, '0'); // "0066"
            orderInfo.orderId = "ORD" + formattedNumber;
        }

        let oneDayCost = 0;
        let missingProducts = [];

        // Check each ordered item
        for (let i = 0; i < data.orderedItems.length; i++) {
            const item = data.orderedItems[i];
            try {
                const product = await Product.findOne({ key: item.key });

                if (!product) {
                    missingProducts.push(item.key);
                    continue; // Continue checking other products
                }

                if (!product.availability) {
                    return res.status(400).json({ message: `Product with key ${item.key} is not available` });
                }

                orderInfo.orderedItems.push({
                    product: {
                        key: product.key,
                        name: product.name,
                        image: product.image[0],
                        price: product.price
                    },
                    quantity: item.qty
                });

                oneDayCost += product.price * item.qty;
            } catch (e) {
                console.error("Product lookup failed:", e);
                return res.status(500).json({ message: "Failed to retrieve product data", error: e.message });
            }
        }

        // If some products were not found, return an error
        if (missingProducts.length > 0) {
            return res.status(404).json({
                message: `Products not found: ${missingProducts.join(", ")}`
            });
        }

        if (!data.days || isNaN(data.days) || data.days <= 0) {
            return res.status(400).json({ message: "Invalid number of days" });
        }

        orderInfo.days = data.days;
        orderInfo.startingDate = data.startingDate;
        orderInfo.endingDate = data.endingDate;
        orderInfo.totalAmount = oneDayCost * data.days;

        // Save order
        const newOrder = new Order(orderInfo);
        await newOrder.save();

        return res.status(201).json({
            message: "Order created successfully",
            order: newOrder
        });
    } catch (e) {
        console.error("Order creation failed:", e);
        return res.status(500).json({ message: "Failed to create order", error: e.message });
    }
}

export async function getQuote(req,res){
    try {
        const data = req.body;
        const orderInfo = { orderedItems: [] };

       

        let oneDayCost = 0;
        let missingProducts = [];

        // Check each ordered item
        for (let i = 0; i < data.orderedItems.length; i++) {
            const item = data.orderedItems[i];
            try {
                const product = await Product.findOne({ key: item.key });

                if (!product) {
                    missingProducts.push(item.key);
                    continue; // Continue checking other products
                }

                if (!product.availability) {
                    return res.status(400).json({ message: `Product with key ${item.key} is not available` });
                }

                orderInfo.orderedItems.push({
                    product: {
                        key: product.key,
                        name: product.name,
                        image: product.image[0],
                        price: product.price
                    },
                    quantity: item.qty
                });

                oneDayCost += product.price * item.qty;
            } catch (e) {
                console.error("Product lookup failed:", e);
                return res.status(500).json({ message: "Failed to retrieve product data", error: e.message });
            }
        }

        // If some products were not found, return an error
        if (missingProducts.length > 0) {
            return res.status(404).json({
                message: `Products not found: ${missingProducts.join(", ")}`
            });
        }

        if (!data.days || isNaN(data.days) || data.days <= 0) {
            return res.status(400).json({ message: "Invalid number of days" });
        }

        orderInfo.days = data.days;
        orderInfo.startingDate = data.startingDate;
        orderInfo.endingDate = data.endingDate;
        orderInfo.totalAmount = oneDayCost * data.days;


        return res.status(201).json({
            message: "Order created successfully",
            total: orderInfo.totalAmount,
        });
    } catch (e) {
        console.error("Order creation failed:", e);
        return res.status(500).json({ message: "Failed to create order", error: e.message });
    }
}

export async function getOrders(req,res){
    if(isItCustomer(req)){
        try{
            const orders = await Order.find({email:req.user.email});
            res.json(orders);
        }catch(e){
            res.status(500).json({error:"Failed to get orders"});
        }
    }else if(isItAdmin(req)){
        try{
            const orders = await Order.find();
            res.json(orders);
        }catch(e){
            res.status(500).json({error:"Failed"});
        }
    }else{
        res.status(403).json({error:"Unauthorized user"});
    }
}

export async function  approveOrRejectOrder(req,res){
    const orderId = req.params.orderId;
    const status = req.body.status;

    if(isItAdmin(req)){
        try{
            const order = await Order.findOne(
                {
                    orderId : orderId
                }
            )
            if(order == null){
                res.status(404).json({error:"Order not found"});
                return;
            }
            await Order.updateOne({
                orderId : orderId
            },
            {
                status:status
            }
        );
        res.json({message :"Order approved/rejected successfully"});

        }catch(e){
            res.status(500).json({error:"Failed to get order"});
        }
    
    }else{
        res.status(403).json({error:"Unauthorized"});
    }
}
