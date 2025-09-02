// Cloudflare Worker for UK Vehicle Checker PWA
// Simple JavaScript version without TypeScript exports

export default {
  async fetch(request, env) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Use POST.' }),
        {
          status: 405,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    try {
      // Validate environment
      if (!env.DVLA_API_KEY) {
        return new Response(
          JSON.stringify({ 
            error: 'Server configuration error. DVLA API key not found.',
            detail: 'Please configure the DVLA_API_KEY environment variable in your Cloudflare Worker.'
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }

      // Parse request body
      let requestBody;
      try {
        requestBody = await request.json();
      } catch {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid request body. Expected JSON with registrationNumber field.' 
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }

      // Validate registration number
      const { registrationNumber } = requestBody;
      if (!registrationNumber || typeof registrationNumber !== 'string') {
        return new Response(
          JSON.stringify({ 
            error: 'Missing or invalid registration number' 
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }

      // Clean and validate registration format
      const cleanReg = registrationNumber.toUpperCase().replace(/\s/g, '');
      if (cleanReg.length < 2 || cleanReg.length > 8) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid registration format. Must be 2-8 characters.' 
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }

      console.log(`Checking vehicle: ${cleanReg}`);

      // Call DVLA API
      const dvlaResponse = await fetch(
        'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles',
        {
          method: 'POST',
          headers: {
            'x-api-key': env.DVLA_API_KEY,
            'Content-Type': 'application/json',
            'User-Agent': 'UK-Vehicle-Checker-PWA/1.0'
          },
          body: JSON.stringify({ registrationNumber: cleanReg })
        }
      );

      const responseData = await dvlaResponse.json();

      // Handle DVLA API errors
      if (!dvlaResponse.ok) {
        console.error(`DVLA API error ${dvlaResponse.status}:`, responseData);
        
        let errorMessage = 'Unknown error from DVLA API';
        let errorDetail = responseData.detail || responseData.message || 'Please try again later';

        switch (dvlaResponse.status) {
          case 400:
            errorMessage = 'Invalid registration number format';
            errorDetail = 'Please check the registration number and try again';
            break;
          case 403:
            errorMessage = 'API access denied';
            errorDetail = 'Please check your DVLA API key configuration';
            break;
          case 404:
            errorMessage = 'Vehicle not found';
            errorDetail = 'No vehicle found with this registration number';
            break;
          case 429:
            errorMessage = 'Rate limit exceeded';
            errorDetail = 'Too many requests. Please wait and try again';
            break;
          case 500:
          case 502:
          case 503:
          case 504:
            errorMessage = 'DVLA service temporarily unavailable';
            errorDetail = 'Please try again in a few moments';
            break;
        }

        return new Response(
          JSON.stringify({
            error: errorMessage,
            detail: errorDetail,
            status: dvlaResponse.status
          }),
          {
            status: dvlaResponse.status,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }

      // Transform DVLA response to our format
      const vehicleData = {
        registrationNumber: cleanReg,
        taxStatus: responseData.taxStatus || 'Unknown',
        taxDueDate: responseData.taxDueDate,
        motStatus: responseData.motStatus || 'No details held by DVLA',
        motExpiryDate: responseData.motExpiryDate,
        make: responseData.make || 'Unknown',
        colour: responseData.colour || 'Unknown',
        fuelType: responseData.fuelType || 'Unknown',
        engineCapacity: responseData.engineCapacity,
        co2Emissions: responseData.co2Emissions,
        yearOfManufacture: responseData.yearOfManufacture || new Date().getFullYear()
      };

      console.log(`Successfully retrieved data for ${cleanReg}`);

      // Return successful response
      return new Response(JSON.stringify(vehicleData), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        },
      });

    } catch (error) {
      console.error('Worker error:', error);
      
      return new Response(
        JSON.stringify({ 
          error: 'Internal server error',
          detail: 'An unexpected error occurred while processing your request'
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
  },
};