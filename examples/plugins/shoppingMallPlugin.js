module.exports.initShoppingMall = (context) => {
    try {
      context.router.registerRoute({
        method: "GET",
        path: "/products",
        response: {
          type: "json",
          data: {
            products: [
              { id: 1, name: "Product A", price: 10.0 },
              { id: 2, name: "Product B", price: 20.0 }
            ]
          }
        }
      });
      context.router.registerRoute({
        method: "GET",
        path: "/products/:id",
        response: {
          handler: (req, res) => {
            const productId = req.params.id;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ id: productId, name: `Product ${productId}`, price: parseFloat(productId) * 10 }));
          }
        }
      });
      context.router.registerRoute({
        method: "POST",
        path: "/cart",
        response: {
          type: "json",
          data: { message: "Item added to cart" }
        }
      });
      context.router.registerRoute({
        method: "GET",
        path: "/cart",
        response: {
          type: "json",
          data: { items: [] }
        }
      });
      context.router.registerRoute({
        method: "POST",
        path: "/checkout",
        response: {
          type: "json",
          data: { message: "Checkout successful" }
        }
      });
      console.log("ShoppingMall Plugin: E-commerce routes registered.");
    } catch (error) {
      console.error("ShoppingMall Plugin Initialization Error:", error);
    }
  };
  