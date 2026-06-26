import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { PendingUser } from "../models/pendingUser.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { sendOTPEmail } from "../utils/sendEmail.js"
import jwt from "jsonwebtoken"


const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }


    } catch (error) {
        // console.error("TOKEN ERROR =>", error);
        throw new ApiError(
            500,
            "Something went wrong while generating refresh and access token"
        );
    }
}

const generateOTP = () => {
    // 6-digit numeric code, e.g. "042913"
    return Math.floor(100000 + Math.random() * 900000).toString();
}

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists (in real Users, or already has a pending signup): username, email
    // generate OTP, store signup as pending, email the OTP
    // return res — account is NOT created yet, only pending

    const { fullName, email, username, password } = req.body

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    const otp = generateOTP()

    // Replace any earlier pending signup for this email (e.g. they asked to resend)
    await PendingUser.findOneAndDelete({ email: email.toLowerCase() })

    const pendingUser = await PendingUser.create({
        fullName,
        email,
        username: username.toLowerCase(),
        password,
        otp,
    })

    await sendOTPEmail(pendingUser.email, otp)

    return res.status(201).json(
        new ApiResponse(201, { email: pendingUser.email }, "OTP sent to " + pendingUser.email)
    )

})

const verifyEmail = asyncHandler(async (req, res) => {
    const { email, code } = req.body

    if (!email?.trim() || !code?.trim()) {
        throw new ApiError(400, "Email and OTP code are required")
    }

    const pendingUser = await PendingUser.findOne({ email: email.toLowerCase() })

    if (!pendingUser) {
        throw new ApiError(400, "No pending signup found for this email. Please register again.")
    }

    if (pendingUser.otp !== code.trim()) {
        throw new ApiError(400, "Invalid OTP")
    }

    // OTP correct — create the real, verified user.
    // PendingUser already hashed the password once on its own pre-save hook.
    // We use insertOne (not User.create) here specifically because .create()
    // would trigger User's pre-save hook and hash the already-hashed password
    // a second time, breaking the stored credential.
    const insertResult = await User.collection.insertOne({
        fullName: pendingUser.fullName,
        email: pendingUser.email,
        username: pendingUser.username,
        password: pendingUser.password,
        createdAt: new Date(),
        updatedAt: new Date(),
    })

    await PendingUser.findByIdAndDelete(pendingUser._id)

    const createdUser = await User.findById(insertResult.insertedId).select("-password -refreshToken")

    return res.status(200).json(
        new ApiResponse(200, createdUser, "Email verified, account created successfully")
    )
})

const resendOTP = asyncHandler(async (req, res) => {
    const { email } = req.body

    if (!email?.trim()) {
        throw new ApiError(400, "Email is required")
    }

    const pendingUser = await PendingUser.findOne({ email: email.toLowerCase() })

    if (!pendingUser) {
        throw new ApiError(400, "No pending signup found for this email. Please register again.")
    }

    const otp = generateOTP()
    pendingUser.otp = otp
    pendingUser.createdAt = new Date() // resets the 10-minute TTL window
    await pendingUser.save()

    await sendOTPEmail(pendingUser.email, otp)

    return res.status(200).json(
        new ApiResponse(200, { email: pendingUser.email }, "OTP resent to " + pendingUser.email)
    )
})

const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const { email, username, password } = req.body

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        // If there's no verified user, check if they have an unfinished signup —
        // this is what Login.jsx's 403/needsVerification handling expects.
        const pendingUser = await PendingUser.findOne({ email })
        if (pendingUser) {
            return res.status(403).json({
                success: false,
                needsVerification: true,
                message: "Please verify your email before logging in. Check your inbox for the OTP.",
                user: {
                    fullName: pendingUser.fullName,
                    username: pendingUser.username,
                    email: pendingUser.email,
                }
            })
        }
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    // const options = {
    //     httpOnly: true,
    //     secure: true
    // }

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged In Successfully"
            )
        )

})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    // const options = {
    //     httpOnly: true,
    //     secure: true
    // }
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")

        }

        // const options = {
        //     httpOnly: true,
        //     secure: true
        // }
        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        };

        const { accessToken, newRefreshToken } = await generateAccessAndRefereshTokens(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"))


})


const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                req.user,
                "Current user fetched successfully"
            )
        )
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        { new: true }
    )
        .select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "User details updated successfully"))

});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar) {
        throw new ApiError(500, "Something went wrong while uploading avatar");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "User avatar updated successfully"));

});

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params
    if (!username?.trim()) {
        throw new ApiError(400, "username is required")
    }
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localfield: "_id",
                foreignfield: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localfield: "_id",
                foreignfield: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                email: 1
            }
        }

    ])

    if (!channel?.length) {
        throw new ApiError(404, "Channel not found")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, channel[0], "Channel fetched successfully"))
})


export {
    registerUser,
    verifyEmail,
    resendOTP,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    getUserChannelProfile
}