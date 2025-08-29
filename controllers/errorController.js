import AppError from "../utils/appError.js";

const handleCastErrDB =(error)=>{
    const message = ` invalid  ${error.path}  :  ${error.value}  `
    return new AppError(message,400);
}
const handleDublicateFieldsErrDB = (error)=>{
    const value = error.errorResponse?.errmsg?.match(/"(.*?)"/g)[0];
    const message = `Dublicate Fields {{{ ${value} }}} please use another value`
    return new AppError(message,400);
}
const handleValidationErrDB = (error) => {
    const msgs = Object.values(error.errors).map((el,i) => `${i+1} :: ${el.message}`);
    const message = ` invalid input data . ${msgs.join(". ")} `
    return new AppError(message,400);
};
const handleJWTError = () => new AppError("Invalid token , Please Login again!",401);
const handleTokenExpiredErr = () => new AppError("your token Expired , Please login again",401);

const sendErrDev =(err,res)=>{
    res.status(err.statusCode).json({
        status:err.status,
        error : err,
        message: err.message,
        errStack: err.stack,
    })
}
const sendErrProd =(err,res)=>{
    if(err.isOperational){
    res.status(err.statusCode).json({
        status:err.status,
        message: err.message,
    })
}   else{
     console.log("Error 🐞☹",err);
     res.status(500).json({
        status:"error🐞☹",
        message:"Something went very wrong",
     })
}
}
export default (err,req,res,next) =>{
    err.statusCode = err.statusCode  || 500;
    err.status = err.status || "error";
    if(process.env.NODE_ENV === "development"){
        sendErrDev(err,res);
    }
    if(process.env.NODE_ENV === "production"){
        let error = {...err};
        if(err.name === "CastError") error = handleCastErrDB(error);
        if(err.code === 11000) error = handleDublicateFieldsErrDB(error);
        if(err.name === "ValidationError") error = handleValidationErrDB(error);
        if(err.name === "JsonWebTokenError") error = handleJWTError(error);
        if(err.name === "TokenExpiredError") error = handleTokenExpiredErr(error);
        sendErrProd(error,res);
    }
}