module.exports = async function (context, req) {
    const apiKey = process.env.AZURE_ML_API_KEY;
    const apiUrl = process.env.AZURE_ML_ENDPOINT_URL;

    context.res = {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
            apiKey: apiKey,
            apiUrl: apiUrl
        }
    };
};