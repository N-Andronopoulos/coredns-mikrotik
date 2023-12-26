module.exports = function(options, webpack) {
  return {
    ...options,
    plugins: [
      ...options.plugins,
    ],
  };
};
