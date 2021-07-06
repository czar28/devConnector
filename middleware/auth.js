const jwt=require('jsonwebtoken');
const config=require('config');

module.exports =function(req,res,next){
    //Get token from header
    const token=req.header('x-auth-token');

    //Check if no token
    if(!token)
    {
        return (res.status(401).json({msg:'No Token,authorization denied'}));
    }
    //Verify token
    try{
        const decoded=jwt.verify(token,config.get('mySecretKey'));
        req.user=decoded.user;
        next();
    }catch{
        
        return (res.status(401).json({msg:'Token not valid,authorization denied'}));
    }
}