const {defineConfig} = require('@vue/cli-service')
// const fs = require('fs');
module.exports = defineConfig({
    transpileDependencies: true,
    publicPath: './',
    outputDir: 'dist',
    assetsDir: 'static',
    pages: {
        index: {
            entry: 'src/main.js',
            // 当使用 title 选项时，template 中的 title 标签需要是 <title><%= htmlWebpackPlugin.options.title %></title>
            title: 'chat',
        },
    },
    devServer: {
        // port: 9090,
        // https: {
        //     key: fs.readFileSync('./xx.key'),
        //     cert: fs.readFileSync('./xx.pem'),
        // },
    },
    lintOnSave: false,// 关闭eslint
})