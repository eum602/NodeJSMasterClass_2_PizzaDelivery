/**
 * these are the request handlers
 */
//Dependencies
const _data = require('./data')
const helpers = require('./helpers')
const config = require('./config')

//define the handlers
const handlers = {}
//users
handlers.users = (data,callback)=>{
    const acceptableMethods = ['post','get','put','delete']
    if(acceptableMethods.indexOf(data.method)>-1){
        handlers._users[data.method](data,callback)
    }else{
        callback(405)
    }
}
//container for the users submethods
handlers._users = {}
//Users - post
//required data: first name , lastName ,  phone ,  password,  tosAgreement
handlers._users.post = (data,callback)=>{
    //console.log(data)
    //Check that all required  fields  are filled out
    const firstName = typeof(data.payload.firstName)==="string" && 
        data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() :false
    
    const lastName = typeof(data.payload.lastName)==="string" && 
    data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() :false
    
    const email = typeof(data.payload.email)==="string" &&
    data.payload.email.trim().length > 0 ? data.payload.email.trim() :false

    const streetAddress = typeof(data.payload.streetAddress)==="string" &&
    data.payload.streetAddress.trim().length > 0 ? data.payload.streetAddress.trim() :false

    const password = typeof(data.payload.password)==="string" &&
    data.payload.password.trim().length > 0 ? data.payload.password.trim() :false

    const tosAgreement = typeof(data.payload.tosAgreement)==="boolean" &&
        data.payload.tosAgreement ==true ? true:false

    if(firstName && lastName && email && streetAddress && password && tosAgreement) {
        //Make sure that the user does not already exist
        _data.read('users',email,(err,data)=>{
            if(err){
                //Hash the passord
                const hashedPassword = helpers.hash(password)
                if(hashedPassword){    //Create the user object
                    const userObject = {
                        'firstName':firstName,
                        'lastName':lastName,
                        'email':email,
                        'streetAddress':streetAddress,
                        'hashedPassword':hashedPassword,
                        'tosAgreement':true
                    }
                    //store the user
                    _data.create('users',email, userObject , err=>{
                        if(!err){
                            callback(200)
                        }else{
                            console.log(err)
                            callback(500,{'Error':'Could not create that user'})
                        }
                    })
                }else{
                    callback(500,{'Error':'Could not hash user\'s password'})
                }
            }else{
                //user already exist
                callback(400,{'Error':'A user with that email already exist'})
            }
        })
    }else{
        callback(400,{'Error':'Missing required fields'})
    }
}
//Users - get
//required data: email
//optional data: none
handlers._users.get = (data,callback)=>{    
    //check that the email is valid    
    const email = typeof(data.queryStringObject.email)==="string" &&
    data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() :false
    if(email){
        //Get the token from the headers        
        const token = typeof(data.headers.token)==='string' ? data.headers.token : false           
        //Verify that the given token is valid for the phone number
        handlers._tokens.verifyToken(token,email,tokenIsValid=>{            
            if(tokenIsValid){
                //LookUp the user
                _data.read('users',email,(err,data)=>{
                    if(!err && data){
                        //Remove the  hadhed password  from the user  object  before returning 
                        //it to the requester
                        delete data.hashedPassword
                        callback(200,data)
                    }else{
                        callback(404)
                    }
                })

            }else{
                callback(403,{'Error':'Missing required token in header, or token is invalid'})
            }
        })
        
    }else{
        callback(400,{'Error':'Missing required field'})
    }
}
//Users - put
//required data: phone
//optional data: firstName, lastName,  password(at least one must be specfied)
handlers._users.put = (data,callback)=>{
    //Check for the required field 
    const firstName = typeof(data.payload.firstName)==="string" && 
        data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() :false
    
    const lastName = typeof(data.payload.lastName)==="string" && 
    data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() :false
    
    const email = typeof(data.payload.email)==="string" &&
    data.payload.email.trim().length > 0 ? data.payload.email.trim() :false

    const streetAddress = typeof(data.payload.streetAddress)==="string" &&
    data.payload.streetAddress.trim().length > 0 ? data.payload.streetAddress.trim() :false

    const password = typeof(data.payload.password)==="string" &&
    data.payload.password.trim().length > 0 ? data.payload.password.trim() :false    

    //Error if phone is invalid
    if(email){
        //Error if nothing is sent to update
        if(firstName || lastName || streetAddress || password){
            //Get the token from the headers
            const token = typeof(data.headers.token)==='string' ? data.headers.token : false
            //Verify that the given token is valid for the phone number
            handlers._tokens.verifyToken(token,email,tokenIsValid=>{
                if(tokenIsValid){
                    //Lookup the user
                    _data.read('users',email, (err,userData)=>{
                        if(!err && userData){
                            //Update the fields that are necessary
                            if(firstName){
                                userData.firstName = firstName
                            }
                            if(lastName){
                                userData.lastName = lastName
                            }
                            if(password){
                                userData.hashedPassword = helpers.hash(password)
                            }
                            if(streetAddress){
                                userData.streetAddress = streetAddress
                            }
                            //Store the new updates
                            _data.update('users',email,userData,(err)=>{
                                if(!err){
                                    callback(200)
                                }else{
                                    console.log(err)
                                    callback(500, {'Error':'Could not update the user'})
                                }
                            })
                        }else{
                            callback(400,{'Error':'The specified user does not exist'})
                        }
                    })

                }else{
                    callback(403,{'Error':'Missing required token in header, or token is invalid'})
                }
            })
            
        }else{
            callback(400,{'Error':'Missing fields to update'})
        }
    }else{
        callback(400,{'Error':'Missing required field'})
    }
}
//Users - delete
//Required field :  email
handlers._users.delete = (data,callback)=>{
    //Check that the phone number is valid
    const email = typeof(data.queryStringObject.email)=='string' && 
    data.queryStringObject.email.trim().length>0 ? data.queryStringObject.email:false
    if(email){
        //Get the token from the headers
        const token = typeof(data.headers.token)==='string' ? data.headers.token : false
        //Verify that the given token is valid for the phone number
        handlers._tokens.verifyToken(token,email,tokenIsValid=>{
            if(tokenIsValid){
                //LookUp the user
                _data.read('users',email,(err,userData)=>{
                    if(!err && userData){
                        _data.delete('users',email, err =>{
                            if(!err){
                                callback(200)
                            //     //Delete each of the checks associated with the user
                            //     const userChecks = typeof(userData.checks) === 'object' &&
                            //         userData.checks instanceof Array ? userData.checks:[]
                            //     const checksToDelete =  userChecks.length
                            //     if(checksToDelete>0){
                            //         let checksDeleted = 0
                            //         let deletionErrors = false
                            //         //Look through the checks
                            //         userChecks.forEach(checkId=>{
                            //             //Delete the check
                            //             _data.delete('checks',checkId,err=>{
                            //                 if(err){
                            //                     deletionErrors = true
                            //                 }
                            //                 checksDeleted++
                            //                 if(checksDeleted===checksToDelete){
                            //                     if(!deletionErrors){
                            //                         callback(200)
                            //                     }else{
                            //                         callback(500, {'Error':'Errors encountered while attempting to delete all of the  users\' checks. All checks may not have been deleted from the system successfully.'})
                            //                     }
                            //                 }else{

                            //                 }
                            //             })
                            //         })
                            //     }else{
                            //         callback(200)
                            //     }
                                

                            }else{
                                callback(500, {'Error':'Could not delete the specified user'})
                            }
                        })
                    }else{
                        callback(400,{'Error':'Could not  find the specified user'})
                    }
                })

            }else{
                callback(403,{'Error':'Missing required token in header, or token is invalid'})
            }
        })
        
    }else{
        callback(400,{'Error':'Missing required field'})
    }
}

//Tokens
handlers.tokens = (data,callback)=>{
    const acceptableMethods = ['post','get','put','delete']
    if(acceptableMethods.indexOf(data.method)>-1){
        handlers._tokens[data.method](data,callback)
    }else{
        callback(405)
    }
}

//Containers for all the tokens methods
handlers._tokens = {}

//tokens - post
//Required data: email, password
//Optional data: none
handlers._tokens.post = (data , callback) => {
    //parsing data
    const email = typeof(data.payload.email)==="string" &&
    data.payload.email.trim().length > 0 ? data.payload.email.trim() :false
    
    const password = typeof(data.payload.password)==="string" && 
    data.payload.password.trim().length > 0 ? data.payload.password.trim() :false

    if(email && password){
        //Lookup the user who matches the phone number
        _data.read('users',email,(err,userData)=>{
            if(!err && userData){
                //Hash the sent password and compare it to the password stored in the
                //user object
                const hashedPassword = helpers.hash(password)
                if(hashedPassword===userData.hashedPassword){
                    //If valid, crete a new token with a random name. set expiration date one hour
                    //in the future
                    const tokenId = helpers.createRandomString(20)
                    const expires = Date.now() + 1000*60*60
                    const tokenObject = {
                        'email':email,
                        'tokenId':tokenId,
                        'expires':expires,
                    }
                    //store the token
                    _data.create('tokens', tokenId,tokenObject,err=>{
                        if(!err){
                            callback(200,tokenObject)
                        }else{
                            callback(500,{'Error':'Could not create the new token'})
                        }
                    })

                }else{
                    callback(400,{'Error':'Password did not match the specified user\s stored password'})
                }
            }else{
                callback(400,{'Error':'Could not find the specified user'})
            }
        })
    }else{
        callback(400,{'Error':'Missing required fields'})
    }    
}

//tokens - get
//Required data: id
//Optional data: none
handlers._tokens.get = (data , callback) => {
    //Check that the id  is valid    
    const id = typeof(data.queryStringObject.id)=='string' && 
    data.queryStringObject.id.trim().length ===20 ?
    data.queryStringObject.id.trim():false
    if(id){
        //LookUp the token
        _data.read('tokens',id,(err,tokenData)=>{
            if(!err && tokenData){
                callback(200,tokenData)
            }else{
                callback(404)
            }
        })
    }else{
        callback(400,{'Error':'Missing required field'})
    }
}
//tokens - put
//Rwquired fields: id, extend
//Optional data: none
handlers._tokens.put = (data , callback) => {    
    const id = typeof(data.payload.id) === 'string' && 
    data.payload.id.trim().length === 20 ?
    data.payload.id.trim():false

    const extend = typeof(data.payload.extend) === 'boolean' && 
    data.payload.extend === true ?
    true:false

    //console.log(id, extend)

    if(id && extend){
        //LookUp the token
        _data.read('tokens',id,(err,tokenData)=>{
            if(!err && tokenData){
                //check to make sure the token is not already expired
                if(tokenData.expires > Date.now()){
                    //Set the expiration an hour from now
                    tokenData.expires = Date.now() + 1000*60*60
                    //Store the new updates
                    _data.update('tokens',id,tokenData, err=>{
                        if(!err){
                            callback(200)
                        }else{
                            callback(500,{'Error':'Could not update the token expiration'})
                        }
                    })
                }else{
                    callback(400,{'Error':'The token has already expired and can not be expanded'})
                }
            }else{
                callback(400,{'Error':'Specified token does not exist'})
            }
        })
    }else{
        callback(400,{'Error':'Missing required fields or fields are invalid'})
    }
}

//tokens - delete
//required data:id
//Optional data: none
handlers._tokens.delete = (data , callback) => {
    //Check that the id number is valid
    const id = typeof(data.queryStringObject.id)=='string' && 
    data.queryStringObject.id.trim().length ==20 ? data.queryStringObject.id:false
    if(id){
        //LookUp the token
        _data.read('tokens',id,(err,data)=>{
            if(!err && data){
                _data.delete('tokens',id, err =>{
                    if(!err){
                        callback(200)
                    }else{
                        callback(500, {'Error':'Could not delete the specified token'})
                    }
                })
            }else{
                callback(400,{'Error':'Could not  find the specified token'})
            }
        })
    }else{
        callback(400,{'Error':'Missing required field'})
    }
}

//Verify if a given token id is currently valid for  a given user
handlers._tokens.verifyToken = (id,email,callback)=>{
    //LookUpthe token
    _data.read('tokens',id,(err,tokenData)=>{        
        if(!err && tokenData){
            //Check that the token is for the given user and has not expired
            if(tokenData.email === email && tokenData.expires>Date.now()){
                callback(true)
            }else{
                callback(false)
            }
        }else{
            callback(false)
        }
    })
}

//menu items
//required data: email,token
//optional data: none
handlers.items = (data,callback)=>{    
    //check that the email is valid    
    const email = typeof(data.queryStringObject.email)==="string" &&
    data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() :false    
    if(email){
        //Get the token from the headers        
        const token = typeof(data.headers.token)==='string' ? data.headers.token : false           
        //Verify that the given token is valid for the phone number
        handlers._tokens.verifyToken(token,email,tokenIsValid=>{            
            if(tokenIsValid){
                //LookUp the user
                _data.read('items','items',(err,data)=>{
                    if(!err && data){
                        //Remove the  hadhed password  from the user  object  before returning 
                        //it to the requester                        
                        callback(200,data)
                    }else{
                        callback(404)
                    }
                })

            }else{
                callback(403,{'Error':'Missing required token in header, or token is invalid'})
            }
        })
        
    }else{
        callback(400,{'Error':'Missing required field'})
    }
}

//shopping Cart
handlers.shop = (data,callback)=>{
    const acceptableMethods = ['post','get','put','delete']
    if(acceptableMethods.indexOf(data.method)>-1){
        handlers._shop[data.method](data,callback)
    }else{
        callback(405)//Method Not Allowed
    }
}

//Container for all the shop methods

handlers._shop = {}

//shop post
//required data:
//payload(drinks, pizzas) , header(token) , email(query)
//optional data: none
//POST example
/**
 {
"drinks":[{"name":"coca cola","sizes":["1"],"amounts":["1"]},{"name":"fanta","sizes":["1/2","1"],"amounts":["1","1"]}],
"pizzas":[{"name":"Mozarella","sizes":["11"],"amounts":["2"]},{"name":"American","sizes":["13","11"],"amounts":["1","1"]}]
}
 */
handlers._shop.post = (data,callback)=>{
    let drinks = typeof(data.payload.drinks)==="object" && data.payload.drinks instanceof Array &&
    data.payload.drinks.length > 0 ? data.payload.drinks :false
       
    let pizzas = typeof(data.payload.pizzas)==="object" && data.payload.pizzas instanceof Array &&
    data.payload.pizzas.length > 0 ? data.payload.pizzas :false    

    const token = typeof(data.headers.token) === 'string' ? data.headers.token:false    

    if(drinks && pizzas ) {
        //Make sure that the user does not already exist
        _data.read('tokens',token,(err,tokenData)=>{
            if(!err && tokenData){
                const email =  tokenData.email
                let pizzaItems = false
                _data.read('items','items',(err,items)=>{
                    if(!err && items){
                        pizzaItems = items
                    }else{
                        callback(404,{'error':'Data ITEMS not found'})//data items not found
                    }
                })
                //LookUp the user data
                _data.read('users',email,(err,userData)=>{
                    if(!err && userData){
                        const orders = typeof(userData.orders) === 'object' &&
                            userData.orders instanceof Array ? userData.orders:[]
                        //Verify that the user has less than the number of max checks 
                        //per user
                        if(orders.length < config.maxOrders){
                            //Create a random id for the order
                            const orderId = helpers.createRandomString(20)
                            //determine the price:
                            let price = 0
                            for(let drink of drinks){
                                if(drink.name && drink.sizes.length>0){
                                    //console.log(pizzaItems.drinks)
                                    for(let drinkOption of pizzaItems.drinks){                                        
                                        if(drinkOption.name === drink.name){
                                            //validating input data
                                            drink.sizes = typeof(drink.sizes) === 'object' &&
                                            drink.sizes instanceof Array && drink.sizes.length>0 ?
                                            drink.sizes:false

                                            drink.amounts = typeof(drink.amounts) === 'object' &&
                                            drink.sizes.length===drink.amounts.length &&
                                            drink.amounts instanceof Array && drink.amounts.length>0 ?
                                            drink.amounts:false
                                            //verifiying amounts of drink are integer quantities                                            
                                            if(drink.amounts){
                                                for(let amount of drink.amounts){
                                                    if(!(parseInt(amount)>0)){
                                                        drink.amounts = false
                                                        break
                                                    }
                                                }
                                            }

                                            //find the price of the specific drink
                                            if(drink.sizes && drink.amounts){
                                                for(let size of drink.sizes){
                                                    if(drinkOption.sizes.indexOf(size)>-1){
                                                        const idxAmount = drink.sizes.indexOf(size)
                                                        const quantity = drink.amounts[idxAmount]
                                                        const idxPrice = drinkOption.sizes.indexOf(size)
                                                        const unitPrice = drinkOption.prices[idxPrice]
                                                        price+=quantity*unitPrice
                                                        //console.log(drink.name,', price: ', price)                                                        
                                                    }else{
                                                        //case when size is incorrect
                                                        drinks = false
                                                        break
                                                    }
                                                }
                                            }else{
                                                drinks = false
                                                break
                                            }
                                        }
                                    }
                                }
                                if(!drinks){
                                    break
                                }
                            }
                            for(let pizza of pizzas){
                                if(pizza.name && pizza.sizes.length>0){                                    
                                    for(let pizzaOption of pizzaItems.pizzas){
                                        if(pizzaOption.name === pizza.name){
                                            //validating pizza input data
                                            pizza.sizes = typeof(pizza.sizes) === 'object' &&
                                            pizza.sizes instanceof Array && pizza.sizes.length>0 ?
                                            pizza.sizes:false

                                            pizza.amounts = typeof(pizza.amounts) === 'object' &&
                                            pizza.sizes.length===pizza.amounts.length &&
                                            pizza.amounts instanceof Array && pizza.amounts.length>0 ?
                                            pizza.amounts:false
                                            //verifiying amounts of pizza are integer quantities                                            
                                            if(pizza.amounts){
                                                for(let amount of pizza.amounts){
                                                    if(!(parseInt(amount)>0)){
                                                        pizza.amounts = false
                                                        break
                                                    }
                                                }
                                            }
                                            //find the price for this specific pizza
                                            if(pizza.sizes && pizza.amounts){
                                                for(let size of pizza.sizes){
                                                    if(pizzaOption.sizes.indexOf(size)>-1){
                                                        const idxAmount = pizza.sizes.indexOf(size)                                                        
                                                        const quantity = pizza.amounts[idxAmount]
                                                        const idxPrice = pizzaOption.sizes.indexOf(size)                                                        
                                                        const unitPrice = pizzaOption.prices[idxPrice]
                                                        price+=quantity*unitPrice
                                                        //console.log('price: ', price)
                                                    }else{
                                                        //case when size is incorrect
                                                        pizzas = false
                                                        break
                                                    }
                                                }
                                            }else{
                                                pizzas = false                                                
                                                break
                                            }
                                        }
                                    }
                                }
                                if(!pizzas){
                                    break
                                }
                            }
                            //Create the order object and include  the email
                            if(pizzas && drinks){
                                const orderObject = {
                                    'id':orderId,
                                    'email':email,
                                    'drinks':drinks,
                                    'pizzas':pizzas,
                                    'price':price
                                }
                                //save the object
                                _data.create('shopCart',orderId,orderObject,err=>{
                                    if(!err){
                                        //Add the checkId to the users object
                                        userData.orders = orders
                                        userData.orders.push(orderId)
    
                                        //save the new user data
                                        _data.update('users',email,userData,err=>{
                                            if(!err){
                                                //Return the data about the new check
                                                callback(200, orderObject)
                                            }else{
                                                callback(400,{'Error':'Could not update the user with the new order'})
                                            }
                                        })
                                    }else{
                                        callback(500,{'Error':'Could not create the new order'})
                                    }
                                })
                            }else{
                                callback(400,{'Error':'Missing required inputs or inputs are invalid'})
                            }
                        }else{
                            callback(400,{'Error':`The user already has the maximum number of orders(${config.maxOrders})`})
                        }
                    }else{
                        callback(403)
                    }
                })
            }else{                
                callback(403,{'Error':err,'tokenData':tokenData})//403 code for not authorized
            }
        })
    }
}

handlers.order = (data,callback)=>{
    const acceptableMethods = ['post','get','put','delete']
    if(acceptableMethods.indexOf(data.method)>-1){
        handlers._order[data.method](data,callback)
    }else{
        callback(405)//Method Not Allowed
    }
}

handlers._order = {}


//order post
//Required data: token(header), orderId(query)
//optional data: none
handlers._order.post = (data,callback)=>{
    //Get the token from the headers
    const token = typeof(data.headers.token) === 'string' ? data.headers.token:false
    //Lookup the user by reading the token
    if(token){
        _data.read('tokens',token,(err,tokenData)=>{
            if(!err && tokenData){
                const email =  tokenData.email
                //LookUp the shopCart data
                //search in the shop cart
                const orderId =  typeof(data.queryStringObject.orderId)=='string' &&
                data.queryStringObject.orderId.trim().length ==20 ?
                data.queryStringObject.orderId.trim():false
                _data.read('shopCart',orderId,(err,orderDetails)=>{
                    if(!err && orderDetails){
                        //verify the status =>
                        orderDetails.status = orderDetails.status !=='done' &&
                        orderDetails.status!=='rejected' ? 'pending':false
                        //get the total price
                        const price = orderDetails.price
                        //create the request
                        if(orderDetails.status){
                            helpers.sendStripeRequest(price,(err,paymentId)=>{
                                if(!err){
                                    //update the shopCart
                                    //set the status according to the response from stripe                                            
                                    orderDetails.status = 'done'
                                    orderDetails.paymentId = paymentId
                                    //updating the status of the order
                                    _data.update('shopCart',orderId,orderDetails,err=>{
                                        if(!err){
                                            const msg=`Dear user, your payment for ${parseFloat(price).toFixed(2)} dollars has been executed successfully`
                                            helpers.sendMailgunMessage(email,msg,(errStatus,resultMsg)=>{
                                                if(!errStatus){
                                                    callback(200,{'message':'payment executed successfully'})
                                                }else{
                                                    callback(errStatus,resultMsg)
                                                }
                                            })
                                        }else{
                                            callback(500,{'Error': 'Could not update the check'})
                                        }
                                    })
                                }else{
                                    switch (err.type) {
                                    case 'StripeCardError':
                                        // A declined card error
                                        err.message; // => e.g. "Your card's expiration year is invalid."                                                    
                                        break;
                                    case 'RateLimitError':
                                        // Too many requests made to the API too quickly                                                    
                                        break;
                                    case 'StripeInvalidRequestError':
                                        // Invalid parameters were supplied to Stripe's API                                                    
                                        break;
                                    case 'StripeAPIError':
                                        // An error occurred internally with Stripe's API
                                        break;
                                    case 'StripeConnectionError':
                                        // Some kind of error occurred during the HTTPS communication
                                        break;
                                    case 'StripeAuthenticationError':
                                        // You probably used an incorrect API key
                                        break;
                                    default:
                                        // Handle any other types of unexpected errors
                                        break;
                                    }
                                    callback(406,{'error':err.message})
                                    orderDetails.status = 'rejected'
                                }                                
                            })
                        }else{
                            console.log(`Order Id ${orderDetails.id} of the account ${orderDetails.email} has been already done or rejected`)
                        }

                    }else{
                        console.log(`Details for the order id ${orderId} corresponding to the email ${email} was not found`)
                    }
                })
            }else{
                callback(403,{'Error':'Invalid token'})//403 code for not authorized
            }
        })
    }else{
        callback(400,{'Error':'Missing required inputs or inputs are invalid'})
    }
}

//ping handler
handlers.ping = (data,callback)=>{
        callback(200)
}
//Not found handler
handlers.notFound = (data,callback)=>{
        callback(404)//does not need a payload
}
//export the module
module.exports = handlers