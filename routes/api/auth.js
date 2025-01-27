const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('config');
const {check,validationResult} = require('express-validator'); 
const User = require('../../models/User');

//@route GET api/auths
//@desc Test Route
//@acess Public


router.get('/',auth,async (req, res) => {
    try{
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    }catch(err){
console.error(err.message);
res.status(500).send('Server Error');

    }

});
//@route Post api/auth
    //@desc  Authenticate User  & token
    //@acess Public

    

    router.post('/',[
        
        check ('email','Please include Email').isEmail(),
        check ('password','Password is required').exists()
    ],async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }
        const{ email, password} = req.body;
        
        try {
            //see if user exist
        let user = await User.findOne({email});

        if(!user){
           return res
           .status (400)
           .json({errors : [{msg: 'Invalid Credentials'}]});
        }
        
        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch)
        {
            return res
            .status (400)
            .json({errors : [{msg: 'Invalid Credentials'}]});
         

        }

        
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