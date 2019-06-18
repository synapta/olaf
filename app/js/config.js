var obj = {}
obj["author"] = {}
obj["options"] = []
obj["selected"] = []
var objv2 = {}
objv2["old"] = {}
objv2["options"] = []
exports.obj = obj
exports.objv2 = objv2
/*exports.cleandata_cobis = function (rawData) {
    let attr = rawData["head"]["vars"]
    let bind = rawData["results"]["bindings"]
    let rawjson = {}
    rawjson["author"] = {}
    rawjson["options"] = [{}]
    for (y in bind) {
        for (x in attr) {
            if (bind[y][attr[x]] == undefined) {
                rawjson["author"][attr[x]] = "undefined"
            } else {
                rawjson["author"][attr[x]] = bind[y][attr[x]]["value"].split(',')

            }
        }
    }
    obj["author"] = rawjson["author"]
}*/
/*exports.cleandata_wikidata = function (rawData) {
    //console.log("\ncleandata_wikidata\n")
    obj.options = []
    rawData = JSON.parse(rawData)
    let a = rawData.head.vars
    obj["vars"] = a
    let dim = rawData.results.bindings.length
    let arr = rawData.results.bindings
    console.log("attributes\n" + a + "\n")
    for (x = 0; x < dim; x++) {
        obj.options[x] = {}
        a = Object.keys(rawData.results.bindings[x])
        for (y in a) {
            if (a[y] == "birthDate" || a[y] == "deathDate") {
                obj.options[x][a[y]] = arr[x][a[y]].value.substr(0, 11)
            } else if (a[y] == "immagine") {
                obj.options[x][a[y]] = arr[x][a[y]].value.substr(5, arr[x][a[y]].value.length)
            } else {
                obj.options[x][a[y]] = arr[x][a[y]].value
            }
        }
    }
    /*
    Object.keys(rawData).forEach((ki)=>{
      console.log(ki)
      console.log(rawData[ki])
    })//
}*/

function insertdata(n, att, val) {
    if (n == 0) {
        objv2.old[att] = val
    } else {
        objv2.options[n - 1][att] = val
    }
}

function cleanoptions(jay, q) {
    let name = jay.options[q]["label"].split(" ")[0]
    let surname = jay.options[q]["label"].split(" ")[1]
    console.log(name + " " + surname)
    jay.options[q]["name"] = name
    jay.options[q]["surname"] = surname
    jay.options[q]["birth"] = jay.options[q]["birthDate"]
    jay.options[q]["death"] = jay.options[q]["deathDate"]
    jay.options[q]["fonte"] = jay.options[q]["item"]

    //se sono undefined assegna il valore ""
    for (con = 0; con <= Object.keys(jay.options[q]).length; con++) {
        if (Object.values(jay.options[q])[con] == undefined) {
            jay.options[q][Object.keys(jay.options[q])[con]] = ""
        }
    }
    return jay
}

function cleanauthor(jay) {
    console.log("\n\n__________cleanauthor______")
    console.log(jay)
    console.log("\______________\n")
    jay.author["name"] = jay.author["personName"][1]
    jay.author["surname"] = jay.author["personName"][0]
    jay.author["roles"] = jay.author["personRole"]
    console.log(jay)
    console.log("\______________\n")
    return jay
}

exports.makeJson4checkData = function (idselezionati) {
    let principali = ["fonte", "name", "surname", "birth", "death", "description"]//,"immagine"]
    let prinauthor = ["personName", "personRole", "title", "description"]
    let prinoptions = ["name", "surname", "description", "birthDate", "deathDate", "immagine"]
    let dim = []
    for (x = 0; x < idselezionati.length; x++) {
        dim.push(idselezionati[x])
    }
    let attr = principali
    obj = cleanauthor(obj)
    for (x = 0; x < dim.length; x++) {
        obj = cleanoptions(obj, (dim[x] - 1))
    }
    //per authors devo farne un altro dato che hanno attributi diversi
    for (x = 0; x <= dim.length; x++) {
        if (x > 0) {
            objv2.options[x - 1] = {}
        }

        for (a = 0; a < attr.length; a++) {
            if (x == 0) {
                if (obj.author[attr[a]] == undefined) {
                    insertdata(x, attr[a], "")
                } else {
                    insertdata(x, attr[a], obj.author[attr[a]])
                }
            } else {
                if (obj.options[dim[x - 1] - 1][attr[a]] == undefined) {
                    insertdata(x, attr[a], "")
                } else {
                    insertdata(x, attr[a], obj.options[dim[x - 1] - 1][attr[a]])
                }
            }
        }
    }
    objv2["attributes"] = {}
    objv2["attributes"] = principali
    return objv2
}
exports.orderFonti = function (json) {
    let jey = {}
    jey = json
    return jey
}
exports.givequerywikidata = function (surname, name) {

    var querywikidatastringa = `
    PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX wd: <http://www.wikidata.org/entity/>

SELECT ?item ?label ?type ?typeLabel ?num ?description ?altLabel  ?birthDate ?deathDate ?immagine ?itwikipedia  ?enwikipedia  WHERE {

SERVICE wikibase:label { 
  bd:serviceParam wikibase:language "it,en,fr,de,nl". 
  ?item rdfs:label ?label .
  ?type rdfs:label ?typeLabel.
  ?item skos:altLabel ?altLabel .    
  ?item schema:description ?description
}
          
SERVICE wikibase:mwapi {
  bd:serviceParam wikibase:api "EntitySearch" .
  bd:serviceParam wikibase:endpoint "www.wikidata.org" .
  bd:serviceParam mwapi:search "${name} ${surname}" .
  bd:serviceParam mwapi:language "en" .
  ?item wikibase:apiOutputItem mwapi:item .
  ?num wikibase:apiOrdinal true .
}
        
OPTIONAL {
  ?item wdt:P569 ?birthDate .
}
OPTIONAL {
  ?item wdt:P570 ?deathDate .
}
OPTIONAL {
  ?item wdt:P18 ?immagine .
}
OPTIONAL {
  ?itwikipedia schema:about ?item   .

  FILTER(CONTAINS(STR(?itwikipedia), 'it.wikipedia.org'))

  BIND(STR(?itwikipedia) as ?itwiki)
}
OPTIONAL {
  ?enwikipedia schema:about ?item   .
  FILTER(CONTAINS(STR(?enwikipedia), 'en.wikipedia.org'))
  BIND(STR(?enwikipedia) as ?enwiki)
}
MINUS{
  ?item wdt:P31 wd:Q15632617
}
MINUS{
  ?item wdt:P31 wd:Q4167410
}
MINUS{
  ?item wdt:P31 ?class.
  ?class wdt:P279* wd:Q838948
}
MINUS{
  ?item wdt:P31 ?class.
  ?class wdt:P279* wd:Q234460
}

?item wdt:P31 ?type .
} ORDER BY ASC(?num) LIMIT 20   
`
    var queryWikidata = {
        method: 'GET',
        url: 'https://query.wikidata.org/sparql',
        qs: {
            query: querywikidatastringa
        },
        headers: {
            'cache-control': 'no-cache',
            Host: 'query.wikidata.org',
            'Accept-Language': 'it-IT,it;q=0.8,en-US;q=0.5,en;q=0.3',
            Accept: 'application/sparql-results+json'
        }
    }
    return queryWikidata
}
