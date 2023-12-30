const express = require("express");
const app = express();

const cors = require("cors");

const Jwt = require("jsonwebtoken");
const jwtKey = "e-com";

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const { ROLE, users } = require("./data");
const { authUser, authRole } = require("./basicAuth");

const productRouter = require("./routes/products");

app.use("/products", productRouter);

app.use(express.json({ limit: "2500mb" }));
app.use(express.urlencoded({ limit: "2500mb" }));
app.use(cors());

app.get("/", (req, resp) => {
  resp.send("app is running...");
});

app.get("/test", async (req, res) => {
  res.status(200).json({
    success: 456,
  });
});

app.post(`/signup`, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const result = await prisma.user.create({
      data: {
        name,
        email,
        password,
      },
    });
    if (result) {
      Jwt.sign({ result }, jwtKey, { expiresIn: "2h" }, (err, token) => {
        if (err) {
          res.status(401).json({
            success: false,
            message: "Something went wrong!",
          });
        }
        res.status(200).json({
          success: true,
          result: result,
          auth: token,
        });
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await prisma.$disconnect(); // Disconnect from the Prisma client
  }
});

app.post(`/login`, async (req, res) => {
  try {
    if (!req.body.email || !req.body.password) {
      res.status(401).json({
        success: false,
        message: "unauthorize",
      });
    }
    const result = await prisma.user.findUnique({
      where: {
        email: req.body.email,
        password: req.body.password,
      },
    });
    if (result) {
      Jwt.sign({ result }, jwtKey, { expiresIn: "2h" }, (err, token) => {
        if (err) {
          res.status(401).json({
            success: false,
            message: "Something went wrong!",
          });
        }
        res.status(200).json({
          success: true,
          result: result,
          auth: token,
        });
      });
    } else {
      res.status(401).json({
        success: false,
        message: "unauthorize",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await prisma.$disconnect(); // Disconnect from the Prisma client
  }
});

app.post(`/add-product`, verifyToken, async (req, res) => {
  try {
    if (
      !req.body.name ||
      !req.body.price ||
      !req.body.brand ||
      !req.body.category ||
      !req.body.user_id
    ) {
      res.status(401).json({
        success: false,
        message: "Some field have missing!",
      });
    }
    const { name, price, brand, category, user_id } = req.body;

    const result = await prisma.product.create({
      data: {
        name,
        price,
        brand,
        category,
        user_id: parseInt(user_id),
      },
    });
    if (result) {
      res.status(200).json({
        success: true,
        result: result,
      });
    } else {
      res.status(401).json({
        success: false,
        message: "Something Went Wrong!",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await prisma.$disconnect(); // Disconnect from the Prisma client
  }
});

// only admin can delete product
// app.delete(
//   `/product/:id`,
//   verifyToken,
//   authRole(ROLE.ADMIN),
//   async (req, res) => {
//     try {
//       const { id } = req.params;
//       const productId = Number(id);

//       const existingPost = await prisma.product.findUnique({
//         where: { id: productId },
//       });

//       if (!existingPost) {
//         return res.status(404).json({ error: "Post not found" });
//       }

//       const deletedPost = await prisma.product.delete({
//         where: { id: productId },
//       });

//       res.json(deletedPost);
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ error: "Internal server error" });
//     } finally {
//       await prisma.$disconnect(); // Disconnect from the Prisma client
//     }
//   }
// );

app.get(`/product/:id`, async (req, res) => {
  try {
    const { id } = req.params;
    const productId = Number(id);

    const existingPost = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingPost) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.json(existingPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await prisma.$disconnect(); // Disconnect from the Prisma client
  }
});

// only admin can update product
app.put(`/product/:id`, verifyToken, authRole(ROLE.ADMIN), async (req, res) => {
  try {
    const { id } = req.params;
    const productId = Number(id);
    const { name, price, brand, category } = req.body;

    const updateProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        name,
        price,
        brand,
        category,
      },
    });

    if (updateProduct) {
      res.json(updateProduct);
    } else {
      res.status(404).json({ error: "Something went wrong" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await prisma.$disconnect(); // Disconnect from the Prisma client
  }
});

app.get("/search/:key", verifyToken, async (req, res) => {
  try {
    const { key } = req.params;
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: key } },
          { category: { contains: key } },
          { brand: { contains: key } },
        ],
      },
    });
    if (products.length > 0) {
      res.status(200).json({
        success: true,
        result: products,
      });
    } else {
      res.status(200).json({
        success: false,
        result: "",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await prisma.$disconnect(); // Disconnect from the Prisma client
  }
});

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

app.listen(5000, () => console.log(`Server ready at: http://localhost:5000`));
