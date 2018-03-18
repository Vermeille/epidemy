module.exports = {
    entry: "./index.js",
    devtool: "source-map",
    resolve: {
        extensions: [".js", ".json", ".jsx"]
    },
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /(node_modules|bower_components)/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: ['env'],
                    plugins: [
                        ["transform-react-jsx"]
                    ]
                }
            }
        }]
    },
};
