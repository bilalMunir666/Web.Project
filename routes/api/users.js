    const express = require('express');
    const router = express.Router();
    const gravatar = require('gravatar');
    const bcrypt = require ('bcryptjs');
    const jwt = require('jsonwebtoken');
    const config = require('config');
    const {check,validationResult} = require('express-validator/check'); 

    const User = require('../../models/User');
    //@route Post api/users
    //@desc  Register User 
    //@acess Public

    

    router.post('/',[
        check('name', 'Name is required')
        .not()
        .isEmpty(),
        check ('email','Please include Email').isEmail(),
        check ('password','Please Enter Password With Min 6 Character')
        .isLength({min:6})
    ],async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }
        const{name, email, password} = req.body;
        
        try {
            //see if user exist
        let user = await User.findOne({email});

        if(user){
            res.status (400).json({errors : [{msg: 'User Already Exist'}]});
        }
        //get user gravatar
        const avatar = gravatar.url(email,{
        s:'200',
        r: 'pg',
        d: 'mm'  
        })

        user = new User({
        name,
        email, 
        avatar,
        password  
        });

        

        //encrypt
        const salt = await bcrypt.genSalt(10);

        user.password= await bcrypt.hash(password, salt);
        await  user.save();
        
        //return jsonwebtoken

        
        const payload = {
            user: {
                id: user.id
            
        }}

        jwt.sign(
            payload, 
            config.get('jwtSecret'),
            {expiresIn: 360000},
            (err,token) =>{
                if(err) throw err;
                res.json({token});
            } 
            );
            
        } catch (err) {
            console.error(err.message); 
            res.status(500).send('Server error');
        }
    

    });

    module.exports = router;