const https = require('https');

module.exports = async function (context, req) {
    const apiKey = process.env.AZURE_ML_API_KEY;
    const apiUrl = process.env.AZURE_ML_ENDPOINT_URL;

    // Log for debugging
    context.log('Chat proxy function called');
    context.log('API URL configured:', apiUrl ? 'Yes' : 'No');
    context.log('API Key configured:', apiKey ? 'Yes' : 'No');

    if (!apiKey || !apiUrl) {
        context.res = {
            status: 500,
            body: {
                error: 'Server configuration error',
                message: 'API credentials not properly configured'
            }
        };
        return;
    }

    try {
        // Parse the URL
        const url = new URL(apiUrl);
        
        // Prepare the request data
        const postData = JSON.stringify(req.body);
        
        // Set up the request options
        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'Authorization': `Bearer ${apiKey}`
            }
        };

        // Make the HTTPS request
        const mlResponse = await new Promise((resolve, reject) => {
            const request = https.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        data: data
                    });
                });
            });
            
            request.on('error', (error) => {
                reject(error);
            });
            
            request.write(postData);
            request.end();
        });

        context.log('ML Response status:', mlResponse.statusCode);
        context.log('ML Response data:', mlResponse.data);

        // Parse the response
        let result;
        try {
            result = JSON.parse(mlResponse.data);
        } catch (e) {
            // If not JSON, wrap in answer field
            result = { answer: mlResponse.data };
        }

        // Return appropriate response
        if (mlResponse.statusCode === 200) {
            context.res = {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                body: result
            };
        } else {
            context.res = {
                status: mlResponse.statusCode,
                body: {
                    error: `Azure ML API error: ${mlResponse.statusCode}`,
                    details: mlResponse.data
                }
            };
        }

    } catch (error) {
        context.log.error('Error calling Azure ML:', error);
        context.res = {
            status: 500,
            body: {
                error: 'Failed to call Azure ML endpoint',
                message: error.message
            }
        };
    }
};