const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dns = require('dns');

const twilio = require('twilio');
const cron = require('node-cron');
const generateDailyReport = require('./Controllers/reportController');
const cors = require('cors');
const sendMessageToAllUsers = require('./sendMessage');
const multer = require('multer');
const Slot= require('./models/video');
const userModel = require('./models/userModel')
const foodModel = require("./models/foodModel")
const trackingModel = require("./models/trackingModel")
const PhysicalModel=require("./models/PhysicalModel")
const postModel =require("./models/postModel")
const verifyToken = require("./verifyToken")
const WaterIntake=require("./models/waterModel")
const User = require('./models/ProfileModel');
const UserinfoModel=require('./models/UserInfoModel');
const CaloriesData = require('./models/CaloriesData'); 


const app = express();
app.use(express.json({ limit: '10mb' })); // Set the limit to 10MB
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// database connection 
mongoose.connect("mongodb://localhost:27017/nutrify")
.then(()=>{
    console.log("Database connection successfull")
})
.catch((err)=>{
    console.log(err);
})
cron.schedule('0 7 * * *', () => {
  console.log('Running daily report job');
  generateDailyReport();
});


// User Schema
const scheduleMessages = () => {
  // Schedule for breakfast at 8 AM
  sendMessageToAllUsers('Good morning! It’s time for breakfast.'); 
  cron.schedule('0 8 * * *', () => {
      sendMessageToAllUsers('Good morning! It’s time for breakfast.'); // Send breakfast message
  });

  // Schedule for lunch at 12 PM
  cron.schedule('0 12 * * *', () => {
      sendMessageToAllUsers('It’s lunch time! Enjoy your meal.'); // Send lunch message
  });

  // Schedule for dinner at 7 PM
  cron.schedule('0 19 * * *', () => {
      sendMessageToAllUsers('Dinner is ready! Time to eat.'); // Send dinner message
  });
};



let slots = [
  { id: 1, time: '9:00 AM - 10:00 AM', booked: false },
  { id: 2, time: '10:00 AM - 11:00 AM', booked: false },
  { id: 3, time: '11:00 AM - 12:00 PM', booked: true },
  { id: 4, time: '12:00 PM - 1:00 PM', booked: false },
];


app.get('/api/slots', (req, res) => {
  res.json(slots);
});

// Book a slot
app.post('/api/book-slot/:id', (req, res) => {
  const slotId = parseInt(req.params.id, 10);
  const { memberId } = req.body;

  const slot = slots.find((s) => s.id === slotId);
  if (!slot) {
    return res.status(404).json({ error: 'Slot not found' });
  }

  if (slot.booked) {
    return res.status(400).json({ error: 'Slot already booked' });
  }

  slot.booked = true;
  slot.memberId = memberId;
  res.json(slot);
});

// Unblock a slot
app.post('/api/unblock-slot/:id', (req, res) => {
  const slotId = parseInt(req.params.id, 10);
  const { memberId } = req.body;

  const slot = slots.find((s) => s.id === slotId);
  if (!slot) {
    return res.status(404).json({ error: 'Slot not found' });
  }

  if (slot.memberId !== memberId) {
    return res.status(403).json({ error: 'You can only unblock slots booked by you.' });
  }

  slot.booked = false;
  slot.memberId = null;
  res.json(slot);
});

// POST route to save calorie data
app.post('/saveCalories', async (req, res) => {
  try {
    const { activity, caloriesBurned, date } = req.body;

    const newEntry = new CaloriesData({
      activity,
      caloriesBurned,
      date,
    });

    await newEntry.save();
    res.status(200).json({ message: 'Data saved successfully' });
  } catch (error) {
    console.error('Error saving calorie data:', error);
    res.status(500).json({ error: 'Failed to save data' });
  }
});




app.post('/send-messages', async (req, res) => {
  const { message } = req.body; // Get message from request body

  if (!message) {
      return res.status(400).send('Message content is required.');
  }

  try {
      await sendMessageToAllUsers(message); // Call the function to send messages
      res.status(200).send('Messages sent successfully.');
  } catch (error) {
      console.error('Error in sending messages:', error);
      res.status(500).send('Server error');
  }
});

app.delete('/posts/:id', async (req, res) => {
  const postId = req.params.id;

  try {
      const deletedPost = await postModel.findByIdAndDelete(postId);
      if (!deletedPost) {
          return res.status(404).send('Post not found');
      }
      res.status(200).send('Post deleted successfully');
  } catch (err) {
      console.error("Error deleting post:", err);
      res.status(500).send('Server error');
  }
});
app.get('/water_intake/:userId/:date', async (req, res) => {
  try {
    const { userId, date } = req.params;
    const waterIntake = await WaterIntake.findOne({ userId, date });

    if (waterIntake) {
      res.status(200).json(waterIntake);
    } else {
      res.status(404).json({ message: 'No water intake record found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching water intake data' });
  }
});


app.post('/water_intake', async (req, res) => {
  try {
    const { userId, date, waterConsumed } = req.body;
    let waterIntake = await WaterIntake.findOne({ userId, date });

    if (waterIntake) {
      // Update existing record
      waterIntake.waterConsumed += waterConsumed;
      await waterIntake.save();
    } else {
      // Create a new record
      waterIntake = new WaterIntake({
        userId,
        date,
        waterConsumed
      });
      await waterIntake.save();
    }

    res.status(200).json({ message: 'Water intake logged successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error logging water intake' });
  }
});


// Placeholder for OTP storage (can use Redis or a more secure method in production)
const otpStore = {};

app.post('/register/generate-otp', async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the email already exists in the database
    const existingUser = await userModel.findOne({ email: email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists.' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = otp; // Store OTP temporarily (implement expiry logic as needed)

    // Set up Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: EMAIL_USER, // Use email from .env
        pass: EMAIL_PASS // Use app-specific password from .env
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from:  EMAIL_USER, // Use email from .env
     
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is: ${otp}`,
    };

    // Send email
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'OTP sent to your email.' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, message: 'Error sending OTP.' });
  }
});


// Verify OTP and register user
app.post('/register/verify-otp', async (req, res) => {
  const { name, email, password, age, otp } = req.body;

  if (otpStore[email] !== otp) {
    return res.status(400).json({ success: false, message: 'Invalid OTP.' });
  }

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save the new user
    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
      age,
    });

    await newUser.save();
    delete otpStore[email]; // Remove OTP after successful registration

    res.status(201).json({ success: true, message: 'Registration successful!' });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

app.post("/login",async (req,res)=>{

    let userCred = req.body;

    try 
    {
        const user=await userModel.findOne({email:userCred.email});
        if(user!==null)
        {
            bcrypt.compare(userCred.password,user.password,(err,success)=>{
                if(success==true)
                {
                    jwt.sign({email:userCred.email},"nutrifyapp",(err,token)=>{
                        if(!err)
                        {
                            res.send({message:"Login Success",token:token,userid:user._id,name:user.name});
                            console.log("hh");
                        }
                    })
                }
                else 
                {
                    res.status(403).send({message:"Incorrect password"})
                }
            })
        }
        else 
        {
            res.status(404).send({message:"User not found"})
        }
    }
    catch(err)
    {
        console.log(err);
        res.status(500).send({message:"Some Problem"})
    }
})


app.get("/foods",verifyToken,async(req,res)=>{

    try 
    {
        let foods = await foodModel.find();
        res.send(foods);
    }
    catch(err)
    {
        console.log(err);
        res.status(500).send({message:"Some Problem while getting info"})
    }

})

app.get('/foods/random', async (req, res) => {
  const numMeals = req.query.count || 5; // Number of meals to return, default to 5
  try {
    const mealsCount = await foodModel.countDocuments();
    const randomIndex = Math.floor(Math.random() * mealsCount);
    const randomMeals = await foodModel.find().skip(randomIndex).limit(numMeals);
    res.json(randomMeals);
  } catch (error) {
    console.error('Error fetching random meals:', error);
    res.status(500).json({ message: 'Error fetching random meals' });
  }
});
app.get("/foods/:name",verifyToken,async (req,res)=>{

    try
    {
        let foods = await foodModel.find({name:{$regex:req.params.name,$options:'i'}})
        if(foods.length!==0)
        {
            res.send(foods);
        }
        else 
        {
            res.status(404).send({message:"Food Item Not Fund"})
        }
       
    }
    catch(err)
    {
        console.log(err);
        res.status(500).send({message:"Some Problem in getting the food"})
    }
    

})


app.post("/track",verifyToken,async (req,res)=>{
    
    let trackData = req.body;
   
    try 
    {
        let data = await trackingModel.create(trackData);
        console.log(data)
        res.status(201).send({message:"Food Added"});
    }
    catch(err)
    {
        console.log(err);
        res.status(500).send({message:"Some Problem in adding the food"})
    }

})
// endpoint to fetch all foods eaten by a person 

app.get("/track/:userid/:date",async (req,res)=>{

    let userid = req.params.userid;
    let date = new Date(req.params.date);
    let strDate = date.getDate()+"/"+(date.getMonth()+1)+"/"+date.getFullYear();

    try
    {

        let foods = await trackingModel.find({userId:userid,eatenDate:strDate}).populate('userId').populate('foodId')
        res.send(foods);

    }
    catch(err)
    {
        console.log(err);
        res.status(500).send({message:"Some Problem in getting the food"})
    }


})
    app.get('/user/:userId/posts', async (req, res) => {
      const { userId } = req.params; // This should be the user ID
      try {
          // Check if userId is a valid ObjectId
          if (!mongoose.Types.ObjectId.isValid(userId)) {
              return res.status(400).json({ message: 'Invalid user ID' });
          }
  
          const posts = await postModel.find({ userId: userId });
          res.status(200).json(posts);
      } catch (error) {
          console.error('Error fetching user posts:', error);
          res.status(500).json({ message: 'Error fetching user posts', error });
      }
  });

  app.get('/posts/:postId', async (req, res) => {
      const { postId } = req.params; // Extract postId from the URL
      try {
          const post = await postModel.findById(postId); // Find post by postId
          if (!post) {
              return res.status(404).json({ message: 'Post not found' });
          }
          res.status(200).json(post);
      } catch (error) {
        console.log("i am here");
          console.error('Error fetching post:', error);
          res.status(500).json({ message: 'Error fetching post', error });
      }
  });
  
    


app.post('/posts', upload.single('image'), async (req, res) => {
    const { userId,title,content } = req.body;  // Extract userId from the request body
    const image = req.file ? req.file.buffer.toString('base64') : null; // Convert image to base64
  
    if (!userId || !image || !title || !content) {
      return res.status(400).json({ message: 'User ID and image are required!' });
    }
  
    try {
      // Create a new ProfilePhoto document and save the image with userId
      const newProfilePhoto = new postModel({
        userId, 
        title,
        content,   // Link to the user
        image,     // Store the base64 image data
      });
  
      // Save the document to the database
      const savedPhoto = await newProfilePhoto.save();
  
      if (!savedPhoto) {
        return res.status(500).json({ message: 'Failed to save profile photo' });
      }
  
      res.status(200).json({
        message: 'Profile photo uploaded successfully!',
        savedPhoto,  // Return the saved profile photo details
      });
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      res.status(500).json({ message: 'Error uploading profile photo', error });
    }
  });
  
  app.post('/upload_profile_photo', upload.single('image'), async (req, res) => {
    const { userId } = req.body;  // Extract userId from the request body
    const image = req.file ? req.file.buffer.toString('base64') : null; // Convert image to base64
  
    if (!userId || !image) {
      return res.status(400).json({ message: 'User ID and image are required!' });
    }
  
    try {
      // Check if the user already exists in the database
      const existingUser = await User.findOne({ userId });
  
      if (existingUser) {
        // If user exists, update the profile photo
        existingUser.image = image;
  
        // Save the updated document to the database
        const updatedUser = await existingUser.save();
  
        res.status(200).json({
          message: 'Profile photo updated successfully!',
          updatedUser,  // Return the updated user details
        });
      } else {
        // If user doesn't exist, create a new document
        const newProfilePhoto = new User({
          userId,    // Link to the user
          image,     // Store the base64 image data
        });
  
        // Save the new document to the database
        const savedPhoto = await newProfilePhoto.save();
  
        res.status(200).json({
          message: 'Profile photo uploaded successfully!',
          savedPhoto,  // Return the saved profile photo details
        });
      }
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      res.status(500).json({ message: 'Error uploading profile photo', error });
    }
  });
// Post route to handle image upload
/*app.post('/upload_profile_photo', upload.single('image'), async (req, res) => {
    const { userId } = req.body;  // Extract userId from the request body
    const image = req.file ? req.file.buffer.toString('base64') : null; // Convert image to base64
  
    if (!userId || !image) {
      return res.status(400).json({ message: 'User ID and image are required!' });
    }
  
    try {
      // Create a new ProfilePhoto document and save the image with userId
      const newProfilePhoto = new User({
        userId,    // Link to the user
        image,     // Store the base64 image data
      });
  
      // Save the document to the database
      const savedPhoto = await newProfilePhoto.save();
  
      if (!savedPhoto) {
        return res.status(500).json({ message: 'Failed to save profile photo' });
      }
  
      res.status(200).json({
        message: 'Profile photo uploaded successfully!',
        savedPhoto,  // Return the saved profile photo details
      });
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      res.status(500).json({ message: 'Error uploading profile photo', error });
    }
  }); */
  
// Backend route to fetch profile photo by userId
app.get('/upload_profile_photo/:userId', async (req, res) => {
    const { userId } = req.params;
  
    try {
      // Find the user's profile photo by userId
      const profilePhoto = await User.findOne({ userId });
  
      if (!profilePhoto) {
        return res.status(404).json({ message: 'Profile photo not found!' });
      }
  
      // Return the base64 image and other data
      res.status(200).json({
        message: 'Profile photo fetched successfully!',
        image: profilePhoto.image,  // Send base64 image as a response
      });
    } catch (error) {
      console.error('Error fetching profile photo:', error);
      res.status(500).json({ message: 'Error fetching profile photo', error });
    }
  });

  app.post('/userinfo', verifyToken, async (req, res) => {
    try {
        const { userId, firstName, lastName, age, height, weight, bloodGroup, email, contactNumber, activityLevel, allergies, healthConditions, fitnessGoal, dietaryPreferences, foodPreferences, hobbies, bmi, dailyCalorieRequirement } = req.body;

        // Ensure userId is passed and valid
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        // Define the update data
        const userInfoData = {
            firstName,
            lastName,
            age,
            height,
            weight,
            bloodGroup,
            email,
            contactNumber,
            activityLevel,
            allergies,
            healthConditions,
            fitnessGoal,
            dietaryPreferences,
            foodPreferences,
            hobbies,
            bmi,
            dailyCalorieRequirement
        };

        // Use findOneAndUpdate to update if exists, or create a new document
        const updatedUserInfo = await UserinfoModel.findOneAndUpdate(
            { userId }, // Filter
            userInfoData, // Update data
            { new: true, upsert: true } // Options: new returns the updated document, upsert creates a new document if it does not exist
        );

        // Return the updated or newly created document
        res.status(200).json(updatedUserInfo);
    } catch (error) {
        console.error(error);
        if (error.code === 11000 && error.keyPattern.email) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        res.status(500).json({ message: 'Something went wrong' });
    }
});


app.get('/userinfo/:userId', verifyToken, async (req, res) => {
  try {
      const { userId } = req.params; // Extract userId from the URL

      // Ensure userId is passed and valid
      if (!userId) {
          return res.status(400).json({ message: 'User ID is required' });
      }

      // Fetch user info by userId
      const userInfo = await UserinfoModel.findOne({ userId });

      if (!userInfo) {
          return res.status(404).json({ message: 'User not found' });
      }

      // Return the fetched user data
      res.status(200).json(userInfo);
  } catch (error) {
      console.error('Error fetching user info:', error);
      res.status(500).json({ message: 'Something went wrong' });
  }
});
app.get('/posts', verifyToken, async (req, res) => {
  try {
    const posts = await postModel.find(); // Fetch all posts from the database
    if (posts.length === 0) {
      return res.status(404).json({ message: 'No posts available' });
    }

    // Shuffle and select 5 random posts
    const shuffledPosts = posts.sort(() => 0.5 - Math.random());
    const selectedPosts = shuffledPosts.slice(0, 5);

    res.status(200).json(selectedPosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
app.listen(8000,()=>{
    console.log("Server is up and running");
})
/*app.post("/physical_info", verifyToken, async (req, res) => {
    const phyData = req.body;

    console.log("Incoming physical data:", phyData);

    try {
        // Check if a record with the same userId already exists
        const existingData = await PhysicalModel.findOne({ userId: phyData.userId });

        if (existingData) {
            // If it exists, update the existing record
            existingData.height = phyData.height;
            existingData.weight = phyData.weight;
            existingData.bmi = phyData.bmi;
            await existingData.save();
            console.log("Physical data updated:", existingData);
            return res.status(200).send({ message: "Physical data updated successfully." });
        } else {
            // If it does not exist, create a new record
            const newData = await PhysicalModel.create(phyData);
            console.log("Physical data added:", newData);
            return res.status(201).send({ message: "Physical data added successfully." });
        }
    } catch (err) {
        console.log("Error occurred:", err);
        res.status(500).send({ message: "Some problem occurred while processing the request." });
    }
}); 
/*app.post("/posts",verifyToken,async (req,res)=>{
    
    let postData = req.body;
    
    try 
    {
        let data = await postModel.create(postData);
       // console.log(data)
        res.status(201).send({message:"Post Added In database"});
    }
    catch(err)
    {
        console.log(err);
        res.status(500).send({message:"Some Problem in adding the food"})
    }
    


})
app.post("/posts",  upload.single('image'), async (req, res) => {
    const { userId, title, content } = req.body; // Extract data from request body
  const image = req.file ? req.file.buffer.toString('base64') : null; // Convert image to base64

  if (!userId || !title || !content) {
    return res.status(400).json({ message: 'User ID, title, and content are required!' });
  }

  try {
    // Create a new post and save it in the database
    const newPost = new postModel({
      userId,
      title,
      content,
      image,
    });

    const savedPost = await newPost.save(); // Save to database

    res.status(200).json({
      message: 'Post created successfully!',
      savedPost,
    });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({
      message: 'Error creating post',
      error,
    });
  }
}); 


app.get('/posts/:userId', async (req, res) => {

        try {
            const userId = req.params.userId;
    
            // Find all posts for the user
            const posts = await postModel.find({ userId }).sort({ createdAt: -1 });
    
            if (posts.length === 0) {
                return res.status(404).json({ message: 'No posts found' });
            }
    
            return res.status(200).json(posts); // Return the posts
        } catch (error) {
            console.error('Error fetching posts:', error);
            return res.status(500).json({ message: 'Server error', error });
        }
    }); */
