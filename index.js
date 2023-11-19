const express = require("express");
const app = express();

const cors = require("cors");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

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
  const { name, email, password } = req.body;

  const result = await prisma.user.create({
    data: {
      name,
      email,
      password,
    },
  });
  res.json(result);
});

app.post(`/login`, async (req, res) => {
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
    res.status(200).json({
      success: true,
      result: result,
    });
  } else {
    res.status(401).json({
      success: false,
      message: "unauthorize",
    });
  }
});

app.get("/products", async (req, res) => {
  const products = await prisma.product.findMany();
  if (products.length > 0) {
    res.status(200).json({
      success: true,
      result: products,
    });
  } else {
    res.status(200).json({
      success: false,
      result: "No products found.",
    });
  }
});

app.post(`/product`, async (req, res) => {
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
});

app.listen(5000, () => console.log(`Server ready at: http://localhost:5000`));
