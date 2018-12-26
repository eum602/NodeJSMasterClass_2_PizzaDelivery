# NodeJSMasterClass_2_PizzaDelivery
## Steps:

1.**clone the repository**

2.**Start the server**
```
NODE_DEBUG=server NODE_ENV=staging node index.js
```
3.**Test the app (For example using postman)**

    3.1. Create a new user:
    ```
    method:POST
    url:http://localhost:3000/users
    payload(body):
    {
    "firstName":"Erick",
    "lastName":"Pacheco",
    "email":"eum602@gmail.com",
    "streetAddress":"La Merced MzA. Lt22",
    "password":"thisIsAPassword",
    "tosAgreement":true
    }
    ```
  
    3.2. Create a new Token:
    ```
    method:POST
    url:http://localhost:3000/tokens
    payload(body):
    {
    "email": "eum602@gmail.com",
    "password":"thisIsAPassword"
    }
    ```
    3.3. Create a new pizza delivery Order:
    method: POST
    url: http://localhost:3000/shop?email=eum602@gmail.com
    payload(body):
    {
    "drinks":[{"name":"coca cola","sizes":["1"],"amounts":["8"]},{"name":"fanta","sizes":["1/2","1"],"amounts":["2","1"]}],
    "pizzas":[{"name":"Mozarella","sizes":["11"],"amounts":["4"]},{"name":"American","sizes":["13","11"],"amounts":["1","1"]}]
    }
