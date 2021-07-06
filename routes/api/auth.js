
const bcrypt=require('bcryptjs');
const express = require('express');
const router = express.Router();
const auth=require('../../middleware/auth');
const User=require('../../models/User');
const jwt=require('jsonwebtoken');
const config=require('config');
const {check,validationResult}=require('express-validator/check');
//@route   GET api/auth
//@desc    Test route
//@access  Public


router.get('/',auth, async (req, res) => {
    try{
        const user= await User.findById(req.user.id).select("-password");
        res.json(user);
    }catch(err){
        console.log(err.message);
        res.status(500).send('Internel Server Error');
    }
})

//authenticate user and get token
router.post('/',[
    check('email','Valid email address is required').isEmail(),
    check('password','Password is required').exists()
    
], async (req, res) => {

    const errors=validationResult(req);
        if(!errors.isEmpty())
            return res.status(400).json({errors:errors.array()});

    const { email, password}=req.body;
    
    try{

        //See if user exists
        let user= await User.findOne({email:email});
        if(!user)
        {
            res
            .status(400)
            .json({errors:[{msg:'Invalid credentials'}]});
        }

        //check password
        const isMatch= await bcrypt.compare(password,user.password);
        if(!isMatch)
        {
            res
            .status(400)
            .json({errors:[{msg:'Invalid credentials'}]});
        }
        //Return jswebtoken

        const payload={
            user:{
                id:user.id
            }
        }

        jwt.sign(
            payload,
            config.get('mySecretKey'),
            {expiresIn:360000},
            (err,token)=>{
                if(err)throw(err);
                res.json(token);
            }
            );
 
    }
    catch(err){
        console.log(err.message,err.name);
        res.status(500).send('Server Error');
    }
})

module.exports = router;