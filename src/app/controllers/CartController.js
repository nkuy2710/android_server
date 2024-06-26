const Cart = require('../Models/Cart');
const Order = require('../Models/Order');
const uuid = require('uuid');
const { format } = require('date-fns');

function generateOrderId() {
    return uuid.v4();
}

function isOrderIdExist(orderId) {
    return Order.findOne({ orderId: orderId }).exec().then(order => order !== null);
}

function generateUniqueOrderId() {
    let orderId = generateOrderId();
    return isOrderIdExist(orderId).then(exists => {
        if (exists) {
            return generateUniqueOrderId();
        }
        return orderId;
    });
}

class CartController {

    getProductsInCart(req, res) {
        const username = req.query.username;
        if (username) {
            Cart.find({ user: username, isConfirmed: false, isOrdered: false, isDelivered: false, isCompleted: false })
                .then(products => res.json(products))
                .catch(err => {
                    console.error(err);
                    res.status(400).send({ error: 'ERROR!' });
                });
        } else {
            res.status(400).send({ error: 'Username not provided.' });
        }
    }

    setOrderIdProduct(req, res) {
        const username = req.query.username;
        if (username) {
            generateUniqueOrderId().then(orderId => {
                Cart.updateMany({ user: username, isConfirmed: false }, { $set: { orderId: orderId } })
                    .then(() => {
                        const newOrder = new Order({
                            orderId: orderId,
                            clientName: username,
                        });
                        newOrder.save()
                            .then(() => res.status(200).json({ message: 'Updated successfully', orderId: orderId }))
                            .catch(err => {
                                console.error(err);
                                res.status(500).send({ error: 'Internal server error.' });
                            });
                    })
                    .catch(err => {
                        console.error(err);
                        res.status(500).send({ error: 'Internal server error.' });
                    });
            });
        } else {
            res.status(400).send({ error: 'Username not provided.' });
        }
    }


    setConfirmed(req, res) {
        const _id = req.query._id;
        Cart.findOne({ _id: _id })
            .then(product => {
                const orderId = product.orderId;
                return Cart.updateMany({ orderId: orderId }, { $set: { isConfirmed: true } });
            })
            .then(() => res.status(200).send({ message: 'isCompleted set to true for all products.' }))
            .catch(err => {
                console.error(err);
                res.status(500).send({ error: 'Internal server error.' });
            });
    }

    setOrdered(req, res) {
        const _id = req.query._id;
        Cart.findOne({ _id: _id })
            .then(product => {
                const currentTime = new Date();
                const formattedTime = format(currentTime, "dd/MM/yyyy HH:mm");
                const orderId = product.orderId;
                return Cart.updateMany({ orderId: orderId }, { $set: { isConfirmed: true, isOrdered: true, orderedAt: formattedTime } });
            })
            .then(() => res.status(200).send({ message: 'isCompleted set to true for all products.' }))
            .catch(err => {
                console.error(err);
                res.status(500).send({ error: 'Internal server error.' });
            });
    }

    setDelivered(req, res) {
        const _id = req.query._id;
        Cart.findOne({ _id: _id })
            .then(product => {
                const orderId = product.orderId;
                return Cart.updateMany({ orderId: orderId }, { $set: { isConfirmed: true, isOrdered: true, isDelivered: true } });
            })
            .then(() => res.status(200).send({ message: 'isCompleted set to true for all products.' }))
            .catch(err => {
                console.error(err);
                res.status(500).send({ error: 'Internal server error.' });
            });
    }

    receiveOrder(req, res) {
        const _id = req.query._id;
        Cart.findOne({ _id: _id })
            .then(product => {
                const orderId = product.orderId;
                return Cart.updateMany({ orderId: orderId }, { $set: { isConfirmed: true, isOrdered: true, isCompleted: true } });
            })
            .then(() => res.status(200).send({ message: 'isCompleted set to true for all products.' }))
            .catch(err => {
                console.error(err);
                res.status(500).send({ error: 'Internal server error.' });
            });
    }

    getProductsInProcessing(req, res) {
        const username = req.query.username;
        if (username) {
            Cart.find({ user: username, isCompleted: false, orderId: { $exists: true, $ne: null } }).sort({ createdAt: -1 })
                .then(products => res.json(products))
                .catch(err => {
                    console.error(err);
                    if (!res.headersSent) {
                        res.status(400).send({ error: 'ERROR!' });
                    }
                });
        } else {
            res.status(400).send({ error: 'Username not provided.' });
        }
    }

    getProductsInProcessingForStaff(req, res) {
        Cart.find({ isCompleted: false })
            .then(products => res.json(products))
            .catch(err => {
                console.error(err);
                res.status(400).send({ error: 'ERROR!' });
            });
    }

    getProductsInTracking(req, res) {
        const username = req.query.username;
        const _id = req.query._id;
        if (username) {
            Cart.findOne({ user: username, _id: _id })
                .then(product => {
                    if (product) {
                        const orderId = product.orderId;
                        return Cart.find({ orderId: orderId });
                    } else {
                        return Order.findOne({ clientName: username }).sort({ createdAt: -1 }).then(order => {
                            if (order) {
                                const orderId = order.orderId;
                                return Cart.find({ user: username, orderId: orderId });
                            } else {
                                return Promise.reject({ message: 'Cannot find product' });
                            }
                        });
                    }
                })
                .then(products => res.json(products))
                .catch(err => {
                    console.error(err);
                    res.status(400).send({ error: 'ERROR!' });
                });
        } else {
            res.json({ message: 'Cannot find username' });
        }
    }

    getProductsInTrackingForStaff(req, res) {
        const _id = req.query._id;
        Cart.findOne({ _id: _id })
            .then(product => {
                if (product) {
                    const orderId = product.orderId;
                    return Cart.find({ orderId: orderId });
                } else {
                    return Promise.reject({ message: 'Cannot find product' });
                }
            })
            .then(products => res.json(products))
            .catch(err => {
                console.error(err);
                res.status(400).send({ error: 'ERROR!' });
            });
    }

    getProductsInComplete(req, res) {
        const username = req.query.username;
        if (username) {
            Cart.find({ user: username, isCompleted: true }).sort({ createdAt: -1 })
                .then(products => res.json(products))
                .catch(err => {
                    console.error(err);
                    if (!res.headersSent) {
                        res.status(500).send({ error: 'ERROR!' });
                    }
                });
        } else {
            res.status(400).send({ error: 'Username not provided.' });
        }
    }

    getProductsInCompleteForStaff(req, res) {
        Cart.find({ isCompleted: true }).sort({ createdAt: -1 })
            .then(products => res.json(products))
            .catch(err => {
                console.error(err);
                res.status(400).send({ error: 'ERROR!' });
            });
    }

    getPaymentMethosForBill(req, res) {
        const username = req.query.username;
        const _id = req.query._id;
        Cart.findOne({ user: username, _id: _id })
            .then(product => {
                if (product) {
                    const orderId = product.orderId;
                    return Order.findOne({ clientName: username, orderId: orderId });
                } else {
                    return Order.findOne({ clientName: username }).sort({ createdAt: -1 });
                }
            })
            .then(order => {
                if (order) {
                    res.status(200).json(order.paymentMethod);
                } else {
                    res.status(404).json({ error: 'Order not found' });
                }
            })
            .catch(err => {
                console.error(err);
                res.status(500).send({ error: 'Internal Server Error!' });
            });
    }

    getToalPrice(req, res) {
        const username = req.query.username;
        if (!username) {
            return res.status(400).send({ error: 'Username not provided.' });
        }

        Cart.find({ user: username, isConfirmed: false })
            .then(products => {
                let totalPrice = 0;
                products.forEach(cart => {
                    totalPrice += parseFloat(cart.price) * parseFloat(cart.quantity);
                });

                if (products.length > 0) {
                    const orderId = products[0].orderId;
                    if (orderId) {
                        return Order.findOne({ orderId: orderId })
                            .then(order => {
                                if (order) {
                                    order.total = totalPrice;
                                    return order.save().then(() => res.json({ totalPrice }));
                                } else {
                                    return res.json({ totalPrice });
                                }
                            });
                    } else {
                        return res.json({ totalPrice });
                    }
                } else {
                    return res.json({ totalPrice });
                }
            })
            .catch(error => {
                console.error(error);
                res.status(500).json({ error: 'Internal Server Error' });
            });
    }



    getProductsForBill(req, res) {
        const _id = req.query._id;
        Cart.findOne({ _id: _id })
            .then(product => {
                const orderId = product.orderId;
                return Cart.find({ orderId });
            })
            .then(products => res.status(200).json(products))
            .catch(err => {
                console.error(err);
                res.status(500).send({ error: 'Internal server error.' });
            });
    }

    getPriceForBill(req, res) {
        const _id = req.query._id;
        Cart.findOne({ _id: _id })
            .then(product => {
                const orderId = product.orderId;
                return Cart.find({ orderId: orderId });
            })
            .then(products => {
                let totalPrice = 0;
                products.forEach(cart => {
                    totalPrice += parseFloat(cart.price) * parseFloat(cart.quantity);
                });
                res.json({ totalPrice });
            })
            .catch(err => {
                console.error(err);
                res.status(500).send({ error: 'Internal server error.' });
            });
    }

    addToCart(req, res) {
        const { user, image, title, price, quantity, total } = req.body;
        let options = req.query.selectedOptions;

        if (!options) {
            options = "Không có";
        }

        Cart.findOne({ user: user, title: title, options: options, isConfirmed: false })
            .then(existingCartItem => {
                if (existingCartItem) {
                    existingCartItem.quantity += quantity;
                    existingCartItem.total += total;
                    return existingCartItem.save();
                } else {
                    const cart = new Cart({
                        user: user,
                        image: image,
                        title: title,
                        price: price,
                        quantity: quantity,
                        total: total,
                        options: options
                    });
                    return cart.save();
                }
            })
            .then(updatedCart => res.status(201).json(updatedCart))
            .catch(err => {
                console.error(err);
                res.status(500).json({ message: 'Đã xảy ra lỗi nội bộ' });
            });
    }




    updateCartItem(req, res) {
        const username = req.params.username;
        const cartId = req.params.cartId;
        const updatedCartItem = req.body;

        Cart.findOne({ _id: cartId, user: username })
            .then(existingCartItem => {
                if (existingCartItem) {
                    existingCartItem.quantity = updatedCartItem.quantity;
                    existingCartItem.total = (parseFloat(updatedCartItem.total) * parseFloat(updatedCartItem.quantity)).toString();
                    return existingCartItem.save();
                } else {
                    res.status(404).json({ message: 'Cart item not found' });
                }
            })
            .then(updatedItem => res.status(200).json(updatedItem))
            .catch(err => {
                console.error(err);
                res.status(500).json({ message: 'Internal Server Error' });
            });
    }

    evaluateProduct(req, res) {
        const { _id, starEvaluate, contentEvaluate } = req.query;
        if (!_id || !starEvaluate || !contentEvaluate) {
            return res.status(400).send({ error: 'Missing required fields.' });
        }

        Cart.findOne({ _id: _id })
            .then(product => {
                if (!product) {
                    return res.status(404).json({ message: 'Product not found' });
                }
                const orderId = product.orderId;
                return Cart.updateMany(
                    { orderId: orderId },
                    { $set: { starEvaluate: starEvaluate, contentEvaluate: contentEvaluate } }
                );
            })
            .then(result => {
                if (result.nModified > 0) {
                    res.status(200).json({ message: 'Products evaluated successfully', modifiedCount: result.nModified });
                } else {
                    res.status(404).json({ message: 'No products found or updated' });
                }
            })
            .catch(err => {
                console.error(err);
                res.status(500).json({ error: 'Internal Server Error' });
            });
    }


    deleteProduct(req, res) {
        const user = req.query.user;
        const _id = req.query._id;
        Cart.findOneAndDelete({ user: user, _id: _id })
            .then(deletedProduct => {
                if (deletedProduct) {
                    res.status(200).json({ message: 'Product deleted successfully' });
                } else {
                    res.status(404).json({ message: 'Product not found' });
                }
            })
            .catch(err => {
                console.error(err);
                res.status(500).json({ error: 'Internal Server Error' });
            });
    }

    deleteAllProductInCart(req, res) {
        const _id = req.query._id;
        Cart.findOne({ _id: _id })
            .then(product => {
                const orderId = product.orderId;
                return Cart.deleteMany({ orderId: orderId });
            })
            .then(deletedProducts => {
                if (deletedProducts.deletedCount > 0) {
                    res.status(200).json({ message: 'All products in cart deleted successfully' });
                } else {
                    res.status(404).json({ message: 'No products found in cart' });
                }
            })
            .catch(err => {
                console.error(err);
                res.status(500).json({ error: 'Internal Server Error' });
            });
    }
}

module.exports = new CartController();
