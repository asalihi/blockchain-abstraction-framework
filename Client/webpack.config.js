module.exports = {
  module: {
    rules: [
      {
        test: /\.bpmnlintrc$/,
        use: [
          {
            loader: 'bpmnlint-loader'
          }
        ]
      }
    ]
  }
};
