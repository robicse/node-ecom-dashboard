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
  try {
    const { name, email, password } = req.body;

    const result = await prisma.user.create({
      data: {
        name,
        email,
        password,
      },
    });
    res.json(result);
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await prisma.$disconnect(); // Disconnect from the Prisma client
  }
});

app.get("/products", async (req, res) => {
  try {
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await prisma.$disconnect(); // Disconnect from the Prisma client
  }
});

app.post(`/product`, async (req, res) => {
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

app.delete(`/product/:id`, async (req, res) => {
  try {
    const { id } = req.params;
    const productId = Number(id);

    const existingPost = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    const deletedPost = await prisma.product.delete({
      where: { id: productId },
    });

    res.json(deletedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await prisma.$disconnect(); // Disconnect from the Prisma client
  }
});

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

app.put(`/product/:id`, async (req, res) => {
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

app.get("/search/:key", async (req, res) => {
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

app.listen(5000, () => console.log(`Server ready at: http://localhost:5000`));
