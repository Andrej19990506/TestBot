const path = require('path');

const config = {
    webpack: {
        configure: (webpackConfig) => {
            webpackConfig.output = {
                ...webpackConfig.output,
                publicPath: ''
            };
            return webpackConfig;
        }
    },
    devServer: {
        allowedHosts: 'all',
        host: '0.0.0.0',
        port: 3000,
        hot: false,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Origin, Content-Type, Accept, Authorization'
        },
        historyApiFallback: true,
        client: {
            overlay: false,
            webSocketTransport: 'ws'
        },
        webSocketServer: false,
        https: false,
        proxy: {
            '/api/*': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                secure: false,
                pathRewrite: {
                    '^/api': ''
                },
                onProxyReq: function(proxyReq, req, res) {
                    console.log('Proxying request:', req.method, req.url);
                },
                onError: function(err, req, res) {
                    console.error('Proxy error:', err);
                }
            }
        }
    }
};

// Прокси только для разработки
if (process.env.NODE_ENV === 'development') {
    config.devServer.proxy = {
        '/api/*': {
            target: 'http://localhost:5000',
            changeOrigin: true,
            secure: false,
            pathRewrite: {
                '^/api': ''
            }
        }
    };
}

module.exports = config; 