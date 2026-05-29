import { wrapAsync } from "../utils/asyncHandler.js";

const registerUser = wrapAsync(async (req, res) => {
  // take data from frontend - username, fullname, password, email
  const {username, fullname, email, password} = req.body
  let userDetails = {username,fullname,email,password};
  res.status(200).json(userDetails)
  
  // validate - done by zod
  
  // check username and email must be unique


  // check images - cover and avatar
  // upload to cloudinary, get the url of avatar and cover image if uploaded
  // make an object of user details to store it into db
});

export { registerUser };
