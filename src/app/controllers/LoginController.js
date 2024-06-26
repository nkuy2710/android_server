const User = require('../Models/User');

class LoginController {

    login(req, res) {
        User.find({}, { _id: 0, userId: 1, username: 1, password: 1, role: 1 })
            .then(users => {
                res.json(users);
            })
            .catch(err => {
                console.error(err);
                res.status(400).send({ error: 'ERROR!' });
            });
    }

    signup(req, res) {
        const user = new User({
            username: req.body.username,
            fullname: req.body.username,
            email: req.body.email,
            phoneNumber: req.body.phoneNumber,
            password: req.body.password
        });

        user.save()
            .then(newUser => {
                res.status(201).json(newUser);
            })
            .catch(err => {
                console.error(err);
                res.status(500).json({ message: 'Đã xảy ra lỗi nội bộ' });
            });
    }

    addStaff(req, res) {
        const user = new User({
            username: req.body.username,
            fullname: req.body.username,
            email: req.body.email,
            phoneNumber: req.body.phoneNumber,
            password: req.body.password,
            role: "staff"
        });

        user.save()
            .then(newUser => {
                res.status(201).json(newUser);
            })
            .catch(err => {
                console.error(err);
                res.status(500).json({ message: 'Đã xảy ra lỗi nội bộ' });
            });
    }
}

module.exports = new LoginController();
