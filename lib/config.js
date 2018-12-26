/*
*
Create and export configuration variables
*
**/
//container for all the environments
const environments = {}

//Staging (default) environment
environments.staging={
    'httpPort':3000,
    'httpsPort':3001,
    'envName':'staging',
    'hashingSecret':'thisIsASecret',
    //'maxChecks':5,
    'maxOrders':50000000000000000000,
    'twilio' : {
        'accountSid' : 'ACb32d411ad7fe886aac54c665d25e5c5d',
        'authToken' : '9455e3eb3109edc12e3d8c92768f7a67',
        'fromPhone' : '+15005550006'
    },
    'stripeSecretKey':'sk_test_h2Vn8CPf7wSbBjvLSpi5yqw2'
}

//production environment
environments.production={
    'httpPort':5000,
    'httpsPort':5001,
    'envName':'production',
    'hashingSecret':'thisIsAlsoASecret',
    //'maxChecks':5,
    'maxOrders':5,
    'twilio':{
        'accountSid':'',
        'authToken':'',
        'fromPhone':''
    },
    'stripeSecretKey':'sk_test_h2Vn8CPf7wSbBjvLSpi5yqw2'
}

//Determine which environment was passed as a command-line argument
const currentEnvironment = typeof(process.env.NODE_ENV)==='string' ? 
process.env.NODE_ENV.toLowerCase():''

//Check that the current environment  was passed  as a command-line  argument
const environmentToExport = typeof(environments[currentEnvironment]) ==='object' ?
environments[currentEnvironment]:environments.staging

//export the module
module.exports = environmentToExport