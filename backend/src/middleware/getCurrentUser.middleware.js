import { User } from "../models/User.model";

export default async function getCurrentUser(req, res, next) {
  try {
    const signed = req.signedCookies?.uId;
    if (!signed) {
      req.currentUser = null;
      return next();
    }

    const user = await User.findById(signed);
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
