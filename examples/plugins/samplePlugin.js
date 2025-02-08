// examples/plugins/samplePlugin.js
module.exports.initPlugin = (context) => {
    try {
      context.router.registerRoute({
        method: "GET",
        path: "/plugin-route",
        response: {
          type: "json",
          data: { message: "This route was registered by a plugin!" }
        }
      });
      console.log("Sample Plugin: Plugin initialized with options:", context.options);
    } catch (error) {
      console.error("Sample Plugin Initialization Error:", error);
    }
  };
  