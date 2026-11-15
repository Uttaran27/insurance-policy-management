const User = require("../models/User");
const Policy = require("../models/Policy");
const { readPage } = require("../utils/pagination");

// Search policies for one user by an exact username.
const searchPoliciesByUsername = async (req, res) => {
    try {
        const username = String(req.params.username || "").trim().toLowerCase();

        if (!username) {
            return res.status(400).json({
                success: false,
                message: "Username is required"
            });
        }

        const user = await User.findOne({ username });

        console.log(`db users findOne found=${Boolean(user)}`);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const { page, limit, skip } = readPage(req.query);
        const filter = { userId: user._id };
        const totalPolicies = await Policy.countDocuments(filter);

        const policies = await Policy.find(filter)
            .skip(skip)
            .limit(limit)
            .populate("userId")
            .populate("categoryId")
            .populate("carrierId");

        console.log(
            `db policies find page=${page} limit=${limit} totalPolicies=${totalPolicies}`
        );

        return res.status(200).json({
            success: true,
            page,
            limit,
            totalPolicies,
            data: policies
        });
    } catch (error) {
        console.error("Policy search error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
};

// Get a page of users with their policies.
const getPoliciesByUser = async (req, res) => {
    try {
        const { page, limit, skip } = readPage(req.query);

        const [facet] = await User.aggregate([
            { $sort: { firstname: 1, _id: 1 } },
            {
                $facet: {
                    metadata: [{ $count: "totalUsers" }],
                    data: [
                        { $skip: skip },
                        { $limit: limit },
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
                                firstname: 1,
                                email: 1,
                                phone: 1,
                                totalPolicies: { $size: "$policies" },
                                policies: 1
                            }
                        }
                    ]
                }
            }
        ]);

        const totalUsers = facet?.metadata?.[0]?.totalUsers || 0;

        console.log(
            `db users aggregate page=${page} limit=${limit} totalUsers=${totalUsers}`
        );

        return res.status(200).json({
            success: true,
            page,
            limit,
            totalUsers,
            data: facet?.data || []
        });
    } catch (error) {
        console.error("Policy aggregation error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
};

module.exports = {
    searchPoliciesByUsername,
    getPoliciesByUser
};
