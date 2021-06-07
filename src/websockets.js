// const API_KEY = '3461ad4efdb1754b43f74f8b6ac3a83a6362f55e152bcdabf3d2ff1714990abe'

function getSubscribeList(tickersList) {
    return  tickersList.map(function(element){
        return element.name.toUpperCase()
    }).join(',')
}

export function updateTickers(tickersList) {
    const SUBSCRIBE_LIST = getSubscribeList(tickersList)
    let newTickerList = []
    fetch(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${SUBSCRIBE_LIST}&tsyms=USD&api_key=3461ad4efdb1754b43f74f8b6ac3a83a6362f55e152bcdabf3d2ff1714990abe`)
        .then((response) => {
            return response.json()
        })
        .then((data) => {
            // console.log(data)
            // console.log('tickersList', tickersList)
            for (const item in data) {
                let newCoin = {
                    name: item,
                    price: data[item].USD
                }
                newTickerList.push(newCoin)
                // console.log(item, data[item].USD)
            }
            newTickerList.reverse()
            // console.log('newTickerList', newTickerList)
        })
    return newTickerList 
}

