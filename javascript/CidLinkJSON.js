const Max = require('max-api-or-not')

//var d = new Dict("northern animals");


Max.addHandler("bang", () => {
    Max.post(Max.getDict("LinkMessage").then((result)=> {
        console.log(result.toString())
        Max.outlet(result);

    }))

});