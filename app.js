//PACKAGE-----------------------------------------------------
const express=require("express")
const bcrypt=require("bcrypt")
const mysql2=require("mysql2")
const cookieparser=require("cookie-parser")
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require("dotenv").config()
const nodemailer=require("nodemailer")
const jwt=require("jsonwebtoken")
const session = require('express-session');
const path=require("path")
let crypto=require("crypto")
let cors=require("cors")
const Joi = require('joi');
const jalaali=require("jalaali-js")
const { Pool } = require('pg');
//------------------------

//datebase---------------------------------------------------
// let database=mysql2.createPool({
//     host:process.env.DB_HOST,
//     user:process.env.DB_USER,
//     password:process.env.DB_PASSWORD,
//     database:process.env.DB_NAME
// }).promise()

// datebase ---------------------------------------------------


let database = new Pool({
    host: process.env.DB_HOST,        // میزبان پایگاه داده
    user: process.env.DB_USER,        // نام کاربری
    password: process.env.DB_PASSWORD,// رمز عبور
    database: process.env.DB_NAME,    // نام پایگاه داده
    port: process.env.DB_PORT || 5432 // پورت (به طور پیشفرض 5432 است)
});

database.connect()
    .then(() => {
        console.log("Connected to PostgreSQL database successfully");
    })
    .catch((err) => {
        console.error('Error connecting to PostgreSQL database:', err);
    });

// ----------------------- پایان اتصال به پایگاه داده
//-----------------------


//pack-run-----------------------------------------------------

let app=express()
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
console.log(process.env.ci);
function emailsend(code,email) {
    // ساخت یک transporter (تنظیمات سرویس‌دهنده ایمیل)
const transporter = nodemailer.createTransport({
    service: 'gmail', // استفاده از سرویس Gmail
    auth: {
      user: 'mhmdsalhy631@gmail.com', // ایمیل فرستنده
      pass: process.env.appPassword // رمز عبور ایمیل فرستنده
    }
  });
  
  // تنظیمات ایمیل (فرستنده، گیرنده، موضوع، محتوا)
  const mailOptions = {
    from: 'mhmdsalhy631@gmail.com', // ایمیل فرستنده
    to: email, // ایمیل گیرنده
    subject: 'کد تایید رمز عبور', // موضوع ایمیل
    text: `${code}` // متن ایمیل
  };
  
  // ارسال ایمیل
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error:', error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}

//--------------------------


//globall-midlwer----------------------------------------------

app.use(cors({
  origin: 'https://mohammadqeshm.github.io/code-w/index.html', // آدرس فرانت‌اند
  credentials: true, // برای ارسال کوکی
}));
app.use(express.json())
app.use(express.urlencoded())
app.use(cookieparser())
// تنظیمات Express-Session
app.use(session({
    secret: 'yourSecretKey',   // کلید رمزنگاری برای سشن‌ها
    resave: false,             // آیا سشن باید دوباره ذخیره شود؟
    saveUninitialized: false,  // ذخیره سشن‌های بدون مقدار
    cookie: {
      httpOnly: true,          // فقط دسترسی از سمت سرور به کوکی
      secure: false,           // در محیط تولید باید true باشد (برای HTTPS)
      maxAge: 3600000          // زمان انقضا کوکی (1 ساعت)
    }
  }));
  // ابتدا باید passport را پیکربندی کنید
  app.use(passport.initialize());
  app.use(passport.session());
passport.use(new GoogleStrategy({
    clientID: process.env.ci,
    clientSecret: process.env.cs,
    callbackURL: 'http://localhost:5000/back'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // اطلاعات پروفایل کاربر گوگل
      const pr = profile._json;
done(null,pr)
    } catch (error) {
      console.error(error);
      done(error, null);
    }
  }
));
passport.serializeUser((user, done) => {
    done(null, user);
  });
passport.deserializeUser((user, done) => {
    done(null, user);
  });

//api----------------------------------------------------------
app.post("/signup",async(req,res)=>{
 try {  
let email=req.body.email
let password=req.body.password
let username=req.body.username
let shopname=req.body.shopname
console.log([email,password,username,shopname],req.body);

let dateactiv=new Date()
console.log(dateactiv);

// تعریف اسکیما
const schema = Joi.object({
  username: Joi.string()
    .min(4) // حداقل ۴ کاراکتر
    .max(100) // حداکثر ۱۰۰ کاراکتر
    .required() // اجباری
    .messages({
      'string.base': 'نام کاربری باید یک رشته باشد.',
      'string.min': 'نام کاربری باید حداقل ۴ کاراکتر باشد.',
      'string.max': 'نام کاربری باید حداکثر ۱۰۰ کاراکتر باشد.',
      'any.required': 'نام کاربری الزامی است.'
    }),

  email: Joi.string()
    .email({ tlds: { allow: ['com'] } }) // ایمیل باید پسوند .com داشته باشد
    .max(100) // حداکثر ۱۰۰ کاراکتر
    .required() // اجباری
    .messages({
      'string.base': 'ایمیل باید یک رشته باشد.',
      'string.email': 'ایمیل معتبر نیست. باید پسوند .com داشته باشد.',
      'string.max': 'ایمیل باید حداکثر ۱۰۰ کاراکتر باشد.',
      'any.required': 'ایمیل الزامی است.'
    }),

  nameshop: Joi.string()
    .max(50) // حداکثر ۵۰ کاراکتر
    .optional() // اختیاری
    .allow('') // اجازه دادن به رشته خالی (یعنی اختیاری)
    .messages({
      'string.base': 'نام فروشگاه باید یک رشته باشد.',
      'string.max': 'نام فروشگاه باید حداکثر ۵۰ کاراکتر باشد.'
    }),

  password: Joi.string()
    .min(8) // حداقل ۸ کاراکتر
    .max(30) // حداکثر ۳۰ کاراکتر
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/) // شامل حروف کوچک، بزرگ و عدد
    .required() // اجباری
    .messages({
      'string.base': 'رمز عبور باید یک رشته باشد.',
      'string.min': 'رمز عبور باید حداقل ۸ کاراکتر باشد.',
      'string.max': 'رمز عبور باید حداکثر ۳۰ کاراکتر باشد.',
      'string.pattern.base': 'رمز عبور باید شامل حداقل یک حرف بزرگ، یک حرف کوچک، یک عدد و یک نماد باشد.',
      'any.required': 'رمز عبور الزامی است.'
    })
});
// داده‌هایی برای اعتبارسنجی
let data2 = {
  username: username,
  email: email,
  nameshop: shopname,
  password: password
};
// اعتبارسنجی داده‌ها
const result = schema.validate(data2);

if (result.error) {
  console.log(result.error.details); 
res.json({status:result.error.message})
} else {
//  let data=await database.query("select * from users where email=? OR usernamee=?",[email,username])
//     if (data[0].length===0) {
//     let salt=await bcrypt.genSalt(10)
//     let newpas=await bcrypt.hash(password,salt)
//     let newuser=await database.query("insert into users(email,password,usernamee,nameshop,dateactive) value(?,?,?,?,?)",[email,newpas,username,shopname,dateactiv])
//     let data2=await database.query("select * from users where email=? OR usernamee=?",[email,username])
// console.log("df");
// let rf=data2[0]
//     console.log(rf[0].id);

//     let token= await jwt.sign({id:rf[0].id},'testapp',{expiresIn:"12h"})
//     res.cookie('tooky',token,{
//      httpOnly: true,
//      maxAge: 24 * 60 * 60 * 1000,
//      secure: false, // فقط در محیط توسعه
//      sameSite: 'lax', // یا 'none' برای cross-origin کامل
//     })
//     res.json({status:"ثبت نام موفقیت امیز بود"})

// }
// else{
//         console.log("not");
//         res.json({status:"قبلا این یوزر ثبت شده لطفا مقدار جدید انتخاب کنید"})
        
//     }





try {
  // بررسی وجود کاربر در دیتابیس
  let data = await database.query(
    "SELECT * FROM users WHERE email = $1 OR usernamee = $2",
    [email, username]
  );

  // اگر کاربر پیدا نشد، ثبت کاربر جدید
  if (data.rows.length === 0) {
    // هش کردن رمز عبور
    let salt = await bcrypt.genSalt(10);
    let hashedPassword = await bcrypt.hash(password, salt);

    // ثبت اطلاعات کاربر جدید در دیتابیس
    await database.query(
      "INSERT INTO users (email, password, usernamee, nameshop, dateactive) VALUES ($1, $2, $3, $4, $5)",
      [email, hashedPassword, username, shopname, dateactiv]
    );

    // دریافت اطلاعات کاربر جدید از دیتابیس
    let newUser = await database.query(
      "SELECT * FROM users WHERE email = $1 OR usernamee = $2",
      [email, username]
    );

    let userInfo = newUser.rows[0]; // اطلاعات کاربر جدید
    console.log("ثبت موفقیت‌آمیز", userInfo.id);

    // تولید توکن JWT برای کاربر جدید
    let token = await jwt.sign({ id: userInfo.id }, "testapp", {
      expiresIn: "12h",
    });

    // تنظیم کوکی حاوی توکن
    res.cookie("tooky", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 روز
      secure: false, // فقط در محیط توسعه
      sameSite: "lax", // یا 'none' در حالت cross-origin
    });

    // پاسخ موفقیت
    res.json({ status: "ثبت‌نام موفقیت‌آمیز بود" });
  } else {
    // اگر کاربر وجود داشته باشد
    console.log("کاربر موجود است");
    res.json({
      status: "این ایمیل یا نام‌کاربری قبلاً ثبت شده است. لطفاً مقدار جدیدی انتخاب کنید",
    });
  }
} catch (err) {
  console.error("خطا در عملیات:", err);
  res.status(500).json({ status: "خطای داخلی سرور" });
}


}


















    } catch (e) {
      console.log(e);
      res.json({status:e})
        
    }
   

})
app.post("/signin",async (req,res)=>{

    try {
let email=req.body.email
let password=req.body.password

// تعریف اسکیما
const schema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: ['com'] } }) // ایمیل باید پسوند .com داشته باشد
    .max(100) // حداکثر ۱۰۰ کاراکتر
    .required() // اجباری
    .messages({
      'string.base': 'ایمیل باید یک رشته باشد.',
      'string.email': 'ایمیل معتبر نیست. باید پسوند .com داشته باشد.',
      'string.max': 'ایمیل باید حداکثر ۱۰۰ کاراکتر باشد.',
      'any.required': 'ایمیل الزامی است.'
    }),
  password: Joi.string()
    .min(8) // حداقل ۸ کاراکتر
    .max(30) // حداکثر ۳۰ کاراکتر
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/) // شامل حروف کوچک، بزرگ و عدد
    .required() // اجباری
    .messages({
      'string.base': 'رمز عبور باید یک رشته باشد.',
      'string.min': 'رمز عبور باید حداقل ۸ کاراکتر باشد.',
      'string.max': 'رمز عبور باید حداکثر ۳۰ کاراکتر باشد.',
      'string.pattern.base': 'رمز عبور باید شامل حداقل یک حرف بزرگ، یک حرف کوچک، یک عدد و یک نماد باشد.',
      'any.required': 'رمز عبور الزامی است.'
    })
});
// داده‌هایی برای اعتبارسنجی
let data2 = {
  email: email,
  password: password
};
// اعتبارسنجی داده‌ها
const result = schema.validate(data2);

if (result.error) {
res.json({status:result.error.message})
} else {

// let user=await database.query("select * from users where email=?",[email])
// let uss=user[0]
// let find=uss.find((i)=>i.email==email)
// if (!find) {
//     res.json({status:"کاربر با این مشخصات نیست"})
// }else{
// let pass2=find.password
// let com=await bcrypt.compare(password,pass2)
// if (com==true) {
//  let token= await jwt.sign({id:find.id},'testapp',{expiresIn:"12h"})
//  res.cookie('tooky',token,{
//   httpOnly: true,
//   maxAge: 24 * 60 * 60 * 1000,
//   secure: false, // فقط در محیط توسعه
//   sameSite: 'lax', // یا 'none' برای cross-origin کامل
//  })
//  res.json({ststus:"login"})




// }else{
//     res.json({status:"رمز اشتباه"})
// }

// }

let user = await database.query("SELECT * FROM users WHERE email = $1", [email]);
let uss = user.rows; // دسترسی به نتایج از rows
let find = uss.find((i) => i.email === email); // جستجو در نتایج

if (!find) {
  res.json({ status: "کاربر با این مشخصات نیست" });
} else {
  let pass2 = find.password;
  let com = await bcrypt.compare(password, pass2);
  if (com === true) {
    let token = await jwt.sign({ id: find.id }, "testapp", { expiresIn: "12h" });
    res.cookie("tooky", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      secure: false, // فقط در محیط توسعه
      sameSite: "lax", // یا 'none' برای cross-origin کامل
    });
    res.json({ status: "login" });
  } else {
    res.json({ status: "رمز اشتباه" });
  }
}



}
 









 } catch (error) {
      res.json({status:error})  
    }
})
app.get('/auth/google',
    passport.authenticate('google', { scope: ['email'] })
  ); 
app.get('/back', passport.authenticate('google', { failureRedirect: '/' }),async(req, res) => {
let pr=req.user
console.log(pr);
let dateactiv=new Date()

  // // بررسی موجودیت کاربر در دیتابیس
  // let user = await database.query("SELECT * FROM users WHERE email=?", [pr.email]);
  // let uss = user[0];

  // if (uss.length === 0) {
  //   // اگر کاربر جدید بود، اضافه کردن به دیتابیس
  //   await database.query("INSERT INTO users (email,googleid,usernamee,dateactive) VALUES (?,?,?,?)", [pr.email, pr.sub,pr.email,dateactiv]);

  //   // پس از ثبت کاربر جدید، اطلاعات کاربر را مجدداً بارگذاری می‌کنیم
  //   let newUser = await database.query("SELECT * FROM users WHERE email=?", [pr.email]);
  //   let uss2 = newUser[0];

  //   // ایجاد توکن JWT برای کاربر
  //   let token= await jwt.sign({id:uss2[0].id},'testapp',{expiresIn:"12h"})
  //   res.cookie('tooky', token)
  //   res.redirect("https://mohammadqeshm.github.io/code-w/index.html")
  // } else {
  //   // اگر کاربر قبلاً ثبت‌نام کرده باشد
  //   let token= await jwt.sign({id:uss[0].id},'testapp',{expiresIn:"12h"})
  //   res.cookie('tooky', token)
  //  res.redirect("https://mohammadqeshm.github.io/code-w/index.html")

  // }

// بررسی موجودیت کاربر در دیتابیس
let user = await database.query("SELECT * FROM users WHERE email = $1", [pr.email]);
let uss = user.rows;  // دسترسی به نتیجه کوئری از طریق rows

if (uss.length === 0) {
  // اگر کاربر جدید بود، اضافه کردن به دیتابیس
  await database.query(
    "INSERT INTO users (email, googleid, usernamee, dateactive) VALUES ($1, $2, $3, $4)",
    [pr.email, pr.sub, pr.email, dateactiv]
  );

  // پس از ثبت کاربر جدید، اطلاعات کاربر را مجدداً بارگذاری می‌کنیم
  let newUser = await database.query("SELECT * FROM users WHERE email = $1", [pr.email]);
  let uss2 = newUser.rows;

  // ایجاد توکن JWT برای کاربر
  let token = await jwt.sign({ id: uss2[0].id }, "testapp", { expiresIn: "12h" });
  res.cookie("tooky", token);
  res.redirect("https://mohammadqeshm.github.io/code-w/index.html");
} else {
  // اگر کاربر قبلاً ثبت‌نام کرده باشد
  let token = await jwt.sign({ id: uss[0].id }, "testapp", { expiresIn: "12h" });
  res.cookie("tooky", token);
  res.redirect("https://mohammadqeshm.github.io/code-w/index.html");
}




});
 app.get('/dash',async(req, res) => {
    try {
      let token=req.cookies.tooky
      console.log(token);
      
     jwt.verify(token,"testapp",async(err,user)=>{
        if (err) {
            console.log("error");
            res.json({})        
        }else{
        // let qr= await database.query("select email,usernamee,nameshop,dateactive from users where id=? ",[user.id])
        //  let ff=qr[0]
        //  res.json(ff[0])

        let qr = await database.query("SELECT email, usernamee, nameshop, dateactive FROM users WHERE id = $1", [user.id]);
let ff = qr.rows[0];  // دسترسی به اولین ردیف نتایج

res.json(ff);  // نیازی به `[0]` نیست چون `ff` یک شیء است، نه یک آرایه


        }})

    } catch (error) {
res.json({})        
    }

        
 });
 app.get("/restpass",(req,res)=>{
res.sendFile(path.join(__dirname,"restpass.html"))
 })
 app.post("/regster",async(req,res)=>{
    let email=req.body.email
// let user=await database.query("select * from users where email=?",[email])
// let uss=user[0]
// if (uss.length==0) {
//     res.json({sttus:"not"})
// }else{
// let code=crypto.randomInt(999999)
// let date=new Date().getTime()+300000
// await database.query("update users set date=?,code=? where email=?",[date,code,email])
// emailsend(code,email)
//     res.json({status:"yes code"})
// }
let user = await database.query("SELECT * FROM users WHERE email = $1", [email]);
let uss = user.rows[0];  // نتایج در آرایه `rows` ذخیره می‌شوند

if (!uss) {  // اگر هیچ ردیفی بازگشتی نباشد
    res.json({ status: "not" });
} else {
    let code = crypto.randomInt(999999);
    let date = new Date().getTime() + 300000;
    await database.query("UPDATE users SET date = $1, code = $2 WHERE email = $3", [date, code, email]);
    emailsend(code, email);
    res.json({ status: "yes code" });
}



 })
 app.post("/oky",async(req,res)=>{
    let email=req.body.email
    let code=parseInt(req.body.code)
    let datenow=new Date().getTime()
// let user=await database.query("select * from users where email=?",[email])
// let uss=user[0]
// let dateactive=uss[0].date
// let codeactive=uss[0].code

let user = await database.query("SELECT * FROM users WHERE email = $1", [email]);
let uss = user.rows[0]; // در پستگرس‌اسکیول داده‌ها در آرایه rows قرار می‌گیرند
let dateactive = uss.date;  // دسترسی به فیلدها مانند مای‌اسکیول
let codeactive = uss.code;  // دسترسی به فیلدها مانند مای‌اسکیول




if (code==codeactive&&dateactive>datenow) { 
     res.json({status:"yes code"})
}else{
    res.json({status:"not"}) 
}



 })
app.post("/restpassword",async(req,res)=>{
try {
  // تعریف اسکیما
const schema = Joi.object({
  password: Joi.string()
    .min(8) // حداقل ۸ کاراکتر
    .max(30) // حداکثر ۳۰ کاراکتر
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/) // شامل حروف کوچک، بزرگ و عدد
    .required() // اجباری
    .messages({
      'string.base': 'رمز عبور باید یک رشته باشد.',
      'string.min': 'رمز عبور باید حداقل ۸ کاراکتر باشد.',
      'string.max': 'رمز عبور باید حداکثر ۳۰ کاراکتر باشد.',
      'string.pattern.base': 'رمز عبور باید شامل حداقل یک حرف بزرگ، یک حرف کوچک، یک عدد و یک نماد باشد.',
      'any.required': 'رمز عبور الزامی است.'
    })
});
// داده‌هایی برای اعتبارسنجی
let data2 = {
  password: req.body.newpassword
};
// اعتبارسنجی داده‌ها
const result = schema.validate(data2);

if (result.error) {
  console.log(result.error.details); 
res.json({status:result.error.message})
} else {
   let email=req.body.email
    let code=parseInt(req.body.code)
    let datenow=new Date().getTime()
// let user=await database.query("select * from users where email=?",[email])
let user = await database.query("SELECT * FROM users WHERE email = $1", [email]);

// let uss=user[0]
// let dateactive=uss[0].date
// let codeactive=uss[0].code
let uss = user.rows;  // دسترسی به داده‌های برگشتی از کوئری
let dateactive = uss[0].date;  // دسترسی به فیلد "date" از اولین ردیف
let codeactive = uss[0].code;  // دسترسی به فیلد "code" از اولین ردیف

if (code==codeactive&&dateactive>datenow) { 
let passnew=req.body.newpassword
let salt=await bcrypt.genSalt(10)
let newpas=await bcrypt.hash(passnew,salt)
// await database.query("update users set password=? where email=?",[newpas,email])
await database.query("UPDATE users SET password = $1 WHERE email = $2", [newpas, email]);


     res.json({status:"yes"})
}else{
    res.json({status:"not"}) 
}
}




} catch (error) {
  res.json({status:"error"})
}
  
})
app.post("/addorder",async(req,res)=>{
  try {
let   name= req.body.name
let   numbers= req.body.numbers
let   typedate= req.body.typedate
let   price= req.body.price
let   barcode= req.body.barcode
let   datey= req.body.datey
let   addrs= req.body.addrs

  const schema = Joi.object({
    // نام محصول
    name: Joi.string()
      .min(1) // حداقل یک کاراکتر
      .max(30) // حداکثر 30 کاراکتر
      .required(), // نام محصول اجباری است
  
    // تعداد
    numbers: Joi.string()
      .pattern(/^\d+$/) // فقط شامل اعداد
      .min(1) // حداقل یک عدد
      .max(8) // حداکثر 8 عدد
      .required(), // تعداد اجباری است
  
    // تایپ (فقط شامل 's' یا 'm')
    typedate: Joi.string()
      .valid('s', 'm') // فقط شامل 's' یا 'm'
      .length(1) // دقیقاً یک کاراکتر
      .required(), // تایپ اجباری است
  
    // قیمت
    price: Joi.string()
      .pattern(/^\d{1,3}(?:,\d{3})*(?:\.\d+)?$/) // فقط شامل اعداد و کاما
      .min(1) // حداقل یک کاراکتر
      .max(20) // حداکثر 20 کاراکتر
      .required(), // قیمت اجباری است
  
    // بارکد
    barcode: Joi.string()
      .pattern(/^\d{5,20}$/) // فقط اعداد بین 5 تا 20 کاراکتر
      .required(), // بارکد اجباری است
  
    // تاریخ
    datey: Joi.string()
    .pattern(/^\d{4}\/(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])$/) // تاریخ با ساختار YYYY/MM/DD
      .required(), // تاریخ اجباری است
  
    // آدرس قرارگیری (اختیاری)
    addrs: Joi.string()
      .max(100) // حداکثر 100 کاراکتر
      .optional() // آدرس اختیاری است
      .allow('') // اجازه دادن به رشته خالی (یعنی اختیاری)

  });
  // داده‌های ورودی برای اعتبارسنجی
  const input = {
    name: req.body.name,
    numbers: req.body.numbers,
    typedate: req.body.typedate,
    price: req.body.price,
    barcode: req.body.barcode,
    datey: req.body.datey,
    addrs: req.body.addrs,
  };
  console.log(input);
  // اجرای اعتبارسنجی
  const { error } = schema.validate(input);
  
  if (error) {
    console.log(error.details); // اگر خطایی بود، نمایش داده می‌شود
    res.json({status:error.message})
  } else {
    let token=req.cookies.tooky
    jwt.verify(token,"testapp",async(err,user)=>{
       if (err) {
           res.json({status:"login!"})        
       }else{

  if (typedate=="s") {
   
// تاریخ شمسی
let datee=datey.split("/")
const persianDate = {
    year: Number(datee[0]), 
    month: Number(datee[1]),   
    day: Number(datee[2])    
  };
// تبدیل به میلادی
  const gregorianDate = jalaali.toGregorian(persianDate.year, persianDate.month, persianDate.day);
  let dm=gregorianDate.gy+"/"+gregorianDate.gm+"/"+gregorianDate.gd
  let datenew=new Date(dm).getFullYear()+"/"+(new Date(dm).getMonth()+1)+"/"+new Date(dm).getDate()
// await database.query("insert into orders (userid,namee,numbers,typedate,price,barcode,datey,addrs) value(?,?,?,?,?,?,?,?)",[user.id,name,numbers,typedate,price,barcode,datenew,addrs])
await database.query(
  "INSERT INTO orders (userid, namee, numbers, typedate, price, barcode, datey, addrs) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
  [user.id,name,numbers,typedate,price,barcode,datenew,addrs]
);



}else{
    //  await database.query("insert into orders (userid,namee,numbers,typedate,price,barcode,datey,addrs) value(?,?,?,?,?,?,?,?)",[user.id,name,numbers,typedate,price,barcode,datey,addrs])
    await database.query(
      "INSERT INTO orders (userid, namee, numbers, typedate, price, barcode, datey, addrs) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [user.id, name, numbers, typedate, price, barcode, datey, addrs]
    );
    


}
res.json({status:"add"})


       }})



  






  }} catch (error) {
    res.json({status:"error"})

  }
})
app.get("/getorder",async(req,res)=>{
  console.log("data")

  try {
    let token=req.cookies.tooky
    jwt.verify(token,"testapp",async(err,user)=>{
       if (err) {
           res.json({status:""})        
       }else{
// let data=await database.query("select namee,numbers,typedate,price,barcode,datey,addrs from orders where userid=?",[user.id])
let data = await database.query("SELECT namee, numbers, typedate, price, barcode, datey, addrs FROM orders WHERE userid = $1", [user.id]);
res.json(data.rows)
// res.json(data[0])
       }})



  






  } catch (error) {
    res.json({status:""})

  }
})
app.post('/logout', (req, res) => {
  res.clearCookie('tooky'); // حذف کوکی 'authToken'
  res.send('شما با موفقیت خارج شدید');
});
 app.get("/",(req,res)=>{
res.sendFile(path.join(__dirname,"a.html"))
 }) 


//-------------------------





  
