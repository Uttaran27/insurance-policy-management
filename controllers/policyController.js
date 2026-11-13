
const User = require("../models/User");
const Policy = require("../models/Policy");

const LOB = require("../models/LOB");
const Carrier = require("../models/Carrier");

// Search policies using the user's first name
const searchPoliciesByUsername = async (req, res) => {
    try {

        console.error("SEARCH API HANDLER EXECUTED");
        const { username } = req.params;

        // Search policies using the user's username
        const users = await User.find({
            username: {
                $regex: username,
                $options: "i"
            }
        });


        console.error("Username received:", username);
        console.error("Users found:", users.length);


        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const userIds = users.map((user) => user._id);

        const policies = await Policy.find({
            userId: { $in: userIds }
        })
            .populate("userId")
            .populate("categoryId")
            .populate("carrierId");

        return res.status(200).json({
            success: true,
            totalPolicies: policies.length,
            data: policies
        });

    } catch (error) {
        console.error("Policy search error:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Get policies grouped by each user using MongoDB aggregation
const getPoliciesByUser = async (req, res) => {
    try {
        const result = await User.aggregate([
            {
                $lookup: {
                    from: "policies",
                    localField: "_id",
                    foreignField: "userId",
                    as: "policies"
                }
            },
            {
                $project: {
                    firstName: 1,
                    email: 1,
                    phone: 1,
                    totalPolicies: {
                        $size: "$policies"
                    },
                    policies: 1
                }
            }
        ]);

        return res.status(200).json({
            success: true,
            totalUsers: result.length,
            data: result
        });

    } catch (error) {
        console.error("Policy aggregation error:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    searchPoliciesByUsername,
    getPoliciesByUser
};
