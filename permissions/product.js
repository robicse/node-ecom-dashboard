const { ROLE } = require("../data");

function canViewProduct(user, product) {
  return user.role === ROLE.ADMIN || product.user_id === user.id;
}

function scopedProducts(user, products) {
  if (user.role === ROLE.ADMIN) return products;
  return products.filter((product) => product.user_id === user.id);
}

function canDeleteProduct(user, product) {
  console.log("user", user);
  console.log("product", product);
  return product.user_id === user.id;
}

module.exports = {
  canViewProduct,
  scopedProducts,
  canDeleteProduct,
};
