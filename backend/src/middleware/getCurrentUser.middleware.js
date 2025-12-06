import { User } from "../models/User.model.js";

export default async function getCurrentUser(req, res, next) {
  try {
    const cookie = req.cookies?.uId;

    //signed one is not working for some reason
    //todo : investigate later
    console.log("this is the cookie ", req.cookies.uId);
    if (!cookie) {
      req.currentUser = null;
      return next();
    }

    const user = await User.findById(cookie);
    if (!user) {
      req.currentUser = null;
      return next();
    }

    req.currentUser = user;
    return next();
  } catch (error) {
    console.log("current User ", error);
    req.currentUser = null;
    return next();
  }
}
