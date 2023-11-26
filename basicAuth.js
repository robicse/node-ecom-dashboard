function authUser(req, res, next) {
  if (req.user == null) {
    res.status(403);
    return res.send("You need to sign in");
  }
  console.log("req.user 2", req.user);
  next();
}

function authRole(role) {
  return (req, res, next) => {
    console.log("req.user.role", req.user.role);
    if (req.user.role !== role) {
      res.status(401);
      return res.send("Not allowed");
    }
    next();
  };
}

module.exports = {
  authUser,
  authRole,
};
