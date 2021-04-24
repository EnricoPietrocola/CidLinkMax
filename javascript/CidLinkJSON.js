const Max = require('max-api-or-not')

//var d = new Dict("northern animals");

const dictId = "LinkMessage";

Max.addHandler("bang", () => {
    /*Max.getDict("LinkMessage").then((result)=> {
        Max.outlet(result);

    })*/
    getLinkDict().then(r => Max.outlet(r))
});

async function getLinkDict(){
    try {
        // dict contains the dict's contents
        return await Max.getDict(dictId)
    } catch (err) {
        // handle Error here
    }
}