export default async function requiredAuth(req, res, next) {
  try {
    if (!req.currentUser) {
      return res.status(401).json({ message: "Authentication required" });
    }
    return next();
  } catch (error) {
    console.error("Error in requiredAuth middleware:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
