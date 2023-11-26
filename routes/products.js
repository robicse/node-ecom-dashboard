const express = require("express");
const router = express.Router();
const { products } = require("../data");
const { authUser } = require("../basicAuth");

const cors = require("cors");

const {
  canViewProduct,
  canDeleteProduct,
  scopedProducts,
} = require("../permissions/product");

const Jwt = require("jsonwebtoken");
const jwtKey = "e-com";

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

router.use(cors());

router.use(async (req, res, next) => {
  // req.requestedAt = new Date().toISOString();
  req.products = await prisma.product.findMany();
  next();
});

router.get("/", verifyToken, async (req, res) => {
  const products = await prisma.product.findMany();
  res.json(scopedProducts(req.user, products));
});

// router.get("/:productId", setProduct, authUser, authGetProduct, (req, res) => {
//   res.json(req.product);
// });

router.get(
  "/:productId",
  verifyToken,
  setProduct,
  authGetProduct,
  (req, res) => {
    res.json(req.product);
  }
);

router.delete(
  "/:productId",
  verifyToken,
  setProduct,
  authDeleteProduct,
  async (req, res) => {
    console.log("come here...");
    try {
      const { productId } = req.params;
      const product_id = Number(productId);

      const existingPost = await prisma.product.findUnique({
        where: { id: product_id },
      });

      if (!existingPost) {
        return res.status(404).json({ error: "Post not found" });
      }

      const deletedPost = await prisma.product.delete({
        where: { id: product_id },
      });

      res.json(deletedPost);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    } finally {
      await prisma.$disconnect(); // Disconnect from the Prisma client
    }
  }
);

function setProduct(req, res, next) {
  const productId = parseInt(req.params.productId);
  const products = req.products;
  req.product = products.find((product) => product.id === productId);

  if (req.product == null) {
    res.status(404);
    return res.send("Product not found");
  }
  next();
}

function authGetProduct(req, res, next) {
  if (!canViewProduct(req.user, req.product)) {
    res.status(401);
    return res.send("Not Allowed");
  }

  next();
}

function authDeleteProduct(req, res, next) {
  if (!canDeleteProduct(req.user, req.product)) {
    res.status(401);
    return res.send("Not Allowed");
  }

  next();
}

function verifyToken(req, res, next) {
  // const token = req.headers["Authorization"];
  const token = req.headers.authorization;
  if (token) {
    const authToken = token.split(" ")[1];
    Jwt.verify(authToken, jwtKey, (err, valid) => {
      if (err) {
        // console.log("11");
        res.status(401).json({ result: "Please provide valid token" });
      } else {
        // console.log("22");
        // const decodedToken = util.promisify(Jwt.verify)(authToken, jwtKey);
        const decoded = Jwt.verify(authToken, jwtKey);
        // req.user = decoded.userId
        // console.log("decoded", decoded);
        // console.log("decoded?.result", decoded.result);
        req.user = decoded?.result;
        next();
      }
    });
  } else {
    res.status(403).json({ result: "Please add token with headers" });
  }
}

module.exports = router;
