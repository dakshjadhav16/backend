const User = require('../models/userModel');
const Activity = require('../models/trackingModel');
const sendReportEmail = require('../services/mailService');
const Info=require('../models/UserInfoModel');
const generateDailyReport = async () => {
    try {
        const users = await User.find(); // Fetch all users

        for (const user of users) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const formattedDate = new Date(yesterday).toLocaleDateString(); // Get yesterday's date as a string

            const activities = await Activity.find({
                userId: user._id, // Use user._id here
                eatenDate: formattedDate // Ensure this matches your stored format
            });
            const userInfos=await Info.findOne({userId: user._id});
            const dailyCalorieRequirement = userInfos ? Info.dailyCalorieRequirement:0;

            let totalCalories = 0;
            let totalProtein = 0;
            let totalCarbs = 0;
            let totalFats = 0;
            let totalFiber = 0;

            // Generate report content
            let reportContent = `Hello ${user.name || 'User'},\n\nHere is your daily activity summary:\n`;

            activities.forEach(activity => {
                
                totalCalories += activity.details.calories;
                totalProtein += activity.details.protein;
                totalCarbs += activity.details.carbohydrates;
                totalFats += activity.details.fat;
                totalFiber += activity.details.fiber;

                
            });
            const percentageCompleted = dailyCalorieRequirement > 0 ? (totalCalories / dailyCalorieRequirement) * 100 : 0;

            reportContent += `
                Calories:  ${totalCalories} kcal,
                Protein: ${totalProtein}g,
                Carbs: ${totalCarbs}g,
                Fats: ${totalFats}g,
                Fiber: ${totalFiber}g
                You have completed ${percentageCompleted.toFixed(2)}% of your daily requirement.
                \n`;
                
               
            reportContent += `\nKeep tracking your activities to stay fit!\n`;

            // Send report email
            await sendReportEmail(user.email, reportContent);
        }

    } catch (error) {
        console.error('Error generating report:', error);
    }
};

module.exports = generateDailyReport;
