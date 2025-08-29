import { createTransport } from 'nodemailer';
const sendEmail = async(options)=>{
    //// create a transport
    const transport = createTransport({
        service:"gmail",
        host:"smtp.gmail.com",
        port:465,
        secure:true,
        auth:{
            user:process.env.EMAIL_USERNAME,
            pass:process.env.EMAIL_PASSWORD,
        }
    });
    //// create mail options
    const mailOPtions ={
          from:" hashir <test@gmail.com>",
          to: options.email,
          subject:options.subject,
          text:options.message,
          //html
    }
    //// send mail
    await transport.sendMail(mailOPtions);
}
export default sendEmail;